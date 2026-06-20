package handlers

import (
	stdlog "log"
	"net/http"

	"sehatnusantara/api/internal/models"

	"github.com/gin-gonic/gin"
)

func (h *Handler) audit(c *gin.Context, action, resource, resourceID string) {
	h.recordAudit(c, "admin", c.GetString("adminID"), c.GetString("adminEmail"), action, resource, resourceID)
}

// auditPatient records a patient-scoped audit entry (actor = the authenticated
// patient). actorID/actorEmail identify the patient; either may be empty for
// pre-auth flows (e.g. failed login / forgot-password) where only the email is
// known.
func (h *Handler) auditPatient(c *gin.Context, actorID, actorEmail, action, resource, resourceID string) {
	h.recordAudit(c, "patient", actorID, actorEmail, action, resource, resourceID)
}

// recordAudit is the shared audit-write path for every actor type.
func (h *Handler) recordAudit(c *gin.Context, actorType, actorID, actorEmail, action, resource, resourceID string) {
	entry := models.AuditLog{
		ActorType:  actorType,
		AdminID:    actorID,
		AdminEmail: actorEmail,
		Action:     action,
		Resource:   resource,
		ResourceID: resourceID,
		IP:         c.ClientIP(),
		UserAgent:  c.Request.UserAgent(),
	}
	// Audit writes must never block the request, but failures should be observable
	// rather than silently dropped.
	if err := h.DB.Create(&entry).Error; err != nil {
		stdlog.Printf("audit: failed to record %s on %s/%s: %v", action, resource, resourceID, err)
	}
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
