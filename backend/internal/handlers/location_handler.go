package handlers

import (
	"net/http"

	"sehatnusantara/api/internal/models"

	"github.com/gin-gonic/gin"
)

type locationRequest struct {
	Slug    string  `json:"slug" binding:"omitempty,max=120"`
	Name    string  `json:"name" binding:"required,min=2,max=160"`
	Area    string  `json:"area" binding:"omitempty,max=120"`
	Address string  `json:"address" binding:"omitempty,max=400"`
	Hours   string  `json:"hours" binding:"omitempty,max=160"`
	Phone   string  `json:"phone" binding:"omitempty,max=40"`
	Lat     float64 `json:"lat"`
	Lng     float64 `json:"lng"`
}

func (h *Handler) ListLocations(c *gin.Context) {
	params := parseListParams(c, "name")
	var items []models.Location
	q := h.DB.Model(&models.Location{})
	if params.Q != "" {
		like := "%" + params.Q + "%"
		q = q.Where("name ILIKE ? OR area ILIKE ? OR address ILIKE ? OR slug ILIKE ?", like, like, like, like)
	}
	var total int64
	q.Count(&total)
	q = applyOrder(q, params, map[string]string{
		"name":       "name",
		"area":       "area",
		"created_at": "created_at",
	}, "name")
	if err := paginate(q, params).Find(&items).Error; err != nil {
		fail(c, http.StatusInternalServerError, "DB_ERROR", "Gagal memuat lokasi")
		return
	}
	listResponse(c, items, total, params)
}

func (h *Handler) GetLocation(c *gin.Context) {
	var l models.Location
	if err := h.DB.First(&l, c.Param("id")).Error; err != nil {
		fail(c, http.StatusNotFound, "NOT_FOUND", "Lokasi tidak ditemukan")
		return
	}
	ok(c, l)
}

func (h *Handler) CreateLocation(c *gin.Context) {
	var req locationRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		failValidation(c, err)
		return
	}
	slug := req.Slug
	if slug == "" {
		slug = slugify(req.Name)
	}
	l := models.Location{
		Slug: slug, Name: req.Name, Area: req.Area, Address: req.Address,
		Hours: req.Hours, Phone: req.Phone, Lat: req.Lat, Lng: req.Lng,
	}
	if err := h.DB.Create(&l).Error; err != nil {
		fail(c, http.StatusConflict, "CREATE_FAILED", "Gagal membuat (slug mungkin sudah dipakai)")
		return
	}
	h.audit(c, "create", "locations", stringID(l.ID))
	created(c, l)
}

func (h *Handler) UpdateLocation(c *gin.Context) {
	var l models.Location
	if err := h.DB.First(&l, c.Param("id")).Error; err != nil {
		fail(c, http.StatusNotFound, "NOT_FOUND", "Lokasi tidak ditemukan")
		return
	}
	var req locationRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		failValidation(c, err)
		return
	}
	l.Name = req.Name
	l.Area = req.Area
	l.Address = req.Address
	l.Hours = req.Hours
	l.Phone = req.Phone
	l.Lat = req.Lat
	l.Lng = req.Lng
	if req.Slug != "" {
		l.Slug = req.Slug
	}
	if err := h.DB.Save(&l).Error; err != nil {
		fail(c, http.StatusConflict, "UPDATE_FAILED", "Gagal memperbarui")
		return
	}
	h.audit(c, "update", "locations", c.Param("id"))
	ok(c, l)
}

func (h *Handler) DeleteLocation(c *gin.Context) {
	if err := h.DB.Delete(&models.Location{}, c.Param("id")).Error; err != nil {
		fail(c, http.StatusInternalServerError, "DB_ERROR", "Gagal menghapus")
		return
	}
	h.audit(c, "delete", "locations", c.Param("id"))
	noContent(c)
}
