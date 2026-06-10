package seed

import (
	"log"
	"time"

	"sehatnusantara/api/internal/auth"
	"sehatnusantara/api/internal/config"
	"sehatnusantara/api/internal/models"

	"gorm.io/gorm"
)

// Run seeds the admin account and base content. It is idempotent: existing rows
// (matched by unique email/slug) are skipped.
func Run(db *gorm.DB, cfg *config.Config) error {
	if err := seedAdmin(db, cfg); err != nil {
		return err
	}
	seedDoctors(db)
	seedServices(db)
	seedLocations(db)
	seedPromotions(db)
	seedArticles(db)
	log.Println("seed: complete")
	return nil
}

func seedAdmin(db *gorm.DB, cfg *config.Config) error {
	var count int64
	db.Model(&models.Admin{}).Where("email = ?", cfg.AdminEmail).Count(&count)
	if count > 0 {
		log.Printf("seed: admin %s already exists", cfg.AdminEmail)
		return nil
	}
	hash, err := auth.HashPassword(cfg.AdminPassword)
	if err != nil {
		return err
	}
	admin := models.Admin{Name: cfg.AdminName, Email: cfg.AdminEmail, PasswordHash: hash, Role: auth.RoleSuperAdmin}
	if err := db.Create(&admin).Error; err != nil {
		return err
	}
	log.Printf("seed: created admin %s", cfg.AdminEmail)
	return nil
}

func upsertBySlug[T any](db *gorm.DB, slug string, row *T) {
	var count int64
	db.Model(row).Where("slug = ?", slug).Count(&count)
	if count == 0 {
		db.Create(row)
	}
}

func seedDoctors(db *gorm.DB) {
	doctors := []models.Doctor{
		{Slug: "agnes-pratiwi", Name: "dr. Agnes Pratiwi, Sp.PD", Specialty: "Penyakit Dalam", Experience: "12 tahun", ImageURL: "/doctors/agnes-pratiwi.jpg", Accent: "from-primary-400 to-primary-600", OrderIndex: 1, Active: true},
		{Slug: "yoga-kurniawan", Name: "dr. Yoga D. S. Kurniawan", Specialty: "Dokter Umum", Experience: "8 tahun", ImageURL: "/doctors/yoga-kurniawan.jpg", Accent: "from-accent-400 to-accent-600", OrderIndex: 2, Active: true},
		{Slug: "siti-rahmadani", Name: "dr. Siti Rahmadani, Sp.A", Specialty: "Spesialis Anak", Experience: "10 tahun", ImageURL: "/doctors/siti-rahmadani.jpg", Accent: "from-primary-500 to-accent-500", OrderIndex: 3, Active: true},
		{Slug: "bayu-santoso", Name: "dr. Bayu Santoso, Sp.B", Specialty: "Bedah Umum", Experience: "15 tahun", ImageURL: "/doctors/bayu-santoso.jpg", Accent: "from-accent-500 to-primary-600", OrderIndex: 4, Active: true},
		{Slug: "maria-lestari", Name: "dr. Maria Lestari, Sp.OG", Specialty: "Kebidanan & Kandungan", Experience: "11 tahun", ImageURL: "/doctors/maria-lestari.jpg", Accent: "from-primary-400 to-accent-500", OrderIndex: 5, Active: true},
		{Slug: "rendra-wijaya", Name: "dr. Rendra Wijaya, Sp.KK", Specialty: "Kulit & Kelamin", Experience: "9 tahun", ImageURL: "/doctors/rendra-wijaya.jpg", Accent: "from-accent-400 to-primary-500", OrderIndex: 6, Active: true},
	}
	for i := range doctors {
		upsertBySlug(db, doctors[i].Slug, &doctors[i])
	}
}

