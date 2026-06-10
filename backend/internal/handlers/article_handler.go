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
}

func (h *Handler) ListArticles(c *gin.Context) {
	params := parseListParams(c, "published_at")
	if params.Direction == "asc" && c.Query("direction") == "" {
		params.Direction = "desc"
	}
	var items []models.Article
	q := h.DB.Model(&models.Article{})
	if params.Status == "published" {
		q = q.Where("published = ?", true)
	}
	if params.Status == "draft" {
		q = q.Where("published = ?", false)
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
		PublishedAt: time.Now(),
	}
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
