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

// maxBodyBytes caps request payloads to defend against memory-exhaustion via
// oversized bodies. 1 MiB comfortably covers any article/promotion payload.
const maxBodyBytes = 1 << 20

// bodyLimit rejects request bodies larger than maxBodyBytes.
func bodyLimit() gin.HandlerFunc {
	return func(c *gin.Context) {
		if c.Request.Body != nil {
			c.Request.Body = http.MaxBytesReader(c.Writer, c.Request.Body, maxBodyBytes)
		}
		c.Next()
	}
}

type rateBucket struct {
	count int
	reset time.Time
}

func rateLimit(limit int, window time.Duration, keyFn func(*gin.Context) string) gin.HandlerFunc {
	var mu sync.Mutex
	buckets := map[string]rateBucket{}
	lastSweep := time.Now()

	return func(c *gin.Context) {
		now := time.Now()
		key := keyFn(c)

		mu.Lock()
		// Periodically evict expired buckets so the map cannot grow unbounded
		// (prevents a slow memory leak on long-running single-node servers).
		if now.Sub(lastSweep) > window {
			for k, v := range buckets {
				if now.After(v.reset) {
					delete(buckets, k)
				}
			}
			lastSweep = now
		}
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
