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
	}
	cfg.validate()
	return cfg
}

func (c *Config) IsProd() bool { return c.Env == "production" }

func (c *Config) validate() {
	if !c.IsProd() {
		return
	}
	if c.JWTSecret == "change-me-in-production-please-32chars" || len(c.JWTSecret) < 32 {
		log.Fatal("config: JWT_SECRET must be set to a strong value in production")
	}
	if c.AdminPassword == "Admin#12345" || len(c.AdminPassword) < 12 {
		log.Fatal("config: ADMIN_PASSWORD must be changed in production")
	}
	if strings.Contains(c.DatabaseURL, "ksn_secret_dev") || strings.Contains(c.DatabaseURL, "localhost") {
		log.Fatal("config: DATABASE_URL must not use development defaults in production")
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
