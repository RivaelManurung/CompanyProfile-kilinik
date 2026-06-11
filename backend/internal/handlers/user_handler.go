package handlers

import (
	"net/http"
	"strings"

	"sehatnusantara/api/internal/auth"
	"sehatnusantara/api/internal/models"

	"github.com/gin-gonic/gin"
)

type createUserRequest struct {
	Name      string `json:"name" binding:"required,min=2,max=120"`
	Email     string `json:"email" binding:"required,email"`
	Password  string `json:"password" binding:"required,min=8,max=72"`
	Role      string `json:"role" binding:"required"`
	Phone     string `json:"phone" binding:"omitempty,max=40"`
	AvatarURL string `json:"avatarUrl" binding:"omitempty,max=500"`
	Active    *bool  `json:"active"`
}

type updateUserRequest struct {
	Name      string `json:"name" binding:"omitempty,min=2,max=120"`
	Email     string `json:"email" binding:"omitempty,email"`
	Password  string `json:"password" binding:"omitempty,min=8,max=72"`
	Role      string `json:"role" binding:"omitempty"`
	Phone     string `json:"phone" binding:"omitempty,max=40"`
	AvatarURL string `json:"avatarUrl" binding:"omitempty,max=500"`
	Active    *bool  `json:"active"`
}

// ListUsers returns paginated admin accounts.
func (h *Handler) ListUsers(c *gin.Context) {
	params := parseListParams(c, "created_at")
	if params.Direction == "asc" && c.Query("direction") == "" {
		params.Direction = "desc"
	}
	q := h.DB.Model(&models.Admin{})
	if params.Status == "active" {
		q = q.Where("active = ?", true)
	}
	if params.Status == "inactive" {
		q = q.Where("active = ?", false)
	}
	if auth.IsAssignableRole(params.Status) {
		q = q.Where("role = ?", params.Status)
	}
	if params.Q != "" {
		like := "%" + params.Q + "%"
		q = q.Where("name ILIKE ? OR email ILIKE ?", like, like)
	}
	var total int64
	q.Count(&total)
	q = applyOrder(q, params, map[string]string{
		"created_at": "created_at",
		"name":       "name",
		"email":      "email",
		"role":       "role",
	}, "created_at")
	var items []models.Admin
	if err := paginate(q, params).Find(&items).Error; err != nil {
		fail(c, http.StatusInternalServerError, "DB_ERROR", "Gagal memuat pengguna")
		return
	}
	listResponse(c, items, total, params)
}

// GetUser returns a single admin account.
func (h *Handler) GetUser(c *gin.Context) {
	var u models.Admin
	if err := h.DB.First(&u, c.Param("id")).Error; err != nil {
		fail(c, http.StatusNotFound, "NOT_FOUND", "Pengguna tidak ditemukan")
		return
	}
	ok(c, u)
}

// CreateUser provisions a new admin account.
func (h *Handler) CreateUser(c *gin.Context) {
	var req createUserRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		failValidation(c, err)
		return
	}
	if !auth.IsAssignableRole(req.Role) {
		fail(c, http.StatusBadRequest, "INVALID_ROLE", "Role tidak valid")
		return
	}
	hash, err := auth.HashPassword(req.Password)
	if err != nil {
		fail(c, http.StatusInternalServerError, "HASH_FAILED", "Gagal memproses kata sandi")
		return
	}
	u := models.Admin{
		Name:         req.Name,
		Email:        strings.ToLower(strings.TrimSpace(req.Email)),
		PasswordHash: hash,
		Role:         req.Role,
		Phone:        req.Phone,
		AvatarURL:    req.AvatarURL,
		Active:       boolValue(req.Active, true),
	}
	if err := h.DB.Create(&u).Error; err != nil {
		fail(c, http.StatusConflict, "CREATE_FAILED", "Gagal membuat (email mungkin sudah dipakai)")
		return
	}
	h.audit(c, "create", "users", stringID(u.ID))
	created(c, u)
}

