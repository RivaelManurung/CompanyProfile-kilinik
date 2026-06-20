"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import {
  AlertTriangle,
  BadgeCheck,
  CalendarCheck,
  CalendarClock,
  CalendarDays,
  CalendarPlus,
  Cake,
  CheckCircle2,
  ChevronRight,
  Clock,
  Download,
  FileText,
  Loader2,
  LogOut,
  Mail,
  MapPin,
  Pencil,
  Phone,
  ShieldAlert,
  ShieldQuestion,
  Stethoscope,
  Trash2,
  User2,
  X,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/brand-button";
import { fieldControlClass } from "@/components/ui/Field";
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

function sexLabel(sex?: string | null): string {
  if (sex === "L") return "Laki-laki";
  if (sex === "P") return "Perempuan";
  return "—";
}

function formatDob(dob?: string | null): string {
  if (!dob) return "—";
  const d = new Date(dob);
  if (Number.isNaN(d.getTime())) return "—";
  return format(d, "d MMMM yyyy", { locale: idLocale });
}

/** Triggers a client-side download of arbitrary JSON data. */
function downloadJson(data: unknown, filename: string) {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export default function AkunPage() {
  const { patient, loading, logout, updateProfile } = usePatientAuth();
  const router = useRouter();
  const [items, setItems] = useState<PatientAppointment[]>([]);
  const [listLoading, setListLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [filter, setFilter] = useState<Filter>("all");
  const [cancelTarget, setCancelTarget] = useState<PatientAppointment | null>(null);
  const [rescheduleTarget, setRescheduleTarget] = useState<PatientAppointment | null>(null);
  const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);
  const [exporting, setExporting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (!loading && !patient) router.replace("/masuk?redirect=/akun");
  }, [loading, patient, router]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(t);
  }, [toast]);

  function applyUpdated(updated: PatientAppointment) {
    setItems((prev) => prev.map((x) => (x.id === updated.id ? updated : x)));
  }

  async function handleCancel(a: PatientAppointment) {
    try {
      const updated = await patientApi.cancelAppointment(a.id);
      applyUpdated(updated);
      setToast({ type: "success", msg: "Janji temu berhasil dibatalkan." });
    } catch (err) {
      setToast({
        type: "error",
        msg: err instanceof PatientApiError ? err.message : "Gagal membatalkan janji.",
      });
    } finally {
      setCancelTarget(null);
    }
  }

  async function handleExport() {
    setExporting(true);
    try {
      const data = await patientApi.exportData();
      downloadJson(data, `data-pasien-${data.profile.id}.json`);
      setToast({ type: "success", msg: "Data Anda berhasil diunduh." });
    } catch (err) {
      setToast({
        type: "error",
        msg: err instanceof PatientApiError ? err.message : "Gagal mengunduh data.",
      });
    } finally {
      setExporting(false);
    }
  }

  async function handleDeleteAccount() {
    await patientApi.deleteAccount();
    await logout();
    router.push("/");
  }

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

        {/* Profile / medical record details */}
        <div className="rounded-2xl border border-ink-100 bg-white p-5 shadow-soft">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-sm font-bold tracking-tight text-ink-900">Data Diri & Rekam Medis</h2>
            {patient.emailVerifiedAt ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-accent-50 px-2.5 py-1 text-xs font-semibold text-accent-700 ring-1 ring-accent-100">
                <BadgeCheck className="h-3.5 w-3.5" /> Email terverifikasi
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-warning/10 px-2.5 py-1 text-xs font-semibold text-warning ring-1 ring-warning/20">
                <ShieldQuestion className="h-3.5 w-3.5" /> Email belum terverifikasi
              </span>
            )}
          </div>
          <dl className="mt-4 grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2">
            <ProfileFact icon={FileText} label="No. Rekam Medis" value={patient.medicalRecordNo || "Belum tersedia"} />
            <ProfileFact icon={Cake} label="Tanggal lahir" value={formatDob(patient.dateOfBirth)} />
            <ProfileFact icon={User2} label="Jenis kelamin" value={sexLabel(patient.sex)} />
            <ProfileFact icon={BadgeCheck} label="NIK" value={patient.nik || "—"} />
            <div className="sm:col-span-2">
              <ProfileFact icon={MapPin} label="Alamat" value={patient.address || "—"} />
            </div>
          </dl>
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
                <AppointmentCard
                  key={a.id}
                  appointment={a}
                  onCancel={() => setCancelTarget(a)}
                  onReschedule={() => setRescheduleTarget(a)}
                />
              ))}
            </ul>
          )}
        </div>

        {/* Data & Privacy */}
        <div className="rounded-2xl border border-ink-100 bg-white p-5 shadow-soft">
          <h2 className="text-sm font-bold tracking-tight text-ink-900">Data & Privasi</h2>
          <p className="mt-1 text-sm text-ink-500">
            Kelola data pribadi Anda sesuai hak Anda atas perlindungan data.
          </p>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={handleExport}
              disabled={exporting}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-full border border-ink-200 px-4 py-2.5 text-sm font-semibold text-ink-700 transition-colors hover:bg-ink-50 focus-visible:ring-2 focus-visible:ring-primary-500/40 disabled:opacity-60"
            >
              {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              Unduh data saya
            </button>
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-full border border-danger/30 px-4 py-2.5 text-sm font-semibold text-danger transition-colors hover:bg-danger/5 focus-visible:ring-2 focus-visible:ring-danger/30"
            >
              <Trash2 className="h-4 w-4" /> Hapus akun
            </button>
          </div>
        </div>
      </Container>

      {editing && (
        <EditProfileModal patient={patient} onClose={() => setEditing(false)} onSave={updateProfile} />
      )}

      {confirmDelete && (
        <DeleteAccountDialog
          onClose={() => setConfirmDelete(false)}
          onConfirm={handleDeleteAccount}
        />
      )}

      {cancelTarget && (
        <CancelConfirmDialog
          appointment={cancelTarget}
          onClose={() => setCancelTarget(null)}
          onConfirm={() => handleCancel(cancelTarget)}
        />
      )}

      {rescheduleTarget && (
        <RescheduleModal
          appointment={rescheduleTarget}
          onClose={() => setRescheduleTarget(null)}
          onSuccess={(updated) => {
            applyUpdated(updated);
            setRescheduleTarget(null);
            setToast({ type: "success", msg: "Jadwal janji temu berhasil diperbarui." });
          }}
        />
      )}

      {toast && (
        <div
          role="status"
          aria-live="polite"
          className={cn(
            "fixed bottom-6 left-1/2 z-[60] -translate-x-1/2 rounded-full px-5 py-3 text-sm font-semibold shadow-lift",
            toast.type === "success"
              ? "bg-primary-700 text-white"
              : "bg-danger text-white",
          )}
        >
          {toast.msg}
        </div>
      )}
    </div>
  );
}

