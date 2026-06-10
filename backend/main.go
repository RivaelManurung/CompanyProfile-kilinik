package main

import (
	"flag"
	"log"

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
	log.Printf("Sehat Nusantara API listening on http://localhost:%s", cfg.Port)
	if err := r.Run(":" + cfg.Port); err != nil {
		log.Fatalf("fatal: server error: %v", err)
	}
}
