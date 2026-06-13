package handlers

import (
	"crypto/rand"
	"encoding/hex"
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

func randomToken(n int) string {
	buf := make([]byte, n)
	_, _ = rand.Read(buf)
	return hex.EncodeToString(buf)
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
	ext := strings.ToLower(filepath.Ext(fileHeader.Filename))
	if !allowedImageExt[ext] {
		fail(c, http.StatusBadRequest, "BAD_TYPE", "Format gambar tidak didukung (gunakan JPG, PNG, WEBP, AVIF, atau GIF)")
		return
	}

	folder := sanitizeFolder(c.PostForm("folder"))
	dir := filepath.Join(h.Cfg.UploadDir, folder)
	if err := os.MkdirAll(dir, 0o755); err != nil {
		fail(c, http.StatusInternalServerError, "MKDIR_FAILED", "Gagal menyiapkan penyimpanan")
		return
	}

	name := randomToken(8) + ext
	dest := filepath.Join(dir, name)
	if err := c.SaveUploadedFile(fileHeader, dest); err != nil {
		fail(c, http.StatusInternalServerError, "SAVE_FAILED", "Gagal menyimpan berkas")
		return
	}

	url := "/uploads/" + folder + "/" + name
	h.audit(c, "upload", "media", url)
	created(c, gin.H{"url": url})
}
