package handlers

import (
	"crypto/rand"
	"crypto/sha256"
	"encoding/hex"
	stdlog "log"
	"net/http"
	"strings"
	"time"

	"sehatnusantara/api/internal/auth"
	"sehatnusantara/api/internal/models"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// Token purposes and lifetimes for patient self-service flows.
const (
	tokenPurposeReset  = "reset"
	tokenPurposeVerify = "verify"
	resetTokenTTL      = time.Hour
	verifyTokenTTL     = 48 * time.Hour
	mrnPrefix          = "RM"
	mrnPadWidth        = 6 // RM000001
)

// nextMedicalRecordNo derives the next sequential medical record number inside a
// transaction. It scans the highest existing numeric suffix and increments it so
// values stay collision-free even under concurrent registration (the caller runs
// this inside tx and the partial unique index is the final backstop).
func nextMedicalRecordNo(tx *gorm.DB) (string, error) {
	var maxNum int64
	// Coalesce the numeric part of existing MRNs; ignore any malformed values.
	if err := tx.Raw(`
		SELECT COALESCE(MAX(NULLIF(regexp_replace(medical_record_no, '\D', '', 'g'), '')::bigint), 0)
		FROM patient_users
		WHERE medical_record_no <> ''
	`).Scan(&maxNum).Error; err != nil {
		return "", err
	}
	next := maxNum + 1
	return mrnFormat(next), nil
}

// mrnFormat renders a zero-padded medical record number, e.g. 1 -> "RM000001".
func mrnFormat(n int64) string {
	s := itoaBase10(n)
	for len(s) < mrnPadWidth {
		s = "0" + s
	}
	return mrnPrefix + s
}

func itoaBase10(n int64) string {
	if n == 0 {
		return "0"
	}
	var buf [20]byte
	i := len(buf)
	for n > 0 {
		i--
		buf[i] = byte('0' + n%10)
		n /= 10
	}
	return string(buf[i:])
}

// isUniqueViolation reports whether err looks like a Postgres unique-constraint
// violation mentioning the given column/index fragment. Kept string-based to
// avoid a hard dependency on the pgx error type in this layer.
func isUniqueViolation(err error, fragment string) bool {
	if err == nil {
		return false
	}
	msg := strings.ToLower(err.Error())
	return strings.Contains(msg, "duplicate") && strings.Contains(msg, strings.ToLower(fragment))
}

// generateToken returns a cryptographically random URL-safe token and its
// SHA-256 hash (hex). Only the hash is ever persisted.
func generateToken() (raw, hash string, err error) {
	b := make([]byte, 32)
	if _, err = rand.Read(b); err != nil {
		return "", "", err
	}
	raw = hex.EncodeToString(b)
	return raw, hashToken(raw), nil
}

func hashToken(raw string) string {
	sum := sha256.Sum256([]byte(raw))
	return hex.EncodeToString(sum[:])
}

// issueVerificationToken creates an email-verification token for a patient and
// logs the verification link. TODO: deliver via email/WA once a provider is
// wired; for now only the log carries the link.
func (h *Handler) issueVerificationToken(c *gin.Context, p models.PatientUser) (string, error) {
	raw, hash, err := generateToken()
	if err != nil {
		return "", err
	}
	tok := models.PatientToken{
		PatientUserID: p.ID,
		Purpose:       tokenPurposeVerify,
		TokenHash:     hash,
		ExpiresAt:     time.Now().Add(verifyTokenTTL),
	}
	if err := h.DB.Create(&tok).Error; err != nil {
		return "", err
	}
	// TODO: send via real provider (email/WhatsApp). Logged-only for now.
	stdlog.Printf("patient-verify: WOULD send verification token to %q <%s>: token=%s (valid %s)",
		p.Name, p.Email, raw, verifyTokenTTL)
	return raw, nil
}

// ── Forgot / reset password ──────────────────────────────────────────────────

type forgotPasswordRequest struct {
	Email string `json:"email" binding:"required,email"`
}

// PatientForgotPassword issues a reset token when the email exists. It ALWAYS
// returns a generic 200 so it cannot be used to probe which emails are
// registered (account-enumeration protection).
func (h *Handler) PatientForgotPassword(c *gin.Context) {
	var req forgotPasswordRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		failValidation(c, err)
		return
	}
	email := strings.ToLower(strings.TrimSpace(req.Email))

	var p models.PatientUser
	if err := h.DB.Where("email = ?", email).First(&p).Error; err == nil && p.Active {
		raw, hash, gerr := generateToken()
		if gerr == nil {
			tok := models.PatientToken{
				PatientUserID: p.ID,
				Purpose:       tokenPurposeReset,
				TokenHash:     hash,
				ExpiresAt:     time.Now().Add(resetTokenTTL),
			}
			if cerr := h.DB.Create(&tok).Error; cerr == nil {
				// TODO: deliver via email/WhatsApp. Logged-only for now.
				stdlog.Printf("patient-reset: WOULD send reset token to <%s>: token=%s (valid %s)",
					email, raw, resetTokenTTL)
				h.auditPatient(c, stringID(p.ID), email, "password_reset_requested", "patient", stringID(p.ID))
			}
		}
	}
	// Generic response regardless of whether the account exists.
	ok(c, gin.H{"message": "Jika email terdaftar, tautan pemulihan kata sandi telah dikirim."})
}

