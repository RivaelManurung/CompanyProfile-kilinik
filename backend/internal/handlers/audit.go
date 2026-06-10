package handlers

import (
	"net/http"

	"sehatnusantara/api/internal/models"

	"github.com/gin-gonic/gin"
)

func (h *Handler) audit(c *gin.Context, action, resource, resourceID string) {
	log := models.AuditLog{
		AdminID:    c.GetString("adminID"),
		AdminEmail: c.GetString("adminEmail"),
		Action:     action,
		Resource:   resource,
		ResourceID: resourceID,
		IP:         c.ClientIP(),
		UserAgent:  c.Request.UserAgent(),
	}
	_ = h.DB.Create(&log).Error
}

func (h *Handler) ListAuditLogs(c *gin.Context) {
	params := parseListParams(c, "created_at")
	params.Direction = "desc"

	q := h.DB.Model(&models.AuditLog{})
	if params.Q != "" {
		like := "%" + params.Q + "%"
		q = q.Where("admin_email ILIKE ? OR action ILIKE ? OR resource ILIKE ? OR resource_id ILIKE ?", like, like, like, like)
	}

	var total int64
	q.Count(&total)

	var items []models.AuditLog
	if err := paginate(applyOrder(q, params, map[string]string{
		"created_at":  "created_at",
		"action":      "action",
		"resource":    "resource",
		"admin_email": "admin_email",
	}, "created_at"), params).Find(&items).Error; err != nil {
		fail(c, http.StatusInternalServerError, "DB_ERROR", "Gagal memuat audit log")
		return
	}

	listResponse(c, items, total, params)
}
