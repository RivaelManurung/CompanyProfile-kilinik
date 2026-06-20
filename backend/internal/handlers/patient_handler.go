package handlers

import (
	"errors"
	"net/http"
	"regexp"
	"strings"
	"time"

	"sehatnusantara/api/internal/auth"
	"sehatnusantara/api/internal/models"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// Patient accounts — public-facing booking realm, separate from admin auth.

const consentCurrentVersion = "v1"

// nikPattern matches exactly 16 digits (Indonesian NIK format).
var nikPattern = regexp.MustCompile(`^\d{16}$`)

type patientRegisterRequest struct {
	Name            string `json:"name" binding:"required,min=2,max=120"`
	Email           string `json:"email" binding:"required,email"`
	Phone           string `json:"phone" binding:"required,min=6,max=30"`
	Password        string `json:"password" binding:"required,min=8,max=72"`
	ConsentAccepted bool   `json:"consentAccepted"`
	NIK             string `json:"nik" binding:"omitempty"`
	DateOfBirth     string `json:"dateOfBirth" binding:"omitempty"` // YYYY-MM-DD
	Sex             string `json:"sex" binding:"omitempty,oneof=L P"`
	Address         string `json:"address" binding:"omitempty,max=500"`
}

type patientLoginRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required"`
}

// maskNIK returns a privacy-safe rendering of a NIK (***-****-#### style),
// revealing only the last 4 digits. Empty input yields empty output.
func maskNIK(nik string) string {
	if nik == "" {
		return ""
	}
	if len(nik) <= 4 {
		return strings.Repeat("*", len(nik))
	}
	return "***-****-" + nik[len(nik)-4:]
}

// patientPublic returns the non-sensitive profile a patient/admin may see. The
// NIK is always masked here; the raw NIK is never included in any list/detail
// projection.
func patientPublic(p models.PatientUser) gin.H {
	return gin.H{
		"id": p.ID, "name": p.Name, "email": p.Email, "phone": p.Phone,
		"dateOfBirth": p.DateOfBirth, "sex": p.Sex, "address": p.Address,
		"nik":               maskNIK(p.NIK),
		"medicalRecordNo":   p.MedicalRecordNo,
		"consentAcceptedAt": p.ConsentAcceptedAt,
		"emailVerifiedAt":   p.EmailVerifiedAt,
	}
}

// parseDateOfBirth validates a "YYYY-MM-DD" string and rejects future dates.
// Returns (nil, nil) for empty input (the field is optional).
func parseDateOfBirth(s string) (*time.Time, error) {
	s = strings.TrimSpace(s)
	if s == "" {
		return nil, nil
	}
	d, err := time.ParseInLocation("2006-01-02", s, clinicLoc)
	if err != nil {
		return nil, errors.New("format tanggal lahir harus YYYY-MM-DD")
	}
	if d.After(time.Now().In(clinicLoc)) {
		return nil, errors.New("tanggal lahir tidak boleh di masa depan")
	}
	return &d, nil
}

func (h *Handler) issuePatientToken(c *gin.Context, p models.PatientUser) bool {
	token, err := auth.GenerateToken(h.Cfg.JWTSecret, p.ID, p.Email, auth.RolePatient)
	if err != nil {
		fail(c, http.StatusInternalServerError, "TOKEN_FAILED", "Gagal membuat sesi")
		return false
	}
	auth.SetPatientCookie(c, token, h.Cfg.IsProd())
	return true
}