function AppointmentCard({
  appointment: a,
  onCancel,
  onReschedule,
}: {
  appointment: PatientAppointment;
  onCancel: () => void;
  onReschedule: () => void;
}) {
  const st = STATUS[a.status] ?? STATUS.pending;
  const isHistory = a.status === "done" || a.status === "cancelled";
  const canManage = a.status === "pending" || a.status === "confirmed";
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

      {/* Footer: hint + actions */}
      <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-ink-400">{hint}</p>
        <div className="flex shrink-0 gap-2">
          {canManage && (
            <>
              <button
                type="button"
                onClick={onReschedule}
                className="inline-flex items-center gap-1.5 rounded-full border border-primary-200 px-3.5 py-1.5 text-xs font-semibold text-primary-700 transition-colors hover:bg-primary-50 focus-visible:ring-2 focus-visible:ring-primary-500/40"
              >
                <CalendarClock className="h-3.5 w-3.5" /> Jadwal Ulang
              </button>
              <button
                type="button"
                onClick={onCancel}
                className="inline-flex items-center gap-1.5 rounded-full border border-danger/30 px-3.5 py-1.5 text-xs font-semibold text-danger transition-colors hover:bg-danger/5 focus-visible:ring-2 focus-visible:ring-danger/30"
              >
                <X className="h-3.5 w-3.5" /> Batalkan
              </button>
            </>
          )}
          {isHistory && (
            <Button href="/buat-janji" variant="outline" size="sm" className="shrink-0">
              Buat Janji Lagi
            </Button>
          )}
        </div>
      </div>
    </li>
  );
}

