# Admin Dashboard — shadcn/ui Conventions

Aturan ini berlaku untuk **semua halaman di `src/app/admin/**`** dan komponen di `src/components/admin/**`.
Tujuannya: seluruh dashboard punya **"shadcn feel"** yang konsisten. Saat membuat/mengubah halaman admin, **ikuti pola di bawah** agar sinkron.

> shadcn sudah terpasang & dikonfigurasi: `components.json` → style **new-york**, base **neutral**, `cssVariables: true`, ikon **lucide-react**. Primitives ada di `src/components/ui/`.

---

## 1. Prinsip Utama

1. **Selalu compose dari primitives `@/components/ui/*`** — jangan bikin tombol/card/badge dari `<div>` mentah kalau primitive-nya sudah ada.
2. **Warna lewat token semantik, bukan hex.** Pakai `bg-primary`, `text-muted-foreground`, `bg-card`, `border`, `bg-sidebar`, dst. **Brand admin = Dark Green `#06402b`**, didefinisikan sebagai `--primary` di `src/app/globals.css` (blok `:root` shadcn). Situs publik tetap Teal (skala `primary-*` di blok `@theme`) — jadi jangan samakan keduanya. **Jangan hardcode** warna brand (`bg-[#06402b]`, `bg-green-*`, dll); admin selalu pakai `bg-primary`/`text-primary`.
3. **Jangan lawan default primitive.** `Card` sudah punya `py-6`, `gap-6`, `rounded-xl`, `border`, `shadow-sm`. Jangan tambah `p-6` di `<Card>` — pakai `CardHeader`/`CardContent`/`CardFooter` untuk padding.
4. **`cn()` dari `@/lib/utils`** untuk menggabung className. Jangan template-string manual.
5. Ikon **lucide-react**, ukuran via `size-4` / `size-5` (utility `size-*`), bukan `h-4 w-4` untuk konsistensi (boleh, tapi `size-*` lebih disukai di kode baru).

---

## 2. Pola Card (WAJIB)

Selalu pakai komposisi resmi. **Jangan** `<Card className="p-6"><h3>...</h3>...</Card>`.

```tsx
import {
  Card, CardHeader, CardTitle, CardDescription, CardAction, CardContent, CardFooter,
} from "@/components/ui/card";

<Card>
  <CardHeader>                      {/* tambah `className="border-b"` jika perlu garis pemisah */}
    <CardTitle>Judul Section</CardTitle>
    <CardDescription>Subjudul / konteks singkat</CardDescription>
    <CardAction>                    {/* otomatis menempel kanan-atas */}
      <Button asChild variant="ghost" size="sm">
        <Link href="/admin/...">Lihat Semua <ArrowRight className="size-3.5" /></Link>
      </Button>
    </CardAction>
  </CardHeader>
  <CardContent>{/* isi */}</CardContent>
  <CardFooter>{/* opsional: aksi/footer */}</CardFooter>
</Card>
```

- **Judul section** = `CardTitle` (bukan `<h3>` manual). **Deskripsi** = `CardDescription`.
- **Aksi di header** (link "View All", tombol) = `CardAction` — jangan flex-justify-between manual.
- Konten yang butuh padding samping = `CardContent` (sudah `px-6`).

---

## 3. KPI / Summary Card

Gunakan komponen bersama **`SummaryCard`** (`@/components/admin/summary-card.tsx`) — sudah dibangun di atas Card composition. Jangan bikin kartu metrik ad-hoc.

```tsx
<SummaryCard
  icon={<CalendarClock />}
  label="Janji Temu Hari Ini"
  value={stats.totals.todayAppointments}
  context="Permintaan masuk hari ini"
  href="/admin/appointments"          // opsional → kartu jadi link
  variant="warning"                   // neutral | success | warning | danger | info → menyetel warna chip ikon
/>
```

Grid standar untuk baris KPI: `grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6`.

---

## 4. Layout Halaman

Setiap halaman admin = `PageHeader` + konten dalam `space-y-6`.

```tsx
<div className="space-y-6">
  <PageHeader
    eyebrow="Dashboard"
    title="Clinic Overview"
    description="Deskripsi singkat tujuan halaman."
    action={<Button asChild><Link href="...">Tambah</Link></Button>}  // opsional
  />
  {/* ...kartu, tabel, dsb... */}
</div>
```

- `PageHeader` (`@/components/admin/page-header.tsx`) adalah satu-satunya pola judul halaman. Jangan bikin `<h1>` lepas.
- Jarak antar section: `space-y-6`. Grid multi-kolom: `gap-6`.

---

## 5. Tombol

`@/components/ui/button.tsx`. Pilih variant sesuai makna:

| Variant | Kapan dipakai |
| --- | --- |
| `default` | Aksi utama (primary, forest green) |
| `secondary` | Aksi sekunder |
| `outline` | Aksi netral / tombol di toolbar / list pintasan |
| `ghost` | Aksi ringan, ikon di header (`CardAction`) |
| `destructive` | Hapus / aksi merusak |
| `link` | Tautan inline |

- **Tombol yang menavigasi** = `<Button asChild><Link href>...</Link></Button>` (jangan `<Link className="...button-ish">`).
- Sizes: `sm`, `default`, `lg`, `icon`, `icon-sm`, dll. Ikon-only **wajib** punya `aria-label`.

---

