package handlers

import (
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"io"
	"mime"
	"net/http"
	"os"
	"path/filepath"
	"strings"

	"github.com/gin-gonic/gin"
)

const maxUploadFileBytes = 5 << 20 // 5 MiB

var allowedImageExt = map[string]bool{
	".jpg": true, ".jpeg": true, ".png": true, ".webp": true, ".avif": true, ".gif": true,
}

var allowedImageMIME = map[string]bool{
	"image/jpeg": true, "image/png": true, "image/webp": true,
	"image/avif": true, "image/gif": true,
}

// sanitizeFolder keeps only a safe slug so the folder can't escape the upload dir.
func sanitizeFolder(s string) string {
	s = strings.ToLower(strings.TrimSpace(s))
	var b strings.Builder
	for _, r := range s {
		if (r >= 'a' && r <= 'z') || (r >= '0' && r <= '9') || r == '-' || r == '_' {
			b.WriteRune(r)
		}
	}
	if out := b.String(); out != "" {
		return out
	}
	return "general"
}

func randomToken(n int) (string, error) {
	buf := make([]byte, n)
	if _, err := rand.Read(buf); err != nil {
		return "", fmt.Errorf("randomToken: %w", err)
	}
	return hex.EncodeToString(buf), nil
}

// UploadFile accepts a multipart image ("file") and stores it under the upload
// directory, returning a public URL path served at /uploads/...
func (h *Handler) UploadFile(c *gin.Context) {
	fileHeader, err := c.FormFile("file")
	if err != nil {
		fail(c, http.StatusBadRequest, "NO_FILE", "Tidak ada berkas yang diunggah")
		return
	}
	if fileHeader.Size > maxUploadFileBytes {
		fail(c, http.StatusBadRequest, "FILE_TOO_LARGE", "Ukuran berkas maksimal 5MB")
		return
	}

	// Extension check (fast path).
	ext := strings.ToLower(filepath.Ext(fileHeader.Filename))
	if !allowedImageExt[ext] {
		fail(c, http.StatusBadRequest, "BAD_TYPE", "Format gambar tidak didukung (gunakan JPG, PNG, WEBP, AVIF, atau GIF)")
		return
	}

	// Magic-byte MIME check — prevents renamed HTML/script files from bypassing the extension check.
	f, err := fileHeader.Open()
	if err != nil {
		fail(c, http.StatusInternalServerError, "READ_FAILED", "Gagal membaca berkas")
		return
	}
	defer f.Close()

	buf := make([]byte, 512)
	n, err := f.Read(buf)
	if err != nil && err != io.EOF {
		fail(c, http.StatusInternalServerError, "READ_FAILED", "Gagal membaca berkas")
		return
	}
	detectedType := http.DetectContentType(buf[:n])
	// DetectContentType may return parameters (e.g. "image/png; charset=..."), strip them.
	mediaType, _, _ := mime.ParseMediaType(detectedType)
	if !allowedImageMIME[mediaType] {
		fail(c, http.StatusBadRequest, "BAD_TYPE", "Konten berkas bukan gambar yang valid")
		return
	}

	folder := sanitizeFolder(c.PostForm("folder"))
	dir := filepath.Join(h.Cfg.UploadDir, folder)
	if err := os.MkdirAll(dir, 0o755); err != nil {
		fail(c, http.StatusInternalServerError, "MKDIR_FAILED", "Gagal menyiapkan penyimpanan")
		return
	}

	token, err := randomToken(8)
	if err != nil {
		fail(c, http.StatusInternalServerError, "ENTROPY_FAILED", "Gagal menghasilkan nama berkas")
		return
	}
	name := token + ext
	dest := filepath.Join(dir, name)
	if err := c.SaveUploadedFile(fileHeader, dest); err != nil {
		fail(c, http.StatusInternalServerError, "SAVE_FAILED", "Gagal menyimpan berkas")
		return
	}

	url := "/uploads/" + folder + "/" + name
	h.audit(c, "upload", "media", url)
	created(c, gin.H{"url": url})
}
