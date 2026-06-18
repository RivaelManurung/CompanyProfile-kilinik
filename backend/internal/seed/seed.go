package seed

import (
	"fmt"
	"log"
	"os"
	"time"

	"sehatnusantara/api/internal/auth"
	"sehatnusantara/api/internal/config"
	"sehatnusantara/api/internal/models"

	"gorm.io/gorm"
)

const seedTotal = 100

var (
	firstNames = []string{"Aditya", "Bunga", "Citra", "Dimas", "Eka", "Farah", "Galih", "Hana", "Indra", "Jihan", "Kirana", "Lukman", "Maya", "Nadia", "Oscar", "Putri", "Raka", "Salsa", "Teguh", "Vina"}
	lastNames  = []string{"Pratama", "Lestari", "Wijaya", "Santoso", "Rahmawati", "Kurniawan", "Permata", "Saputra", "Mahendra", "Utami", "Halim", "Anindya", "Syahputra", "Nugroho", "Azzahra", "Wibowo", "Siregar", "Hartono", "Fauzi", "Maharani"}
)

// Run seeds production-grade demo content. It is idempotent: rows are matched by
// stable email, slug, or generated business keys before being inserted.
func Run(db *gorm.DB, cfg *config.Config) error {
	if err := seedAdmin(db, cfg); err != nil {
		return err
	}
	seedStaff(db)
	seedDoctors(db)
	seedServices(db)
	seedLocations(db)
	seedPromotions(db)
	seedArticles(db)
	seedAppointments(db)
	seedAuditLogs(db)
	seedRolePermissions(db)
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
	admin := models.Admin{Name: cfg.AdminName, Email: cfg.AdminEmail, PasswordHash: hash, Role: auth.RoleSuperAdmin, Active: true}
	if err := db.Create(&admin).Error; err != nil {
		return err
	}
	log.Printf("seed: created admin %s", cfg.AdminEmail)
	return nil
}

func seedStaff(db *gorm.DB) {
	// Demo-only password: never called in production (guarded by Run's prod check in main).
	// Use SEED_STAFF_PASSWORD env var if set, otherwise fall back to a safe demo default.
	staffPwd := os.Getenv("SEED_STAFF_PASSWORD")
	if staffPwd == "" {
		staffPwd = "StaffDemo#12345"
	}
	hash, err := auth.HashPassword(staffPwd)
	if err != nil {
		return
	}
	roles := []string{auth.RoleSuperAdmin, auth.RoleClinicAdmin, auth.RoleReceptionist, auth.RoleContentEditor, auth.RoleViewer}
	for i := 1; i <= seedTotal; i++ {
		name := fullName(i)
		email := fmt.Sprintf("staff%03d@sehatnusantara.id", i)
		lastLogin := time.Now().Add(-time.Duration(i*9) * time.Hour)
		row := models.Admin{
			Name:         name,
			Email:        email,
			PasswordHash: hash,
			Role:         roles[(i-1)%len(roles)],
			Phone:        fmt.Sprintf("+62 811 10%03d %03d", i%1000, (i*37)%1000),
			AvatarURL:    fmt.Sprintf("https://ui-avatars.com/api/?name=%s&background=0E7490&color=fff", name),
			Active:       i%13 != 0,
			LastLoginAt:  &lastLogin,
		}
		upsertAdminByEmail(db, email, &row)
	}
}

func upsertAdminByEmail(db *gorm.DB, email string, row *models.Admin) {
	var count int64
	db.Model(&models.Admin{}).Where("email = ?", email).Count(&count)
	if count == 0 {
		db.Create(row)
	}
}

func upsertBySlug[T any](db *gorm.DB, slug string, row *T) {
	var count int64
	db.Model(row).Where("slug = ?", slug).Count(&count)
	if count == 0 {
		db.Create(row)
	}
}

