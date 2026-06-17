"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import {
  CalendarCheck,
  CalendarDays,
  CalendarPlus,
  CheckCircle2,
  ChevronRight,
  Clock,
  Loader2,
  LogOut,
  Mail,
  Pencil,
  Phone,
  Stethoscope,
  X,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/brand-button";
import { cn } from "@/lib/utils";
import { usePatientAuth } from "@/components/patient/PatientAuthProvider";
import { patientApi, PatientApiError, type Patient, type PatientAppointment } from "@/lib/patient/api";

type StatusKey = PatientAppointment["status"];
type Filter = "all" | StatusKey;

const STATUS: Record<StatusKey, { label: string; badge: string; bar: string }> = {
  pending: { label: "Menunggu konfirmasi", badge: "bg-warning/10 text-warning ring-warning/20", bar: "bg-warning" },
  confirmed: { label: "Terkonfirmasi", badge: "bg-primary-50 text-primary-700 ring-primary-100", bar: "bg-primary-500" },
  done: { label: "Selesai", badge: "bg-accent-50 text-accent-700 ring-accent-100", bar: "bg-accent-500" },
  cancelled: { label: "Dibatalkan", badge: "bg-danger/10 text-danger ring-danger/20", bar: "bg-danger" },
};

const SHORTCUTS: { key: StatusKey; label: string; icon: LucideIcon; chip: string }[] = [
  { key: "pending", label: "Menunggu", icon: Clock, chip: "bg-warning/10 text-warning" },
  { key: "confirmed", label: "Terkonfirmasi", icon: CalendarCheck, chip: "bg-primary-50 text-primary-700" },
  { key: "done", label: "Selesai", icon: CheckCircle2, chip: "bg-accent-50 text-accent-700" },
  { key: "cancelled", label: "Dibatalkan", icon: XCircle, chip: "bg-danger/10 text-danger" },
];

const TABS: { key: Filter; label: string }[] = [
  { key: "all", label: "Semua" },
  { key: "pending", label: "Menunggu" },
  { key: "confirmed", label: "Terkonfirmasi" },
  { key: "done", label: "Selesai" },
  { key: "cancelled", label: "Dibatalkan" },
];

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function sortKey(a: PatientAppointment) {
  return `${a.appointmentDate ?? ""}T${a.appointmentTime ?? ""}`;
}

