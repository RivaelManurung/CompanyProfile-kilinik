package handlers

import (
	"math"
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type listParams struct {
	Page      int
	Limit     int
	Q         string
	Status    string
	Sort      string
	Direction string
}

func parseListParams(c *gin.Context, defaultSort string) listParams {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 100 {
		limit = 20
	}

	direction := strings.ToLower(c.DefaultQuery("direction", "asc"))
	if direction != "asc" && direction != "desc" {
		direction = "asc"
	}

	return listParams{
		Page:      page,
		Limit:     limit,
		Q:         strings.TrimSpace(c.Query("q")),
		Status:    strings.TrimSpace(c.Query("status")),
		Sort:      strings.TrimSpace(c.DefaultQuery("sort", defaultSort)),
		Direction: direction,
	}
}

func applyOrder(q *gorm.DB, params listParams, allowed map[string]string, fallback string) *gorm.DB {
	column, ok := allowed[params.Sort]
	if !ok {
		column = fallback
	}
	return q.Order(column + " " + params.Direction)
}

func listResponse(c *gin.Context, data any, total int64, params listParams) {
	totalPages := int(math.Ceil(float64(total) / float64(params.Limit)))
	if totalPages < 1 {
		totalPages = 1
	}
	c.JSON(200, gin.H{
		"data": data,
		"meta": gin.H{
			"page":       params.Page,
			"limit":      params.Limit,
			"total":      total,
			"totalPages": totalPages,
		},
	})
}

func paginate(q *gorm.DB, params listParams) *gorm.DB {
	return q.Limit(params.Limit).Offset((params.Page - 1) * params.Limit)
}