func seedDoctors(db *gorm.DB) {
	specialties := []string{"Dokter Umum", "Penyakit Dalam", "Spesialis Anak", "Kebidanan & Kandungan", "Dermatologi", "Bedah Umum", "Gigi & Mulut", "Kardiologi", "THT", "Neurologi"}
	images := []string{"/doctors/agnes-pratiwi.jpg", "/doctors/yoga-kurniawan.jpg", "/doctors/siti-rahmadani.jpg", "/doctors/bayu-santoso.jpg", "/doctors/maria-lestari.jpg", "/doctors/rendra-wijaya.jpg"}
	accents := []string{"from-primary-400 to-primary-600", "from-accent-400 to-accent-600", "from-primary-500 to-accent-500", "from-accent-500 to-primary-600"}
	for i := 1; i <= seedTotal; i++ {
		name := doctorName(i)
		row := models.Doctor{
			Slug:       fmt.Sprintf("dokter-%03d-%s", i, slugName(name)),
			Name:       name,
			Specialty:  specialties[(i-1)%len(specialties)],
			Experience: fmt.Sprintf("%d tahun", 4+(i%22)),
			ImageURL:   images[(i-1)%len(images)],
			Accent:     accents[(i-1)%len(accents)],
			OrderIndex: i,
			Active:     i%11 != 0,
		}
		upsertBySlug(db, row.Slug, &row)
	}
}

func seedServices(db *gorm.DB) {
	catalog := []struct {
		title string
		icon  string
	}{
		{"Konsultasi Primer", "Stethoscope"}, {"Program Vaksinasi", "Syringe"}, {"Farmasi Ritel", "Pill"},
		{"Medical Check-Up", "ClipboardCheck"}, {"Bedah Minor", "Scissors"}, {"Terapi Tertarget", "Activity"},
		{"Klinik Anak", "Baby"}, {"Kesehatan Jantung", "HeartPulse"}, {"Laboratorium", "Microscope"}, {"Layanan Gawat Darurat", "Ambulance"},
	}
	for i := 1; i <= seedTotal; i++ {
		item := catalog[(i-1)%len(catalog)]
		focus := serviceFocus(i)
		row := models.Service{
			Slug:        fmt.Sprintf("%s-%03d", slugText(item.title), i),
			Title:       fmt.Sprintf("%s %s", item.title, focus),
			Short:       fmt.Sprintf("Layanan %s dengan alur klinis jelas, tenaga medis terlatih, dan tindak lanjut yang terdokumentasi.", focus),
			Description: fmt.Sprintf("Program %s dirancang untuk pasien individu, keluarga, dan korporat yang membutuhkan layanan kesehatan yang rapi dari pendaftaran sampai evaluasi hasil. Setiap kunjungan dibantu oleh tim front office, perawat, dokter, dan apoteker bila diperlukan, sehingga pasien mendapat arahan yang konsisten dan mudah dipahami.", focus),
			Icon:        item.icon,
			Points:      []string{"Skrining awal terstruktur", "Rekam medis digital", "Edukasi dan tindak lanjut", "Pilihan jadwal fleksibel"},
			OrderIndex:  i,
		}
		upsertBySlug(db, row.Slug, &row)
	}
}

func seedLocations(db *gorm.DB) {
	areas := []struct {
		city string
		lat  float64
		lng  float64
	}{
		{"Jakarta Pusat", -6.1936, 106.8229}, {"Jakarta Selatan", -6.2297, 106.8106}, {"Jakarta Barat", -6.1683, 106.7588},
		{"Jakarta Timur", -6.2250, 106.9004}, {"Jakarta Utara", -6.1384, 106.8639}, {"Tangerang Selatan", -6.2886, 106.7179},
		{"Bekasi", -6.2383, 106.9756}, {"Depok", -6.4025, 106.7942}, {"Bogor", -6.5950, 106.8166}, {"Bandung", -6.9175, 107.6191},
	}
	for i := 1; i <= seedTotal; i++ {
		area := areas[(i-1)%len(areas)]
		row := models.Location{
			Slug:    fmt.Sprintf("cabang-%03d-%s", i, slugText(area.city)),
			Name:    fmt.Sprintf("Sehat Nusantara %s %03d", area.city, i),
			Area:    area.city,
			Address: fmt.Sprintf("Jl. Kesehatan Raya No. %d, Gedung Medika Lt. %d, %s", 10+i, 1+(i%8), area.city),
			Hours:   clinicHours(i),
			Phone:   fmt.Sprintf("+62 21 5050 %04d", 1000+i),
			Lat:     area.lat + float64(i%9)*0.0021,
			Lng:     area.lng + float64(i%7)*0.0023,
		}
		upsertBySlug(db, row.Slug, &row)
	}
}

