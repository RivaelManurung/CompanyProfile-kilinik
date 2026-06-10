package handlers

import (
	"net/http"
	"time"

	"sehatnusantara/api/internal/models"

	"github.com/gin-gonic/gin"
)

type statusCount struct {
	Status string `json:"status"`
	Count  int64  `json:"count"`
}

type dayCount struct {
	Day   string `json:"day"`
	Count int64  `json:"count"`
}

// Stats returns dashboard overview metrics.
func (h *Handler) Stats(c *gin.Context) {
	var totalAppointments, pending, todayAppointments, overdueFollowUp, doctors, articles, draftArticles, locations, promotions int64
	h.DB.Model(&models.Appointment{}).Count(&totalAppointments)
	h.DB.Model(&models.Appointment{}).Where("status = ?", "pending").Count(&pending)
	todayStart := time.Now().Truncate(24 * time.Hour)
	h.DB.Model(&models.Appointment{}).Where("created_at >= ?", todayStart).Count(&todayAppointments)
	h.DB.Model(&models.Appointment{}).Where("status = ? AND created_at < ?", "pending", time.Now().Add(-24*time.Hour)).Count(&overdueFollowUp)
	h.DB.Model(&models.Doctor{}).Count(&doctors)
	h.DB.Model(&models.Article{}).Count(&articles)
	h.DB.Model(&models.Article{}).Where("published = ?", false).Count(&draftArticles)
	h.DB.Model(&models.Location{}).Count(&locations)
	h.DB.Model(&models.Promotion{}).Count(&promotions)

	// appointments grouped by status
	var byStatus []statusCount
	h.DB.Model(&models.Appointment{}).
		Select("status, count(*) as count").
		Group("status").Scan(&byStatus)

	// appointments per day for the last 14 days
	var series []dayCount
	since := time.Now().AddDate(0, 0, -13).Format("2006-01-02")
	h.DB.Model(&models.Appointment{}).
		Select("to_char(created_at, 'YYYY-MM-DD') as day, count(*) as count").
		Where("created_at >= ?", since).
		Group("day").Order("day ASC").Scan(&series)

	// recent appointments
	var recent []models.Appointment
	h.DB.Order("created_at DESC").Limit(5).Find(&recent)

	var busiestServices []struct {
		Service string `json:"service"`
		Count   int64  `json:"count"`
	}
	h.DB.Model(&models.Appointment{}).
		Select("coalesce(nullif(service, ''), 'Belum dipilih') as service, count(*) as count").
		Group("service").Order("count DESC").Limit(5).Scan(&busiestServices)

	var recentActivity []models.AuditLog
	h.DB.Order("created_at DESC").Limit(6).Find(&recentActivity)

	c.JSON(http.StatusOK, gin.H{
		"data": gin.H{
			"totals": gin.H{
				"appointments":      totalAppointments,
				"pending":           pending,
				"todayAppointments": todayAppointments,
				"overdueFollowUp":   overdueFollowUp,
				"doctors":           doctors,
				"articles":          articles,
				"draftArticles":     draftArticles,
				"locations":         locations,
				"promotions":        promotions,
			},
			"byStatus":        byStatus,
			"series":          series,
			"recent":          recent,
			"busiestServices": busiestServices,
			"recentActivity":  recentActivity,
		},
	})
}