func seedServices(db *gorm.DB) {
	services := []models.Service{
		{Slug: "konsultasi", Title: "Konsultasi Primer", Short: "Dokter umum & spesialis siap mendampingi keluhan Anda.", Description: "Layanan konsultasi dokter umum dan spesialis dengan pendekatan personal.", Icon: "Stethoscope", Points: []string{"Dokter umum & spesialis", "Telekonsultasi tersedia", "Rekam medis digital"}, OrderIndex: 1},
		{Slug: "vaksinasi", Title: "Program Vaksinasi", Short: "Imunisasi anak, dewasa, perjalanan, hingga vaksin haji & umroh.", Description: "Program vaksinasi lengkap untuk segala usia.", Icon: "Syringe", Points: []string{"Imunisasi anak & dewasa", "Vaksin perjalanan", "Sertifikat resmi"}, OrderIndex: 2},
		{Slug: "farmasi", Title: "Farmasi Ritel", Short: "Apotek lengkap dengan apoteker yang siap berkonsultasi.", Description: "Apotek dengan ketersediaan obat lengkap dan apoteker berpengalaman.", Icon: "Pill", Points: []string{"Obat resep & bebas", "Konsultasi apoteker", "Antar obat"}, OrderIndex: 3},
		{Slug: "medical-check-up", Title: "Medical Check-Up", Short: "Paket skrining kesehatan untuk individu, pasangan, & korporat.", Description: "Paket medical check-up komprehensif dengan laboratorium terintegrasi.", Icon: "ClipboardCheck", Points: []string{"Paket individu & korporat", "Hasil cepat & akurat", "Konsultasi hasil"}, OrderIndex: 4},
		{Slug: "bedah-minor", Title: "Bedah Minor", Short: "Tindakan bedah ringan dengan standar sterilitas tinggi.", Description: "Tindakan bedah minor seperti pengangkatan kista, lipoma, dan penjahitan luka.", Icon: "Scissors", Points: []string{"Tindakan steril", "Pemulihan nyaman", "Dokter berpengalaman"}, OrderIndex: 5},
		{Slug: "terapi-tertarget", Title: "Terapi Tertarget", Short: "Program terapi IV, GERD, dan pemulihan yang dipersonalisasi.", Description: "Program terapi tertarget termasuk IV therapy dan penanganan GERD.", Icon: "Activity", Points: []string{"IV therapy", "Penanganan GERD", "Program dipersonalisasi"}, OrderIndex: 6},
	}
	for i := range services {
		upsertBySlug(db, services[i].Slug, &services[i])
	}
}

func seedLocations(db *gorm.DB) {
	locations := []models.Location{
		{Slug: "thamrin", Name: "Sehat Nusantara — Thamrin", Area: "Jakarta Pusat", Address: "Sinarmas Land Plaza Tower 1, Lt. 10, Jl. M.H. Thamrin No. 51", Hours: "Senin–Sabtu, 08.00–20.00", Phone: "+62 21 5050 1234", Lat: -6.1936, Lng: 106.8229},
		{Slug: "menteng", Name: "Sehat Nusantara — Menteng", Area: "Jakarta Pusat", Address: "Jl. H.O.S. Cokroaminoto No. 12, Menteng", Hours: "Senin–Sabtu, 08.00–20.00", Phone: "+62 21 5050 2345", Lat: -6.1975, Lng: 106.8305},
		{Slug: "kebayoran", Name: "Sehat Nusantara — Kebayoran", Area: "Jakarta Selatan", Address: "Jl. Senopati Raya No. 88, Kebayoran Baru", Hours: "Senin–Minggu, 08.00–21.00", Phone: "+62 21 5050 3456", Lat: -6.2297, Lng: 106.8106},
		{Slug: "tb-simatupang", Name: "Sehat Nusantara — TB Simatupang", Area: "Jakarta Selatan", Address: "South Quarter Tower B, Lt. 3, Jl. R.A. Kartini Kav. 8", Hours: "Senin–Sabtu, 08.00–20.00", Phone: "+62 21 5050 4567", Lat: -6.2899, Lng: 106.8194},
	}
	for i := range locations {
		upsertBySlug(db, locations[i].Slug, &locations[i])
	}
}

