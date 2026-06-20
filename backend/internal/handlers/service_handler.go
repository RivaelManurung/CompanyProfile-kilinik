package handlers

import (
	"net/http"

	"sehatnusantara/api/internal/models"

	"github.com/gin-gonic/gin"
)

type serviceRequest struct {
	Slug            string   `json:"slug" binding:"omitempty,max=120"`
	Title           string   `json:"title" binding:"required,min=2,max=160"`
	Short           string   `json:"short" binding:"omitempty,max=300"`
	Description     string   `json:"description" binding:"omitempty"`
	Icon            string   `json:"icon" binding:"omitempty,max=60"`
	Points          []string `json:"points"`
	OrderIndex      int      `json:"orderIndex"`
	Price           int      `json:"price" binding:"omitempty,min=0"`
	DurationMinutes int      `json:"durationMinutes" binding:"omitempty,min=0"`
}

func (h *Handler) ListServices(c *gin.Context) {
	params := parseListParams(c, "order_index")
	var items []models.Service
	q := h.DB.Model(&models.Service{})
	if params.Q != "" {
		like := "%" + params.Q + "%"
		q = q.Where("title ILIKE ? OR short ILIKE ? OR slug ILIKE ?", like, like, like)
	}
	var total int64
	q.Count(&total)
	q = applyOrder(q, params, map[string]string{
		"order_index": "order_index",
		"title":       "title",
		"created_at":  "created_at",
	}, "order_index")
	if err := paginate(q, params).Find(&items).Error; err != nil {
		fail(c, http.StatusInternalServerError, "DB_ERROR", "Gagal memuat layanan")
		return
	}
	listResponse(c, items, total, params)
}

func (h *Handler) GetService(c *gin.Context) {
	var s models.Service
	if err := h.DB.First(&s, c.Param("id")).Error; err != nil {
		fail(c, http.StatusNotFound, "NOT_FOUND", "Layanan tidak ditemukan")
		return
	}
	ok(c, s)
}

func (h *Handler) CreateService(c *gin.Context) {
	var req serviceRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		failValidation(c, err)
		return
	}
	slug := req.Slug
	if slug == "" {
		slug = slugify(req.Title)
	}
	s := models.Service{
		Slug: slug, Title: req.Title, Short: req.Short, Description: req.Description,
		Icon: req.Icon, Points: req.Points, OrderIndex: req.OrderIndex,
		Price: req.Price, DurationMinutes: req.DurationMinutes,
	}
	if err := h.DB.Create(&s).Error; err != nil {
		fail(c, http.StatusConflict, "CREATE_FAILED", "Gagal membuat (slug mungkin sudah dipakai)")
		return
	}
	h.audit(c, "create", "services", stringID(s.ID))
	created(c, s)
}

func (h *Handler) UpdateService(c *gin.Context) {
	var s models.Service
	if err := h.DB.First(&s, c.Param("id")).Error; err != nil {
		fail(c, http.StatusNotFound, "NOT_FOUND", "Layanan tidak ditemukan")
		return
	}
	var req serviceRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		failValidation(c, err)
		return
	}
	s.Title = req.Title
	s.Short = req.Short
	s.Description = req.Description
	s.Icon = req.Icon
	s.Points = req.Points
	s.OrderIndex = req.OrderIndex
	s.Price = req.Price
	s.DurationMinutes = req.DurationMinutes
	if req.Slug != "" {
		s.Slug = req.Slug
	}
	if err := h.DB.Save(&s).Error; err != nil {
		fail(c, http.StatusConflict, "UPDATE_FAILED", "Gagal memperbarui")
		return
	}
	h.audit(c, "update", "services", c.Param("id"))
	ok(c, s)
}

func (h *Handler) DeleteService(c *gin.Context) {
	if err := h.DB.Delete(&models.Service{}, c.Param("id")).Error; err != nil {
		fail(c, http.StatusInternalServerError, "DB_ERROR", "Gagal menghapus")
		return
	}
	h.audit(c, "delete", "services", c.Param("id"))
	noContent(c)
}
