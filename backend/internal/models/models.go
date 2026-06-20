package models

import (
	"time"

	"gorm.io/gorm"
)

// Admin is a dashboard user who can sign in and manage content.
type Admin struct {
	ID           uint   `gorm:"primaryKey" json:"id"`
	Name         string `gorm:"not null" json:"name"`
	Email        string `gorm:"uniqueIndex;not null" json:"email"`
	PasswordHash string `gorm:"not null" json:"-"`
	Role         string `gorm:"default:viewer;index" json:"role"`
	Phone        string `json:"phone"`
	AvatarURL    string `json:"avatarUrl"`
	// No GORM default: the handler always sets this explicitly, and a `default:true`
	// tag would make GORM ignore an explicit `false` on insert (deactivated accounts).
	Active      bool       `gorm:"index" json:"active"`
	LastLoginAt *time.Time `json:"lastLoginAt"`
	CreatedAt   time.Time  `json:"createdAt"`
	UpdatedAt   time.Time  `json:"updatedAt"`
}

// Appointment is a booking/consultation request submitted from the public site
// or created by reception staff in the dashboard.
type Appointment struct {
	ID              uint   `gorm:"primaryKey" json:"id"`
	Name            string `gorm:"not null" json:"name"`
	Phone           string `gorm:"not null" json:"phone"`
	Email           string `json:"email"`
	Service         string `json:"service"`
	Doctor          string `json:"doctor"`
	DoctorID        *uint  `gorm:"index" json:"doctorId"`      // FK to Doctor (NULL = unspecified); real FK + ON DELETE RESTRICT added in Migrate
	PatientUserID   *uint  `gorm:"index" json:"patientUserId"` // FK to PatientUser (NULL = guest/admin-created); real FK + ON DELETE SET NULL added in Migrate
	PatientType     string `json:"patientType"`                // new|returning
	Source          string `gorm:"index" json:"source"`        // admin|website|whatsapp|phone
	AppointmentDate string `json:"appointmentDate"`
	AppointmentTime string `json:"appointmentTime"`
	// ScheduledAt is the canonical booking instant derived from
	// AppointmentDate + AppointmentTime interpreted in Asia/Jakarta. The string
	// date/time columns are kept for back-compat; this is the sortable/queryable
	// timestamp. NULL when date/time are unset or unparseable.
	ScheduledAt *time.Time `gorm:"index" json:"scheduledAt"`
	Message     string     `gorm:"type:text" json:"message"`
	Status      string     `gorm:"default:pending;index" json:"status"` // pending|confirmed|done|cancelled|no_show
	// Cancellation metadata (set when status -> cancelled).
	CancelReason string     `json:"cancelReason"`
	CancelledAt  *time.Time `json:"cancelledAt"`
	// HandledByAdminID records the last admin who mutated this appointment.
	HandledByAdminID *uint     `gorm:"index" json:"handledByAdminId"`
	CreatedAt        time.Time `gorm:"index" json:"createdAt"`
	UpdatedAt        time.Time `json:"updatedAt"`
	// Soft-delete: patient-contact records are never physically destroyed. GORM
	// auto-scopes rows with a non-null deleted_at out of all queries.
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`
}

// Doctor profile shown on the public site and managed in the dashboard.
type Doctor struct {
	ID          uint   `gorm:"primaryKey" json:"id"`
	Slug        string `gorm:"uniqueIndex;not null" json:"slug"`
	Name        string `gorm:"not null" json:"name"`
	Specialty   string `json:"specialty"`
	Experience  string `json:"experience"`
	ImageURL    string `json:"imageUrl"`
	Accent      string `json:"accent"`
	OrderIndex  int    `gorm:"default:0" json:"orderIndex"`
	SlotMinutes int    `gorm:"default:30" json:"slotMinutes"` // booking slot length in minutes
	// Professional registration / pricing. STR/SIP are admin-only catalog data
	// (not exposed publicly); ConsultationFee is safe to surface to the booking UI.
	STRNumber       string    `gorm:"column:str_number" json:"strNumber"`
	SIPNumber       string    `gorm:"column:sip_number" json:"sipNumber"`
	ConsultationFee int       `gorm:"default:0" json:"consultationFee"` // in IDR (rupiah)
	Active          bool      `json:"active"`                           // explicit in handler; no default:true (see Admin.Active)
	CreatedAt       time.Time `json:"createdAt"`
	UpdatedAt       time.Time `json:"updatedAt"`
}

// Article is a health blog/news post with full CMS metadata.
type Article struct {
	ID          uint      `gorm:"primaryKey" json:"id"`
	Slug        string    `gorm:"uniqueIndex;not null" json:"slug"`
	Title       string    `gorm:"not null" json:"title"`
	Excerpt     string    `gorm:"type:text" json:"excerpt"`
	Category    string    `gorm:"index" json:"category"`
	Content     string    `gorm:"type:text" json:"content"`
	ReadMins    int       `gorm:"default:4" json:"readMins"`
	Published   bool      `gorm:"index" json:"published"` // explicit in handler; no default:true (drafts must stay false)
	PublishedAt time.Time `json:"publishedAt"`
	// CMS metadata (lifecycle, SEO, media). Stored as opaque strings to match the
	// frontend contract (see frontend src/lib/admin/types.ts).
	Status         string    `gorm:"default:published;index" json:"status"` // draft|published|scheduled|archived
	ScheduledAt    string    `json:"scheduledAt"`
	CoverImage     string    `json:"coverImage"`
	Tags           []string  `gorm:"serializer:json" json:"tags"`
	Author         string    `json:"author"`
	Featured       bool      `gorm:"default:false;index" json:"featured"`
	SeoTitle       string    `json:"seoTitle"`
	SeoDescription string    `json:"seoDescription"`
	OgImage        string    `json:"ogImage"`
	CanonicalURL   string    `json:"canonicalUrl"`
	FocusKeyword   string    `json:"focusKeyword"`
	CreatedAt      time.Time `json:"createdAt"`
	UpdatedAt      time.Time `json:"updatedAt"`
}

// Service is a clinic service/offering.
type Service struct {
	ID          uint     `gorm:"primaryKey" json:"id"`
	Slug        string   `gorm:"uniqueIndex;not null" json:"slug"`
	Title       string   `gorm:"not null" json:"title"`
	Short       string   `json:"short"`
	Description string   `gorm:"type:text" json:"description"`
	Icon        string   `json:"icon"`
	Points      []string `gorm:"serializer:json" json:"points"`
	OrderIndex  int      `gorm:"default:0" json:"orderIndex"`
	// Pricing / scheduling hints surfaced to the booking UI.
	Price           int       `gorm:"default:0" json:"price"`           // in IDR (rupiah); 0 = unspecified
	DurationMinutes int       `gorm:"default:0" json:"durationMinutes"` // typical service duration; 0 = unspecified
	CreatedAt       time.Time `json:"createdAt"`
	UpdatedAt       time.Time `json:"updatedAt"`
}

// Location is a physical clinic branch.
type Location struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	Slug      string    `gorm:"uniqueIndex;not null" json:"slug"`
	Name      string    `gorm:"not null" json:"name"`
	Area      string    `json:"area"`
	Address   string    `json:"address"`
	Hours     string    `json:"hours"`
	Phone     string    `json:"phone"`
	Lat       float64   `json:"lat"`
	Lng       float64   `json:"lng"`
	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`
}