func seedPromotions(db *gorm.DB) {
	types := []string{"discount", "bundle", "seasonal", "new_patient", "wellness"}
	statuses := []string{"active", "scheduled", "active", "expired", "hidden"}
	for i := 1; i <= seedTotal; i++ {
		focus := promoFocus(i)
		status := statuses[(i-1)%len(statuses)]
		active := status == "active"
		start := time.Date(2026, time.Month(1+(i%12)), 1+(i%20), 0, 0, 0, 0, time.UTC)
		end := start.AddDate(0, 2+(i%4), 10)
		price := 250000 + (i * 37500)
		row := models.Promotion{
			Slug:            fmt.Sprintf("promo-%03d-%s", i, slugText(focus)),
			Title:           fmt.Sprintf("Paket %s Hemat %d%%", focus, 10+(i%35)),
			Tag:             fmt.Sprintf("Hemat %d%%", 10+(i%35)),
			Price:           rupiah(price),
			OldPrice:        rupiah(price + 150000 + (i * 10000)),
			Desc:            fmt.Sprintf("Penawaran terbatas untuk %s dengan jadwal fleksibel, edukasi medis, dan alur klaim administrasi yang dibantu staf klinik.", focus),
			Active:          active,
			Status:          status,
			CampaignType:    types[(i-1)%len(types)],
			StartDate:       start.Format("2006-01-02"),
			EndDate:         end.Format("2006-01-02"),
			CoverImage:      fmt.Sprintf("/hero/slide-%s.jpg", promoImage(i)),
			Terms:           "Reservasi wajib dilakukan sebelum kunjungan. Harga belum termasuk tindakan tambahan di luar paket. Promo tidak dapat digabung dengan program diskon lain kecuali tercantum dalam perjanjian kerja sama.",
			FullDescription: fmt.Sprintf("Paket %s dibuat untuk pasien yang ingin mendapatkan layanan preventif dan kuratif dengan biaya lebih terukur. Tim klinik akan membantu memilih jadwal, memverifikasi kebutuhan medis, menjelaskan komponen paket, dan memberikan arahan setelah layanan selesai.", focus),
			TargetAudience:  targetAudience(i),
			AccentColor:     accentColor(i),
			Currency:        "IDR",
			PriceNote:       "Harga dapat berubah mengikuti ketersediaan stok dan evaluasi dokter.",
			Featured:        i%8 == 0,
			DisplayOrder:    i,
			MaxClaims:       80 + i*3,
			TotalClaims:     (i * 7) % (80 + i*3),
		}
		upsertBySlug(db, row.Slug, &row)
	}
}

func seedArticles(db *gorm.DB) {
	base := time.Date(2026, 6, 1, 9, 0, 0, 0, time.UTC)
	statuses := []string{"published", "published", "published", "draft", "scheduled", "archived"}
	for i := 1; i <= seedTotal; i++ {
		topic := articleTopic(i)
		status := statuses[(i-1)%len(statuses)]
		published := status == "published"
		publishedAt := base.AddDate(0, 0, -i)
		row := models.Article{
			Slug:           fmt.Sprintf("panduan-%03d-%s", i, slugText(topic.title)),
			Title:          topic.title,
			Excerpt:        topic.excerpt,
			Category:       topic.category,
			Content:        longArticleContent(topic, i),
			ReadMins:       9 + (i % 8),
			Published:      published,
			PublishedAt:    publishedAt,
			Status:         status,
			ScheduledAt:    scheduledAt(status, publishedAt),
			CoverImage:     fmt.Sprintf("/hero/slide-%s.jpg", promoImage(i)),
			Tags:           topic.tags,
			Author:         articleAuthor(i),
			Featured:       i%10 == 0,
			SeoTitle:       fmt.Sprintf("%s | Klinik Sehat Nusantara", topic.title),
			SeoDescription: topic.excerpt,
			OgImage:        fmt.Sprintf("/hero/slide-%s.jpg", promoImage(i)),
			CanonicalURL:   fmt.Sprintf("https://sehatnusantara.id/artikel/panduan-%03d-%s", i, slugText(topic.title)),
			FocusKeyword:   topic.keyword,
		}
		upsertBySlug(db, row.Slug, &row)
	}
}

