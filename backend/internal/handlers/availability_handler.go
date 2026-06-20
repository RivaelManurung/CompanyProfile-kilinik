package handlers

import (
	"fmt"
	"net/http"
	"os"
	"sort"
	"time"

	"sehatnusantara/api/internal/models"

	"github.com/gin-gonic/gin"
)

// clinicLoc is the clinic's wall-clock timezone (WIB / Asia/Jakarta). All
// "today" / "past slot" decisions must use this, not the server's local time,
// so availability is correct regardless of where the API process runs.
// Overridable via the CLINIC_TZ env var; falls back to a fixed +07:00 offset
// if the tz database isn't available on the host.
var clinicLoc = loadClinicLoc()

func loadClinicLoc() *time.Location {
	name := os.Getenv("CLINIC_TZ")
	if name == "" {
		name = "Asia/Jakarta"
	}
	if loc, err := time.LoadLocation(name); err == nil {
		return loc
	}
	return time.FixedZone("WIB", 7*3600)
}

type slot struct {
	Time      string `json:"time"` // "HH:MM"
	Available bool   `json:"available"`
}

func minutesToHHMM(m int) string {
	return fmt.Sprintf("%02d:%02d", m/60, m%60)
}

// parseScheduledAt builds the canonical booking instant from a date ("2006-01-02")
// and time ("15:04") interpreted in the clinic timezone (Asia/Jakarta). Returns
// nil if either part is empty or unparseable, so callers can store NULL.
func parseScheduledAt(date, t string) *time.Time {
	if date == "" || t == "" {
		return nil
	}
	ts, err := time.ParseInLocation("2006-01-02 15:04", date+" "+t, clinicLoc)
	if err != nil {
		return nil
	}
	return &ts
}

// computeAvailability generates the bookable slots for a doctor on a date,
// derived from the doctor's weekly schedule windows and slot length, with
// already-taken (pending/confirmed) and past slots marked unavailable.
func (h *Handler) computeAvailability(doc models.Doctor, date string) ([]slot, error) {
	day, err := time.ParseInLocation("2006-01-02", date, clinicLoc)
	if err != nil {
		return nil, err
	}
	weekday := int(day.Weekday()) // 0=Sunday … 6=Saturday
	slotLen := doc.SlotMinutes
	if slotLen <= 0 {
		slotLen = 30
	}

	var windows []models.DoctorSchedule
	h.DB.Where("doctor_id = ? AND weekday = ?", doc.ID, weekday).
		Order("start_minute ASC").Find(&windows)
	if len(windows) == 0 {
		return []slot{}, nil
	}

	var taken []string
	h.DB.Model(&models.Appointment{}).
		Where("doctor_id = ? AND appointment_date = ? AND status IN ?",
			doc.ID, date, []string{"pending", "confirmed"}).
		Pluck("appointment_time", &taken)
	takenSet := make(map[string]bool, len(taken))
	for _, t := range taken {
		takenSet[t] = true
	}

	now := time.Now().In(clinicLoc)
	isToday := date == now.Format("2006-01-02")
	nowMin := now.Hour()*60 + now.Minute()

	var slots []slot
	for _, w := range windows {
		for m := w.StartMinute; m+slotLen <= w.EndMinute; m += slotLen {
			label := minutesToHHMM(m)
			available := !takenSet[label]
			if isToday && m <= nowMin {
				available = false
			}
			slots = append(slots, slot{Time: label, Available: available})
		}
	}
	sort.Slice(slots, func(i, j int) bool { return slots[i].Time < slots[j].Time })
	return slots, nil
}

// isSlotAvailable reports whether the given doctor offers an open, future slot
// at date+time. It reuses computeAvailability so admin/public bookings are held
// to the same schedule + anti-collision rules as the patient self-booking path.
// Returns (false, nil) when the doctor exists but the slot is taken/invalid, and
// a non-nil error only for an unparseable date or a missing/inactive doctor.
func (h *Handler) isSlotAvailable(doctorID uint, date, t string) (bool, error) {
	var doc models.Doctor
	if err := h.DB.First(&doc, doctorID).Error; err != nil || !doc.Active {
		return false, fmt.Errorf("doctor unavailable")
	}
	slots, err := h.computeAvailability(doc, date)
	if err != nil {
		return false, err
	}
	for _, s := range slots {
		if s.Time == t && s.Available {
			return true, nil
		}
	}
	return false, nil
}

// PublicAvailability — GET /api/public/availability?doctorId=&date=YYYY-MM-DD
func (h *Handler) PublicAvailability(c *gin.Context) {
	doctorID := c.Query("doctorId")
	date := c.Query("date")
	if doctorID == "" || date == "" {
		fail(c, http.StatusBadRequest, "MISSING_PARAMS", "Parameter doctorId dan date wajib diisi")
		return
	}
	var doc models.Doctor
	if err := h.DB.First(&doc, doctorID).Error; err != nil || !doc.Active {
		fail(c, http.StatusNotFound, "NOT_FOUND", "Dokter tidak ditemukan")
		return
	}
	slots, err := h.computeAvailability(doc, date)
	if err != nil {
		fail(c, http.StatusBadRequest, "INVALID_DATE", "Format tanggal harus YYYY-MM-DD")
		return
	}
	slotLen := doc.SlotMinutes
	if slotLen <= 0 {
		slotLen = 30
	}
	ok(c, gin.H{"doctorId": doc.ID, "date": date, "slotMinutes": slotLen, "slots": slots})
}
