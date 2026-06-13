package auth

import (
	"net/http"
	"sync"

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

// permMu guards rolePermissions, which is hydrated from the database at boot
// and mutated when a super admin edits the matrix at runtime.
var permMu sync.RWMutex

// defaultRolePermissions is the built-in baseline. It seeds the database on first
// boot and is used as a fallback for any role with no stored rows.
var defaultRolePermissions = map[string]map[string]bool{
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

// AssignableRoles is the ordered list of roles an admin can be given in the UI.
// (The internal "admin" alias is intentionally excluded.)
var AssignableRoles = []string{
	RoleSuperAdmin, RoleClinicAdmin, RoleReceptionist, RoleContentEditor, RoleViewer,
}

// AllPermissions is the ordered catalog of permissions, used to render the
// role/permission matrix in the dashboard.
var AllPermissions = []string{
	PermissionDashboardRead,
	PermissionAppointmentsRead, PermissionAppointmentsWrite, PermissionAppointmentsDelete,
	PermissionContentRead, PermissionContentWrite, PermissionContentDelete,
	PermissionClinicRead, PermissionClinicWrite, PermissionClinicDelete,
	PermissionSystemRead, PermissionSystemWrite, PermissionAuditRead,
}

// IsAssignableRole reports whether a role can be assigned to an admin.
func IsAssignableRole(role string) bool {
	for _, r := range AssignableRoles {
		if r == role {
			return true
		}
	}
	return false
}

// rolePermissions is the live, mutable matrix. It starts as a copy of the
// defaults and is overwritten by LoadRolePermissions / SetRolePermissions.
var rolePermissions = clonePermMatrix(defaultRolePermissions)

func clonePermMatrix(src map[string]map[string]bool) map[string]map[string]bool {
	out := make(map[string]map[string]bool, len(src))
	for role, perms := range src {
		inner := make(map[string]bool, len(perms))
		for p, v := range perms {
			inner[p] = v
		}
		out[role] = inner
	}
	return out
}

// DefaultPermissionsForRole returns the built-in baseline permissions for a role,
// used to seed the database on first boot.
func DefaultPermissionsForRole(role string) []string {
	perms := defaultRolePermissions[role]
	out := make([]string, 0, len(perms))
	for _, permission := range AllPermissions {
		if perms[permission] {
			out = append(out, permission)
		}
	}
	return out
}

// SetRolePermissions replaces the in-memory permissions for a role. super_admin
// is never narrowed — it always retains full access.
func SetRolePermissions(role string, permissions []string) {
	if role == RoleSuperAdmin {
		return
	}
	set := make(map[string]bool, len(permissions))
	valid := make(map[string]bool, len(AllPermissions))
	for _, p := range AllPermissions {
		valid[p] = true
	}
	for _, p := range permissions {
		if valid[p] {
			set[p] = true
		}
	}
	permMu.Lock()
	rolePermissions[role] = set
	permMu.Unlock()
}

func PermissionsForRole(role string) []string {
	if role == RoleSuperAdmin {
		out := make([]string, len(AllPermissions))
		copy(out, AllPermissions)
		return out
	}
	permMu.RLock()
	perms := rolePermissions[role]
	out := make([]string, 0, len(perms))
	for _, permission := range AllPermissions {
		if perms[permission] {
			out = append(out, permission)
		}
	}
	permMu.RUnlock()
	return out
}

func HasPermission(role, permission string) bool {
	if role == RoleSuperAdmin {
		return true
	}
	permMu.RLock()
	allowed := rolePermissions[role][permission]
	permMu.RUnlock()
	return allowed
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
