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
	// Campaign metadata
	Status          string `json:"status" binding:"omitempty,oneof=draft scheduled active expired hidden"`
	CampaignType    string `json:"campaignType" binding:"omitempty,oneof=discount bundle seasonal new_patient wellness"`
	StartDate       string `json:"startDate" binding:"omitempty,max=40"`
	EndDate         string `json:"endDate" binding:"omitempty,max=40"`
	CoverImage      string `json:"coverImage" binding:"omitempty,max=500"`
	Terms           string `json:"terms" binding:"omitempty,max=2000"`
	FullDescription string `json:"fullDescription" binding:"omitempty,max=4000"`
	TargetAudience  string `json:"targetAudience" binding:"omitempty,max=120"`
	AccentColor     string `json:"accentColor" binding:"omitempty,max=60"`
	Currency        string `json:"currency" binding:"omitempty,max=10"`
	PriceNote       string `json:"priceNote" binding:"omitempty,max=120"`
	Featured        *bool  `json:"featured"`
	DisplayOrder    *int   `json:"displayOrder"`
	MaxClaims       *int   `json:"maxClaims"`
}

// applyPromotionMeta copies campaign metadata onto a promotion model and keeps
// the legacy `active` boolean consistent with the lifecycle status.
func applyPromotionMeta(p *models.Promotion, req *promotionRequest) {
	if req.Status != "" {
		p.Status = req.Status
		p.Active = req.Status == "active"
	}
	p.CampaignType = req.CampaignType
	p.StartDate = req.StartDate
	p.EndDate = req.EndDate
	p.CoverImage = req.CoverImage
	p.Terms = req.Terms
	p.FullDescription = req.FullDescription
	p.TargetAudience = req.TargetAudience
	p.AccentColor = req.AccentColor
	p.Currency = req.Currency
	p.PriceNote = req.PriceNote
	p.Featured = boolValue(req.Featured, p.Featured)
	if req.DisplayOrder != nil {
		p.DisplayOrder = *req.DisplayOrder
	}
	if req.MaxClaims != nil {
		p.MaxClaims = *req.MaxClaims
	}
}

func (h *Handler) ListPromotions(c *gin.Context) {
	params := parseListParams(c, "created_at")
	if params.Direction == "asc" && c.Query("direction") == "" {
		params.Direction = "desc"
	}
	var items []models.Promotion
	q := h.DB.Model(&models.Promotion{})
	switch params.Status {
	case "draft", "scheduled", "active", "expired", "hidden":
		q = q.Where("status = ?", params.Status)
	case "inactive":
		q = q.Where("active = ?", false)
	}
	// Server-side campaign-type filter so pagination/counts stay correct.
	switch c.Query("campaign") {
	case "discount", "bundle", "seasonal", "new_patient", "wellness":
		q = q.Where("campaign_type = ?", c.Query("campaign"))
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
		Status: "draft",
	}
	applyPromotionMeta(&p, &req)
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
	applyPromotionMeta(&p, &req)
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
