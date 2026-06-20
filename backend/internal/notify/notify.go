// Package notify is a thin, provider-agnostic notification scaffold.
//
// Booking/confirmation/cancel flows call a Notifier so the clinic can later
// plug in WhatsApp / email without touching the handlers. The default
// implementation only logs what WOULD be sent, so it is safe to wire in with no
// external credentials and never blocks or fails a request.
package notify

import (
	"fmt"
	"log"
	"net/http"
	"net/url"
	"strings"
	"time"

	"sehatnusantara/api/internal/models"
)

// Notifier sends out-of-band notifications about appointment lifecycle events.
// Implementations must be safe to call fire-and-forget and must not panic.
type Notifier interface {
	AppointmentCreated(appt models.Appointment)
	AppointmentStatusChanged(appt models.Appointment, oldStatus string)
}

// New selects a Notifier from configuration. "fonnte" with a non-empty token
// sends real WhatsApp messages; anything else falls back to the log-only
// notifier so the app runs safely without credentials.
func New(provider, token string) Notifier {
	switch provider {
	case "fonnte":
		if token != "" {
			log.Println("notify: using Fonnte WhatsApp notifier")
			return NewFonnteNotifier(token)
		}
		log.Println("notify: WA_PROVIDER=fonnte but WA_TOKEN is empty — falling back to log notifier")
	}
	return NewLogNotifier()
}

// LogNotifier is the default, credential-free implementation. It records what a
// real provider would send. Swap this out for a WhatsApp/email-backed Notifier
// in main/router wiring once a provider is configured.
//
// TODO: implement a real provider (e.g. WhatsApp Business API / SMTP email) and
// wire it in place of LogNotifier. The interface above is the integration point.
type LogNotifier struct{}

// NewLogNotifier returns the default log-only notifier.
func NewLogNotifier() *LogNotifier { return &LogNotifier{} }

func (LogNotifier) AppointmentCreated(appt models.Appointment) {
	log.Printf("notify: WOULD send booking confirmation (WhatsApp/email) to %q <%s> for appointment #%d on %s %s (doctor=%q)",
		appt.Name, contact(appt), appt.ID, appt.AppointmentDate, appt.AppointmentTime, appt.Doctor)
}

func (LogNotifier) AppointmentStatusChanged(appt models.Appointment, oldStatus string) {
	log.Printf("notify: WOULD send status update (WhatsApp/email) to %q <%s> for appointment #%d: %s -> %s",
		appt.Name, contact(appt), appt.ID, oldStatus, appt.Status)
}

// contact prefers email, falling back to phone, for log readability.
func contact(appt models.Appointment) string {
	if appt.Email != "" {
		return appt.Email
	}
	return appt.Phone
}

const fonnteEndpoint = "https://api.fonnte.com/send"

// FonnteNotifier sends WhatsApp messages via the Fonnte gateway
// (https://fonnte.com) — the de-facto WhatsApp API in Indonesia. Each send runs
// in its own goroutine with a timeout, so it is fire-and-forget and never blocks
// or fails the originating request. To use a different provider, implement
// Notifier and select it in New().
type FonnteNotifier struct {
	token  string
	client *http.Client
}

// NewFonnteNotifier builds a Fonnte-backed notifier with the given API token.
func NewFonnteNotifier(token string) *FonnteNotifier {
	return &FonnteNotifier{
		token:  token,
		client: &http.Client{Timeout: 10 * time.Second},
	}
}

func (f *FonnteNotifier) AppointmentCreated(appt models.Appointment) {
	msg := fmt.Sprintf(
		"Halo %s 👋\nJanji temu Anda di Klinik Sehat Nusantara telah kami terima:\n\n• Layanan: %s\n• Dokter: %s\n• Jadwal: %s pukul %s WIB\n\nStatus: menunggu konfirmasi. Tim kami akan menghubungi Anda. Terima kasih 🙏",
		firstName(appt.Name), serviceOrConsult(appt), doctorOrTeam(appt), appt.AppointmentDate, appt.AppointmentTime,
	)
	f.send(appt.Phone, msg)
}