func seedAppointments(db *gorm.DB) {
	statuses := []string{"pending", "confirmed", "done", "cancelled"}
	sources := []string{"website", "whatsapp", "phone", "admin"}
	for i := 1; i <= seedTotal; i++ {
		email := fmt.Sprintf("pasien%03d@example.com", i)
		var count int64
		db.Model(&models.Appointment{}).Where("email = ?", email).Count(&count)
		if count > 0 {
			continue
		}
		created := time.Now().Add(-time.Duration(i*6) * time.Hour)
		appointment := created.AddDate(0, 0, 1+(i%21))
		row := models.Appointment{
			Name:            fullName(i + 33),
			Phone:           fmt.Sprintf("+62 812 %04d %04d", 2000+i, 5000+i),
			Email:           email,
			Service:         serviceFocus(i),
			Doctor:          doctorName(i),
			PatientType:     patientType(i),
			Source:          sources[(i-1)%len(sources)],
			AppointmentDate: appointment.Format("2006-01-02"),
			AppointmentTime: fmt.Sprintf("%02d:%02d", 8+(i%10), (i%4)*15),
			Message:         fmt.Sprintf("Pasien ingin konsultasi terkait %s. Mohon dibantu konfirmasi estimasi durasi layanan, persiapan sebelum datang, dan opsi pembayaran cashless bila tersedia.", serviceFocus(i)),
			Status:          statuses[(i-1)%len(statuses)],
			CreatedAt:       created,
		}
		db.Create(&row)
	}
}

func seedAuditLogs(db *gorm.DB) {
	actions := []string{"create", "update", "publish", "archive", "login", "export", "delete", "restore"}
	resources := []string{"articles", "appointments", "doctors", "services", "locations", "promotions", "users", "roles"}
	for i := 1; i <= seedTotal; i++ {
		resourceID := fmt.Sprintf("seed-%03d", i)
		adminEmail := fmt.Sprintf("staff%03d@sehatnusantara.id", 1+((i-1)%seedTotal))
		action := actions[(i-1)%len(actions)]
		resource := resources[(i-1)%len(resources)]
		var count int64
		db.Model(&models.AuditLog{}).Where("admin_email = ? AND action = ? AND resource = ? AND resource_id = ?", adminEmail, action, resource, resourceID).Count(&count)
		if count > 0 {
			continue
		}
		row := models.AuditLog{
			AdminID:    fmt.Sprintf("%d", 1+((i-1)%seedTotal)),
			AdminEmail: adminEmail,
			Action:     action,
			Resource:   resource,
			ResourceID: resourceID,
			IP:         fmt.Sprintf("10.20.%d.%d", i%20, 20+(i%200)),
			UserAgent:  "Mozilla/5.0 (Production Seed) SehatNusantaraAdmin/1.0",
			CreatedAt:  time.Now().Add(-time.Duration(i*45) * time.Minute),
		}
		db.Create(&row)
	}
}

type articleSeed struct {
	title    string
	excerpt  string
	category string
	keyword  string
	tags     []string
}