// Promotion is a special offer/package with full campaign lifecycle metadata.
type Promotion struct {
	ID       uint   `gorm:"primaryKey" json:"id"`
	Slug     string `gorm:"uniqueIndex;not null" json:"slug"`
	Title    string `gorm:"not null" json:"title"`
	Tag      string `json:"tag"`
	Price    string `json:"price"`
	OldPrice string `json:"oldPrice"`
	Desc     string `gorm:"type:text" json:"desc"`
	Active   bool   `gorm:"index" json:"active"` // explicit in handler; no default:true (see Admin.Active)
	// Campaign metadata. Dates stored as strings to match the frontend contract.
	Status          string    `gorm:"default:draft;index" json:"status"` // draft|scheduled|active|expired|hidden
	CampaignType    string    `gorm:"index" json:"campaignType"`         // discount|bundle|seasonal|new_patient|wellness
	StartDate       string    `json:"startDate"`
	EndDate         string    `json:"endDate"`
	CoverImage      string    `json:"coverImage"`
	Terms           string    `gorm:"type:text" json:"terms"`
	FullDescription string    `gorm:"type:text" json:"fullDescription"`
	TargetAudience  string    `json:"targetAudience"`
	AccentColor     string    `json:"accentColor"`
	Currency        string    `json:"currency"`
	PriceNote       string    `json:"priceNote"`
	Featured        bool      `gorm:"default:false;index" json:"featured"`
	DisplayOrder    int       `gorm:"default:0" json:"displayOrder"`
	MaxClaims       int       `gorm:"default:0" json:"maxClaims"`
	TotalClaims     int       `gorm:"default:0" json:"totalClaims"`
	CreatedAt       time.Time `json:"createdAt"`
	UpdatedAt       time.Time `json:"updatedAt"`
}

