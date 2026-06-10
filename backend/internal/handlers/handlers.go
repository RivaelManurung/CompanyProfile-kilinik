package handlers

import (
	"sehatnusantara/api/internal/config"

	"gorm.io/gorm"
)

// Handler carries shared dependencies for all HTTP handlers.
type Handler struct {
	DB  *gorm.DB
	Cfg *config.Config
}

// New constructs a Handler.
func New(db *gorm.DB, cfg *config.Config) *Handler {
	return &Handler{DB: db, Cfg: cfg}
}
