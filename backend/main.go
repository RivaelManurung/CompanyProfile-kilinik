package main

import (
	"context"
	"flag"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"sehatnusantara/api/internal/config"
	"sehatnusantara/api/internal/database"
	"sehatnusantara/api/internal/router"
	"sehatnusantara/api/internal/seed"
)

func main() {
	seedOnly := flag.Bool("seed", false, "seed the database then exit")
	flag.Parse()

	cfg := config.Load()

	db, err := database.Connect(cfg.DatabaseURL)
	if err != nil {
		log.Fatalf("fatal: database connection failed: %v", err)
	}
	if err := database.Migrate(db); err != nil {
		log.Fatalf("fatal: migration failed: %v", err)
	}

	// Seeding is idempotent — safe to run on every boot.
	if err := seed.Run(db, cfg); err != nil {
		log.Fatalf("fatal: seed failed: %v", err)
	}
	if *seedOnly {
		log.Println("seed-only run finished")
		return
	}

	r := router.Setup(db, cfg)

	srv := &http.Server{
		Addr:         ":" + cfg.Port,
		Handler:      r,
		ReadTimeout:  30 * time.Second,
		WriteTimeout: 60 * time.Second,
		IdleTimeout:  120 * time.Second,
	}

	// Start server in a goroutine so we can listen for shutdown signals.
	go func() {
		log.Printf("Sehat Nusantara API listening on http://localhost:%s", cfg.Port)
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("fatal: server error: %v", err)
		}
	}()

	// Wait for SIGINT or SIGTERM (container stop, systemd, Ctrl-C).
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit
	log.Println("shutdown signal received — draining in-flight requests…")

	// Give in-flight requests 30 s to complete before forcefully closing.
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()
	if err := srv.Shutdown(ctx); err != nil {
		log.Fatalf("fatal: graceful shutdown failed: %v", err)
	}
	log.Println("server stopped cleanly")
}
