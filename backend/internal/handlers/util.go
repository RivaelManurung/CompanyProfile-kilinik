package handlers

import (
	"regexp"
	"strconv"
	"strings"
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

func stringID(id uint) string {
	return strconv.FormatUint(uint64(id), 10)
}
