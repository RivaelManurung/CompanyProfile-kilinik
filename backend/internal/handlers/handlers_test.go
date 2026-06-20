package handlers

import (
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
)

func TestSlugify(t *testing.T) {
	cases := map[string]string{
		"Hello World":           "hello-world",
		"  Trim  Me  ":          "trim-me",
		"Spesial!! Chàrs??":     "spesial-ch-rs",
		"IV Therapy untuk GERD": "iv-therapy-untuk-gerd",
		"---already---":         "already",
		"":                      "",
	}
	for in, want := range cases {
		if got := slugify(in); got != want {
			t.Errorf("slugify(%q) = %q, want %q", in, got, want)
		}
	}
}

func TestBoolValue(t *testing.T) {
	tru := true
	fls := false
	if !boolValue(&tru, false) {
		t.Error("pointer true should win")
	}
	if boolValue(&fls, true) {
		t.Error("pointer false should win")
	}
	if !boolValue(nil, true) {
		t.Error("nil should fall back to default true")
	}
	if boolValue(nil, false) {
		t.Error("nil should fall back to default false")
	}
}

func TestStringID(t *testing.T) {
	if stringID(0) != "0" {
		t.Error("stringID(0) should be 0")
	}
	if stringID(4221) != "4221" {
		t.Error("stringID(4221) should be 4221")
	}
}

func TestBuildAppointmentDefaults(t *testing.T) {
	req := createAppointmentRequest{Name: "Budi", Phone: "08123456789"}
	got := buildAppointment(req, "website")
	if got.Source != "website" {
		t.Errorf("source = %q, want default website", got.Source)
	}
	if got.Status != "pending" {
		t.Errorf("status = %q, want default pending", got.Status)
	}
}

func TestBuildAppointmentHonoursExplicitValues(t *testing.T) {
	req := createAppointmentRequest{
		Name: "Sari", Phone: "08123456789",
		Source: "whatsapp", Status: "confirmed",
		Doctor: "dr. Agnes", AppointmentDate: "2026-06-20", AppointmentTime: "10:30",
	}
	got := buildAppointment(req, "admin")
	if got.Source != "whatsapp" {
		t.Errorf("source = %q, want whatsapp", got.Source)
	}
	if got.Status != "confirmed" {
		t.Errorf("status = %q, want confirmed", got.Status)
	}
	if got.Doctor != "dr. Agnes" || got.AppointmentDate != "2026-06-20" || got.AppointmentTime != "10:30" {
		t.Errorf("scheduling fields not copied: %+v", got)
	}
}

func TestParseListParamsDefaults(t *testing.T) {
	gin.SetMode(gin.TestMode)
	c, _ := gin.CreateTestContext(httptest.NewRecorder())
	c.Request = httptest.NewRequest("GET", "/?", nil)
	p := parseListParams(c, "created_at")
	if p.Page != 1 || p.Limit != 20 {
		t.Errorf("defaults page/limit = %d/%d, want 1/20", p.Page, p.Limit)
	}
	if p.Sort != "created_at" {
		t.Errorf("default sort = %q, want created_at", p.Sort)
	}
	if p.Direction != "asc" {
		t.Errorf("default direction = %q, want asc", p.Direction)
	}
}

func TestParseListParamsClampsAndSanitizes(t *testing.T) {
	gin.SetMode(gin.TestMode)
	c, _ := gin.CreateTestContext(httptest.NewRecorder())
	c.Request = httptest.NewRequest("GET", "/?page=-3&limit=9999&direction=sideways&q=%20hi%20", nil)
	p := parseListParams(c, "created_at")
	if p.Page != 1 {
		t.Errorf("page = %d, want clamped to 1", p.Page)
	}
	if p.Limit != 20 {
		t.Errorf("limit = %d, want clamped to 20", p.Limit)
	}
	if p.Direction != "asc" {
		t.Errorf("direction = %q, want sanitized to asc", p.Direction)
	}
	if p.Q != "hi" {
		t.Errorf("q = %q, want trimmed 'hi'", p.Q)
	}
}
