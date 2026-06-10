package handlers

import (
	"net/http"

	"sehatnusantara/api/internal/models"

	"github.com/gin-gonic/gin"
)

type doctorRequest struct {
	Slug       string `json:"slug" binding:"omitempty,max=120"`
	Name       string `json:"name" binding:"required,min=2,max=160"`
	Specialty  string `json:"specialty" binding:"omitempty,max=160"`
	Experience string `json:"experience" binding:"omitempty,max=60"`
	ImageURL   string `json:"imageUrl" binding:"omitempty,max=500"`
	Accent     string `json:"accent" binding:"omitempty,max=120"`
	OrderIndex int    `json:"orderIndex"`
	Active     *bool  `json:"active"`
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
		OrderIndex: req.OrderIndex, Active: boolValue(req.Active, true),
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
	d.Name = req.Name
	d.Specialty = req.Specialty
	d.Experience = req.Experience
	d.ImageURL = req.ImageURL
	d.Accent = req.Accent
	d.OrderIndex = req.OrderIndex
	d.Active = boolValue(req.Active, d.Active)
	if req.Slug != "" {
		d.Slug = req.Slug
	}
	if err := h.DB.Save(&d).Error; err != nil {
		fail(c, http.StatusConflict, "UPDATE_FAILED", "Gagal memperbarui")
		return
	}
	h.audit(c, "update", "doctors", c.Param("id"))
	ok(c, d)
}

func (h *Handler) DeleteDoctor(c *gin.Context) {
	if err := h.DB.Delete(&models.Doctor{}, c.Param("id")).Error; err != nil {
		fail(c, http.StatusInternalServerError, "DB_ERROR", "Gagal menghapus")
		return
	}
	h.audit(c, "delete", "doctors", c.Param("id"))
	noContent(c)
}
