package handlers

import (
	"net/http"
	"time"

	"sehatnusantara/api/internal/models"

	"github.com/gin-gonic/gin"
)

type createAppointmentRequest struct {
	Name            string `json:"name" binding:"required,min=2,max=120"`
	Phone           string `json:"phone" binding:"required,min=6,max=30"`
	Email           string `json:"email" binding:"omitempty,email"`
	Service         string `json:"service" binding:"omitempty,max=120"`
	Doctor          string `json:"doctor" binding:"omitempty,max=120"`
	DoctorID        uint   `json:"doctorId" binding:"omitempty"`
	PatientType     string `json:"patientType" binding:"omitempty,oneof=new returning"`
	Source          string `json:"source" binding:"omitempty,oneof=admin website whatsapp phone"`
	AppointmentDate string `json:"appointmentDate" binding:"omitempty,max=40"`
	AppointmentTime string `json:"appointmentTime" binding:"omitempty,max=40"`
	Status          string `json:"status" binding:"omitempty,oneof=pending confirmed done cancelled no_show"`
	Message         string `json:"message" binding:"omitempty,max=2000"`
}

type updateAppointmentRequest struct {
	Status          string `json:"status" binding:"omitempty,oneof=pending confirmed done cancelled no_show"`
	Name            string `json:"name" binding:"omitempty,min=2,max=120"`
	Phone           string `json:"phone" binding:"omitempty,min=6,max=30"`
	Email           string `json:"email" binding:"omitempty,email"`
	Service         string `json:"service" binding:"omitempty,max=120"`
	Doctor          string `json:"doctor" binding:"omitempty,max=120"`
	DoctorID        uint   `json:"doctorId" binding:"omitempty"`
	AppointmentDate string `json:"appointmentDate" binding:"omitempty,max=40"`
	AppointmentTime string `json:"appointmentTime" binding:"omitempty,max=40"`
	CancelReason    string `json:"cancelReason" binding:"omitempty,max=500"`
	Message         string `json:"message" binding:"omitempty,max=2000"`
}

// buildAppointment maps a create request to a model, applying sensible defaults.
func buildAppointment(req createAppointmentRequest, defaultSource string) models.Appointment {
	source := req.Source
	if source == "" {
		source = defaultSource
	}
	status := req.Status
	if status == "" {
		status = "pending"
	}
	appt := models.Appointment{
		Name: req.Name, Phone: req.Phone, Email: req.Email, Service: req.Service,
		Doctor: req.Doctor, PatientType: req.PatientType, Source: source,
		AppointmentDate: req.AppointmentDate, AppointmentTime: req.AppointmentTime,
		ScheduledAt: parseScheduledAt(req.AppointmentDate, req.AppointmentTime),
		Message:     req.Message, Status: status,
	}
	// DoctorID is a nullable FK: only set it when a real doctor was chosen.
	// 0 from the JSON DTO means "unspecified" and must persist as NULL.
	if req.DoctorID != 0 {
		id := req.DoctorID
		appt.DoctorID = &id
	}
	return appt
}

// resolveDoctorName loads a doctor by id and returns its name. Returns ("", false)
// when the doctor does not exist, so admin bookings can reject an unknown doctorId.
func (h *Handler) resolveDoctorName(doctorID uint) (string, bool) {
	if doctorID == 0 {
		return "", false
	}
	var doc models.Doctor
	if err := h.DB.First(&doc, doctorID).Error; err != nil {
		return "", false
	}
	return doc.Name, true
}

// enforceSlotIfDoctor validates the requested slot through the shared
// availability check when a specific doctor + date + time are provided, so the
// anti-collision unique index actually applies. Legacy bookings without a doctor
// are left untouched. Returns false (and writes a conflict response) if taken.
func (h *Handler) enforceSlotIfDoctor(c *gin.Context, req createAppointmentRequest) bool {
	if req.DoctorID == 0 || req.AppointmentDate == "" || req.AppointmentTime == "" {
		return true
	}
	free, err := h.isSlotAvailable(req.DoctorID, req.AppointmentDate, req.AppointmentTime)
	if err != nil {
		fail(c, http.StatusBadRequest, "INVALID_DOCTOR", "Dokter atau tanggal tidak valid")
		return false
	}
	if !free {
		fail(c, http.StatusConflict, "SLOT_TAKEN", "Jadwal tersebut tidak tersedia. Silakan pilih jam lain.")
		return false
	}
	return true
}

// CreateAppointment is the PUBLIC endpoint used by the website contact form.
func (h *Handler) CreateAppointment(c *gin.Context) {
	var req createAppointmentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		failValidation(c, err)
		return
	}
	req.Status = "pending" // public submissions always start pending
	if !h.enforceSlotIfDoctor(c, req) {
		return
	}
	appt := buildAppointment(req, "website")
	if err := h.DB.Create(&appt).Error; err != nil {
		if appt.DoctorID != nil {
			// Most likely the partial unique index caught a concurrent booking.
			fail(c, http.StatusConflict, "SLOT_TAKEN", "Jadwal tersebut baru saja dipesan. Silakan pilih jam lain.")
			return
		}
		fail(c, http.StatusInternalServerError, "DB_ERROR", "Gagal menyimpan permintaan")
		return
	}
	go h.Notify.AppointmentCreated(appt)
	created(c, appt)
}