func articleTopic(i int) articleSeed {
	topics := []articleSeed{
		{"Panduan Medical Check-Up Tahunan untuk Keluarga Aktif", "Medical check-up tahunan membantu keluarga memahami risiko kesehatan sejak dini dan menyusun langkah pencegahan yang realistis.", "Medical Check-Up", "medical check-up tahunan", []string{"medical check-up", "skrining", "keluarga"}},
		{"Cara Mengelola GERD saat Jadwal Kerja Padat", "GERD sering kambuh ketika pola makan, stres, dan jam tidur tidak terkendali. Kenali strategi praktis agar keluhan lebih mudah dikendalikan.", "Penyakit Dalam", "mengelola GERD", []string{"GERD", "pencernaan", "gaya hidup"}},
		{"Vaksinasi Dewasa yang Sering Terlupakan", "Vaksin bukan hanya untuk anak. Orang dewasa tetap memerlukan perlindungan sesuai usia, pekerjaan, perjalanan, dan kondisi medis tertentu.", "Vaksinasi", "vaksinasi dewasa", []string{"vaksin", "imunisasi", "dewasa"}},
		{"Kapan Anak Perlu Dibawa ke Dokter Spesialis Anak", "Tidak semua keluhan anak cukup ditangani sendiri di rumah. Pahami tanda yang membutuhkan pemeriksaan dokter agar penanganan tidak terlambat.", "Kesehatan Anak", "dokter spesialis anak", []string{"anak", "demam", "tumbuh kembang"}},
		{"Eksim dan Kulit Sensitif: Perawatan Harian yang Aman", "Kulit sensitif membutuhkan rutinitas yang konsisten, pemilihan produk yang tepat, dan evaluasi pemicu agar peradangan tidak berulang.", "Dermatologi", "perawatan eksim", []string{"eksim", "kulit sensitif", "dermatologi"}},
		{"Persiapan Vaksinasi Haji dan Umroh", "Calon jamaah perlu memahami jenis vaksin, jadwal pemberian, dokumen, dan kondisi tubuh sebelum menjalani perjalanan ibadah.", "Kesehatan Perjalanan", "vaksin haji umroh", []string{"haji", "umroh", "vaksin perjalanan"}},
		{"Membaca Hasil Laboratorium Tanpa Panik", "Hasil laboratorium perlu dilihat bersama riwayat kesehatan, gejala, obat yang dikonsumsi, dan pemeriksaan fisik, bukan dari satu angka saja.", "Laboratorium", "hasil laboratorium", []string{"laboratorium", "diagnostik", "skrining"}},
		{"Kesehatan Jantung untuk Usia Produktif", "Risiko penyakit jantung dapat mulai terbentuk sejak usia produktif melalui kebiasaan makan, aktivitas fisik, tidur, dan stres harian.", "Kardiologi", "kesehatan jantung", []string{"jantung", "kolesterol", "tekanan darah"}},
		{"Panduan Aman Bedah Minor di Klinik", "Tindakan bedah minor tetap membutuhkan evaluasi dokter, sterilitas, edukasi luka, dan kontrol pascatindakan yang jelas.", "Bedah Minor", "bedah minor", []string{"bedah minor", "luka", "steril"}},
		{"Manajemen Stres dan Dampaknya pada Daya Tahan Tubuh", "Stres kronis dapat memengaruhi tidur, pola makan, tekanan darah, dan daya tahan tubuh. Pendekatan bertahap membantu tubuh pulih lebih stabil.", "Gaya Hidup", "manajemen stres", []string{"stres", "imunitas", "tidur"}},
	}
	topic := topics[(i-1)%len(topics)]
	round := 1 + ((i - 1) / len(topics))
	if round > 1 {
		topic.title = fmt.Sprintf("%s: Seri %02d", topic.title, round)
	}
	return topic
}