func (h *Handler) PatientRegister(c *gin.Context) {
	var req patientRegisterRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		failValidation(c, err)
		return
	}
	// Consent is mandatory: a patient account may not be created without it.
	if !req.ConsentAccepted {
		fail(c, http.StatusBadRequest, "CONSENT_REQUIRED", "Anda harus menyetujui persetujuan privasi & data untuk mendaftar")
		return
	}
	nik := strings.TrimSpace(req.NIK)
	if nik != "" && !nikPattern.MatchString(nik) {
		fail(c, http.StatusBadRequest, "INVALID_NIK", "NIK harus terdiri dari 16 digit angka")
		return
	}
	dob, err := parseDateOfBirth(req.DateOfBirth)
	if err != nil {
		fail(c, http.StatusBadRequest, "INVALID_DOB", err.Error())
		return
	}
	hash, err := auth.HashPassword(req.Password)
	if err != nil {
		fail(c, http.StatusInternalServerError, "HASH_FAILED", "Gagal memproses kata sandi")
		return
	}
	now := time.Now()
	p := models.PatientUser{
		Name:              req.Name,
		Email:             strings.ToLower(strings.TrimSpace(req.Email)),
		Phone:             req.Phone,
		PasswordHash:      hash,
		NIK:               nik,
		DateOfBirth:       dob,
		Sex:               req.Sex,
		Address:           strings.TrimSpace(req.Address),
		ConsentAcceptedAt: &now,
		ConsentVersion:    consentCurrentVersion,
		Active:            true,
	}

	// Reject a duplicate NIK with a clear 409 before attempting the insert (the
	// partial unique index is the final backstop against a race).
	if nik != "" {
		var dup int64
		h.DB.Model(&models.PatientUser{}).Where("nik = ?", nik).Count(&dup)
		if dup > 0 {
			fail(c, http.StatusConflict, "NIK_TAKEN", "NIK sudah terdaftar")
			return
		}
	}

	// Create the account and assign a unique medical record number atomically so
	// concurrent registrations cannot collide on the same MRN.
	if err := h.DB.Transaction(func(tx *gorm.DB) error {
		mrn, err := nextMedicalRecordNo(tx)
		if err != nil {
			return err
		}
		p.MedicalRecordNo = mrn
		return tx.Create(&p).Error
	}); err != nil {
		// Most likely a duplicate email (unique index) or duplicate NIK (race).
		if isUniqueViolation(err, "nik") {
			fail(c, http.StatusConflict, "NIK_TAKEN", "NIK sudah terdaftar")
			return
		}
		fail(c, http.StatusConflict, "EMAIL_TAKEN", "Email sudah terdaftar")
		return
	}

	// Issue an email-verification token. Delivery (email/WA) is not yet wired, so
	// the link is logged. TODO: send via a real provider once one is configured.
	if _, err := h.issueVerificationToken(c, p); err != nil {
		// Verification is best-effort at signup; the account is already created.
		// Surface nothing to the client beyond the normal success response.
		_ = err
	}

	h.auditPatient(c, stringID(p.ID), p.Email, "register", "patient", stringID(p.ID))
	if !h.issuePatientToken(c, p) {
		return
	}
	created(c, patientPublic(p))
}

func (h *Handler) PatientLogin(c *gin.Context) {
	var req patientLoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		failValidation(c, err)
		return
	}
	var p models.PatientUser
	email := strings.ToLower(strings.TrimSpace(req.Email))
	if err := h.DB.Where("email = ?", email).First(&p).Error; err != nil {
		fail(c, http.StatusUnauthorized, "INVALID_CREDENTIALS", "Email atau kata sandi salah")
		return
	}
	if !p.Active || !auth.CheckPassword(p.PasswordHash, req.Password) {
		fail(c, http.StatusUnauthorized, "INVALID_CREDENTIALS", "Email atau kata sandi salah")
		return
	}
	if !h.issuePatientToken(c, p) {
		return
	}
	h.auditPatient(c, stringID(p.ID), p.Email, "login", "patient", stringID(p.ID))
	ok(c, patientPublic(p))
}

func (h *Handler) PatientLogout(c *gin.Context) {
	auth.ClearPatientCookie(c, h.Cfg.IsProd())
	c.JSON(http.StatusOK, gin.H{"data": gin.H{"ok": true}})
}

func (h *Handler) PatientMe(c *gin.Context) {
	var p models.PatientUser
	if err := h.DB.First(&p, auth.PatientID(c)).Error; err != nil {
		fail(c, http.StatusNotFound, "NOT_FOUND", "Akun tidak ditemukan")
		return
	}
	ok(c, patientPublic(p))
}

