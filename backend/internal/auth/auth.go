package auth

import (
	"errors"
	"net/http"
	"strconv"
	"strings"
	"time"

	"sehatnusantara/api/internal/models"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

const (
	CookieName        = "ksn_token"
	PatientCookieName = "ksn_patient"
	RolePatient       = "patient"
	tokenTTL          = 7 * 24 * time.Hour
	ctxAdminIDKey     = "adminID"
	ctxAdminEmail     = "adminEmail"
	ctxAdminRole      = "adminRole"
	ctxPatientIDKey   = "patientID"
)

// Claims is the JWT payload for an authenticated admin.
type Claims struct {
	Email string `json:"email"`
	Role  string `json:"role"`
	jwt.RegisteredClaims
}

// HashPassword returns a bcrypt hash of the plaintext password.
func HashPassword(pw string) (string, error) {
	b, err := bcrypt.GenerateFromPassword([]byte(pw), bcrypt.DefaultCost)
	return string(b), err
}

// CheckPassword verifies a plaintext password against a bcrypt hash.
func CheckPassword(hash, pw string) bool {
	return bcrypt.CompareHashAndPassword([]byte(hash), []byte(pw)) == nil
}

// GenerateToken signs a JWT for the given admin.
func GenerateToken(secret string, adminID uint, email, role string) (string, error) {
	now := time.Now()
	claims := Claims{
		Email: email,
		Role:  role,
		RegisteredClaims: jwt.RegisteredClaims{
			Subject:   itoa(adminID),
			IssuedAt:  jwt.NewNumericDate(now),
			ExpiresAt: jwt.NewNumericDate(now.Add(tokenTTL)),
			Issuer:    "sehatnusantara-api",
		},
	}
	return jwt.NewWithClaims(jwt.SigningMethodHS256, claims).SignedString([]byte(secret))
}

// ParseToken validates a token string and returns its claims.
func ParseToken(secret, tokenString string) (*Claims, error) {
	claims := &Claims{}
	token, err := jwt.ParseWithClaims(tokenString, claims, func(t *jwt.Token) (any, error) {
		if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, errors.New("unexpected signing method")
		}
		return []byte(secret), nil
	})
	if err != nil || !token.Valid {
		return nil, errors.New("invalid token")
	}
	return claims, nil
}

// SetCookie writes the auth cookie. Cookies ignore ports, so a cookie set by the
// API on localhost is also readable by the Next.js frontend on a different port.
func SetCookie(c *gin.Context, token string, secure bool) {
	http.SetCookie(c.Writer, &http.Cookie{
		Name:     CookieName,
		Value:    token,
		Path:     "/",
		MaxAge:   int(tokenTTL.Seconds()),
		HttpOnly: true,
		Secure:   secure,
		SameSite: http.SameSiteLaxMode,
	})
}

// ClearCookie removes the auth cookie.
func ClearCookie(c *gin.Context, secure bool) {
	http.SetCookie(c.Writer, &http.Cookie{
		Name:     CookieName,
		Value:    "",
		Path:     "/",
		MaxAge:   -1,
		HttpOnly: true,
		Secure:   secure,
		SameSite: http.SameSiteLaxMode,
	})
}

// Middleware enforces a valid token (cookie or Authorization: Bearer header).
// It also re-checks the admin against the DB on every request so a deactivated
// or deleted admin loses access immediately instead of staying valid until the
// JWT expires (token revocation by account state).
func Middleware(db *gorm.DB, secret string) gin.HandlerFunc {
	return func(c *gin.Context) {
		tokenStr := extractToken(c)
		if tokenStr == "" {
			abort401(c, "missing authentication token")
			return
		}
		claims, err := ParseToken(secret, tokenStr)
		if err != nil {
			abort401(c, "invalid or expired token")
			return
		}
		// Single lookup: reject if the admin no longer exists or is deactivated.
		adminID, _ := strconv.ParseUint(claims.Subject, 10, 64)
		var admin models.Admin
		if err := db.Select("id", "active", "role").First(&admin, uint(adminID)).Error; err != nil {
			abort401(c, "account no longer active")
			return
		}
		if !admin.Active {
			abort401(c, "account no longer active")
			return
		}
		c.Set(ctxAdminIDKey, claims.Subject)
		c.Set(ctxAdminEmail, claims.Email)
		// Trust the live DB role over the (possibly stale) token role.
		c.Set(ctxAdminRole, admin.Role)
		c.Next()
	}
}

