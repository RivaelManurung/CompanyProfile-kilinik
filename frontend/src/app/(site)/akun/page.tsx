"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import {
  CalendarPlus,
  Clock,
  Loader2,
  LogOut,
  Pencil,
  Stethoscope,
  CalendarDays,
  X,
} from "lucide-react";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/brand-button";
import { cn } from "@/lib/utils";
import { usePatientAuth } from "@/components/patient/PatientAuthProvider";
import { patientApi, PatientApiError, type Patient, type PatientAppointment } from "@/lib/patient/api";

const STATUS: Record<string, { label: string; cls: string }> = {
  pending: { label: "Menunggu konfirmasi", cls: "bg-warning/10 text-warning ring-warning/20" },
  confirmed: { label: "Terkonfirmasi", cls: "bg-primary-50 text-primary-700 ring-primary-100" },
  done: { label: "Selesai", cls: "bg-accent-50 text-accent-700 ring-accent-100" },
  cancelled: { label: "Dibatalkan", cls: "bg-danger/10 text-danger ring-danger/20" },
};

export default function AkunPage() {
  const { patient, loading, logout, updateProfile } = usePatientAuth();
  const router = useRouter();
  const [items, setItems] = useState<PatientAppointment[]>([]);
  const [listLoading, setListLoading] = useState(true);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    if (!loading && !patient) {
      router.replace("/masuk?redirect=/akun");
    }
  }, [loading, patient, router]);

  useEffect(() => {
    if (!patient) return;
    patientApi
      .myAppointments()
      .then(setItems)
      .catch(() => setItems([]))
      .finally(() => setListLoading(false));
  }, [patient]);

  if (loading || !patient) {
    return (
      <div className="flex justify-center py-32">
        <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
      </div>
    );
  }

  return (
    <section className="py-16 lg:py-24">
      <Container>
        {/* Header */}
        <div className="flex flex-col items-start justify-between gap-5 border-b border-ink-100 pb-8 sm:flex-row sm:items-center">
          <div className="flex items-center gap-4">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-600 text-lg font-bold text-white">
              {patient.name.slice(0, 2).toUpperCase()}
            </span>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-ink-900">{patient.name}</h1>
              <p className="text-sm text-ink-500">{patient.email}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button href="/buat-janji">
              <CalendarPlus className="h-4 w-4" /> Buat Janji
            </Button>
            <Button variant="outline" onClick={() => setEditing(true)}>
              <Pencil className="h-4 w-4" /> Edit Profil
            </Button>
            <Button
              variant="ghost"
              onClick={async () => {
                await logout();
                router.push("/");
              }}
            >
              <LogOut className="h-4 w-4" /> Keluar
            </Button>
          </div>
        </div>

        {editing && (
          <EditProfileModal
            patient={patient}
            onClose={() => setEditing(false)}
            onSave={updateProfile}
          />
        )}

        {/* Appointments */}
        <h2 className="mt-10 text-lg font-bold tracking-tight text-ink-900">
          Janji Temu Saya
        </h2>

        {listLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-primary-500" />
          </div>
        ) : items.length === 0 ? (
          <div className="mt-6 rounded-2xl border border-dashed border-ink-200 bg-surface-muted py-16 text-center">
            <CalendarDays className="mx-auto h-8 w-8 text-ink-300" />
            <p className="mt-3 text-sm font-medium text-ink-600">Belum ada janji temu</p>
            <p className="mt-1 text-sm text-ink-400">Buat janji pertama Anda sekarang.</p>
            <Button href="/buat-janji" className="mt-5">
              <CalendarPlus className="h-4 w-4" /> Buat Janji
            </Button>
          </div>
        ) : (
          <ul className="mt-6 space-y-3">
            {items.map((a) => {
              const st = STATUS[a.status] ?? STATUS.pending;
              return (
                <li
                  key={a.id}
                  className="flex flex-col gap-4 rounded-2xl border border-ink-100 bg-white p-5 transition-colors hover:border-primary-200 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex items-start gap-4">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary-700">
                      <Stethoscope className="h-5 w-5" />
                    </span>
                    <div>
                      <p className="font-bold text-ink-900">{a.doctor}</p>
                      {a.service && <p className="text-sm text-primary-700">{a.service}</p>}
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
                  <span
                    className={cn(
                      "inline-flex w-fit items-center rounded-full px-3 py-1 text-xs font-semibold ring-1",
                      st.cls,
                    )}
                  >
                    {st.label}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </Container>
    </section>
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
        className="w-full max-w-md rounded-3xl border border-ink-100 bg-white p-6 shadow-lift sm:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold tracking-tight text-ink-900">Edit Profil</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup"
            className="rounded-full p-1.5 text-ink-400 transition-colors hover:bg-ink-100 hover:text-ink-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="mt-5 space-y-4">
          {error && (
            <p className="rounded-xl border border-danger/20 bg-danger/5 px-4 py-3 text-sm font-medium text-danger">
              {error}
            </p>
          )}
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-ink-700">Nama</label>
            <input name="name" defaultValue={patient.name} required className={modalInputClass} />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-ink-700">Email</label>
            <input
              value={patient.email}
              disabled
              className={cn(modalInputClass, "bg-ink-50 text-ink-400")}
            />
            <p className="text-xs text-ink-400">Email tidak dapat diubah.</p>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-ink-700">Nomor HP / WhatsApp</label>
            <input name="phone" defaultValue={patient.phone} required className={modalInputClass} />
          </div>

          {!changePw ? (
            <button
              type="button"
              onClick={() => setChangePw(true)}
              className="text-sm font-semibold text-primary-700 hover:text-primary-800"
            >
              Ubah kata sandi
            </button>
          ) : (
            <div className="space-y-4 rounded-xl bg-surface-muted p-4">
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-ink-700">Kata sandi saat ini</label>
                <input name="currentPassword" type="password" required className={modalInputClass} />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-ink-700">Kata sandi baru</label>
                <input name="newPassword" type="password" minLength={8} required className={modalInputClass} />
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
