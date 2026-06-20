package config

import (
	"log"
	"os"
	"strings"

	"github.com/joho/godotenv"
)

// Config holds all runtime configuration loaded from the environment.
type Config struct {
	Port          string
	DatabaseURL   string
	JWTSecret     string
	CORSOrigins   []string
	AdminName     string
	AdminEmail    string
	AdminPassword string
	Env           string
	UploadDir     string

	// Notifications. WAProvider selects the WhatsApp gateway ("fonnte" today;
	// empty = log-only, no messages sent). WAToken is the provider API token.
	WAProvider string
	WAToken    string

	// RedisURL, when set, makes the rate limiter + login lockout shared across
	// instances (e.g. "redis://localhost:6379/0"). Empty = process-local limiter.
	RedisURL string
}

// Load reads .env (if present) and environment variables into a Config.
func Load() *Config {
	// .env is optional in production; ignore the error if it's missing.
	if err := godotenv.Load(); err != nil {
		log.Println("config: no .env file found, relying on environment variables")
	}

	cfg := &Config{
		Port:          getEnv("PORT", "4000"),
		DatabaseURL:   getEnv("DATABASE_URL", "postgresql://ksn_admin:ksn_secret_dev@localhost:5433/sehat_nusantara?sslmode=disable"),
		JWTSecret:     getEnv("JWT_SECRET", "change-me-in-production-please-32chars"),
		CORSOrigins:   splitAndTrim(getEnv("CORS_ORIGINS", "http://localhost:3000,http://localhost:3001")),
		AdminName:     getEnv("ADMIN_NAME", "Administrator"),
		AdminEmail:    getEnv("ADMIN_EMAIL", "admin@sehatnusantara.id"),
		AdminPassword: getEnv("ADMIN_PASSWORD", "Admin#12345"),
		Env:           getEnv("APP_ENV", "development"),
		UploadDir:     getEnv("UPLOAD_DIR", "uploads"),
		WAProvider:    strings.ToLower(getEnv("WA_PROVIDER", "")),
		WAToken:       getEnv("WA_TOKEN", ""),
		RedisURL:      getEnv("REDIS_URL", ""),
	}
	cfg.validate()
	return cfg
}

func (c *Config) IsProd() bool { return c.Env == "production" }

func (c *Config) validate() {
	// Always warn when insecure development defaults are detected, regardless
	// of environment, so a misconfigured staging or production deploy is
	// surfaced immediately at startup rather than silently running with weak
	// credentials.
	insecureJWT := c.JWTSecret == "change-me-in-production-please-32chars" ||
		c.JWTSecret == "dev-super-secret-change-me-please-32chars-min" ||
		len(c.JWTSecret) < 32
	insecurePassword := c.AdminPassword == "Admin#12345" || len(c.AdminPassword) < 12
	insecureDB := strings.Contains(c.DatabaseURL, "ksn_secret_dev")

	if insecureJWT {
		log.Println("[WARN] config: JWT_SECRET is using a weak/default value — set a strong random secret before going to production")
	}
	if insecurePassword {
		log.Println("[WARN] config: ADMIN_PASSWORD is using the default value — change it before going to production")
	}
	if insecureDB {
		log.Println("[WARN] config: DATABASE_URL contains a development credential — replace it before going to production")
	}

	// In production, weak credentials are fatal.
	if !c.IsProd() {
		return
	}
	if insecureJWT {
		log.Fatal("config: JWT_SECRET must be set to a strong random value (≥32 chars) in production")
	}
	if insecurePassword {
		log.Fatal("config: ADMIN_PASSWORD must be changed from the default in production")
	}
	if insecureDB {
		log.Fatal("config: DATABASE_URL must not use development credentials in production")
	}
	if strings.Contains(c.DatabaseURL, "localhost") {
		log.Fatal("config: DATABASE_URL must not point to localhost in production")
	}
	for _, origin := range c.CORSOrigins {
		if origin == "*" || strings.Contains(origin, "localhost") || strings.HasPrefix(origin, "http://") {
			log.Fatal("config: CORS_ORIGINS must be explicit HTTPS origins in production")
		}
	}
}

func getEnv(key, fallback string) string {
	if v, ok := os.LookupEnv(key); ok && v != "" {
		return v
	}
	return fallback
}

func splitAndTrim(s string) []string {
	parts := strings.Split(s, ",")
	out := make([]string, 0, len(parts))
	for _, p := range parts {
		if t := strings.TrimSpace(p); t != "" {
			out = append(out, t)
		}
	}
	return out
}
