package database

import (
	"fmt"
	"log"
	"time"

	"sehatnusantara/api/internal/models"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

// Connect opens a pooled connection to Postgres and verifies it.
func Connect(dsn string) (*gorm.DB, error) {
	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Warn),
	})
	if err != nil {
		return nil, fmt.Errorf("open db: %w", err)
	}

	sqlDB, err := db.DB()
	if err != nil {
		return nil, fmt.Errorf("get sql db: %w", err)
	}
	sqlDB.SetMaxOpenConns(20)
	sqlDB.SetMaxIdleConns(5)
	sqlDB.SetConnMaxLifetime(time.Hour)

	if err := sqlDB.Ping(); err != nil {
		return nil, fmt.Errorf("ping db: %w", err)
	}
	return db, nil
}

// Migrate runs auto-migration for all models.
func Migrate(db *gorm.DB) error {
	log.Println("database: running auto-migration…")
	if err := db.AutoMigrate(models.AllModels()...); err != nil {
		return fmt.Errorf("auto-migrate: %w", err)
	}
	// Anti double-booking: at most one ACTIVE appointment per doctor+date+time.
	// Partial unique index (Postgres) so cancelled/done rows don't block reuse.
	if err := db.Exec(`CREATE UNIQUE INDEX IF NOT EXISTS uniq_appt_active_slot
		ON appointments (doctor_id, appointment_date, appointment_time)
		WHERE status IN ('pending','confirmed') AND doctor_id > 0 AND appointment_time <> ''`).Error; err != nil {
		return fmt.Errorf("create slot index: %w", err)
	}
	log.Println("database: migration complete")
	return nil
}
