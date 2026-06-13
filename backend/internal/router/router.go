package router

import (
	"os"
	"time"

	"sehatnusantara/api/internal/auth"
	"sehatnusantara/api/internal/config"
	"sehatnusantara/api/internal/handlers"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// Setup builds the Gin engine with all routes and middleware.
func Setup(db *gorm.DB, cfg *config.Config) *gin.Engine {
	if cfg.IsProd() {
		gin.SetMode(gin.ReleaseMode)
	}

	r := gin.New()
	r.Use(gin.Logger(), gin.Recovery())

	r.Use(cors.New(cors.Config{
		AllowOrigins:     cfg.CORSOrigins,
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}))
	r.Use(bodyLimit())
	r.Use(mutationOriginGuard(cfg))

	h := handlers.New(db, cfg)
	authMW := auth.Middleware(cfg.JWTSecret)

	api := r.Group("/api")
	{
		api.GET("/health", h.Health)

		// Auth
		api.POST("/auth/login", rateLimit(8, 10*time.Minute, func(c *gin.Context) string {
			return "login:" + c.ClientIP()
		}), h.Login)
		api.POST("/auth/logout", h.Logout)
		api.GET("/auth/me", authMW, h.Me)

		// Public website data
		api.POST("/appointments", rateLimit(6, 10*time.Minute, func(c *gin.Context) string {
			return "appointment:" + c.ClientIP()
		}), h.CreateAppointment) // contact form
		pub := api.Group("/public")
		{
			pub.GET("/doctors", h.PublicDoctors)
			pub.GET("/services", h.PublicServices)
			pub.GET("/locations", h.PublicLocations)
			pub.GET("/promotions", h.PublicPromotions)
			pub.GET("/articles", h.PublicArticles)
			pub.GET("/articles/:slug", h.PublicArticleBySlug)
			pub.GET("/availability", h.PublicAvailability) // bookable slots per doctor+date
		}

		// Patient accounts (public booking realm, separate from admin auth)
		patientMW := auth.PatientMiddleware(cfg.JWTSecret)
		pat := api.Group("/patient")
		{
			pat.POST("/register", rateLimit(10, 10*time.Minute, func(c *gin.Context) string {
				return "preg:" + c.ClientIP()
			}), h.PatientRegister)
			pat.POST("/login", rateLimit(10, 10*time.Minute, func(c *gin.Context) string {
				return "plogin:" + c.ClientIP()
			}), h.PatientLogin)
			pat.POST("/logout", h.PatientLogout)
			pat.GET("/me", patientMW, h.PatientMe)
			pat.PUT("/me", patientMW, h.PatientUpdateProfile)
			pat.GET("/appointments", patientMW, h.PatientListAppointments)
			pat.POST("/appointments", patientMW, h.PatientCreateAppointment)
		}

		// Admin (protected)
		admin := api.Group("/admin", authMW)
		{
			admin.GET("/stats", auth.RequirePermission(auth.PermissionDashboardRead), h.Stats)
			admin.GET("/audit-logs", auth.RequirePermission(auth.PermissionAuditRead), h.ListAuditLogs)

			admin.GET("/appointments", auth.RequirePermission(auth.PermissionAppointmentsRead), h.ListAppointments)
			admin.POST("/appointments", auth.RequirePermission(auth.PermissionAppointmentsWrite), h.AdminCreateAppointment)
			admin.GET("/appointments/:id", auth.RequirePermission(auth.PermissionAppointmentsRead), h.GetAppointment)
			admin.PATCH("/appointments/:id", auth.RequirePermission(auth.PermissionAppointmentsWrite), h.UpdateAppointment)
			admin.DELETE("/appointments/:id", auth.RequirePermission(auth.PermissionAppointmentsDelete), h.DeleteAppointment)

			registerCRUD(admin, "doctors", auth.PermissionClinicRead, auth.PermissionClinicWrite, auth.PermissionClinicDelete, h.ListDoctors, h.GetDoctor, h.CreateDoctor, h.UpdateDoctor, h.DeleteDoctor)
			admin.GET("/doctors/:id/schedule", auth.RequirePermission(auth.PermissionClinicRead), h.GetDoctorSchedule)
			admin.PUT("/doctors/:id/schedule", auth.RequirePermission(auth.PermissionClinicWrite), h.UpdateDoctorSchedule)
			registerCRUD(admin, "articles", auth.PermissionContentRead, auth.PermissionContentWrite, auth.PermissionContentDelete, h.ListArticles, h.GetArticle, h.CreateArticle, h.UpdateArticle, h.DeleteArticle)
			registerCRUD(admin, "services", auth.PermissionClinicRead, auth.PermissionClinicWrite, auth.PermissionClinicDelete, h.ListServices, h.GetService, h.CreateService, h.UpdateService, h.DeleteService)
			registerCRUD(admin, "locations", auth.PermissionClinicRead, auth.PermissionClinicWrite, auth.PermissionClinicDelete, h.ListLocations, h.GetLocation, h.CreateLocation, h.UpdateLocation, h.DeleteLocation)
			registerCRUD(admin, "promotions", auth.PermissionContentRead, auth.PermissionContentWrite, auth.PermissionContentDelete, h.ListPromotions, h.GetPromotion, h.CreatePromotion, h.UpdatePromotion, h.DeletePromotion)

			// Admin user & role management (system administration)
			admin.GET("/users", auth.RequirePermission(auth.PermissionSystemRead), h.ListUsers)
			admin.POST("/users", auth.RequirePermission(auth.PermissionSystemWrite), h.CreateUser)
			admin.GET("/users/:id", auth.RequirePermission(auth.PermissionSystemRead), h.GetUser)
			admin.PUT("/users/:id", auth.RequirePermission(auth.PermissionSystemWrite), h.UpdateUser)
			admin.DELETE("/users/:id", auth.RequirePermission(auth.PermissionSystemWrite), h.DeleteUser)
			admin.GET("/roles", auth.RequirePermission(auth.PermissionSystemRead), h.ListRoles)
			admin.PUT("/roles/:key/permissions", auth.RequirePermission(auth.PermissionSystemWrite), h.UpdateRolePermissions)

			// Media upload (any authenticated admin)
			admin.POST("/upload", h.UploadFile)
		}
	}

	// Serve uploaded media. Stored under cfg.UploadDir, exposed at /uploads/...
	_ = os.MkdirAll(cfg.UploadDir, 0o755)
	r.Static("/uploads", cfg.UploadDir)

	return r
}

// registerCRUD wires the standard 5 REST routes for a resource.
func registerCRUD(g *gin.RouterGroup, name, readPermission, writePermission, deletePermission string, list, get, create, update, del gin.HandlerFunc) {
	g.GET("/"+name, auth.RequirePermission(readPermission), list)
	g.POST("/"+name, auth.RequirePermission(writePermission), create)
	g.GET("/"+name+"/:id", auth.RequirePermission(readPermission), get)
	g.PUT("/"+name+"/:id", auth.RequirePermission(writePermission), update)
	g.DELETE("/"+name+"/:id", auth.RequirePermission(deletePermission), del)
}
