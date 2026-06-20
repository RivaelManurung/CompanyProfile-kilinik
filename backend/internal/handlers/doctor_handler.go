package handlers

import (
	"fmt"
	"net/http"

	"sehatnusantara/api/internal/models"

	"github.com/gin-gonic/gin"
)

type doctorRequest struct {
	Slug            string `json:"slug" binding:"omitempty,max=120"`
	Name            string `json:"name" binding:"required,min=2,max=160"`
	Specialty       string `json:"specialty" binding:"omitempty,max=160"`
	Experience      string `json:"experience" binding:"omitempty,max=60"`
	ImageURL        string `json:"imageUrl" binding:"omitempty,max=500"`
	Accent          string `json:"accent" binding:"omitempty,max=120"`
	OrderIndex      int    `json:"orderIndex"`
	STRNumber       string `json:"strNumber" binding:"omitempty,max=80"`
	SIPNumber       string `json:"sipNumber" binding:"omitempty,max=80"`
	ConsultationFee *int   `json:"consultationFee" binding:"omitempty"`
	Active          *bool  `json:"active"`
}

func (h *Handler) ListDoctors(c *gin.Context) {
	params := parseListParams(c, "order_index")
	var items []models.Doctor
	q := h.DB.Model(&models.Doctor{})
	if params.Status == "active" {
		q = q.Where("active = ?", true)
	}
	if params.Status == "inactive" {
		q = q.Where("active = ?", false)
	}
	if params.Q != "" {
		like := "%" + params.Q + "%"
		q = q.Where("name ILIKE ? OR specialty ILIKE ? OR slug ILIKE ?", like, like, like)
	}
	var total int64
	q.Count(&total)
	q = applyOrder(q, params, map[string]string{
		"order_index": "order_index",
		"name":        "name",
		"specialty":   "specialty",
		"created_at":  "created_at",
	}, "order_index")
	if err := paginate(q, params).Find(&items).Error; err != nil {
		fail(c, http.StatusInternalServerError, "DB_ERROR", "Gagal memuat dokter")
		return
	}
	listResponse(c, items, total, params)
}

func (h *Handler) GetDoctor(c *gin.Context) {
	var d models.Doctor
	if err := h.DB.First(&d, c.Param("id")).Error; err != nil {
		fail(c, http.StatusNotFound, "NOT_FOUND", "Dokter tidak ditemukan")
		return
	}
	ok(c, d)
}

func (h *Handler) CreateDoctor(c *gin.Context) {
	var req doctorRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		failValidation(c, err)
		return
	}
	slug := req.Slug
	if slug == "" {
		slug = slugify(req.Name)
	}
	d := models.Doctor{
		Slug: slug, Name: req.Name, Specialty: req.Specialty,
		Experience: req.Experience, ImageURL: req.ImageURL, Accent: req.Accent,
		OrderIndex: req.OrderIndex, STRNumber: req.STRNumber, SIPNumber: req.SIPNumber,
		ConsultationFee: intValue(req.ConsultationFee, 0), Active: boolValue(req.Active, true),
	}
	if err := h.DB.Create(&d).Error; err != nil {
		fail(c, http.StatusConflict, "CREATE_FAILED", "Gagal membuat (slug mungkin sudah dipakai)")
		return
	}
	h.audit(c, "create", "doctors", stringID(d.ID))
	created(c, d)
}

func (h *Handler) UpdateDoctor(c *gin.Context) {
	var d models.Doctor
	if err := h.DB.First(&d, c.Param("id")).Error; err != nil {
		fail(c, http.StatusNotFound, "NOT_FOUND", "Dokter tidak ditemukan")
		return
	}
	var req doctorRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		failValidation(c, err)
		return
	}
	// Update only fields the caller actually sent so concurrent edits to other
	// columns are not clobbered. Name is binding:"required" so it is always set.
	updates := map[string]any{
		"name":        req.Name,
		"order_index": req.OrderIndex,
	}
	if req.Specialty != "" {
		updates["specialty"] = req.Specialty
	}
	if req.Experience != "" {
		updates["experience"] = req.Experience
	}
	if req.ImageURL != "" {
		updates["image_url"] = req.ImageURL
	}
	if req.Accent != "" {
		updates["accent"] = req.Accent
	}
	if req.Slug != "" {
		updates["slug"] = req.Slug
	}
	if req.STRNumber != "" {
		updates["str_number"] = req.STRNumber
	}
	if req.SIPNumber != "" {
		updates["sip_number"] = req.SIPNumber
	}
	// Pointer lets us tell "set to 0" apart from "not provided".
	if req.ConsultationFee != nil {
		updates["consultation_fee"] = *req.ConsultationFee
	}
	if req.Active != nil {
		updates["active"] = *req.Active
	}
	if err := h.DB.Model(&d).Updates(updates).Error; err != nil {
		fail(c, http.StatusConflict, "UPDATE_FAILED", "Gagal memperbarui")
		return
	}
	// Re-fetch so the response reflects the persisted row.
	if err := h.DB.First(&d, c.Param("id")).Error; err != nil {
		fail(c, http.StatusInternalServerError, "DB_ERROR", "Gagal memuat dokter")
		return
	}
	h.audit(c, "update", "doctors", c.Param("id"))
	ok(c, d)
}

func (h *Handler) DeleteDoctor(c *gin.Context) {
	id := c.Param("id")

	// Orphan guard: refuse to delete a doctor that still has working schedules or
	// active (pending/confirmed) appointments referencing them. Schedules always
	// block; historical appointments (done/cancelled) and soft-deleted rows do not.
	var scheduleCount int64
	h.DB.Model(&models.DoctorSchedule{}).Where("doctor_id = ?", id).Count(&scheduleCount)
	var activeAppointments int64
	h.DB.Model(&models.Appointment{}).
		Where("doctor_id = ? AND status IN ?", id, []string{"pending", "confirmed"}).
		Count(&activeAppointments)
	if scheduleCount > 0 || activeAppointments > 0 {
		fail(c, http.StatusConflict, "DOCTOR_IN_USE",
			fmt.Sprintf("Dokter masih memiliki %d jadwal dan %d janji temu aktif. Pindahkan atau selesaikan terlebih dahulu.", scheduleCount, activeAppointments))
		return
	}

	if err := h.DB.Delete(&models.Doctor{}, id).Error; err != nil {
		fail(c, http.StatusInternalServerError, "DB_ERROR", "Gagal menghapus")
		return
	}
	h.audit(c, "delete", "doctors", id)
	noContent(c)
}
