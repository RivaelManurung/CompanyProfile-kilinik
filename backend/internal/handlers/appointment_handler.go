package handlers

import (
	"net/http"

	"sehatnusantara/api/internal/models"

	"github.com/gin-gonic/gin"
)

type createAppointmentRequest struct {
	Name    string `json:"name" binding:"required,min=2,max=120"`
	Phone   string `json:"phone" binding:"required,min=6,max=30"`
	Email   string `json:"email" binding:"omitempty,email"`
	Service string `json:"service" binding:"omitempty,max=120"`
	Message string `json:"message" binding:"omitempty,max=2000"`
}

type updateAppointmentRequest struct {
	Status  string `json:"status" binding:"omitempty,oneof=pending confirmed done cancelled"`
	Name    string `json:"name" binding:"omitempty,min=2,max=120"`
	Phone   string `json:"phone" binding:"omitempty,min=6,max=30"`
	Email   string `json:"email" binding:"omitempty,email"`
	Service string `json:"service" binding:"omitempty,max=120"`
	Message string `json:"message" binding:"omitempty,max=2000"`
}

// CreateAppointment is the PUBLIC endpoint used by the website contact form.
func (h *Handler) CreateAppointment(c *gin.Context) {
	var req createAppointmentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		failValidation(c, err)
		return
	}
	appt := models.Appointment{
		Name: req.Name, Phone: req.Phone, Email: req.Email,
		Service: req.Service, Message: req.Message, Status: "pending",
	}
	if err := h.DB.Create(&appt).Error; err != nil {
		fail(c, http.StatusInternalServerError, "DB_ERROR", "Gagal menyimpan permintaan")
		return
	}
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
	updates := map[string]any{}
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
	if req.Service != "" {
		updates["service"] = req.Service
	}
	if req.Message != "" {
		updates["message"] = req.Message
	}
	if len(updates) > 0 {
		h.DB.Model(&appt).Updates(updates)
	}
	if req.Status != "" {
		h.audit(c, "status_change", "appointments", c.Param("id"))
	} else {
		h.audit(c, "update", "appointments", c.Param("id"))
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