## 6. Badge & Status

- **Status entitas** (appointment/article/promotion/user) = **`StatusBadge`** (`@/components/admin/status-badge.tsx`). Sudah memetakan warna+label Indonesia untuk `pending/confirmed/done/cancelled/draft/published/active/...`. **Jangan** bikin pill status sendiri.
- **Label umum / tag** = `Badge` (`@/components/ui/badge.tsx`) dengan variant `secondary` / `outline` / `default`.
- Warna status (emerald=sukses, amber=menunggu, rose=gagal, blue=info) adalah **semantik**, sengaja dibiarkan di luar warna brand — jangan diubah ke forest green.

---

## 7. Tabel & List

- List resource (CRUD) memakai **`CrudManager`** + **`AdminDataGrid`** (`@/components/admin/`). Tambah/ubah kolom lewat prop `columns`, jangan menulis `<table>` mentah.
- Untuk tabel kustom non-CRUD, pakai primitive `@/components/ui/table.tsx` (`Table`, `TableHeader`, `TableRow`, `TableHead`, `TableBody`, `TableCell`).

---

## 8. Form

- Pola form: **react-hook-form + Zod** lewat skema di `src/lib/admin/schemas/*.schema.ts`, dirender via `CrudManager`/`FormShell`.
- Input pakai primitives: `Input`, `Textarea`, `Select`, `Switch`, `Label` dari `@/components/ui/`.
- **Tanggal** pakai `DatePicker` (`@/components/ui/date-picker.tsx`) — bukan `<input type="date">`. Mode `withTime` untuk tanggal+jam. Di `FormPage` cukup set `type: "date"` atau `type: "datetime"`.
- **Koordinat peta** pakai `MapPicker` (`@/components/admin/map-picker.tsx`) — peta Leaflet dengan klik/geser pin + pencarian alamat. Di `FormPage` set `type: "map"` pada field latitude dengan `lngName` menunjuk field longitude. Jangan pakai dua `<input type="number">` mentah.
- **Gambar** pakai `ImageUpload` (`@/components/admin/image-upload.tsx`) — unggah ke `POST /admin/upload`, simpan path `/uploads/...`. Di `FormPage` set `type: "image"` (opsi `uploadFolder`, `imageAspect`). Jangan minta URL gambar. Tampilkan gambar tersimpan via `AdminImage`/`assetUrl` agar path `/uploads` di-resolve ke host backend.
- **Ikon** pakai `IconPicker` (`@/components/admin/icon-picker.tsx`) — pemilih ikon lucide kurасi. Di `FormPage` set `type: "icon"`. Render ikon tersimpan via `DynamicIcon`. Jangan ketik nama ikon manual.
- **Dropdown dinamis** (mis. layanan/dokter pada janji temu) pakai `AsyncSelect` (`@/components/admin/async-select.tsx`) + `optionsApi` di `api.ts`. Jangan biarkan field pilihan jadi free-text `<Input>`.
- **RBAC** kini berbasis DB: matriks izin di halaman `roles` dapat diedit Super Admin (`PUT /admin/roles/:key/permissions`). Default izin di-seed dari `auth.defaultRolePermissions`; super_admin selalu akses penuh.
- **`FormPage` = satu Card bersih.** Form resource sederhana (service, location, dll) cukup grid field tanpa `sections`. Pakai `sections` hanya bila benar-benar ada beberapa kelompok bermakna (dirender sebagai label inline, bukan kartu terpisah).
- Error field ditampilkan via mapping dari `ApiError.details` — jangan bikin penanganan error sendiri.

---

## 9. State: Loading / Empty / Error

- **Loading**: `Skeleton` (`@/components/ui/skeleton.tsx`) atau helper `LoadingSkeleton`. Bentuk skeleton meniru layout asli.
- **Empty**: komponen `empty-state` / pesan dalam `CardContent` yang ter-center.
- **Error**: `Card` dengan ikon `AlertTriangle` (`text-destructive`) + tombol "Muat Ulang". Lihat pola di `src/app/admin/(panel)/page.tsx`.

---

## 10. Toast & Dialog

- Notifikasi = **`sonner`** (`toast(...)` dari `sonner`); `<Toaster />` sudah dipasang di layout panel. Jangan `alert()`.
- Konfirmasi destruktif = `AlertDialog` (`@/components/ui/alert-dialog.tsx`) atau `confirm-dialog` admin. Modal umum = `Dialog`. Panel samping = `Sheet`.

---

## 11. Menambah Primitive shadcn Baru

Kalau butuh komponen shadcn yang belum ada di `src/components/ui/`:

```bash
npx shadcn@latest add <nama>     # contoh: command, calendar, progress
```

Komponen akan dibuat dengan token & style yang sudah benar. Jangan menyalin manual dari internet tanpa menyesuaikan token.

---

## Checklist Sebelum Selesai

- [ ] Tidak ada `<Card className="p-6">` + `<h3>` manual — sudah `CardHeader`/`CardTitle`/`CardContent`.
- [ ] Tidak ada warna brand hardcoded; semua via token (`bg-primary`, dst).
- [ ] Tombol navigasi pakai `Button asChild` + `Link`; ikon-only punya `aria-label`.
- [ ] Status entitas pakai `StatusBadge`; metrik pakai `SummaryCard`.
- [ ] `npx tsc --noEmit` lolos.
