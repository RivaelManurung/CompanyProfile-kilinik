package handlers

import (
	"net/http"

	"sehatnusantara/api/internal/auth"
	"sehatnusantara/api/internal/models"

	"github.com/gin-gonic/gin"
)

type loginRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required,min=6"`
}

// Login authenticates an admin and sets the auth cookie.
func (h *Handler) Login(c *gin.Context) {
	var req loginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		failValidation(c, err)
		return
	}

	var admin models.Admin
	if err := h.DB.Where("email = ?", req.Email).First(&admin).Error; err != nil {
		h.audit(c, "login_failed", "auth", req.Email)
		fail(c, http.StatusUnauthorized, "INVALID_CREDENTIALS", "Email atau kata sandi salah")
		return
	}
	if !auth.CheckPassword(admin.PasswordHash, req.Password) {
		h.audit(c, "login_failed", "auth", req.Email)
		fail(c, http.StatusUnauthorized, "INVALID_CREDENTIALS", "Email atau kata sandi salah")
		return
	}

	token, err := auth.GenerateToken(h.Cfg.JWTSecret, admin.ID, admin.Email, admin.Role)
	if err != nil {
		fail(c, http.StatusInternalServerError, "TOKEN_ERROR", "Gagal membuat sesi")
		return
	}

	auth.SetCookie(c, token, h.Cfg.IsProd())
	c.Set("adminID", stringID(admin.ID))
	c.Set("adminEmail", admin.Email)
	c.Set("adminRole", admin.Role)
	h.audit(c, "login_success", "auth", stringID(admin.ID))
	ok(c, gin.H{"admin": admin, "permissions": auth.PermissionsForRole(admin.Role)})
}

// Logout clears the auth cookie.
func (h *Handler) Logout(c *gin.Context) {
	auth.ClearCookie(c, h.Cfg.IsProd())
	ok(c, gin.H{"message": "Berhasil keluar"})
}

// Me returns the currently authenticated admin.
func (h *Handler) Me(c *gin.Context) {
	id := c.GetString("adminID")
	var admin models.Admin
	if err := h.DB.Where("id = ?", id).First(&admin).Error; err != nil {
		fail(c, http.StatusUnauthorized, "UNAUTHORIZED", "Sesi tidak valid")
		return
	}
	ok(c, gin.H{"admin": admin, "permissions": auth.PermissionsForRole(admin.Role)})
}