// AuditLog records sensitive activity for accountability. Actors may be admins,
// patients (self-service actions), or the system itself; ActorType disambiguates
// which realm the AdminID/AdminEmail columns refer to (they are reused as the
// generic actor id/email so the existing admin audit log keeps working).
type AuditLog struct {
	ID         uint      `gorm:"primaryKey" json:"id"`
	ActorType  string    `gorm:"index;default:admin" json:"actorType"` // admin|patient|system
	AdminID    string    `gorm:"index" json:"adminId"`                 // actor id (admin or patient), may be empty for system
	AdminEmail string    `json:"adminEmail"`                           // actor email
	Action     string    `gorm:"index;not null" json:"action"`
	Resource   string    `gorm:"index;not null" json:"resource"`
	ResourceID string    `gorm:"index" json:"resourceId"`
	IP         string    `json:"ip"`
	UserAgent  string    `json:"userAgent"`
	CreatedAt  time.Time `gorm:"index" json:"createdAt"`
}

// RolePermission stores one (role, permission) grant. Together these rows make
// the RBAC matrix editable at runtime instead of hardcoded in code.
type RolePermission struct {
	ID         uint   `gorm:"primaryKey" json:"id"`
	Role       string `gorm:"uniqueIndex:idx_role_permission;not null" json:"role"`
	Permission string `gorm:"uniqueIndex:idx_role_permission;not null" json:"permission"`
}

// AllModels returns every model for auto-migration.
// PatientUser is a public patient account used to book appointments.
// Separate realm from Admin — different table, cookie, and JWT role.
type PatientUser struct {
	ID           uint   `gorm:"primaryKey" json:"id"`
	Name         string `gorm:"not null" json:"name"`
	Email        string `gorm:"uniqueIndex;not null" json:"email"`
	Phone        string `json:"phone"`
	PasswordHash string `json:"-"`
	// Identity / demographics (PDP-relevant). NIK and MedicalRecordNo are UNIQUE
	// but allow empty — enforced via partial unique indexes in Migrate (WHERE x <> '')
	// rather than uniqueIndex tags, which would collide on multiple empty strings.
	DateOfBirth     *time.Time `json:"dateOfBirth"`
	Sex             string     `json:"sex"`                   // L|P|"" (Indonesian: Laki-laki / Perempuan)
	NIK             string     `gorm:"column:nik" json:"nik"` // 16-digit national ID; masked in list responses
	MedicalRecordNo string     `gorm:"column:medical_record_no" json:"medicalRecordNo"`
	Address         string     `json:"address"`
	// Consent / verification metadata (data-protection compliance).
	ConsentAcceptedAt *time.Time `json:"consentAcceptedAt"`
	ConsentVersion    string     `json:"consentVersion"`
	EmailVerifiedAt   *time.Time `json:"emailVerifiedAt"`
	Active            bool       `gorm:"default:true" json:"active"`
	CreatedAt         time.Time  `json:"createdAt"`
	UpdatedAt         time.Time  `json:"updatedAt"`
}

// PatientToken backs password-reset and email-verification flows. Only a SHA-256
// hash of the opaque token is stored, never the raw token. Tokens are
// single-use (UsedAt) and time-bounded (ExpiresAt).
type PatientToken struct {
	ID            uint       `gorm:"primaryKey" json:"id"`
	PatientUserID uint       `gorm:"index;not null" json:"patientUserId"`
	Purpose       string     `gorm:"index;not null" json:"purpose"` // reset|verify
	TokenHash     string     `gorm:"index;not null" json:"-"`
	ExpiresAt     time.Time  `json:"expiresAt"`
	UsedAt        *time.Time `json:"usedAt"`
	CreatedAt     time.Time  `json:"createdAt"`
}

// DoctorSchedule is one weekly working window for a doctor on a given weekday.
// Availability slots are generated from these windows + Doctor.SlotMinutes.
type DoctorSchedule struct {
	ID          uint `gorm:"primaryKey" json:"id"`
	DoctorID    uint `gorm:"index;not null" json:"doctorId"`
	Weekday     int  `json:"weekday"`     // 0=Sunday … 6=Saturday (time.Weekday)
	StartMinute int  `json:"startMinute"` // minutes from midnight, e.g. 480 = 08:00
	EndMinute   int  `json:"endMinute"`   // e.g. 960 = 16:00
}

func AllModels() []any {
	return []any{
		&Admin{}, &Appointment{}, &Doctor{}, &Article{},
		&Service{}, &Location{}, &Promotion{}, &AuditLog{},
		&RolePermission{}, &PatientUser{}, &DoctorSchedule{}, &PatientToken{},
	}
}
