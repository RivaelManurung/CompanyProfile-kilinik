package router

import (
	"bytes"
	"context"
	"encoding/json"
	"io"
	"log"
	"net/http"
	"net/url"
	"strings"
	"sync"
	"time"

	"sehatnusantara/api/internal/config"

	"github.com/gin-gonic/gin"
	"github.com/redis/go-redis/v9"
)

// maxBodyBytes caps request payloads to defend against memory-exhaustion via
// oversized bodies. 1 MiB comfortably covers any article/promotion payload.
const maxBodyBytes = 1 << 20

// maxUploadBytes is the larger cap for the multipart image-upload route.
const maxUploadBytes = 8 << 20 // 8 MiB

// bodyLimit rejects request bodies larger than the route's cap.
func bodyLimit() gin.HandlerFunc {
	return func(c *gin.Context) {
		limit := int64(maxBodyBytes)
		if strings.HasPrefix(c.Request.URL.Path, "/api/admin/upload") {
			limit = maxUploadBytes
		}
		if c.Request.Body != nil {
			c.Request.Body = http.MaxBytesReader(c.Writer, c.Request.Body, limit)
		}
		c.Next()
	}
}

// ---------------------------------------------------------------------------
// Counter store: backs both the per-IP/route rate limiter and the per-email
// login lockout. The default is process-local; when REDIS_URL is configured the
// limits become shared across instances (call initRateStore in router.Setup).
// Backend errors fail OPEN (allow the request) so a store outage never locks
// users out of the whole app.
// ---------------------------------------------------------------------------

type rateStore interface {
	// incr increments key's counter, applying TTL=window on first use, and
	// returns the new count. Returns (0, err) on backend failure.
	incr(key string, window time.Duration) (int, error)
	// get returns the current count for key (0 if absent/expired/error).
	get(key string) int
	// del clears key's counter.
	del(key string)
}

// defaultStore is the active counter store. Swapped to Redis by initRateStore.
var defaultStore rateStore = newMemStore()

// initRateStore selects the Redis-backed store when a valid, reachable REDIS_URL
// is provided; otherwise the in-memory store is kept. Safe to call once at boot.
func initRateStore(redisURL string) {
	if redisURL == "" {
		return
	}
	opt, err := redis.ParseURL(redisURL)
	if err != nil {
		log.Printf("rate: invalid REDIS_URL (%v) — using in-memory limiter", err)
		return
	}
	client := redis.NewClient(opt)
	ctx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
	defer cancel()
	if err := client.Ping(ctx).Err(); err != nil {
		log.Printf("rate: redis unreachable (%v) — using in-memory limiter", err)
		_ = client.Close()
		return
	}
	defaultStore = &redisStore{client: client}
	log.Println("rate: using Redis-backed rate limiter / login lockout")
}

type rateBucket struct {
	count int
	reset time.Time
}

// memStore is a process-local counter store with periodic eviction so the map
// cannot grow unbounded on a long-running server.
type memStore struct {
	mu        sync.Mutex
	buckets   map[string]rateBucket
	lastSweep time.Time
}

func newMemStore() *memStore {
	return &memStore{buckets: map[string]rateBucket{}, lastSweep: time.Now()}
}

func (m *memStore) incr(key string, window time.Duration) (int, error) {
	now := time.Now()
	m.mu.Lock()
	defer m.mu.Unlock()
	m.sweepLocked(now)
	b := m.buckets[key]
	if b.reset.IsZero() || now.After(b.reset) {
		b = rateBucket{count: 0, reset: now.Add(window)}
	}
	b.count++
	m.buckets[key] = b
	return b.count, nil
}

func (m *memStore) get(key string) int {
	now := time.Now()
	m.mu.Lock()
	defer m.mu.Unlock()
	b, ok := m.buckets[key]
	if !ok || now.After(b.reset) {
		return 0
	}
	return b.count
}

func (m *memStore) del(key string) {
	m.mu.Lock()
	delete(m.buckets, key)
	m.mu.Unlock()
}

// sweepLocked evicts expired buckets at most once per minute. Caller holds mu.
func (m *memStore) sweepLocked(now time.Time) {
	if now.Sub(m.lastSweep) <= time.Minute {
		return
	}
	for k, v := range m.buckets {
		if now.After(v.reset) {
			delete(m.buckets, k)
		}
	}
	m.lastSweep = now
}

// redisStore is the shared, multi-instance counter store.
type redisStore struct {
	client *redis.Client
}

func (s *redisStore) ctx() (context.Context, context.CancelFunc) {
	return context.WithTimeout(context.Background(), 2*time.Second)
}