func longArticleContent(topic articleSeed, i int) string {
	return fmt.Sprintf(`# %s

%s Artikel ini disusun sebagai materi edukasi klinik untuk membantu pasien memahami konteks kesehatan secara lebih utuh sebelum mengambil keputusan. Informasi di dalamnya tidak menggantikan konsultasi dokter, tetapi dapat menjadi bekal agar diskusi dengan tenaga kesehatan berjalan lebih terarah.

## Mengapa Topik Ini Penting

Dalam praktik sehari-hari, banyak pasien datang ketika keluhan sudah mengganggu aktivitas, padahal tanda awal sering muncul jauh lebih cepat. Pada topik %s, keterlambatan memahami gejala dapat membuat pasien melewatkan kesempatan untuk melakukan pencegahan sederhana. Pemeriksaan yang dilakukan lebih awal biasanya memberi ruang lebih luas untuk memilih terapi, mengatur kebiasaan, dan mengevaluasi faktor risiko keluarga.

Klinik juga melihat bahwa pasien membutuhkan bahasa yang jelas. Istilah medis yang rumit sering membuat orang menunda bertanya, mencari jawaban dari sumber yang tidak terverifikasi, atau mencoba obat tanpa arahan. Karena itu, edukasi yang baik harus menjelaskan apa yang perlu diamati, kapan harus mencari bantuan, dan tindakan apa yang realistis dilakukan di rumah.

## Tanda dan Kondisi yang Perlu Diperhatikan

Perhatikan perubahan yang menetap, berulang, atau semakin berat. Catat kapan keluhan muncul, seberapa sering terjadi, makanan atau aktivitas yang mendahului, obat yang sedang dikonsumsi, serta riwayat penyakit dalam keluarga. Catatan sederhana seperti ini membantu dokter melihat pola yang kadang tidak tampak saat konsultasi singkat.

Untuk sebagian orang, keluhan ringan dapat membaik dengan perubahan gaya hidup. Namun konsultasi sebaiknya tidak ditunda bila keluhan disertai nyeri hebat, sesak, demam tinggi, penurunan berat badan tanpa sebab jelas, perdarahan, dehidrasi, gangguan kesadaran, atau keluhan yang mengganggu kerja dan tidur. Pada kelompok anak, lansia, ibu hamil, dan pasien dengan penyakit kronis, ambang untuk memeriksakan diri perlu lebih rendah.

## Pemeriksaan di Klinik

Alur pemeriksaan biasanya dimulai dari anamnesis, yaitu percakapan terarah mengenai keluhan dan riwayat kesehatan. Dokter kemudian melakukan pemeriksaan fisik sesuai kebutuhan. Bila diperlukan, pasien dapat direkomendasikan menjalani pemeriksaan laboratorium, pencitraan, elektrokardiografi, tindakan minor, atau rujukan ke dokter spesialis.

Di Klinik Sehat Nusantara, hasil pemeriksaan dijelaskan dengan bahasa yang mudah dipahami. Pasien akan mendapatkan ringkasan masalah, pilihan penanganan, manfaat dan keterbatasan setiap opsi, serta rencana kontrol. Pendekatan ini penting karena keputusan medis yang baik bukan hanya tentang menemukan diagnosis, tetapi juga memastikan pasien paham langkah berikutnya.

## Langkah Pencegahan yang Realistis

Pencegahan tidak harus ekstrem. Mulailah dari kebiasaan yang paling mungkin dipertahankan: tidur cukup, makan lebih teratur, memperbanyak air putih, mengurangi rokok dan alkohol, bergerak minimal tiga puluh menit sehari, serta mengelola stres dengan jeda yang terencana. Bila pasien memiliki faktor risiko tertentu, jadwal skrining dapat dibuat lebih personal.

Untuk topik %s, perubahan kecil yang konsisten sering lebih bermanfaat daripada perubahan besar yang hanya bertahan beberapa hari. Pasien dianjurkan membuat target mingguan, mengevaluasi hambatan, dan melibatkan keluarga bila membutuhkan dukungan. Tim klinik dapat membantu menyusun target yang sesuai usia, pekerjaan, dan kondisi medis.

## Kesalahan Umum yang Sebaiknya Dihindari

Kesalahan yang sering terjadi adalah menghentikan obat tanpa konsultasi, mengganti terapi dengan suplemen yang belum jelas manfaatnya, menunda kontrol karena gejala sementara membaik, atau membandingkan kondisi diri dengan pengalaman orang lain. Setiap pasien memiliki riwayat, faktor risiko, dan toleransi terapi yang berbeda.

Pasien juga perlu berhati-hati terhadap informasi kesehatan yang terlalu menjanjikan hasil cepat. Klaim seperti sembuh permanen tanpa pemeriksaan, terapi pasti cocok untuk semua orang, atau paket pengobatan tanpa evaluasi dokter sebaiknya dipertanyakan. Informasi yang bertanggung jawab biasanya menjelaskan manfaat sekaligus batasannya.

## Kapan Harus Konsultasi

Jadwalkan konsultasi bila keluhan berlangsung lebih dari beberapa hari, sering kambuh, memerlukan obat berulang, atau membuat Anda khawatir. Konsultasi juga dianjurkan sebelum menjalani vaksinasi tertentu, medical check-up khusus, perjalanan jauh, program kehamilan, operasi kecil, atau perubahan terapi jangka panjang.

Membawa data pendukung akan mempercepat evaluasi. Siapkan daftar obat, alergi, hasil laboratorium terdahulu, riwayat rawat inap, catatan tekanan darah atau gula darah bila ada, dan pertanyaan yang ingin dibahas. Dengan persiapan ini, waktu konsultasi dapat digunakan untuk mengambil keputusan yang lebih tepat.

## Penutup

%s Tujuan utama edukasi kesehatan adalah membantu pasien merasa lebih siap, bukan membuat pasien mendiagnosis diri sendiri. Bila Anda membutuhkan arahan yang spesifik, tim medis Klinik Sehat Nusantara siap membantu melalui konsultasi langsung, layanan telekonsultasi, dan rencana tindak lanjut yang terdokumentasi.
`, topic.title, topic.excerpt, topic.keyword, topic.keyword, topic.excerpt)
}

