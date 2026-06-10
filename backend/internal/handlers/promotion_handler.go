package handlers

import (
	"net/http"

	"sehatnusantara/api/internal/models"

	"github.com/gin-gonic/gin"
)

type promotionRequest struct {
	Slug     string `json:"slug" binding:"omitempty,max=120"`
	Title    string `json:"title" binding:"required,min=2,max=160"`
	Tag      string `json:"tag" binding:"omitempty,max=60"`
	Price    string `json:"price" binding:"omitempty,max=60"`
	OldPrice string `json:"oldPrice" binding:"omitempty,max=60"`
	Desc     string `json:"desc" binding:"omitempty,max=600"`
	Active   *bool  `json:"active"`
}

func (h *Handler) ListPromotions(c *gin.Context) {
	params := parseListParams(c, "created_at")
	if params.Direction == "asc" && c.Query("direction") == "" {
		params.Direction = "desc"
	}
	var items []models.Promotion
	q := h.DB.Model(&models.Promotion{})
	if params.Status == "active" {
		q = q.Where("active = ?", true)
	}
	if params.Status == "inactive" {
		q = q.Where("active = ?", false)
	}
	if params.Q != "" {
		like := "%" + params.Q + "%"
		q = q.Where("title ILIKE ? OR tag ILIKE ? OR slug ILIKE ?", like, like, like)
	}
	var total int64
	q.Count(&total)
	q = applyOrder(q, params, map[string]string{
		"created_at": "created_at",
		"title":      "title",
		"price":      "price",
	}, "created_at")
	if err := paginate(q, params).Find(&items).Error; err != nil {
		fail(c, http.StatusInternalServerError, "DB_ERROR", "Gagal memuat promo")
		return
	}
	listResponse(c, items, total, params)
}

func (h *Handler) GetPromotion(c *gin.Context) {
	var p models.Promotion
	if err := h.DB.First(&p, c.Param("id")).Error; err != nil {
		fail(c, http.StatusNotFound, "NOT_FOUND", "Promo tidak ditemukan")
		return
	}
	ok(c, p)
}

func (h *Handler) CreatePromotion(c *gin.Context) {
	var req promotionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		failValidation(c, err)
		return
	}
	slug := req.Slug
	if slug == "" {
		slug = slugify(req.Title)
	}
	p := models.Promotion{
		Slug: slug, Title: req.Title, Tag: req.Tag, Price: req.Price,
		OldPrice: req.OldPrice, Desc: req.Desc, Active: boolValue(req.Active, true),
	}
	if err := h.DB.Create(&p).Error; err != nil {
		fail(c, http.StatusConflict, "CREATE_FAILED", "Gagal membuat (slug mungkin sudah dipakai)")
		return
	}
	h.audit(c, "create", "promotions", stringID(p.ID))
	created(c, p)
}

func (h *Handler) UpdatePromotion(c *gin.Context) {
	var p models.Promotion
	if err := h.DB.First(&p, c.Param("id")).Error; err != nil {
		fail(c, http.StatusNotFound, "NOT_FOUND", "Promo tidak ditemukan")
		return
	}
	var req promotionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		failValidation(c, err)
		return
	}
	p.Title = req.Title
	p.Tag = req.Tag
	p.Price = req.Price
	p.OldPrice = req.OldPrice
	p.Desc = req.Desc
	p.Active = boolValue(req.Active, p.Active)
	if req.Slug != "" {
		p.Slug = req.Slug
	}
	if err := h.DB.Save(&p).Error; err != nil {
		fail(c, http.StatusConflict, "UPDATE_FAILED", "Gagal memperbarui")
		return
	}
	h.audit(c, "update", "promotions", c.Param("id"))
	ok(c, p)
}

func (h *Handler) DeletePromotion(c *gin.Context) {
	if err := h.DB.Delete(&models.Promotion{}, c.Param("id")).Error; err != nil {
		fail(c, http.StatusInternalServerError, "DB_ERROR", "Gagal menghapus")
		return
	}
	h.audit(c, "delete", "promotions", c.Param("id"))
	noContent(c)
}