func (s *redisStore) incr(key string, window time.Duration) (int, error) {
	ctx, cancel := s.ctx()
	defer cancel()
	n, err := s.client.Incr(ctx, key).Result()
	if err != nil {
		return 0, err
	}
	if n == 1 {
		// Best-effort TTL on the first hit of the window.
		_ = s.client.Expire(ctx, key, window).Err()
	}
	return int(n), nil
}

func (s *redisStore) get(key string) int {
	ctx, cancel := s.ctx()
	defer cancel()
	n, err := s.client.Get(ctx, key).Int()
	if err != nil {
		return 0 // missing (redis.Nil) or backend error → treat as not-locked
	}
	return n
}

func (s *redisStore) del(key string) {
	ctx, cancel := s.ctx()
	defer cancel()
	_ = s.client.Del(ctx, key).Err()
}

func rateLimit(limit int, window time.Duration, keyFn func(*gin.Context) string) gin.HandlerFunc {
	return func(c *gin.Context) {
		count, err := defaultStore.incr("rl:"+keyFn(c), window)
		if err != nil {
			c.Next() // fail open on store error
			return
		}
		if count > limit {
			c.AbortWithStatusJSON(http.StatusTooManyRequests, gin.H{
				"error": gin.H{"code": "RATE_LIMITED", "message": "Terlalu banyak percobaan. Coba lagi beberapa saat."},
			})
			return
		}
		c.Next()
	}
}

// Per-email login lockout. The per-IP rate limiter cannot stop a distributed
// credential-stuffing attack that rotates source IPs against a single account,
// so we additionally throttle by email via the shared counter store.
const (
	// maxEmailLoginAttempts is how many consecutive failed logins are allowed for
	// one email before further attempts are rejected, regardless of source IP.
	maxEmailLoginAttempts = 5
	// emailLockoutWindow is how long failures are remembered / the lockout lasts.
	emailLockoutWindow = 15 * time.Minute
)

// normalizeEmailKey lower-cases and trims an email so the counter is keyed
// consistently regardless of how the client typed it.
func normalizeEmailKey(email string) string {
	return strings.ToLower(strings.TrimSpace(email))
}

func emailLockKey(email string) string {
	k := normalizeEmailKey(email)
	if k == "" {
		return ""
	}
	return "elock:" + k
}

// emailLoginLocked reports whether the email has reached the failure threshold.
func emailLoginLocked(email string) bool {
	key := emailLockKey(email)
	if key == "" {
		return false
	}
	return defaultStore.get(key) >= maxEmailLoginAttempts
}

// recordFailedLogin increments the failed-attempt counter for an email, starting
// its window on the first failure.
func recordFailedLogin(email string) {
	key := emailLockKey(email)
	if key == "" {
		return
	}
	_, _ = defaultStore.incr(key, emailLockoutWindow)
}

// resetFailedLogins clears the counter for an email after a successful login.
func resetFailedLogins(email string) {
	key := emailLockKey(email)
	if key == "" {
		return
	}
	defaultStore.del(key)
}

// emailLoginLockout wraps the login handler with a per-email failed-attempt
// guard that complements the per-IP rate limiter. It reads the email from the
// JSON body, rejects locked accounts before the handler runs, and then inspects
// the response status to record a failure or clear the counter on success.
func emailLoginLockout() gin.HandlerFunc {
	return func(c *gin.Context) {
		email := peekLoginEmail(c)
		if email != "" && emailLoginLocked(email) {
			c.AbortWithStatusJSON(http.StatusTooManyRequests, gin.H{
				"error": gin.H{"code": "ACCOUNT_LOCKED", "message": "Terlalu banyak percobaan masuk. Coba lagi nanti."},
			})
			return
		}

		c.Next()

		if email == "" {
			return
		}
		switch c.Writer.Status() {
		case http.StatusOK:
			resetFailedLogins(email)
		case http.StatusUnauthorized, http.StatusForbidden:
			recordFailedLogin(email)
		}
	}
}

// peekLoginEmail extracts the email from the login JSON body without consuming
// it, so the downstream handler can still bind the request.
func peekLoginEmail(c *gin.Context) string {
	if c.Request.Body == nil {
		return ""
	}
	raw, err := io.ReadAll(c.Request.Body)
	if err != nil {
		return ""
	}
	c.Request.Body = io.NopCloser(bytes.NewReader(raw))
	var body struct {
		Email string `json:"email"`
	}
	if err := json.Unmarshal(raw, &body); err != nil {
		return ""
	}
	return normalizeEmailKey(body.Email)
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