function ProfileFact({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-2.5">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-ink-400" />
      <div className="min-w-0">
        <dt className="text-xs font-medium text-ink-400">{label}</dt>
        <dd className="text-sm font-semibold text-ink-800">{value}</dd>
      </div>
    </div>
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

const modalInputClass = cn("h-11", fieldControlClass);

function nextDays(count: number): { value: string; weekday: string; day: string; month: string }[] {
  const out: { value: string; weekday: string; day: string; month: string }[] = [];
  const base = new Date();
  for (let i = 0; i < count; i++) {
    const d = new Date(base);
    d.setDate(base.getDate() + i);
    out.push({
      value: format(d, "yyyy-MM-dd"),
      weekday: format(d, "EEE", { locale: idLocale }),
      day: format(d, "d"),
      month: format(d, "MMM", { locale: idLocale }),
    });
  }
  return out;
}

function CancelConfirmDialog({
  appointment,
  onClose,
  onConfirm,
}: {
  appointment: PatientAppointment;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}) {
  const [busy, setBusy] = useState(false);

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

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink-950/40 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="cancel-title"
        className="w-full max-w-sm rounded-3xl border border-ink-100 bg-white p-6 text-center shadow-lift sm:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-danger/10 text-danger">
          <AlertTriangle className="h-7 w-7" />
        </span>
        <h2 id="cancel-title" className="mt-4 text-lg font-bold tracking-tight text-ink-900">
          Batalkan janji temu?
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-ink-500">
          Janji <span className="font-semibold text-ink-700">{appointment.service || "Konsultasi"}</span> bersama{" "}
          <span className="font-semibold text-ink-700">{appointment.doctor}</span> akan dibatalkan. Tindakan ini tidak dapat dibatalkan.
        </p>
        <div className="mt-6 flex gap-3">
          <Button type="button" variant="ghost" onClick={onClose} disabled={busy} className="flex-1">
            Tidak
          </Button>
          <button
            type="button"
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              await onConfirm();
            }}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-danger px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-danger/90 disabled:opacity-60"
          >
            {busy && <Loader2 className="h-4 w-4 animate-spin" />}
            Ya, batalkan
          </button>
        </div>
      </div>
    </div>
  );
}

function DeleteAccountDialog({
  onClose,
  onConfirm,
}: {
  onClose: () => void;
  onConfirm: () => Promise<void>;
}) {
  const [busy, setBusy] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const canDelete = confirmText.trim().toUpperCase() === "HAPUS";

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

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink-950/40 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="delete-account-title"
        className="w-full max-w-sm rounded-3xl border border-ink-100 bg-white p-6 text-center shadow-lift sm:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-danger/10 text-danger">
          <ShieldAlert className="h-7 w-7" />
        </span>
        <h2 id="delete-account-title" className="mt-4 text-lg font-bold tracking-tight text-ink-900">
          Hapus akun secara permanen?
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-ink-500">
          Seluruh data dan riwayat janji temu Anda akan dihapus. Tindakan ini tidak dapat
          dibatalkan. Ketik <span className="font-semibold text-ink-700">HAPUS</span> untuk
          mengonfirmasi.
        </p>
        {error && (
          <p className="mt-4 rounded-xl border border-danger/20 bg-danger/5 px-4 py-3 text-sm font-medium text-danger">
            {error}
          </p>
        )}
        <input
          value={confirmText}
          onChange={(e) => setConfirmText(e.target.value)}
          aria-label="Ketik HAPUS untuk mengonfirmasi"
          placeholder="HAPUS"
          className={cn("mt-4 h-11 text-center", fieldControlClass)}
        />
        <div className="mt-6 flex gap-3">
          <Button type="button" variant="ghost" onClick={onClose} disabled={busy} className="flex-1">
            Batal
          </Button>
          <button
            type="button"
            disabled={busy || !canDelete}
            onClick={async () => {
              setBusy(true);
              setError(null);
              try {
                await onConfirm();
              } catch (err) {
                setError(
                  err instanceof PatientApiError ? err.message : "Gagal menghapus akun.",
                );
                setBusy(false);
              }
            }}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-danger px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-danger/90 disabled:opacity-50"
          >
            {busy && <Loader2 className="h-4 w-4 animate-spin" />}
            Hapus akun
          </button>
        </div>
      </div>
    </div>
  );
}

