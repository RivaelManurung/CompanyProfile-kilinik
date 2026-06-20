package handlers

import (
	"net/http"

	"sehatnusantara/api/internal/models"

	"github.com/gin-gonic/gin"
)

// patientAdminView is the admin-safe projection of a patient. The NIK is masked;
// the raw NIK is never exposed through the admin surface.
func patientAdminView(p models.PatientUser) gin.H {
	return gin.H{
		"id": p.ID, "name": p.Name, "email": p.Email, "phone": p.Phone,
		"dateOfBirth": p.DateOfBirth, "sex": p.Sex, "address": p.Address,
		"nik":               maskNIK(p.NIK),
		"medicalRecordNo":   p.MedicalRecordNo,
		"consentAcceptedAt": p.ConsentAcceptedAt,
		"emailVerifiedAt":   p.EmailVerifiedAt,
		"active":            p.Active,
		"createdAt":         p.CreatedAt,
		"updatedAt":         p.UpdatedAt,
	}
}

// AdminListPatients returns paginated, searchable patients (admin).
// GET /api/admin/patients — permission patients:read.
func (h *Handler) AdminListPatients(c *gin.Context) {
	params := parseListParams(c, "created_at")
	if params.Direction == "asc" && c.Query("direction") == "" {
		params.Direction = "desc"
	}

	q := h.DB.Model(&models.PatientUser{})
	if params.Q != "" {
		like := "%" + params.Q + "%"
		q = q.Where(
			"name ILIKE ? OR email ILIKE ? OR phone ILIKE ? OR nik ILIKE ? OR medical_record_no ILIKE ?",
			like, like, like, like, like,
		)
	}

	var total int64
	q.Count(&total)

	var items []models.PatientUser
	q = applyOrder(q, params, map[string]string{
		"created_at": "created_at",
		"updated_at": "updated_at",
		"name":       "name",
		"email":      "email",
	}, "created_at")
	if err := paginate(q, params).Find(&items).Error; err != nil {
		fail(c, http.StatusInternalServerError, "DB_ERROR", "Gagal memuat data pasien")
		return
	}

	views := make([]gin.H, 0, len(items))
	for _, p := range items {
		views = append(views, patientAdminView(p))
	}
	h.audit(c, "read", "patients", "")
	listResponse(c, views, total, params)
}

// AdminGetPatient returns a single patient plus their appointments (admin).
// GET /api/admin/patients/:id — permission patients:read.
func (h *Handler) AdminGetPatient(c *gin.Context) {
	var p models.PatientUser
	if err := h.DB.First(&p, c.Param("id")).Error; err != nil {
		fail(c, http.StatusNotFound, "NOT_FOUND", "Pasien tidak ditemukan")
		return
	}
	var appts []models.Appointment
	if err := h.DB.Where("patient_user_id = ?", p.ID).
		Order("scheduled_at DESC, id DESC").Find(&appts).Error; err != nil {
		fail(c, http.StatusInternalServerError, "DB_ERROR", "Gagal memuat janji temu pasien")
		return
	}
	h.audit(c, "read", "patients", c.Param("id"))
	ok(c, gin.H{"patient": patientAdminView(p), "appointments": appts})
}