// AdminCreateAppointment lets reception staff create an appointment from the dashboard.
func (h *Handler) AdminCreateAppointment(c *gin.Context) {
	var req createAppointmentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		failValidation(c, err)
		return
	}
	// When a doctorId is supplied, canonicalize the doctor name from the record so
	// the stored Doctor string always matches the FK (admin UIs may send only id).
	if req.DoctorID != 0 {
		name, ok2 := h.resolveDoctorName(req.DoctorID)
		if !ok2 {
			fail(c, http.StatusBadRequest, "INVALID_DOCTOR", "Dokter tidak ditemukan")
			return
		}
		req.Doctor = name
	}
	if !h.enforceSlotIfDoctor(c, req) {
		return
	}
	appt := buildAppointment(req, "admin")
	appt.HandledByAdminID = currentAdminID(c)
	if err := h.DB.Create(&appt).Error; err != nil {
		if appt.DoctorID != nil {
			fail(c, http.StatusConflict, "SLOT_TAKEN", "Jadwal tersebut baru saja dipesan. Silakan pilih jam lain.")
			return
		}
		fail(c, http.StatusInternalServerError, "DB_ERROR", "Gagal menyimpan permintaan")
		return
	}
	h.audit(c, "create", "appointments", stringID(appt.ID))
	go h.Notify.AppointmentCreated(appt)
	created(c, appt)
}

// ListAppointments returns paginated, filterable appointments (admin).
func (h *Handler) ListAppointments(c *gin.Context) {
	params := parseListParams(c, "created_at")
	if params.Direction == "asc" && c.Query("direction") == "" {
		params.Direction = "desc"
	}
	q := h.DB.Model(&models.Appointment{})
	if params.Status != "" {
		q = q.Where("status = ?", params.Status)
	}
	if params.Q != "" {
		like := "%" + params.Q + "%"
		q = q.Where("name ILIKE ? OR email ILIKE ? OR phone ILIKE ?", like, like, like)
	}
	// Calendar/agenda filters.
	if did := c.Query("doctorId"); did != "" {
		q = q.Where("doctor_id = ?", did)
	}
	if from := c.Query("from"); from != "" {
		q = q.Where("appointment_date >= ?", from)
	}
	if to := c.Query("to"); to != "" {
		q = q.Where("appointment_date <= ?", to)
	}

	var total int64
	q.Count(&total)

	var items []models.Appointment
	q = applyOrder(q, params, map[string]string{
		"created_at": "created_at",
		"updated_at": "updated_at",
		"name":       "name",
		"status":     "status",
		"service":    "service",
	}, "created_at")
	if err := paginate(q, params).Find(&items).Error; err != nil {
		fail(c, http.StatusInternalServerError, "DB_ERROR", "Gagal memuat data")
		return
	}

	listResponse(c, items, total, params)
}

// GetAppointment returns one appointment.
func (h *Handler) GetAppointment(c *gin.Context) {
	var appt models.Appointment
	if err := h.DB.First(&appt, c.Param("id")).Error; err != nil {
		fail(c, http.StatusNotFound, "NOT_FOUND", "Permintaan tidak ditemukan")
		return
	}
	// Reading a single appointment exposes patient PHI/contact data — audit it.
	h.audit(c, "read", "appointments", c.Param("id"))
	ok(c, appt)
}

