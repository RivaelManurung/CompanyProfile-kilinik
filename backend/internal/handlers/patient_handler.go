package handlers

import (
	"net/http"
	"strings"

	"sehatnusantara/api/internal/auth"
	"sehatnusantara/api/internal/models"

	"github.com/gin-gonic/gin"
)

// Patient accounts — public-facing booking realm, separate from admin auth.

type patientRegisterRequest struct {
	Name     string `json:"name" binding:"required,min=2,max=120"`
	Email    string `json:"email" binding:"required,email"`
	Phone    string `json:"phone" binding:"required,min=6,max=30"`
	Password string `json:"password" binding:"required,min=8,max=72"`
}

type patientLoginRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required"`
}

func patientPublic(p models.PatientUser) gin.H {
	return gin.H{"id": p.ID, "name": p.Name, "email": p.Email, "phone": p.Phone}
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
	hash, err := auth.HashPassword(req.Password)
	if err != nil {
		fail(c, http.StatusInternalServerError, "HASH_FAILED", "Gagal memproses kata sandi")
		return
	}
	p := models.PatientUser{
		Name:         req.Name,
		Email:        strings.ToLower(strings.TrimSpace(req.Email)),
		Phone:        req.Phone,
		PasswordHash: hash,
		Active:       true,
	}
	if err := h.DB.Create(&p).Error; err != nil {
		fail(c, http.StatusConflict, "EMAIL_TAKEN", "Email sudah terdaftar")
		return
	}
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

// PatientListAppointments returns the authenticated patient's own bookings.
func (h *Handler) PatientListAppointments(c *gin.Context) {
	var items []models.Appointment
	h.DB.Where("patient_user_id = ?", auth.PatientID(c)).
		Order("appointment_date DESC, appointment_time DESC, id DESC").
		Find(&items)
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

	appt := models.Appointment{
		Name: p.Name, Phone: p.Phone, Email: p.Email, Service: req.Service,
		Doctor: doc.Name, DoctorID: doc.ID, PatientUserID: p.ID,
		PatientType: patientType, Source: "website",
		AppointmentDate: req.AppointmentDate, AppointmentTime: req.AppointmentTime,
		Message: req.Message, Status: "pending",
	}
	if err := h.DB.Create(&appt).Error; err != nil {
		// Most likely the partial unique index caught a concurrent booking.
		fail(c, http.StatusConflict, "SLOT_TAKEN", "Jadwal tersebut baru saja dipesan. Silakan pilih jam lain.")
		return
	}
	created(c, appt)
}
