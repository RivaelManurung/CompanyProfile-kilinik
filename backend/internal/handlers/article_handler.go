package handlers

import (
	"net/http"
	"time"

	"sehatnusantara/api/internal/models"

	"github.com/gin-gonic/gin"
)

type articleRequest struct {
	Slug      string `json:"slug" binding:"omitempty,max=160"`
	Title     string `json:"title" binding:"required,min=4,max=200"`
	Excerpt   string `json:"excerpt" binding:"omitempty,max=500"`
	Category  string `json:"category" binding:"omitempty,max=80"`
	Content   string `json:"content" binding:"omitempty"`
	ReadMins  int    `json:"readMins"`
	Published *bool  `json:"published"`
	// CMS metadata
	Status         string   `json:"status" binding:"omitempty,oneof=draft published scheduled archived"`
	ScheduledAt    string   `json:"scheduledAt" binding:"omitempty,max=40"`
	CoverImage     string   `json:"coverImage" binding:"omitempty,max=500"`
	Tags           []string `json:"tags"`
	Author         string   `json:"author" binding:"omitempty,max=120"`
	Featured       *bool    `json:"featured"`
	SeoTitle       string   `json:"seoTitle" binding:"omitempty,max=200"`
	SeoDescription string   `json:"seoDescription" binding:"omitempty,max=320"`
	OgImage        string   `json:"ogImage" binding:"omitempty,max=500"`
	CanonicalURL   string   `json:"canonicalUrl" binding:"omitempty,max=500"`
	FocusKeyword   string   `json:"focusKeyword" binding:"omitempty,max=120"`
}

// applyArticleMeta copies CMS metadata from a request onto an article model and
// keeps the legacy `published` boolean consistent with the lifecycle status.
func applyArticleMeta(a *models.Article, req *articleRequest) {
	if req.Status != "" {
		a.Status = req.Status
		a.Published = req.Status == "published"
	}
	a.ScheduledAt = req.ScheduledAt
	a.CoverImage = req.CoverImage
	a.Tags = req.Tags
	a.Author = req.Author
	a.Featured = boolValue(req.Featured, a.Featured)
	a.SeoTitle = req.SeoTitle
	a.SeoDescription = req.SeoDescription
	a.OgImage = req.OgImage
	a.CanonicalURL = req.CanonicalURL
	a.FocusKeyword = req.FocusKeyword
}

func (h *Handler) ListArticles(c *gin.Context) {
	params := parseListParams(c, "published_at")
	if params.Direction == "asc" && c.Query("direction") == "" {
		params.Direction = "desc"
	}
	var items []models.Article
	q := h.DB.Model(&models.Article{})
	switch params.Status {
	case "published", "draft", "scheduled", "archived":
		q = q.Where("status = ?", params.Status)
	case "featured":
		q = q.Where("featured = ?", true)
	}
	if params.Q != "" {
		like := "%" + params.Q + "%"
		q = q.Where("title ILIKE ? OR category ILIKE ? OR slug ILIKE ?", like, like, like)
	}
	var total int64
	q.Count(&total)
	q = applyOrder(q, params, map[string]string{
		"published_at": "published_at",
		"created_at":   "created_at",
		"title":        "title",
		"category":     "category",
	}, "published_at")
	if err := paginate(q, params).Find(&items).Error; err != nil {
		fail(c, http.StatusInternalServerError, "DB_ERROR", "Gagal memuat artikel")
		return
	}
	listResponse(c, items, total, params)
}

func (h *Handler) GetArticle(c *gin.Context) {
	var a models.Article
	if err := h.DB.First(&a, c.Param("id")).Error; err != nil {
		fail(c, http.StatusNotFound, "NOT_FOUND", "Artikel tidak ditemukan")
		return
	}
	ok(c, a)
}

func (h *Handler) CreateArticle(c *gin.Context) {
	var req articleRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		failValidation(c, err)
		return
	}
	slug := req.Slug
	if slug == "" {
		slug = slugify(req.Title)
	}
	readMins := req.ReadMins
	if readMins <= 0 {
		readMins = 4
	}
	a := models.Article{
		Slug: slug, Title: req.Title, Excerpt: req.Excerpt, Category: req.Category,
		Content: req.Content, ReadMins: readMins, Published: boolValue(req.Published, true),
		PublishedAt: time.Now(), Status: "published",
	}
	applyArticleMeta(&a, &req)
	if err := h.DB.Create(&a).Error; err != nil {
		fail(c, http.StatusConflict, "CREATE_FAILED", "Gagal membuat (slug mungkin sudah dipakai)")
		return
	}
	h.audit(c, "create", "articles", stringID(a.ID))
	created(c, a)
}

func (h *Handler) UpdateArticle(c *gin.Context) {
	var a models.Article
	if err := h.DB.First(&a, c.Param("id")).Error; err != nil {
		fail(c, http.StatusNotFound, "NOT_FOUND", "Artikel tidak ditemukan")
		return
	}
	var req articleRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		failValidation(c, err)
		return
	}
	a.Title = req.Title
	a.Excerpt = req.Excerpt
	a.Category = req.Category
	a.Content = req.Content
	if req.ReadMins > 0 {
		a.ReadMins = req.ReadMins
	}
	a.Published = boolValue(req.Published, a.Published)
	applyArticleMeta(&a, &req)
	if req.Slug != "" {
		a.Slug = req.Slug
	}
	if err := h.DB.Save(&a).Error; err != nil {
		fail(c, http.StatusConflict, "UPDATE_FAILED", "Gagal memperbarui")
		return
	}
	h.audit(c, "update", "articles", c.Param("id"))
	ok(c, a)
}

func (h *Handler) DeleteArticle(c *gin.Context) {
	if err := h.DB.Delete(&models.Article{}, c.Param("id")).Error; err != nil {
		fail(c, http.StatusInternalServerError, "DB_ERROR", "Gagal menghapus")
		return
	}
	h.audit(c, "delete", "articles", c.Param("id"))
	noContent(c)
}