func extractToken(c *gin.Context) string {
	if h := c.GetHeader("Authorization"); strings.HasPrefix(h, "Bearer ") {
		return strings.TrimPrefix(h, "Bearer ")
	}
	if ck, err := c.Cookie(CookieName); err == nil {
		return ck
	}
	return ""
}

func abort401(c *gin.Context, msg string) {
	c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{
		"error": gin.H{"code": "UNAUTHORIZED", "message": msg},
	})
}

// ── Patient session (separate realm from admin) ─────────────────────────────

// SetPatientCookie writes the patient auth cookie.
func SetPatientCookie(c *gin.Context, token string, secure bool) {
	http.SetCookie(c.Writer, &http.Cookie{
		Name:     PatientCookieName,
		Value:    token,
		Path:     "/",
		MaxAge:   int(tokenTTL.Seconds()),
		HttpOnly: true,
		Secure:   secure,
		SameSite: http.SameSiteLaxMode,
	})
}

// ClearPatientCookie removes the patient auth cookie.
func ClearPatientCookie(c *gin.Context, secure bool) {
	http.SetCookie(c.Writer, &http.Cookie{
		Name:     PatientCookieName,
		Value:    "",
		Path:     "/",
		MaxAge:   -1,
		HttpOnly: true,
		Secure:   secure,
		SameSite: http.SameSiteLaxMode,
	})
}

// PatientMiddleware enforces a valid patient token with role=patient. Like the
// admin middleware it re-checks the patient account against the DB so a deleted
// or deactivated patient loses access immediately rather than at token expiry.
func PatientMiddleware(db *gorm.DB, secret string) gin.HandlerFunc {
	return func(c *gin.Context) {
		tokenStr := extractPatientToken(c)
		if tokenStr == "" {
			abort401(c, "missing patient token")
			return
		}
		claims, err := ParseToken(secret, tokenStr)
		if err != nil || claims.Role != RolePatient {
			abort401(c, "invalid or expired patient token")
			return
		}
		patientID, _ := strconv.ParseUint(claims.Subject, 10, 64)
		var p models.PatientUser
		if err := db.Select("id", "active").First(&p, uint(patientID)).Error; err != nil {
			abort401(c, "account no longer active")
			return
		}
		if !p.Active {
			abort401(c, "account no longer active")
			return
		}
		c.Set(ctxPatientIDKey, claims.Subject)
		c.Next()
	}
}

func extractPatientToken(c *gin.Context) string {
	if h := c.GetHeader("Authorization"); strings.HasPrefix(h, "Bearer ") {
		return strings.TrimPrefix(h, "Bearer ")
	}
	if ck, err := c.Cookie(PatientCookieName); err == nil {
		return ck
	}
	return ""
}

// PatientID returns the authenticated patient id from context (0 if none).
func PatientID(c *gin.Context) uint {
	v, ok := c.Get(ctxPatientIDKey)
	if !ok {
		return 0
	}
	id, _ := strconv.ParseUint(v.(string), 10, 64)
	return uint(id)
}

func itoa(u uint) string {
	// small uint -> string without importing strconv everywhere
	if u == 0 {
		return "0"
	}
	var buf [20]byte
	i := len(buf)
	for u > 0 {
		i--
		buf[i] = byte('0' + u%10)
		u /= 10
	}
	return string(buf[i:])
}