function RescheduleModal({
  appointment,
  onClose,
  onSuccess,
}: {
  appointment: PatientAppointment;
  onClose: () => void;
  onSuccess: (updated: PatientAppointment) => void;
}) {
  const days = useMemo(() => nextDays(14), []);
  const [date, setDate] = useState(days[0]?.value ?? "");
  const [time, setTime] = useState("");
  const [slots, setSlots] = useState<{ time: string; available: boolean }[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  useEffect(() => {
    if (!date || !appointment.doctorId) return;
    let active = true;
    const load = async () => {
      setSlotsLoading(true);
      setTime("");
      try {
        const res = await patientApi.availability(appointment.doctorId, date);
        if (active) setSlots(res.slots);
      } catch {
        if (active) setSlots([]);
      } finally {
        if (active) setSlotsLoading(false);
      }
    };
    load();
    return () => {
      active = false;
    };
  }, [date, appointment.doctorId]);

  async function submit() {
    if (!date || !time) {
      setError("Pilih tanggal dan jam baru terlebih dahulu.");
      return;
    }
    setError(null);
    setBusy(true);
    try {
      const updated = await patientApi.rescheduleAppointment(appointment.id, {
        appointmentDate: date,
        appointmentTime: time,
      });
      onSuccess(updated);
    } catch (err) {
      setError(
        err instanceof PatientApiError ? err.message : "Gagal memperbarui jadwal.",
      );
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
        aria-labelledby="reschedule-title"
        className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-3xl border border-ink-100 bg-white shadow-lift"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between border-b border-ink-100 p-6">
          <div>
            <h2 id="reschedule-title" className="text-lg font-bold tracking-tight text-ink-900">
              Jadwal ulang janji temu
            </h2>
            <p className="mt-1 text-sm text-ink-500">
              {appointment.service || "Konsultasi"} • {appointment.doctor}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup"
            className="-mr-1 rounded-full p-1.5 text-ink-400 transition-colors hover:bg-ink-100 hover:text-ink-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto p-6">
          {error && (
            <p className="rounded-xl border border-danger/20 bg-danger/5 px-4 py-3 text-sm font-medium text-danger">
              {error}
            </p>
          )}

          <div>
            <p className="mb-2 text-sm font-semibold text-ink-700">Pilih tanggal</p>
            <div className="mask-fade-x -mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
              {days.map((d) => {
                const active = d.value === date;
                return (
                  <button
                    key={d.value}
                    type="button"
                    onClick={() => setDate(d.value)}
                    aria-pressed={active}
                    className={cn(
                      "flex w-14 shrink-0 flex-col items-center gap-0.5 rounded-2xl border px-2 py-3 text-center transition-colors",
                      active
                        ? "border-primary-600 bg-primary-600 text-white"
                        : "border-ink-200 bg-white text-ink-600 hover:border-primary-300",
                    )}
                  >
                    <span className="text-[0.65rem] font-medium uppercase opacity-80">{d.weekday}</span>
                    <span className="text-lg font-bold leading-none">{d.day}</span>
                    <span className="text-[0.65rem] font-medium opacity-80">{d.month}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <p className="mb-2 text-sm font-semibold text-ink-700">Pilih jam</p>
            {slotsLoading ? (
              <div className="flex items-center gap-2 py-6 text-sm text-ink-400">
                <Loader2 className="h-4 w-4 animate-spin" /> Memuat jadwal tersedia…
              </div>
            ) : slots.length === 0 ? (
              <p className="py-6 text-sm text-ink-400">
                Tidak ada jadwal tersedia pada tanggal ini. Pilih tanggal lain.
              </p>
            ) : (
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                {slots.map((s) => {
                  const active = s.time === time;
                  return (
                    <button
                      key={s.time}
                      type="button"
                      disabled={!s.available}
                      onClick={() => setTime(s.time)}
                      aria-pressed={active}
                      className={cn(
                        "rounded-xl border px-2 py-2.5 text-sm font-semibold transition-colors",
                        !s.available
                          ? "cursor-not-allowed border-ink-100 bg-ink-50 text-ink-300 line-through"
                          : active
                            ? "border-primary-600 bg-primary-600 text-white"
                            : "border-ink-200 bg-white text-ink-700 hover:border-primary-300",
                      )}
                    >
                      {s.time}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-3 border-t border-ink-100 p-6">
          <Button type="button" variant="ghost" onClick={onClose} disabled={busy}>
            Batal
          </Button>
          <Button type="button" onClick={submit} disabled={busy || !time}>
            {busy && <Loader2 className="h-4 w-4 animate-spin" />}
            Simpan jadwal baru
          </Button>
        </div>
      </div>
    </div>
  );
}

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
    dateOfBirth?: string;
    sex?: string;
    address?: string;
    nik?: string;
  }) => Promise<void>;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [changePw, setChangePw] = useState(false);
  const [nikError, setNikError] = useState<string | undefined>();
  const nikLocked = Boolean(patient.nik);

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
      dateOfBirth?: string;
      sex?: string;
      address?: string;
      nik?: string;
    } = {
      name: String(fd.get("name")),
      phone: String(fd.get("phone")),
      dateOfBirth: String(fd.get("dateOfBirth") ?? ""),
      sex: String(fd.get("sex") ?? ""),
      address: String(fd.get("address") ?? "").trim(),
    };
    if (!nikLocked) {
      const nik = String(fd.get("nik") ?? "").trim();
      if (nik) {
        if (!/^\d{16}$/.test(nik)) {
          setNikError("NIK harus terdiri dari 16 digit angka.");
          return;
        }
        body.nik = nik;
      }
    }
    if (changePw) {
      body.currentPassword = String(fd.get("currentPassword"));
      body.newPassword = String(fd.get("newPassword"));
    }
    setNikError(undefined);
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

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label htmlFor="ep-dob" className="text-sm font-semibold text-ink-700">
                Tanggal lahir
              </label>
              <input
                id="ep-dob"
                name="dateOfBirth"
                type="date"
                defaultValue={patient.dateOfBirth ?? ""}
                className={modalInputClass}
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="ep-sex" className="text-sm font-semibold text-ink-700">
                Jenis kelamin
              </label>
              <select
                id="ep-sex"
                name="sex"
                defaultValue={patient.sex ?? ""}
                className={modalInputClass}
              >
                <option value="">Pilih…</option>
                <option value="L">Laki-laki</option>
                <option value="P">Perempuan</option>
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="ep-nik" className="text-sm font-semibold text-ink-700">
              NIK
            </label>
            <input
              id="ep-nik"
              name="nik"
              inputMode="numeric"
              maxLength={16}
              defaultValue={patient.nik ?? ""}
              disabled={nikLocked}
              aria-invalid={nikError ? true : undefined}
              aria-describedby={nikError ? "ep-nik-msg" : undefined}
              placeholder="16 digit NIK"
              className={cn(modalInputClass, nikLocked && "bg-ink-50 text-ink-400")}
              onChange={() => setNikError(undefined)}
            />
            {nikError ? (
              <p id="ep-nik-msg" className="text-xs font-medium text-danger">
                {nikError}
              </p>
            ) : (
              <p className="text-xs text-ink-400">
                {nikLocked
                  ? "NIK sudah tersimpan dan tidak dapat diubah."
                  : "Isi sekali — NIK tidak dapat diubah setelah disimpan."}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <label htmlFor="ep-address" className="text-sm font-semibold text-ink-700">
              Alamat
            </label>
            <textarea
              id="ep-address"
              name="address"
              rows={2}
              defaultValue={patient.address ?? ""}
              placeholder="Alamat tempat tinggal"
              className={cn("py-3 leading-relaxed", fieldControlClass)}
            />
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
