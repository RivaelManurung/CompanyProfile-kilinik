package seed

import (
	"log"

	"sehatnusantara/api/internal/auth"
	"sehatnusantara/api/internal/models"

	"gorm.io/gorm"
)

// seedRolePermissions persists the default permission matrix for any role that
// has no stored rows yet, then hydrates the in-memory matrix from the database.
// super_admin is intentionally not stored — it always retains full access.
func seedRolePermissions(db *gorm.DB) {
	for _, role := range auth.AssignableRoles {
		if role == auth.RoleSuperAdmin {
			continue
		}
		var count int64
		db.Model(&models.RolePermission{}).Where("role = ?", role).Count(&count)
		if count > 0 {
			continue
		}
		for _, perm := range auth.DefaultPermissionsForRole(role) {
			db.Create(&models.RolePermission{Role: role, Permission: perm})
		}
	}

	var rows []models.RolePermission
	db.Find(&rows)
	byRole := map[string][]string{}
	for _, r := range rows {
		byRole[r.Role] = append(byRole[r.Role], r.Permission)
	}
	for role, perms := range byRole {
		auth.SetRolePermissions(role, perms)
	}
	log.Println("seed: role permissions hydrated")
}
