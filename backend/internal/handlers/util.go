package handlers

import (
	"regexp"
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"
)

var nonSlug = regexp.MustCompile(`[^a-z0-9]+`)

// slugify converts a string into a URL-safe slug.
func slugify(s string) string {
	s = strings.ToLower(strings.TrimSpace(s))
	s = nonSlug.ReplaceAllString(s, "-")
	return strings.Trim(s, "-")
}

func boolValue(p *bool, def bool) bool {
	if p == nil {
		return def
	}
	return *p
}

func intValue(p *int, def int) int {
	if p == nil {
		return def
	}
	return *p
}

func stringID(id uint) string {
	return strconv.FormatUint(uint64(id), 10)
}

// currentAdminID returns the authenticated admin's id from the gin context as a
// *uint (the auth middleware stores it as a decimal string under "adminID").
// Returns nil when absent or unparseable so it can be stored as NULL.
func currentAdminID(c *gin.Context) *uint {
	raw := c.GetString("adminID")
	if raw == "" {
		return nil
	}
	id, err := strconv.ParseUint(raw, 10, 64)
	if err != nil {
		return nil
	}
	u := uint(id)
	return &u
}