func (f *FonnteNotifier) AppointmentStatusChanged(appt models.Appointment, oldStatus string) {
	msg := statusMessage(appt)
	if msg == "" {
		return
	}
	f.send(appt.Phone, msg)
}

// send fires the WhatsApp message in the background. It self-isolates in a
// goroutine so callers need not (the interface contract is fire-and-forget).
func (f *FonnteNotifier) send(phone, message string) {
	target := normalizePhone(phone)
	if target == "" || f.token == "" {
		return
	}
	go func() {
		form := url.Values{}
		form.Set("target", target)
		form.Set("message", message)
		req, err := http.NewRequest(http.MethodPost, fonnteEndpoint, strings.NewReader(form.Encode()))
		if err != nil {
			log.Printf("notify(fonnte): build request: %v", err)
			return
		}
		req.Header.Set("Authorization", f.token)
		req.Header.Set("Content-Type", "application/x-www-form-urlencoded")
		resp, err := f.client.Do(req)
		if err != nil {
			log.Printf("notify(fonnte): send to %s failed: %v", target, err)
			return
		}
		defer resp.Body.Close()
		if resp.StatusCode >= 300 {
			log.Printf("notify(fonnte): send to %s returned status %d", target, resp.StatusCode)
		}
	}()
}

// statusMessage returns the WhatsApp body for a status change, or "" to skip.
func statusMessage(appt models.Appointment) string {
	schedule := fmt.Sprintf("%s pukul %s WIB", appt.AppointmentDate, appt.AppointmentTime)
	switch appt.Status {
	case "confirmed":
		return fmt.Sprintf("Halo %s ✅\nJanji temu Anda untuk %s pada %s telah DIKONFIRMASI. Sampai jumpa di klinik!",
			firstName(appt.Name), serviceOrConsult(appt), schedule)
	case "cancelled":
		if reason := strings.TrimSpace(appt.CancelReason); reason != "" {
			return fmt.Sprintf("Halo %s\nMohon maaf, janji temu Anda untuk %s pada %s telah DIBATALKAN. Alasan: %s. Silakan buat janji baru bila diperlukan.",
				firstName(appt.Name), serviceOrConsult(appt), schedule, reason)
		}
		return fmt.Sprintf("Halo %s\nMohon maaf, janji temu Anda untuk %s pada %s telah DIBATALKAN. Silakan buat janji baru bila diperlukan.",
			firstName(appt.Name), serviceOrConsult(appt), schedule)
	case "done":
		return fmt.Sprintf("Halo %s 🙏\nTerima kasih telah berkunjung ke Klinik Sehat Nusantara. Semoga lekas sehat selalu!",
			firstName(appt.Name))
	default:
		return ""
	}
}

// normalizePhone converts an Indonesian phone to international digits Fonnte
// expects (62…): keeps digits, maps a leading 0 to 62, accepts existing 62.
func normalizePhone(phone string) string {
	var b strings.Builder
	for _, r := range phone {
		if r >= '0' && r <= '9' {
			b.WriteRune(r)
		}
	}
	digits := b.String()
	switch {
	case digits == "":
		return ""
	case strings.HasPrefix(digits, "0"):
		return "62" + strings.TrimPrefix(digits, "0")
	case strings.HasPrefix(digits, "62"):
		return digits
	default:
		return digits
	}
}

func firstName(name string) string {
	name = strings.TrimSpace(name)
	if name == "" {
		return "Pasien"
	}
	return strings.Fields(name)[0]
}

func serviceOrConsult(appt models.Appointment) string {
	if s := strings.TrimSpace(appt.Service); s != "" {
		return s
	}
	return "Konsultasi"
}

func doctorOrTeam(appt models.Appointment) string {
	if d := strings.TrimSpace(appt.Doctor); d != "" {
		return d
	}
	return "tim dokter kami"
}