export default function AkunPage() {
  const { patient, loading, logout, updateProfile } = usePatientAuth();
  const router = useRouter();
  const [items, setItems] = useState<PatientAppointment[]>([]);
  const [listLoading, setListLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [filter, setFilter] = useState<Filter>("all");

  useEffect(() => {
    if (!loading && !patient) router.replace("/masuk?redirect=/akun");
  }, [loading, patient, router]);

  useEffect(() => {
    if (!patient) return;
    patientApi
      .myAppointments()
      .then(setItems)
      .catch(() => setItems([]))
      .finally(() => setListLoading(false));
  }, [patient]);

  const counts = useMemo(() => {
    const c: Record<StatusKey, number> = { pending: 0, confirmed: 0, done: 0, cancelled: 0 };
    for (const a of items) c[a.status] = (c[a.status] ?? 0) + 1;
    return c;
  }, [items]);

  const filtered = useMemo(() => {
    const list = filter === "all" ? items : items.filter((a) => a.status === filter);
    return [...list].sort((a, b) => sortKey(b).localeCompare(sortKey(a)));
  }, [items, filter]);

  if (loading || !patient) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
      </div>
    );
  }

  return (
    <div className="bg-surface-muted">
      {/* Green profile header (Shopee-style band) */}
      <header className="relative overflow-hidden bg-gradient-to-br from-primary-700 via-primary-600 to-primary-500 pt-28 pb-24 lg:pt-32">
        <div className="bg-grid absolute inset-0 opacity-[0.12]" aria-hidden="true" />
        <Container className="relative">
          <nav className="mb-6 flex items-center gap-1.5 text-sm text-white/60">
            <Link href="/" className="transition-colors hover:text-white">Beranda</Link>
            <ChevronRight className="h-4 w-4" />
            <span className="font-medium text-white">Akun Saya</span>
          </nav>
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <span className="flex h-16 w-16 items-center justify-center rounded-full bg-white/15 text-xl font-bold text-white ring-4 ring-white/20 backdrop-blur-sm">
                {getInitials(patient.name)}
              </span>
              <div className="min-w-0">
                <h1 className="truncate font-display text-2xl font-extrabold tracking-tight text-white">{patient.name}</h1>
                <p className="truncate text-sm text-white/75">{patient.email}</p>
              </div>
            </div>
            <div className="flex gap-2.5">
              <button
                onClick={() => setEditing(true)}
                className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-sm font-semibold text-white backdrop-blur-sm transition-colors hover:bg-white/25"
              >
                <Pencil className="h-4 w-4" /> Edit Profil
              </button>
              <button
                onClick={async () => {
                  await logout();
                  router.push("/");
                }}
                className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-sm font-semibold text-white backdrop-blur-sm transition-colors hover:bg-white/25"
              >
                <LogOut className="h-4 w-4" /> Keluar
              </button>
            </div>
          </div>
        </Container>
      </header>

      <Container className="relative z-10 -mt-14 space-y-4 pb-20">
        {/* Status shortcut strip */}
        <div className="rounded-2xl border border-ink-100 bg-white p-5 shadow-soft">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold tracking-tight text-ink-900">Janji Temu Saya</h2>
            <button
              onClick={() => setFilter("all")}
              className="inline-flex items-center gap-0.5 text-xs font-semibold text-primary-700 transition-colors hover:text-primary-800"
            >
              Lihat Semua <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="mt-4 grid grid-cols-4 gap-2">
            {SHORTCUTS.map((s) => {
              const Icon = s.icon;
              const active = filter === s.key;
              return (
                <button
                  key={s.key}
                  onClick={() => setFilter(s.key)}
                  className={cn(
                    "group flex flex-col items-center gap-2 rounded-xl px-1 py-3 transition-colors",
                    active ? "bg-primary-50" : "hover:bg-ink-50",
                  )}
                >
                  <span className={cn("relative flex h-11 w-11 items-center justify-center rounded-full", s.chip)}>
                    <Icon className="h-5 w-5" />
                    {counts[s.key] > 0 && (
                      <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-danger px-1 text-[0.65rem] font-bold text-white ring-2 ring-white">
                        {counts[s.key]}
                      </span>
                    )}
                  </span>
                  <span className="text-center text-[0.7rem] font-medium leading-tight text-ink-600 sm:text-xs">{s.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Contact + CTA quick card */}
        <div className="flex flex-col gap-4 rounded-2xl border border-ink-100 bg-white p-5 shadow-soft sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-x-8 gap-y-3">
            <div className="flex items-start gap-2.5">
              <Mail className="mt-0.5 h-4 w-4 shrink-0 text-ink-400" />
              <div>
                <p className="text-xs font-medium text-ink-400">Email</p>
                <p className="text-sm font-semibold text-ink-800">{patient.email}</p>
              </div>
            </div>
            <div className="flex items-start gap-2.5">
              <Phone className="mt-0.5 h-4 w-4 shrink-0 text-ink-400" />
              <div>
                <p className="text-xs font-medium text-ink-400">Nomor HP / WhatsApp</p>
                <p className="text-sm font-semibold text-ink-800">{patient.phone || "—"}</p>
              </div>
            </div>
          </div>
          <Button href="/buat-janji" className="shrink-0">
            <CalendarPlus className="h-4 w-4" /> Buat Janji Baru
          </Button>
        </div>

        {/* Appointment list with filter tabs */}
        <div className="overflow-hidden rounded-2xl border border-ink-100 bg-white shadow-soft">
          <div className="flex gap-1 overflow-x-auto border-b border-ink-100 px-2">
            {TABS.map((t) => {
              const active = filter === t.key;
              const n = t.key === "all" ? items.length : counts[t.key];
              return (
                <button
                  key={t.key}
                  onClick={() => setFilter(t.key)}
                  className={cn(
                    "relative whitespace-nowrap px-4 py-3.5 text-sm font-semibold transition-colors",
                    active ? "text-primary-700" : "text-ink-500 hover:text-ink-800",
                  )}
                >
                  {t.label}
                  {n > 0 && <span className="ml-1.5 text-xs text-ink-400">({n})</span>}
                  {active && <span className="absolute inset-x-3 -bottom-px h-0.5 rounded-full bg-primary-600" />}
                </button>
              );
            })}
          </div>

          {listLoading ? (
            <div className="space-y-3 p-4">
              <AppointmentSkeleton />
              <AppointmentSkeleton />
            </div>
          ) : filtered.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-surface-muted text-ink-300">
                <CalendarDays className="h-7 w-7" />
              </span>
              <p className="mt-4 text-sm font-semibold text-ink-700">
                {filter === "all" ? "Belum ada janji temu" : "Tidak ada janji pada status ini"}
              </p>
              <p className="mt-1 text-sm text-ink-400">Buat janji temu dan kelola semuanya di sini.</p>
              <Button href="/buat-janji" size="sm" className="mt-5">
                <CalendarPlus className="h-4 w-4" /> Buat Janji
              </Button>
            </div>
          ) : (
            <ul className="divide-y divide-ink-100">
              {filtered.map((a) => (
                <AppointmentCard key={a.id} appointment={a} />
              ))}
            </ul>
          )}
        </div>
      </Container>

      {editing && (
        <EditProfileModal patient={patient} onClose={() => setEditing(false)} onSave={updateProfile} />
      )}
    </div>
  );
}

function AppointmentCard({ appointment: a }: { appointment: PatientAppointment }) {
  const st = STATUS[a.status] ?? STATUS.pending;
  const isHistory = a.status === "done" || a.status === "cancelled";
  const hint =
    a.status === "pending"
      ? "Tim kami akan menghubungi Anda untuk konfirmasi."
      : a.status === "confirmed"
        ? "Terkonfirmasi — sampai jumpa di klinik."
        : a.status === "done"
          ? "Kunjungan selesai. Terima kasih."
          : "Janji ini dibatalkan.";

  return (
    <li className="relative px-5 py-4">
      {/* Top row: provider + status (Shopee order header) */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2 text-sm font-semibold text-ink-800">
          <Stethoscope className="h-4 w-4 shrink-0 text-primary-600" />
          <span className="truncate">{a.doctor}</span>
        </div>
        <span className={cn("inline-flex shrink-0 items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1", st.badge)}>
          {st.label}
        </span>
      </div>

      {/* Body: service + schedule */}
      <div className="mt-3 flex items-start gap-3 rounded-xl bg-surface-muted/60 p-3">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary-700">
          <CalendarCheck className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <p className="font-semibold text-ink-900">{a.service || "Konsultasi"}</p>
          <p className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-ink-500">
            <span className="flex items-center gap-1.5">
              <CalendarDays className="h-3.5 w-3.5" />
              {a.appointmentDate
                ? format(new Date(a.appointmentDate), "EEEE, d MMM yyyy", { locale: idLocale })
                : "-"}
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" />
              {a.appointmentTime || "-"} WIB
            </span>
          </p>
        </div>
      </div>

      {/* Footer: hint + action (Shopee order footer) */}
      <div className="mt-3 flex items-center justify-between gap-3">
        <p className="text-xs text-ink-400">{hint}</p>
        {isHistory && (
          <Button href="/buat-janji" variant="outline" size="sm" className="shrink-0">
            Buat Janji Lagi
          </Button>
        )}
      </div>
    </li>
  );
}

function AppointmentSkeleton() {
  return (
    <div className="rounded-xl border border-ink-100 p-4">
      <div className="flex items-center justify-between">
        <div className="h-4 w-40 animate-pulse rounded bg-ink-100" />
        <div className="h-6 w-28 animate-pulse rounded-full bg-ink-100" />
      </div>
      <div className="mt-3 flex gap-3">
        <div className="h-12 w-12 animate-pulse rounded-lg bg-ink-100" />
        <div className="flex-1 space-y-2 py-1">
          <div className="h-4 w-32 animate-pulse rounded bg-ink-100" />
          <div className="h-3 w-56 animate-pulse rounded bg-ink-50" />
        </div>
      </div>
    </div>
  );
}

const modalInputClass =
  "h-11 w-full rounded-xl border border-ink-200 bg-white px-4 text-sm text-ink-900 outline-none transition-colors placeholder:text-ink-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/15";

function EditProfileModal({
  patient,
  onClose,
  onSave,
}: {
  patient: Patient;
  onClose: () => void;
  onSave: (body: {
    name?: string;
    phone?: string;
    currentPassword?: string;
    newPassword?: string;
  }) => Promise<void>;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [changePw, setChangePw] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    const body: {
      name?: string;
      phone?: string;
      currentPassword?: string;
      newPassword?: string;
    } = { name: String(fd.get("name")), phone: String(fd.get("phone")) };
    if (changePw) {
      body.currentPassword = String(fd.get("currentPassword"));
      body.newPassword = String(fd.get("newPassword"));
    }
    setBusy(true);
    try {
      await onSave(body);
      onClose();
    } catch (err) {
      setError(err instanceof PatientApiError ? err.message : "Gagal menyimpan profil.");
      setBusy(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink-950/40 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-profile-title"
        className="w-full max-w-md rounded-3xl border border-ink-100 bg-white p-6 shadow-lift sm:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <div>
            <h2 id="edit-profile-title" className="text-lg font-bold tracking-tight text-ink-900">
              Edit Profil
            </h2>
            <p className="mt-1 text-sm text-ink-500">Perbarui data diri dan kata sandi Anda.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup"
            className="-mr-1 rounded-full p-1.5 text-ink-400 transition-colors hover:bg-ink-100 hover:text-ink-700 focus-visible:ring-2 focus-visible:ring-primary-500/40"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          {error && (
            <p className="rounded-xl border border-danger/20 bg-danger/5 px-4 py-3 text-sm font-medium text-danger">
              {error}
            </p>
          )}
          <div className="space-y-1.5">
            <label htmlFor="ep-name" className="text-sm font-semibold text-ink-700">
              Nama
            </label>
            <input id="ep-name" name="name" defaultValue={patient.name} required className={modalInputClass} />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="ep-email" className="text-sm font-semibold text-ink-700">
              Email
            </label>
            <input
              id="ep-email"
              value={patient.email}
              disabled
              className={cn(modalInputClass, "bg-ink-50 text-ink-400")}
            />
            <p className="text-xs text-ink-400">Email tidak dapat diubah.</p>
          </div>
          <div className="space-y-1.5">
            <label htmlFor="ep-phone" className="text-sm font-semibold text-ink-700">
              Nomor HP / WhatsApp
            </label>
            <input id="ep-phone" name="phone" defaultValue={patient.phone} required className={modalInputClass} />
          </div>

          {!changePw ? (
            <button
              type="button"
              onClick={() => setChangePw(true)}
              className="text-sm font-semibold text-primary-700 transition-colors hover:text-primary-800"
            >
              Ubah kata sandi
            </button>
          ) : (
            <div className="space-y-4 rounded-xl bg-surface-muted p-4">
              <div className="space-y-1.5">
                <label htmlFor="ep-cpw" className="text-sm font-semibold text-ink-700">
                  Kata sandi saat ini
                </label>
                <input id="ep-cpw" name="currentPassword" type="password" required className={modalInputClass} />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="ep-npw" className="text-sm font-semibold text-ink-700">
                  Kata sandi baru
                </label>
                <input
                  id="ep-npw"
                  name="newPassword"
                  type="password"
                  minLength={8}
                  required
                  className={modalInputClass}
                />
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="ghost" onClick={onClose} disabled={busy}>
              Batal
            </Button>
            <Button type="submit" disabled={busy}>
              {busy && <Loader2 className="h-4 w-4 animate-spin" />}
              Simpan
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