type patientUpdateRequest struct {
	Name            string `json:"name" binding:"omitempty,min=2,max=120"`
	Phone           string `json:"phone" binding:"omitempty,min=6,max=30"`
	DateOfBirth     string `json:"dateOfBirth" binding:"omitempty"` // YYYY-MM-DD
	Sex             string `json:"sex" binding:"omitempty,oneof=L P"`
	Address         string `json:"address" binding:"omitempty,max=500"`
	NIK             string `json:"nik" binding:"omitempty"` // only settable while currently empty
	CurrentPassword string `json:"currentPassword" binding:"omitempty"`
	NewPassword     string `json:"newPassword" binding:"omitempty,min=8,max=72"`
}

// PatientUpdateProfile updates the authenticated patient's name/phone and,
// optionally, their password (requires the current password).
func (h *Handler) PatientUpdateProfile(c *gin.Context) {
	var p models.PatientUser
	if err := h.DB.First(&p, auth.PatientID(c)).Error; err != nil {
		fail(c, http.StatusNotFound, "NOT_FOUND", "Akun tidak ditemukan")
		return
	}
	var req patientUpdateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		failValidation(c, err)
		return
	}
	if req.Name != "" {
		p.Name = req.Name
	}
	if req.Phone != "" {
		p.Phone = req.Phone
	}
	if req.Sex != "" {
		p.Sex = req.Sex
	}
	if req.Address != "" {
		p.Address = strings.TrimSpace(req.Address)
	}
	if req.DateOfBirth != "" {
		dob, err := parseDateOfBirth(req.DateOfBirth)
		if err != nil {
			fail(c, http.StatusBadRequest, "INVALID_DOB", err.Error())
			return
		}
		p.DateOfBirth = dob
	}
	// NIK may only be set once: allow it when currently empty, reject overwrites.
	if nik := strings.TrimSpace(req.NIK); nik != "" {
		if p.NIK != "" {
			fail(c, http.StatusConflict, "NIK_LOCKED", "NIK sudah terisi dan tidak dapat diubah")
			return
		}
		if !nikPattern.MatchString(nik) {
			fail(c, http.StatusBadRequest, "INVALID_NIK", "NIK harus terdiri dari 16 digit angka")
			return
		}
		var dup int64
		h.DB.Model(&models.PatientUser{}).Where("nik = ? AND id <> ?", nik, p.ID).Count(&dup)
		if dup > 0 {
			fail(c, http.StatusConflict, "NIK_TAKEN", "NIK sudah terdaftar")
			return
		}
		p.NIK = nik
	}
	if req.NewPassword != "" {
		if !auth.CheckPassword(p.PasswordHash, req.CurrentPassword) {
			fail(c, http.StatusBadRequest, "INVALID_PASSWORD", "Kata sandi saat ini salah")
			return
		}
		hash, err := auth.HashPassword(req.NewPassword)
		if err != nil {
			fail(c, http.StatusInternalServerError, "HASH_FAILED", "Gagal memproses kata sandi")
			return
		}
		p.PasswordHash = hash
	}
	if err := h.DB.Save(&p).Error; err != nil {
		if isUniqueViolation(err, "nik") {
			fail(c, http.StatusConflict, "NIK_TAKEN", "NIK sudah terdaftar")
			return
		}
		fail(c, http.StatusInternalServerError, "UPDATE_FAILED", "Gagal memperbarui profil")
		return
	}
	h.auditPatient(c, stringID(p.ID), p.Email, "update", "patient", stringID(p.ID))
	ok(c, patientPublic(p))
}

// PatientListAppointments returns the authenticated patient's own bookings.
func (h *Handler) PatientListAppointments(c *gin.Context) {
	var items []models.Appointment
	if err := h.DB.Where("patient_user_id = ?", auth.PatientID(c)).
		Order("appointment_date DESC, appointment_time DESC, id DESC").
		Find(&items).Error; err != nil {
		fail(c, http.StatusInternalServerError, "DB_ERROR", "Gagal memuat data janji temu")
		return
	}
	ok(c, items)
}