func fullName(i int) string {
	return fmt.Sprintf("%s %s", firstNames[(i-1)%len(firstNames)], lastNames[(i*3-1)%len(lastNames)])
}

func doctorName(i int) string {
	prefixes := []string{"dr.", "drg."}
	suffixes := []string{"", "Sp.PD", "Sp.A", "Sp.OG", "Sp.KK", "Sp.B", "Sp.JP", "M.Kes"}
	name := fmt.Sprintf("%s %s", prefixes[i%len(prefixes)], fullName(i+7))
	if suffix := suffixes[(i-1)%len(suffixes)]; suffix != "" {
		name = fmt.Sprintf("%s, %s", name, suffix)
	}
	return name
}

func serviceFocus(i int) string {
	values := []string{"Konsultasi Keluarga", "Skrining Diabetes", "Vaksinasi Dewasa", "Kesehatan Anak", "Pemeriksaan Jantung", "Terapi GERD", "Perawatan Luka", "Kesehatan Kulit", "Program Korporat", "Konsultasi Gizi"}
	return values[(i-1)%len(values)]
}

func promoFocus(i int) string {
	values := []string{"Medical Check-Up", "Vaksinasi Keluarga", "IV Therapy", "Konsultasi Spesialis", "Skrining Jantung", "Paket Anak Sehat", "Perawatan Kulit", "Bedah Minor", "Program Korporat", "Kesehatan Perjalanan"}
	return values[(i-1)%len(values)]
}

func clinicHours(i int) string {
	if i%5 == 0 {
		return "Senin-Minggu, 08.00-21.00"
	}
	return "Senin-Sabtu, 08.00-20.00"
}

func promoImage(i int) string {
	images := []string{"cashless", "vaccine", "corporate", "facility"}
	return images[(i-1)%len(images)]
}

func targetAudience(i int) string {
	values := []string{"Pasien dewasa", "Keluarga muda", "Karyawan korporat", "Calon jamaah", "Pasien kontrol rutin", "Pasien baru"}
	return values[(i-1)%len(values)]
}

func accentColor(i int) string {
	values := []string{"#0E7490", "#16A34A", "#2563EB", "#DC2626", "#7C3AED", "#EA580C"}
	return values[(i-1)%len(values)]
}

func patientType(i int) string {
	if i%3 == 0 {
		return "returning"
	}
	return "new"
}

func articleAuthor(i int) string {
	authors := []string{"Tim Medis Sehat Nusantara", "dr. Agnes Pratiwi, Sp.PD", "dr. Siti Rahmadani, Sp.A", "dr. Rendra Wijaya, Sp.KK", "Editor Klinis Sehat Nusantara"}
	return authors[(i-1)%len(authors)]
}

func scheduledAt(status string, publishedAt time.Time) string {
	if status == "scheduled" {
		return publishedAt.AddDate(0, 1, 0).Format(time.RFC3339)
	}
	return ""
}

func rupiah(amount int) string {
	raw := fmt.Sprintf("%d", amount)
	formatted := ""
	for len(raw) > 3 {
		formatted = "." + raw[len(raw)-3:] + formatted
		raw = raw[:len(raw)-3]
	}
	return "Rp " + raw + formatted
}

func slugName(value string) string {
	return slugText(value)
}

func slugText(value string) string {
	out := make([]rune, 0, len(value))
	lastDash := false
	for _, r := range value {
		if r >= 'A' && r <= 'Z' {
			r += 'a' - 'A'
		}
		if (r >= 'a' && r <= 'z') || (r >= '0' && r <= '9') {
			out = append(out, r)
			lastDash = false
			continue
		}
		if !lastDash && len(out) > 0 {
			out = append(out, '-')
			lastDash = true
		}
	}
	if len(out) > 0 && out[len(out)-1] == '-' {
		out = out[:len(out)-1]
	}
	return string(out)
}
