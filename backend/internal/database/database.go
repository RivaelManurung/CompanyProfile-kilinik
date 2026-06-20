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
	// Prevent stale connections after a load-balancer TCP timeout.
	sqlDB.SetConnMaxIdleTime(5 * time.Minute)

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
	// Nullable-FK migration for appointments.doctor_id / patient_user_id:
	// historically these were NOT NULL uint columns using 0 as a "none" sentinel
	// (public/legacy bookings). The Go model is now *uint, and we add real FKs
	// below — so first convert any lingering 0 sentinels to NULL. Idempotent:
	// re-running on an already-migrated table matches no rows.
	if err := db.Exec(`UPDATE appointments SET doctor_id = NULL WHERE doctor_id = 0`).Error; err != nil {
		return fmt.Errorf("null out sentinel doctor_id: %w", err)
	}
	if err := db.Exec(`UPDATE appointments SET patient_user_id = NULL WHERE patient_user_id = 0`).Error; err != nil {
		return fmt.Errorf("null out sentinel patient_user_id: %w", err)
	}

	// Anti double-booking: at most one ACTIVE appointment per doctor+date+time.
	// Partial unique index (Postgres) so cancelled/done rows don't block reuse.
	// `deleted_at IS NULL` keeps soft-deleted rows from blocking slot reuse, matching
	// GORM's soft-delete scoping (their status is left unchanged on delete).
	// `doctor_id IS NOT NULL` replaces the old `doctor_id > 0` guard now that the
	// column is nullable (NULL = doctor-less legacy/admin booking, which never
	// participates in slot collision).
	//
	// Drop-then-recreate (in one transaction) so databases created before the
	// `deleted_at IS NULL` clause was added are corrected automatically on boot.
	// Postgres DDL is transactional, so there is never a window without the
	// constraint; cost is negligible on this table size.
	if err := db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Exec(`DROP INDEX IF EXISTS uniq_appt_active_slot`).Error; err != nil {
			return err
		}
		return tx.Exec(`CREATE UNIQUE INDEX uniq_appt_active_slot
			ON appointments (doctor_id, appointment_date, appointment_time)
			WHERE status IN ('pending','confirmed') AND doctor_id IS NOT NULL AND appointment_time <> '' AND deleted_at IS NULL`).Error
	}); err != nil {
		return fmt.Errorf("recreate slot index: %w", err)
	}

	// Backfill the canonical scheduled_at instant for legacy rows that predate the
	// column, parsing the string date/time in the clinic timezone (Asia/Jakarta).
	// Idempotent: only touches rows still missing scheduled_at that have a usable
	// date+time. Guarded WHERE keeps the cast from ever seeing empty strings.
	if err := db.Exec(`UPDATE appointments
		SET scheduled_at = (appointment_date || ' ' || appointment_time)::timestamp AT TIME ZONE 'Asia/Jakarta'
		WHERE scheduled_at IS NULL
		  AND appointment_date <> ''
		  AND appointment_time <> ''
		  AND appointment_date ~ '^\d{4}-\d{2}-\d{2}$'
		  AND appointment_time ~ '^\d{2}:\d{2}$'`).Error; err != nil {
		return fmt.Errorf("backfill scheduled_at: %w", err)
	}

	// Referential integrity: a doctor_schedule must point to a real doctor.
	// This is the one clean FK in the schema — doctor_schedules.doctor_id is
	// always a real doctor (no 0="none" sentinel, unlike appointments.doctor_id
	// / patient_user_id which use 0 for public/legacy rows and would need a
	// nullable-column refactor before they can be constrained).
	// ON DELETE RESTRICT mirrors the app-level orphan guard in DeleteDoctor.
	// Idempotent: only added if missing, after sweeping any pre-existing orphans.
	if err := db.Exec(`DELETE FROM doctor_schedules s
		WHERE NOT EXISTS (SELECT 1 FROM doctors d WHERE d.id = s.doctor_id)`).Error; err != nil {
		return fmt.Errorf("sweep orphan schedules: %w", err)
	}
	if err := db.Exec(`DO $$
		BEGIN
			IF NOT EXISTS (
				SELECT 1 FROM pg_constraint WHERE conname = 'fk_doctor_schedules_doctor'
			) THEN
				ALTER TABLE doctor_schedules
					ADD CONSTRAINT fk_doctor_schedules_doctor
					FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE RESTRICT;
			END IF;
		END $$;`).Error; err != nil {
		return fmt.Errorf("add doctor_schedules fk: %w", err)
	}

	// Referential integrity for appointments. Both columns are nullable (NULL =
	// public/legacy or admin-created booking), so NULL rows are always allowed by
	// the FK. The sentinel→NULL UPDATEs above run earlier in this same Migrate
	// pass, so no 0-valued orphan can violate these constraints.
	//   - doctor_id        → doctors(id)        ON DELETE RESTRICT  (mirror the
	//     app-level orphan guard in DeleteDoctor; a doctor with live appointments
	//     cannot be hard-deleted out from under them).
	//   - patient_user_id  → patient_users(id)  ON DELETE SET NULL  (keep the
	//     appointment record for clinic history, just unlink the deleted account).
	// Idempotent: each is only added if the named constraint is missing.
	if err := db.Exec(`DO $$
		BEGIN
			IF NOT EXISTS (
				SELECT 1 FROM pg_constraint WHERE conname = 'fk_appointments_doctor'
			) THEN
				ALTER TABLE appointments
					ADD CONSTRAINT fk_appointments_doctor
					FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE RESTRICT;
			END IF;
		END $$;`).Error; err != nil {
		return fmt.Errorf("add appointments doctor fk: %w", err)
	}
	if err := db.Exec(`DO $$
		BEGIN
			IF NOT EXISTS (
				SELECT 1 FROM pg_constraint WHERE conname = 'fk_appointments_patient_user'
			) THEN
				ALTER TABLE appointments
					ADD CONSTRAINT fk_appointments_patient_user
					FOREIGN KEY (patient_user_id) REFERENCES patient_users(id) ON DELETE SET NULL;
			END IF;
		END $$;`).Error; err != nil {
		return fmt.Errorf("add appointments patient_user fk: %w", err)
	}

	// ── Patient identity (PDP) migration ────────────────────────────────────
	// NIK and medical_record_no are UNIQUE but allow empty. A struct uniqueIndex
	// tag would treat every empty string as a collision, so enforce uniqueness
	// with partial unique indexes that skip empty values. Idempotent.
	if err := db.Exec(`CREATE UNIQUE INDEX IF NOT EXISTS uniq_patient_nik
		ON patient_users (nik) WHERE nik <> ''`).Error; err != nil {
		return fmt.Errorf("create patient nik index: %w", err)
	}
	if err := db.Exec(`CREATE UNIQUE INDEX IF NOT EXISTS uniq_patient_mrn
		ON patient_users (medical_record_no) WHERE medical_record_no <> ''`).Error; err != nil {
		return fmt.Errorf("create patient mrn index: %w", err)
	}

	// Backfill a deterministic, sequential medical record number for any existing
	// patient row that lacks one. Numbering is assigned by ascending id and
	// offset past the current max so a re-run never re-numbers or collides.
	if err := db.Exec(`
		WITH ranked AS (
			SELECT id, row_number() OVER (ORDER BY id) AS rn
			FROM patient_users
			WHERE medical_record_no = '' OR medical_record_no IS NULL
		),
		base AS (
			SELECT COALESCE(MAX(NULLIF(regexp_replace(medical_record_no, '\D', '', 'g'), '')::bigint), 0) AS m
			FROM patient_users
			WHERE medical_record_no <> ''
		)
		UPDATE patient_users p
		SET medical_record_no = 'RM' || lpad((base.m + ranked.rn)::text, 6, '0')
		FROM ranked, base
		WHERE p.id = ranked.id`).Error; err != nil {
		return fmt.Errorf("backfill medical_record_no: %w", err)
	}

	// Audit actor_type backfill: pre-existing rows were all admin-authored.
	if err := db.Exec(`UPDATE audit_logs SET actor_type = 'admin'
		WHERE actor_type IS NULL OR actor_type = ''`).Error; err != nil {
		return fmt.Errorf("backfill audit actor_type: %w", err)
	}

	// ── RBAC backfill for the new patients:* permissions and the viewer lockdown ──
	// The seed only inserts defaults for roles with zero stored rows, so roles
	// that already have rows (clinic_admin, receptionist, viewer) need explicit,
	// idempotent grants/revocations here.
	patientGrants := map[string][]string{
		"clinic_admin": {"patients:read", "patients:write"},
		"receptionist": {"patients:read"},
	}
	for role, perms := range patientGrants {
		for _, perm := range perms {
			if err := db.Exec(`INSERT INTO role_permissions (role, permission)
				VALUES (?, ?) ON CONFLICT DO NOTHING`, role, perm).Error; err != nil {
				return fmt.Errorf("grant %s to %s: %w", perm, role, err)
			}
		}
	}
	// Lock viewer out of patient PHI enumeration: revoke appointments:read and
	// ensure patients:read is never granted.
	if err := db.Exec(`DELETE FROM role_permissions
		WHERE role = 'viewer' AND permission IN ('appointments:read','patients:read','patients:write')`).Error; err != nil {
		return fmt.Errorf("revoke viewer phi perms: %w", err)
	}

	log.Println("database: migration complete")
	return nil
}
