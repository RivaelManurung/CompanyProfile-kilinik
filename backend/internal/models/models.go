package models

import "time"

// Admin is a dashboard user who can sign in and manage content.
type Admin struct {
	ID           uint      `gorm:"primaryKey" json:"id"`
	Name         string    `gorm:"not null" json:"name"`
	Email        string    `gorm:"uniqueIndex;not null" json:"email"`
	PasswordHash string    `gorm:"not null" json:"-"`
	Role         string    `gorm:"default:viewer;index" json:"role"`
	CreatedAt    time.Time `json:"createdAt"`
	UpdatedAt    time.Time `json:"updatedAt"`
}

// Appointment is a booking/consultation request submitted from the public site.
type Appointment struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	Name      string    `gorm:"not null" json:"name"`
	Phone     string    `gorm:"not null" json:"phone"`
	Email     string    `json:"email"`
	Service   string    `json:"service"`
	Message   string    `gorm:"type:text" json:"message"`
	Status    string    `gorm:"default:pending;index" json:"status"` // pending|confirmed|done|cancelled
	CreatedAt time.Time `gorm:"index" json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`
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
	Active     bool      `gorm:"default:true" json:"active"`
	CreatedAt  time.Time `json:"createdAt"`
	UpdatedAt  time.Time `json:"updatedAt"`
}

// Article is a health blog/news post.
type Article struct {
	ID          uint      `gorm:"primaryKey" json:"id"`
	Slug        string    `gorm:"uniqueIndex;not null" json:"slug"`
	Title       string    `gorm:"not null" json:"title"`
	Excerpt     string    `gorm:"type:text" json:"excerpt"`
	Category    string    `gorm:"index" json:"category"`
	Content     string    `gorm:"type:text" json:"content"`
	ReadMins    int       `gorm:"default:4" json:"readMins"`
	Published   bool      `gorm:"default:true;index" json:"published"`
	PublishedAt time.Time `json:"publishedAt"`
	CreatedAt   time.Time `json:"createdAt"`
	UpdatedAt   time.Time `json:"updatedAt"`
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

// Promotion is a special offer/package.
type Promotion struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	Slug      string    `gorm:"uniqueIndex;not null" json:"slug"`
	Title     string    `gorm:"not null" json:"title"`
	Tag       string    `json:"tag"`
	Price     string    `json:"price"`
	OldPrice  string    `json:"oldPrice"`
	Desc      string    `gorm:"type:text" json:"desc"`
	Active    bool      `gorm:"default:true;index" json:"active"`
	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`
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
