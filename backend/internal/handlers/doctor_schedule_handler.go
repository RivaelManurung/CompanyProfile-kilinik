package handlers

import (
	"net/http"

	"sehatnusantara/api/internal/models"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type scheduleWindow struct {
	Weekday     int `json:"weekday" binding:"min=0,max=6"`
	StartMinute int `json:"startMinute" binding:"min=0,max=1440"`
	EndMinute   int `json:"endMinute" binding:"min=0,max=1440"`
}

type updateScheduleRequest struct {
	SlotMinutes int              `json:"slotMinutes" binding:"omitempty,min=5,max=240"`
	Windows     []scheduleWindow `json:"windows"`
}

func (h *Handler) loadDoctor(c *gin.Context) (models.Doctor, bool) {
	var doc models.Doctor
	if err := h.DB.First(&doc, c.Param("id")).Error; err != nil {
		fail(c, http.StatusNotFound, "NOT_FOUND", "Dokter tidak ditemukan")
		return doc, false
	}
	return doc, true
}

func scheduleResponse(h *Handler, doctorID uint) gin.H {
	var windows []models.DoctorSchedule
	h.DB.Where("doctor_id = ?", doctorID).
		Order("weekday ASC, start_minute ASC").Find(&windows)
	var doc models.Doctor
	h.DB.First(&doc, doctorID)
	slotLen := doc.SlotMinutes
	if slotLen <= 0 {
		slotLen = 30
	}
	return gin.H{"doctorId": doctorID, "slotMinutes": slotLen, "windows": windows}
}

// GetDoctorSchedule — GET /admin/doctors/:id/schedule
func (h *Handler) GetDoctorSchedule(c *gin.Context) {
	doc, ok2 := h.loadDoctor(c)
	if !ok2 {
		return
	}
	ok(c, scheduleResponse(h, doc.ID))
}

// UpdateDoctorSchedule — PUT /admin/doctors/:id/schedule (replaces all windows)
func (h *Handler) UpdateDoctorSchedule(c *gin.Context) {
	doc, ok2 := h.loadDoctor(c)
	if !ok2 {
		return
	}
	var req updateScheduleRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		failValidation(c, err)
		return
	}
	for _, w := range req.Windows {
		if w.EndMinute <= w.StartMinute {
			fail(c, http.StatusBadRequest, "INVALID_WINDOW", "Jam selesai harus setelah jam mulai")
			return
		}
	}

	err := h.DB.Transaction(func(tx *gorm.DB) error {
		if req.SlotMinutes > 0 {
			if err := tx.Model(&models.Doctor{}).Where("id = ?", doc.ID).
				Update("slot_minutes", req.SlotMinutes).Error; err != nil {
				return err
			}
		}
		if err := tx.Where("doctor_id = ?", doc.ID).Delete(&models.DoctorSchedule{}).Error; err != nil {
			return err
		}
		for _, w := range req.Windows {
			row := models.DoctorSchedule{
				DoctorID: doc.ID, Weekday: w.Weekday,
				StartMinute: w.StartMinute, EndMinute: w.EndMinute,
			}
			if err := tx.Create(&row).Error; err != nil {
				return err
			}
		}
		return nil
	})
	if err != nil {
		fail(c, http.StatusInternalServerError, "UPDATE_FAILED", "Gagal menyimpan jadwal")
		return
	}
	h.audit(c, "update", "doctor_schedule", c.Param("id"))
	ok(c, scheduleResponse(h, doc.ID))
}
