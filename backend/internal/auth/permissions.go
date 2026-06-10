package auth

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

const (
	RoleSuperAdmin    = "super_admin"
	RoleClinicAdmin   = "clinic_admin"
	RoleReceptionist  = "receptionist"
	RoleContentEditor = "content_editor"
	RoleViewer        = "viewer"
)

const (
	PermissionDashboardRead      = "dashboard:read"
	PermissionAppointmentsRead   = "appointments:read"
	PermissionAppointmentsWrite  = "appointments:write"
	PermissionAppointmentsDelete = "appointments:delete"
	PermissionContentRead        = "content:read"
	PermissionContentWrite       = "content:write"
	PermissionContentDelete      = "content:delete"
	PermissionClinicRead         = "clinic:read"
	PermissionClinicWrite        = "clinic:write"
	PermissionClinicDelete       = "clinic:delete"
	PermissionSystemRead         = "system:read"
	PermissionSystemWrite        = "system:write"
	PermissionAuditRead          = "audit:read"
)

var rolePermissions = map[string]map[string]bool{
	"admin": {
		PermissionDashboardRead: true, PermissionAppointmentsRead: true, PermissionAppointmentsWrite: true, PermissionAppointmentsDelete: true,
		PermissionContentRead: true, PermissionContentWrite: true, PermissionContentDelete: true,
		PermissionClinicRead: true, PermissionClinicWrite: true, PermissionClinicDelete: true,
		PermissionSystemRead: true, PermissionSystemWrite: true, PermissionAuditRead: true,
	},
	RoleSuperAdmin: {
		PermissionDashboardRead: true, PermissionAppointmentsRead: true, PermissionAppointmentsWrite: true, PermissionAppointmentsDelete: true,
		PermissionContentRead: true, PermissionContentWrite: true, PermissionContentDelete: true,
		PermissionClinicRead: true, PermissionClinicWrite: true, PermissionClinicDelete: true,
		PermissionSystemRead: true, PermissionSystemWrite: true, PermissionAuditRead: true,
	},
	RoleClinicAdmin: {
		PermissionDashboardRead: true, PermissionAppointmentsRead: true, PermissionAppointmentsWrite: true, PermissionAppointmentsDelete: true,
		PermissionContentRead: true, PermissionContentWrite: true, PermissionContentDelete: true,
		PermissionClinicRead: true, PermissionClinicWrite: true, PermissionClinicDelete: true, PermissionAuditRead: true,
	},
	RoleReceptionist: {
		PermissionDashboardRead: true, PermissionAppointmentsRead: true, PermissionAppointmentsWrite: true,
		PermissionClinicRead: true,
	},
	RoleContentEditor: {
		PermissionDashboardRead: true, PermissionContentRead: true, PermissionContentWrite: true,
		PermissionClinicRead: true,
	},
	RoleViewer: {
		PermissionDashboardRead: true, PermissionAppointmentsRead: true, PermissionContentRead: true, PermissionClinicRead: true,
	},
}

func PermissionsForRole(role string) []string {
	perms := rolePermissions[role]
	out := make([]string, 0, len(perms))
	for permission := range perms {
		out = append(out, permission)
	}
	return out
}

func HasPermission(role, permission string) bool {
	if role == RoleSuperAdmin {
		return true
	}
	return rolePermissions[role][permission]
}

func RequirePermission(permission string) gin.HandlerFunc {
	return func(c *gin.Context) {
		role := c.GetString(ctxAdminRole)
		if !HasPermission(role, permission) {
			c.AbortWithStatusJSON(http.StatusForbidden, gin.H{
				"error": gin.H{"code": "FORBIDDEN", "message": "Anda tidak memiliki akses untuk aksi ini"},
			})
			return
		}
		c.Next()
	}
}