// UpdateAppointment updates status or details of an appointment.
func (h *Handler) UpdateAppointment(c *gin.Context) {
	var appt models.Appointment
	if err := h.DB.First(&appt, c.Param("id")).Error; err != nil {
		fail(c, http.StatusNotFound, "NOT_FOUND", "Permintaan tidak ditemukan")
		return
	}
	var req updateAppointmentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		failValidation(c, err)
		return
	}
	oldStatus := appt.Status
	updates := map[string]any{}

	// Effective scheduling fields after the patch (fall back to current values),
	// used both for slot re-validation and for recomputing ScheduledAt.
	newDate := appt.AppointmentDate
	if req.AppointmentDate != "" {
		newDate = req.AppointmentDate
	}
	newTime := appt.AppointmentTime
	if req.AppointmentTime != "" {
		newTime = req.AppointmentTime
	}
	effectiveDoctorID := uint(0)
	if appt.DoctorID != nil {
		effectiveDoctorID = *appt.DoctorID
	}

	// doctorId reassignment: canonicalize the stored doctor name from the record.
	if req.DoctorID != 0 && (appt.DoctorID == nil || *appt.DoctorID != req.DoctorID) {
		name, ok2 := h.resolveDoctorName(req.DoctorID)
		if !ok2 {
			fail(c, http.StatusBadRequest, "INVALID_DOCTOR", "Dokter tidak ditemukan")
			return
		}
		updates["doctor_id"] = req.DoctorID
		updates["doctor"] = name
		effectiveDoctorID = req.DoctorID
	}

	// Reschedule guard: if date/time/doctor changed and a doctor-backed slot
	// results, re-validate it through the shared availability check (the partial
	// unique index is the final backstop on Save below).
	scheduleChanged := req.AppointmentDate != "" || req.AppointmentTime != "" || req.DoctorID != 0
	if scheduleChanged && effectiveDoctorID != 0 && newDate != "" && newTime != "" {
		free, err := h.isSlotAvailable(effectiveDoctorID, newDate, newTime)
		if err != nil {
			fail(c, http.StatusBadRequest, "INVALID_DOCTOR", "Dokter atau tanggal tidak valid")
			return
		}
		// Allow a no-op reschedule onto the appointment's own current slot.
		sameSlot := newDate == appt.AppointmentDate && newTime == appt.AppointmentTime &&
			effectiveDoctorID == func() uint {
				if appt.DoctorID != nil {
					return *appt.DoctorID
				}
				return 0
			}()
		if !free && !sameSlot {
			fail(c, http.StatusConflict, "SLOT_TAKEN", "Jadwal tersebut tidak tersedia. Silakan pilih jam lain.")
			return
		}
	}

	if req.Status != "" {
		updates["status"] = req.Status
	}
	if req.Name != "" {
		updates["name"] = req.Name
	}
	if req.Phone != "" {
		updates["phone"] = req.Phone
	}
	if req.Email != "" {
		updates["email"] = req.Email
	}
	// Explicit doctor name (only when doctorId was not the source of truth above).
	if req.Doctor != "" {
		if _, set := updates["doctor"]; !set {
			updates["doctor"] = req.Doctor
		}
	}
	if req.Service != "" {
		updates["service"] = req.Service
	}
	if req.AppointmentDate != "" {
		updates["appointment_date"] = req.AppointmentDate
	}
	if req.AppointmentTime != "" {
		updates["appointment_time"] = req.AppointmentTime
	}
	// Recompute the canonical instant whenever date or time was provided.
	if req.AppointmentDate != "" || req.AppointmentTime != "" {
		updates["scheduled_at"] = parseScheduledAt(newDate, newTime)
	}
	if req.Message != "" {
		updates["message"] = req.Message
	}
	// Cancellation metadata: stamp reason + timestamp when transitioning to
	// cancelled; clear it when reactivating a previously cancelled appointment.
	if req.Status == "cancelled" && oldStatus != "cancelled" {
		now := time.Now().In(clinicLoc)
		updates["cancelled_at"] = &now
		updates["cancel_reason"] = req.CancelReason
	} else if req.Status != "" && req.Status != "cancelled" && oldStatus == "cancelled" {
		updates["cancelled_at"] = nil
		updates["cancel_reason"] = ""
	}

	// Any admin mutation records who handled it.
	if len(updates) > 0 {
		updates["handled_by_admin_id"] = currentAdminID(c)
		if err := h.DB.Model(&appt).Updates(updates).Error; err != nil {
			// Most likely the partial unique index caught a concurrent booking.
			if _, ok2 := updates["scheduled_at"]; ok2 || updates["doctor_id"] != nil {
				fail(c, http.StatusConflict, "SLOT_TAKEN", "Jadwal tersebut baru saja dipesan. Silakan pilih jam lain.")
				return
			}
			fail(c, http.StatusInternalServerError, "DB_ERROR", "Gagal memperbarui janji temu")
			return
		}
		// Re-fetch so the response reflects the persisted row, not the pre-update copy.
		if err := h.DB.First(&appt, c.Param("id")).Error; err != nil {
			fail(c, http.StatusInternalServerError, "DB_ERROR", "Gagal memuat janji temu")
			return
		}
	}
	// Reflect what actually changed: status-only, details-only, or both. Derive
	// from the request, not the updates map, since the map also carries
	// bookkeeping keys (handled_by_admin_id, cancel metadata).
	statusChanged := req.Status != ""
	otherChanged := req.Name != "" || req.Phone != "" || req.Email != "" ||
		req.Service != "" || req.Doctor != "" || req.DoctorID != 0 ||
		req.AppointmentDate != "" || req.AppointmentTime != "" || req.Message != ""
	switch {
	case statusChanged && otherChanged:
		h.audit(c, "status_change+update", "appointments", c.Param("id"))
	case statusChanged:
		h.audit(c, "status_change", "appointments", c.Param("id"))
	default:
		h.audit(c, "update", "appointments", c.Param("id"))
	}
	if statusChanged && appt.Status != oldStatus {
		go h.Notify.AppointmentStatusChanged(appt, oldStatus)
	}
	ok(c, appt)
}

// DeleteAppointment removes an appointment.
func (h *Handler) DeleteAppointment(c *gin.Context) {
	if err := h.DB.Delete(&models.Appointment{}, c.Param("id")).Error; err != nil {
		fail(c, http.StatusInternalServerError, "DB_ERROR", "Gagal menghapus")
		return
	}
	h.audit(c, "delete", "appointments", c.Param("id"))
	noContent(c)
}
