package router

import (
	"net/http"
	"net/url"
	"strings"
	"sync"
	"time"

	"sehatnusantara/api/internal/config"

	"github.com/gin-gonic/gin"
)

type rateBucket struct {
	count int
	reset time.Time
}

func rateLimit(limit int, window time.Duration, keyFn func(*gin.Context) string) gin.HandlerFunc {
	var mu sync.Mutex
	buckets := map[string]rateBucket{}

	return func(c *gin.Context) {
		now := time.Now()
		key := keyFn(c)

		mu.Lock()
		b := buckets[key]
		if b.reset.IsZero() || now.After(b.reset) {
			b = rateBucket{count: 0, reset: now.Add(window)}
		}
		b.count++
		buckets[key] = b
		mu.Unlock()

		if b.count > limit {
			c.AbortWithStatusJSON(http.StatusTooManyRequests, gin.H{
				"error": gin.H{"code": "RATE_LIMITED", "message": "Terlalu banyak percobaan. Coba lagi beberapa saat."},
			})
			return
		}
		c.Next()
	}
}

func mutationOriginGuard(cfg *config.Config) gin.HandlerFunc {
	allowed := map[string]bool{}
	for _, origin := range cfg.CORSOrigins {
		allowed[strings.TrimRight(origin, "/")] = true
	}

	return func(c *gin.Context) {
		if c.Request.Method == http.MethodGet || c.Request.Method == http.MethodHead || c.Request.Method == http.MethodOptions {
			c.Next()
			return
		}

		origin := strings.TrimRight(c.GetHeader("Origin"), "/")
		if origin == "" {
			if ref := c.GetHeader("Referer"); ref != "" {
				if u, err := url.Parse(ref); err == nil {
					origin = u.Scheme + "://" + u.Host
				}
			}
		}

		if origin == "" && !cfg.IsProd() {
			c.Next()
			return
		}

		if origin != "" && allowed[origin] {
			c.Next()
			return
		}

		c.AbortWithStatusJSON(http.StatusForbidden, gin.H{
			"error": gin.H{"code": "BAD_ORIGIN", "message": "Origin permintaan tidak diizinkan"},
		})
	}
}