type resetPasswordRequest struct {
	Token       string `json:"token" binding:"required"`
	NewPassword string `json:"newPassword" binding:"required,min=8,max=72"`
}

// PatientResetPassword consumes a valid reset token and sets a new password.
func (h *Handler) PatientResetPassword(c *gin.Context) {
	var req resetPasswordRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		failValidation(c, err)
		return
	}
	tok, ok2 := h.consumeTokenLookup(c, req.Token, tokenPurposeReset)
	if !ok2 {
		return
	}
	hash, err := auth.HashPassword(req.NewPassword)
	if err != nil {
		fail(c, http.StatusInternalServerError, "HASH_FAILED", "Gagal memproses kata sandi")
		return
	}
	now := time.Now()
	if err := h.DB.Transaction(func(tx *gorm.DB) error {
		if err := tx.Model(&models.PatientUser{}).Where("id = ?", tok.PatientUserID).
			Update("password_hash", hash).Error; err != nil {
			return err
		}
		return tx.Model(&models.PatientToken{}).Where("id = ?", tok.ID).
			Update("used_at", &now).Error
	}); err != nil {
		fail(c, http.StatusInternalServerError, "DB_ERROR", "Gagal mengatur ulang kata sandi")
		return
	}
	h.auditPatient(c, stringID(tok.PatientUserID), "", "password_reset", "patient", stringID(tok.PatientUserID))
	ok(c, gin.H{"message": "Kata sandi berhasil diperbarui. Silakan masuk."})
}

type verifyEmailRequest struct {
	Token string `json:"token" binding:"required"`
}

// PatientVerifyEmail consumes a verify token and stamps EmailVerifiedAt.
func (h *Handler) PatientVerifyEmail(c *gin.Context) {
	var req verifyEmailRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		failValidation(c, err)
		return
	}
	tok, ok2 := h.consumeTokenLookup(c, req.Token, tokenPurposeVerify)
	if !ok2 {
		return
	}
	now := time.Now()
	if err := h.DB.Transaction(func(tx *gorm.DB) error {
		if err := tx.Model(&models.PatientUser{}).Where("id = ?", tok.PatientUserID).
			Update("email_verified_at", &now).Error; err != nil {
			return err
		}
		return tx.Model(&models.PatientToken{}).Where("id = ?", tok.ID).
			Update("used_at", &now).Error
	}); err != nil {
		fail(c, http.StatusInternalServerError, "DB_ERROR", "Gagal memverifikasi email")
		return
	}
	h.auditPatient(c, stringID(tok.PatientUserID), "", "email_verified", "patient", stringID(tok.PatientUserID))
	ok(c, gin.H{"message": "Email berhasil diverifikasi."})
}