type patientBookingRequest struct {
	DoctorID        uint   `json:"doctorId" binding:"required"`
	Service         string `json:"service" binding:"omitempty,max=120"`
	AppointmentDate string `json:"appointmentDate" binding:"required,max=40"`
	AppointmentTime string `json:"appointmentTime" binding:"required,max=40"`
	Message         string `json:"message" binding:"omitempty,max=2000"`
}

// PatientCreateAppointment books a slot for the authenticated patient. The
// requested slot must be offered by the doctor's schedule and still free; a
// partial unique index is the final backstop against a booking race.
func (h *Handler) PatientCreateAppointment(c *gin.Context) {
	var req patientBookingRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		failValidation(c, err)
		return
	}

	var p models.PatientUser
	if err := h.DB.First(&p, auth.PatientID(c)).Error; err != nil {
		fail(c, http.StatusUnauthorized, "UNAUTHORIZED", "Sesi tidak valid")
		return
	}
	var doc models.Doctor
	if err := h.DB.First(&doc, req.DoctorID).Error; err != nil || !doc.Active {
		fail(c, http.StatusBadRequest, "INVALID_DOCTOR", "Dokter tidak tersedia")
		return
	}

	slots, err := h.computeAvailability(doc, req.AppointmentDate)
	if err != nil {
		fail(c, http.StatusBadRequest, "INVALID_DATE", "Format tanggal harus YYYY-MM-DD")
		return
	}
	free := false
	for _, s := range slots {
		if s.Time == req.AppointmentTime && s.Available {
			free = true
			break
		}
	}
	if !free {
		fail(c, http.StatusConflict, "SLOT_TAKEN", "Jadwal tersebut tidak tersedia. Silakan pilih jam lain.")
		return
	}

	var prior int64
	h.DB.Model(&models.Appointment{}).Where("patient_user_id = ?", p.ID).Count(&prior)
	patientType := "new"
	if prior > 0 {
		patientType = "returning"
	}

	// Patient self-bookings always have both a real doctor and a real patient,
	// so both nullable FKs are set to non-nil pointers.
	doctorID := doc.ID
	patientID := p.ID
	appt := models.Appointment{
		Name: p.Name, Phone: p.Phone, Email: p.Email, Service: req.Service,
		Doctor: doc.Name, DoctorID: &doctorID, PatientUserID: &patientID,
		PatientType: patientType, Source: "website",
		AppointmentDate: req.AppointmentDate, AppointmentTime: req.AppointmentTime,
		ScheduledAt: parseScheduledAt(req.AppointmentDate, req.AppointmentTime),
		Message:     req.Message, Status: "pending",
	}
	if err := h.DB.Create(&appt).Error; err != nil {
		// Most likely the partial unique index caught a concurrent booking.
		fail(c, http.StatusConflict, "SLOT_TAKEN", "Jadwal tersebut baru saja dipesan. Silakan pilih jam lain.")
		return
	}
	h.auditPatient(c, stringID(p.ID), p.Email, "book", "appointments", stringID(appt.ID))
	go h.Notify.AppointmentCreated(appt)
	created(c, appt)
}

// loadOwnedAppointment fetches an appointment by :id and verifies it belongs to
// the authenticated patient. It writes the appropriate error response and
// returns ok=false when the appointment is missing or owned by someone else.
func (h *Handler) loadOwnedAppointment(c *gin.Context) (models.Appointment, bool) {
	var appt models.Appointment
	if err := h.DB.First(&appt, c.Param("id")).Error; err != nil {
		fail(c, http.StatusNotFound, "NOT_FOUND", "Janji temu tidak ditemukan")
		return appt, false
	}
	if appt.PatientUserID == nil || *appt.PatientUserID != auth.PatientID(c) {
		fail(c, http.StatusForbidden, "FORBIDDEN", "Anda tidak memiliki akses ke janji temu ini")
		return appt, false
	}
	return appt, true
}

