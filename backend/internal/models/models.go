package models

import "time"

// Admin is a dashboard user who can sign in and manage content.
type Admin struct {
	ID           uint       `gorm:"primaryKey" json:"id"`
	Name         string     `gorm:"not null" json:"name"`
	Email        string     `gorm:"uniqueIndex;not null" json:"email"`
	PasswordHash string     `gorm:"not null" json:"-"`
	Role         string     `gorm:"default:viewer;index" json:"role"`
	Phone        string     `json:"phone"`
	AvatarURL    string     `json:"avatarUrl"`
	// No GORM default: the handler always sets this explicitly, and a `default:true`
	// tag would make GORM ignore an explicit `false` on insert (deactivated accounts).
	Active       bool       `gorm:"index" json:"active"`
	LastLoginAt  *time.Time `json:"lastLoginAt"`
	CreatedAt    time.Time  `json:"createdAt"`
	UpdatedAt    time.Time  `json:"updatedAt"`
}

// Appointment is a booking/consultation request submitted from the public site
// or created by reception staff in the dashboard.
type Appointment struct {
	ID              uint      `gorm:"primaryKey" json:"id"`
	Name            string    `gorm:"not null" json:"name"`
	Phone           string    `gorm:"not null" json:"phone"`
	Email           string    `json:"email"`
	Service         string    `json:"service"`
	Doctor          string    `json:"doctor"`
	PatientType     string    `json:"patientType"` // new|returning
	Source          string    `gorm:"index" json:"source"` // admin|website|whatsapp|phone
	AppointmentDate string    `json:"appointmentDate"`
	AppointmentTime string    `json:"appointmentTime"`
	Message         string    `gorm:"type:text" json:"message"`
	Status          string    `gorm:"default:pending;index" json:"status"` // pending|confirmed|done|cancelled
	CreatedAt       time.Time `gorm:"index" json:"createdAt"`
	UpdatedAt       time.Time `json:"updatedAt"`
}

// Doctor profile shown on the public site and managed in the dashboard.
type Doctor struct {
	ID         uint      `gorm:"primaryKey" json:"id"`
	Slug       string    `gorm:"uniqueIndex;not null" json:"slug"`
	Name       string    `gorm:"not null" json:"name"`
	Specialty  string    `json:"specialty"`
	Experience string    `json:"experience"`
	ImageURL   string    `json:"imageUrl"`
	Accent     string    `json:"accent"`
	OrderIndex int       `gorm:"default:0" json:"orderIndex"`
	Active     bool      `json:"active"` // explicit in handler; no default:true (see Admin.Active)
	CreatedAt  time.Time `json:"createdAt"`
	UpdatedAt  time.Time `json:"updatedAt"`
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
	Status         string   `gorm:"default:published;index" json:"status"` // draft|published|scheduled|archived
	ScheduledAt    string   `json:"scheduledAt"`
	CoverImage     string   `json:"coverImage"`
	Tags           []string `gorm:"serializer:json" json:"tags"`
	Author         string   `json:"author"`
	Featured       bool     `gorm:"default:false;index" json:"featured"`
	SeoTitle       string   `json:"seoTitle"`
	SeoDescription string   `json:"seoDescription"`
	OgImage        string   `json:"ogImage"`
	CanonicalURL   string   `json:"canonicalUrl"`
	FocusKeyword   string   `json:"focusKeyword"`
	CreatedAt      time.Time `json:"createdAt"`
	UpdatedAt      time.Time `json:"updatedAt"`
}

// Service is a clinic service/offering.
type Service struct {
	ID          uint      `gorm:"primaryKey" json:"id"`
	Slug        string    `gorm:"uniqueIndex;not null" json:"slug"`
	Title       string    `gorm:"not null" json:"title"`
	Short       string    `json:"short"`
	Description string    `gorm:"type:text" json:"description"`
	Icon        string    `json:"icon"`
	Points      []string  `gorm:"serializer:json" json:"points"`
	OrderIndex  int       `gorm:"default:0" json:"orderIndex"`
	CreatedAt   time.Time `json:"createdAt"`
	UpdatedAt   time.Time `json:"updatedAt"`
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
	ID        uint      `gorm:"primaryKey" json:"id"`
	Slug      string    `gorm:"uniqueIndex;not null" json:"slug"`
	Title     string    `gorm:"not null" json:"title"`
	Tag       string    `json:"tag"`
	Price     string    `json:"price"`
	OldPrice  string    `json:"oldPrice"`
	Desc      string    `gorm:"type:text" json:"desc"`
	Active    bool      `gorm:"index" json:"active"` // explicit in handler; no default:true (see Admin.Active)
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

// AuditLog records sensitive admin activity for accountability.
type AuditLog struct {
	ID         uint      `gorm:"primaryKey" json:"id"`
	AdminID    string    `gorm:"index" json:"adminId"`
	AdminEmail string    `json:"adminEmail"`
	Action     string    `gorm:"index;not null" json:"action"`
	Resource   string    `gorm:"index;not null" json:"resource"`
	ResourceID string    `gorm:"index" json:"resourceId"`
	IP         string    `json:"ip"`
	UserAgent  string    `json:"userAgent"`
	CreatedAt  time.Time `gorm:"index" json:"createdAt"`
}

// AllModels returns every model for auto-migration.
func AllModels() []any {
	return []any{
		&Admin{}, &Appointment{}, &Doctor{}, &Article{},
		&Service{}, &Location{}, &Promotion{}, &AuditLog{},
	}
}