// consumeTokenLookup validates a raw token for the given purpose: it must exist,
// match the purpose, be unused, and not expired. On any failure it writes the
// response and returns ok=false. It does NOT mark the token used (callers do
// that inside their own transaction together with the state change).
func (h *Handler) consumeTokenLookup(c *gin.Context, raw, purpose string) (models.PatientToken, bool) {
	var tok models.PatientToken
	if err := h.DB.Where("token_hash = ? AND purpose = ?", hashToken(raw), purpose).
		First(&tok).Error; err != nil {
		fail(c, http.StatusBadRequest, "INVALID_TOKEN", "Token tidak valid atau sudah digunakan")
		return tok, false
	}
	if tok.UsedAt != nil {
		fail(c, http.StatusBadRequest, "INVALID_TOKEN", "Token tidak valid atau sudah digunakan")
		return tok, false
	}
	if time.Now().After(tok.ExpiresAt) {
		fail(c, http.StatusBadRequest, "TOKEN_EXPIRED", "Token sudah kedaluwarsa. Silakan minta tautan baru.")
		return tok, false
	}
	return tok, true
}

// ── Data portability + right to erasure ──────────────────────────────────────

// PatientExportData returns the authenticated patient's full profile plus all of
// their appointments as JSON (PDP data-portability).
func (h *Handler) PatientExportData(c *gin.Context) {
	var p models.PatientUser
	if err := h.DB.First(&p, auth.PatientID(c)).Error; err != nil {
		fail(c, http.StatusNotFound, "NOT_FOUND", "Akun tidak ditemukan")
		return
	}
	var appts []models.Appointment
	if err := h.DB.Where("patient_user_id = ?", p.ID).
		Order("scheduled_at DESC, id DESC").Find(&appts).Error; err != nil {
		fail(c, http.StatusInternalServerError, "DB_ERROR", "Gagal memuat data")
		return
	}
	h.auditPatient(c, stringID(p.ID), p.Email, "export", "patient", stringID(p.ID))
	// Full profile incl. raw NIK — this is the owner exporting their own data.
	ok(c, gin.H{
		"profile":      p,
		"appointments": appts,
		"exportedAt":   time.Now(),
	})
}

// PatientDeleteAccount performs a right-to-erasure: it scrubs PII on the patient
// record and on their appointments while keeping the appointment rows for clinic
// history. The account is deactivated so the session can no longer be used.
func (h *Handler) PatientDeleteAccount(c *gin.Context) {
	id := auth.PatientID(c)
	var p models.PatientUser
	if err := h.DB.First(&p, id).Error; err != nil {
		fail(c, http.StatusNotFound, "NOT_FOUND", "Akun tidak ditemukan")
		return
	}
	placeholderEmail := "deleted+" + stringID(p.ID) + "@deleted.invalid"
	now := time.Now()
	if err := h.DB.Transaction(func(tx *gorm.DB) error {
		// Scrub denormalized PII on the patient's appointments (keep the rows).
		if err := tx.Model(&models.Appointment{}).Where("patient_user_id = ?", p.ID).
			Updates(map[string]any{
				"name":  "[dihapus]",
				"phone": "",
				"email": "",
			}).Error; err != nil {
			return err
		}
		// Scrub the account itself and deactivate it.
		return tx.Model(&models.PatientUser{}).Where("id = ?", p.ID).
			Updates(map[string]any{
				"name":                "[dihapus]",
				"email":               placeholderEmail,
				"phone":               "",
				"nik":                 "",
				"address":             "",
				"date_of_birth":       nil,
				"active":              false,
				"consent_accepted_at": &now,
			}).Error
	}); err != nil {
		fail(c, http.StatusInternalServerError, "DB_ERROR", "Gagal menghapus akun")
		return
	}
	auth.ClearPatientCookie(c, h.Cfg.IsProd())
	h.auditPatient(c, stringID(p.ID), p.Email, "erasure", "patient", stringID(p.ID))
	ok(c, gin.H{"message": "Akun dan data pribadi Anda telah dihapus."})
}
