package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/go-playground/validator/v10"
)

// ok writes a 200 response with a data envelope.
func ok(c *gin.Context, data any) {
	c.JSON(http.StatusOK, gin.H{"data": data})
}

// created writes a 201 response with a data envelope.
func created(c *gin.Context, data any) {
	c.JSON(http.StatusCreated, gin.H{"data": data})
}

// noContent writes a 204.
func noContent(c *gin.Context) {
	c.Status(http.StatusNoContent)
}

// fail writes a structured error envelope.
func fail(c *gin.Context, status int, code, message string) {
	c.JSON(status, gin.H{"error": gin.H{"code": code, "message": message}})
}

// failValidation converts binding errors into a 400 with per-field details.
func failValidation(c *gin.Context, err error) {
	details := []gin.H{}
	if ve, ok := err.(validator.ValidationErrors); ok {
		for _, fe := range ve {
			details = append(details, gin.H{
				"field":   fe.Field(),
				"rule":    fe.Tag(),
				"message": fe.Field() + " gagal aturan '" + fe.Tag() + "'",
			})
		}
	}
	c.JSON(http.StatusBadRequest, gin.H{
		"error": gin.H{
			"code":    "VALIDATION_ERROR",
			"message": "Data yang dikirim tidak valid",
			"details": details,
		},
	})
}
