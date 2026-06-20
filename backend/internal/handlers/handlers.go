package handlers

import (
	"sehatnusantara/api/internal/config"
	"sehatnusantara/api/internal/notify"

	"gorm.io/gorm"
)

// Handler carries shared dependencies for all HTTP handlers.
type Handler struct {
	DB     *gorm.DB
	Cfg    *config.Config
	Notify notify.Notifier
}

// New constructs a Handler, selecting the notifier from config (real WhatsApp
// when WA_PROVIDER/WA_TOKEN are set, otherwise log-only).
func New(db *gorm.DB, cfg *config.Config) *Handler {
	return &Handler{DB: db, Cfg: cfg, Notify: notify.New(cfg.WAProvider, cfg.WAToken)}
}