func seedPromotions(db *gorm.DB) {
	promos := []models.Promotion{
		{Slug: "iv-therapy-gerd", Title: "IV Therapy untuk GERD", Tag: "Hemat 20%", Price: "Rp 480.000", OldPrice: "Rp 600.000", Desc: "Bantu redakan gejala GERD dengan terapi cairan yang menutrisi tubuh.", Active: true},
		{Slug: "mcu-berpasangan", Title: "Skrining Kesehatan Berpasangan", Tag: "Paket Berdua", Price: "Rp 1.350.000", OldPrice: "Rp 1.700.000", Desc: "Periksa kesehatan bersama pasangan dengan rangkaian tes menyeluruh.", Active: true},
		{Slug: "vaksin-flu-pneumonia", Title: "Vaksin Flu & Pneumonia", Tag: "Bundling", Price: "Rp 950.000", OldPrice: "Rp 1.150.000", Desc: "Lindungi diri dari infeksi saluran napas dengan paket dua vaksin.", Active: true},
	}
	for i := range promos {
		upsertBySlug(db, promos[i].Slug, &promos[i])
	}
}

func seedArticles(db *gorm.DB) {
	base := time.Date(2026, 5, 28, 9, 0, 0, 0, time.UTC)
	articles := []models.Article{
		{Slug: "memahami-pcos", Title: "Memahami PCOS: Gejala, Penyebab, dan Penanganannya", Excerpt: "Polycystic Ovary Syndrome memengaruhi banyak perempuan usia produktif. Kenali tanda-tandanya sejak dini.", Category: "Kesehatan Wanita", ReadMins: 5, Published: true, PublishedAt: base},
		{Slug: "garam-dan-eksim", Title: "Hubungan Asupan Garam dengan Kondisi Eksim", Excerpt: "Penelitian terbaru menunjukkan asupan garam berlebih dapat memperburuk peradangan kulit.", Category: "Dermatologi", ReadMins: 4, Published: true, PublishedAt: base.AddDate(0, 0, -7)},
		{Slug: "medical-check-up-visa-pelajar", Title: "Persiapan Medical Check-Up untuk Visa Pelajar", Excerpt: "Akan studi ke luar negeri? Pahami komponen pemeriksaan kesehatan yang umumnya dibutuhkan.", Category: "Medical Check-Up", ReadMins: 6, Published: true, PublishedAt: base.AddDate(0, 0, -14)},
		{Slug: "kesehatan-dan-pakaian-dalam", Title: "Pilihan Pakaian Dalam dan Dampaknya bagi Kesehatan", Excerpt: "Bahan dan ukuran pakaian dalam ternyata berpengaruh pada kesehatan area intim.", Category: "Gaya Hidup", ReadMins: 4, Published: true, PublishedAt: base.AddDate(0, 0, -21)},
		{Slug: "kapan-waktu-tepat-ortodonti", Title: "Kapan Waktu yang Tepat untuk Perawatan Ortodonti?", Excerpt: "Pemasangan behel tidak hanya soal estetika. Pahami waktu ideal untuk hasil yang optimal.", Category: "Gigi & Mulut", ReadMins: 5, Published: true, PublishedAt: base.AddDate(0, 0, -28)},
		{Slug: "mengelola-gerd", Title: "Strategi Mengelola GERD agar Tak Mudah Kambuh", Excerpt: "Dari pola makan hingga manajemen stres, ini langkah praktis menjaga GERD tetap terkendali.", Category: "Penyakit Dalam", ReadMins: 6, Published: true, PublishedAt: base.AddDate(0, 0, -35)},
	}
	for i := range articles {
		upsertBySlug(db, articles[i].Slug, &articles[i])
	}
}
