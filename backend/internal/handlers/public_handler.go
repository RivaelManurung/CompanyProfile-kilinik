package handlers

import (
	"net/http"

	"sehatnusantara/api/internal/models"

	"github.com/gin-gonic/gin"
)

// Public read endpoints — consumed by the public website (no auth).

const publicListLimit = 200

func (h *Handler) PublicDoctors(c *gin.Context) {
	var items []models.Doctor
	if err := h.DB.Where("active = ?", true).Order("order_index ASC, id ASC").Limit(publicListLimit).Find(&items).Error; err != nil {
		fail(c, http.StatusInternalServerError, "DB_ERROR", "Gagal memuat data dokter")
		return
	}
	ok(c, items)
}

func (h *Handler) PublicServices(c *gin.Context) {
	var items []models.Service
	if err := h.DB.Order("order_index ASC, id ASC").Limit(publicListLimit).Find(&items).Error; err != nil {
		fail(c, http.StatusInternalServerError, "DB_ERROR", "Gagal memuat data layanan")
		return
	}
	ok(c, items)
}

func (h *Handler) PublicLocations(c *gin.Context) {
	var items []models.Location
	if err := h.DB.Order("id ASC").Limit(publicListLimit).Find(&items).Error; err != nil {
		fail(c, http.StatusInternalServerError, "DB_ERROR", "Gagal memuat data lokasi")
		return
	}
	ok(c, items)
}

func (h *Handler) PublicPromotions(c *gin.Context) {
	var items []models.Promotion
	if err := h.DB.Where("active = ?", true).Order("display_order ASC, id ASC").Limit(publicListLimit).Find(&items).Error; err != nil {
		fail(c, http.StatusInternalServerError, "DB_ERROR", "Gagal memuat data promosi")
		return
	}
	ok(c, items)
}

func (h *Handler) PublicArticles(c *gin.Context) {
	var items []models.Article
	if err := h.DB.Where("published = ?", true).Order("published_at DESC, id DESC").Limit(publicListLimit).Find(&items).Error; err != nil {
		fail(c, http.StatusInternalServerError, "DB_ERROR", "Gagal memuat data artikel")
		return
	}
	ok(c, items)
}

func (h *Handler) PublicArticleBySlug(c *gin.Context) {
	var a models.Article
	if err := h.DB.Where("slug = ? AND published = ?", c.Param("slug"), true).First(&a).Error; err != nil {
		fail(c, http.StatusNotFound, "NOT_FOUND", "Artikel tidak ditemukan")
		return
	}
	ok(c, a)
}

// Health is a simple liveness probe.
func (h *Handler) Health(c *gin.Context) {
	sqlDB, err := h.DB.DB()
	if err != nil || sqlDB.Ping() != nil {
		fail(c, http.StatusServiceUnavailable, "DB_DOWN", "Database tidak tersedia")
		return
	}
	c.JSON(http.StatusOK, gin.H{"status": "ok"})
}