// UpdateUser edits an admin account (profile, role, status, or password).
func (h *Handler) UpdateUser(c *gin.Context) {
	var u models.Admin
	if err := h.DB.First(&u, c.Param("id")).Error; err != nil {
		fail(c, http.StatusNotFound, "NOT_FOUND", "Pengguna tidak ditemukan")
		return
	}
	var req updateUserRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		failValidation(c, err)
		return
	}
	if req.Role != "" && !auth.IsAssignableRole(req.Role) {
		fail(c, http.StatusBadRequest, "INVALID_ROLE", "Role tidak valid")
		return
	}

	// Guard: do not allow removing/deactivating the last active super admin.
	demotingSuper := u.Role == auth.RoleSuperAdmin &&
		((req.Role != "" && req.Role != auth.RoleSuperAdmin) || (req.Active != nil && !*req.Active))
	if demotingSuper && h.isLastActiveSuperAdmin(u.ID) {
		fail(c, http.StatusConflict, "LAST_SUPER_ADMIN", "Tidak dapat menonaktifkan super admin terakhir")
		return
	}

	if req.Name != "" {
		u.Name = req.Name
	}
	if req.Email != "" {
		u.Email = strings.ToLower(strings.TrimSpace(req.Email))
	}
	if req.Role != "" {
		u.Role = req.Role
	}
	if req.Phone != "" {
		u.Phone = req.Phone
	}
	if req.AvatarURL != "" {
		u.AvatarURL = req.AvatarURL
	}
	if req.Active != nil {
		u.Active = *req.Active
	}
	if req.Password != "" {
		hash, err := auth.HashPassword(req.Password)
		if err != nil {
			fail(c, http.StatusInternalServerError, "HASH_FAILED", "Gagal memproses kata sandi")
			return
		}
		u.PasswordHash = hash
	}
	if err := h.DB.Save(&u).Error; err != nil {
		fail(c, http.StatusConflict, "UPDATE_FAILED", "Gagal memperbarui (email mungkin sudah dipakai)")
		return
	}
	h.audit(c, "update", "users", c.Param("id"))
	ok(c, u)
}

// DeleteUser removes an admin account, with self- and last-super-admin guards.
func (h *Handler) DeleteUser(c *gin.Context) {
	var u models.Admin
	if err := h.DB.First(&u, c.Param("id")).Error; err != nil {
		fail(c, http.StatusNotFound, "NOT_FOUND", "Pengguna tidak ditemukan")
		return
	}
	if stringID(u.ID) == c.GetString("adminID") {
		fail(c, http.StatusConflict, "SELF_DELETE", "Anda tidak dapat menghapus akun sendiri")
		return
	}
	if u.Role == auth.RoleSuperAdmin && h.isLastActiveSuperAdmin(u.ID) {
		fail(c, http.StatusConflict, "LAST_SUPER_ADMIN", "Tidak dapat menghapus super admin terakhir")
		return
	}
	if err := h.DB.Delete(&models.Admin{}, u.ID).Error; err != nil {
		fail(c, http.StatusInternalServerError, "DB_ERROR", "Gagal menghapus")
		return
	}
	h.audit(c, "delete", "users", c.Param("id"))
	noContent(c)
}

// isLastActiveSuperAdmin reports whether the given admin is the only remaining
// active super admin (so it must not be removed or demoted).
func (h *Handler) isLastActiveSuperAdmin(excludingID uint) bool {
	var count int64
	h.DB.Model(&models.Admin{}).
		Where("role = ? AND active = ? AND id <> ?", auth.RoleSuperAdmin, true, excludingID).
		Count(&count)
	return count == 0
}

// roleInfo describes a role for the permission matrix UI.
type roleInfo struct {
	Key         string   `json:"key"`
	Label       string   `json:"label"`
	Description string   `json:"description"`
	Permissions []string `json:"permissions"`
	UserCount   int64    `json:"userCount"`
}

var roleLabels = map[string]struct{ Label, Description string }{
	auth.RoleSuperAdmin:    {"Super Admin", "Akses penuh ke seluruh sistem, termasuk manajemen pengguna."},
	auth.RoleClinicAdmin:   {"Clinic Admin", "Mengelola operasional klinik, konten, dan janji temu."},
	auth.RoleReceptionist:  {"Receptionist", "Mengelola antrean dan janji temu pasien."},
	auth.RoleContentEditor: {"Content Editor", "Mengelola artikel, promosi, dan konten publik."},
	auth.RoleViewer:        {"Viewer", "Akses baca saja ke dashboard dan data."},
}

// ListRoles returns the role/permission matrix with live user counts.
func (h *Handler) ListRoles(c *gin.Context) {
	roles := make([]roleInfo, 0, len(auth.AssignableRoles))
	for _, key := range auth.AssignableRoles {
		var count int64
		h.DB.Model(&models.Admin{}).Where("role = ?", key).Count(&count)
		meta := roleLabels[key]
		roles = append(roles, roleInfo{
			Key:         key,
			Label:       meta.Label,
			Description: meta.Description,
			Permissions: auth.PermissionsForRole(key),
			UserCount:   count,
		})
	}
	c.JSON(http.StatusOK, gin.H{
		"data": gin.H{
			"roles":          roles,
			"allPermissions": auth.AllPermissions,
		},
	})
}