// isCancellableStatus reports whether a patient may still cancel/reschedule.
func isCancellableStatus(status string) bool {
	return status == "pending" || status == "confirmed"
}

// PatientCancelAppointment lets the owning patient cancel a still-active booking.
// POST /api/patient/appointments/:id/cancel
func (h *Handler) PatientCancelAppointment(c *gin.Context) {
	appt, ok2 := h.loadOwnedAppointment(c)
	if !ok2 {
		return
	}
	if !isCancellableStatus(appt.Status) {
		fail(c, http.StatusConflict, "NOT_CANCELLABLE", "Janji temu ini tidak dapat dibatalkan")
		return
	}
	oldStatus := appt.Status
	now := time.Now().In(clinicLoc)
	if err := h.DB.Model(&appt).Updates(map[string]any{
		"status":        "cancelled",
		"cancelled_at":  &now,
		"cancel_reason": "Dibatalkan oleh pasien",
	}).Error; err != nil {
		fail(c, http.StatusInternalServerError, "DB_ERROR", "Gagal membatalkan janji temu")
		return
	}
	if err := h.DB.First(&appt, c.Param("id")).Error; err != nil {
		fail(c, http.StatusInternalServerError, "DB_ERROR", "Gagal memuat janji temu")
		return
	}
	h.auditPatient(c, stringID(auth.PatientID(c)), appt.Email, "cancel", "appointments", stringID(appt.ID))
	go h.Notify.AppointmentStatusChanged(appt, oldStatus)
	ok(c, appt)
}

type patientRescheduleRequest struct {
	AppointmentDate string `json:"appointmentDate" binding:"required,max=40"`
	AppointmentTime string `json:"appointmentTime" binding:"required,max=40"`
}

// PatientRescheduleAppointment lets the owning patient move a still-active
// booking to a new slot, re-validating availability + double-booking.
// PATCH /api/patient/appointments/:id
func (h *Handler) PatientRescheduleAppointment(c *gin.Context) {
	appt, ok2 := h.loadOwnedAppointment(c)
	if !ok2 {
		return
	}
	if !isCancellableStatus(appt.Status) {
		fail(c, http.StatusConflict, "NOT_RESCHEDULABLE", "Janji temu ini tidak dapat dijadwalkan ulang")
		return
	}
	var req patientRescheduleRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		failValidation(c, err)
		return
	}
	// A reschedule only makes sense for doctor-backed bookings (the slot model).
	if appt.DoctorID == nil {
		fail(c, http.StatusConflict, "NO_DOCTOR", "Janji temu ini tidak terkait dokter sehingga tidak dapat dijadwalkan ulang")
		return
	}
	free, err := h.isSlotAvailable(*appt.DoctorID, req.AppointmentDate, req.AppointmentTime)
	if err != nil {
		fail(c, http.StatusBadRequest, "INVALID_DATE", "Dokter atau tanggal tidak valid")
		return
	}
	if !free {
		fail(c, http.StatusConflict, "SLOT_TAKEN", "Jadwal tersebut tidak tersedia. Silakan pilih jam lain.")
		return
	}
	updates := map[string]any{
		"appointment_date": req.AppointmentDate,
		"appointment_time": req.AppointmentTime,
		"scheduled_at":     parseScheduledAt(req.AppointmentDate, req.AppointmentTime),
	}
	if err := h.DB.Model(&appt).Updates(updates).Error; err != nil {
		// Partial unique index backstop against a concurrent booking of the slot.
		fail(c, http.StatusConflict, "SLOT_TAKEN", "Jadwal tersebut baru saja dipesan. Silakan pilih jam lain.")
		return
	}
	if err := h.DB.First(&appt, c.Param("id")).Error; err != nil {
		fail(c, http.StatusInternalServerError, "DB_ERROR", "Gagal memuat janji temu")
		return
	}
	h.auditPatient(c, stringID(auth.PatientID(c)), appt.Email, "reschedule", "appointments", stringID(appt.ID))
	ok(c, appt)
}
