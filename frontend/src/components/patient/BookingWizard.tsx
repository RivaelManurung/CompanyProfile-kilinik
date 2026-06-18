"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { addDays, format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import {
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  Loader2,
  LogIn,
  Stethoscope,
  UserRound,
} from "lucide-react";
import { Button } from "@/components/ui/brand-button";
import { Combobox, type ComboOption } from "@/components/ui/Combobox";
import { ServiceIcon } from "@/lib/public/icons";
import { cn } from "@/lib/utils";
import { usePatientAuth } from "@/components/patient/PatientAuthProvider";
import { patientApi, PatientApiError, type Slot } from "@/lib/patient/api";
import type { ServiceVM, DoctorVM } from "@/lib/public/api";

/**
 * Match a service to the doctor specialties that handle it, so the doctor
 * dropdown only offers relevant doctors (e.g. vaccination → general/peds, not
 * an OB-GYN). Keyword-matched against the service title; returns null for
 * unknown services → all doctors are eligible (safe fallback).
 */
const SERVICE_SPECIALTY_RULES: { match: string[]; specialties: string[] }[] = [
  { match: ["vaksin", "imunisasi"], specialties: ["Dokter Umum", "Spesialis Anak", "Penyakit Dalam"] },
  { match: ["jantung", "kardio"], specialties: ["Kardiologi", "Penyakit Dalam"] },
  { match: ["bedah", "operasi"], specialties: ["Bedah Umum"] },
  { match: ["kandungan", "kebidanan", "kehamilan", "rahim", "obgyn"], specialties: ["Kebidanan & Kandungan"] },
  { match: ["kulit", "dermat"], specialties: ["Dermatologi"] },
  { match: ["gigi"], specialties: ["Gigi & Mulut"] },
  { match: ["tht", "telinga", "hidung", "tenggorok"], specialties: ["THT"] },
  { match: ["saraf", "neuro"], specialties: ["Neurologi"] },
  { match: ["anak", "pediatri"], specialties: ["Spesialis Anak", "Dokter Umum"] },
  { match: ["gerd", "terapi", "penyakit dalam", "interna"], specialties: ["Penyakit Dalam", "Dokter Umum"] },
  { match: ["konsultasi", "medical check", "mcu", "farmasi", "laborat", "gawat", "umum"], specialties: ["Dokter Umum", "Penyakit Dalam"] },
];

function specialtiesForService(title: string): string[] | null {
  const t = title.toLowerCase();
  for (const rule of SERVICE_SPECIALTY_RULES) {
    if (rule.match.some((m) => t.includes(m))) return rule.specialties;
  }
  return null;
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-semibold text-ink-700">
        {label}
        {hint && <span className="ml-1 font-normal text-ink-400">{hint}</span>}
      </label>
      {children}
    </div>
  );
}

function AuthGate() {
  return (
    <div className="mx-auto max-w-md rounded-3xl border border-ink-100 bg-white p-8 text-center shadow-card sm:p-10">
      <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-50 text-primary-700">
        <LogIn className="h-7 w-7" />
      </span>
      <h2 className="mt-5 text-xl font-bold tracking-tight text-ink-900">
        Masuk untuk membuat janji
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-ink-500">
        Booking janji temu memerlukan akun pasien agar jadwal Anda tersimpan dan
        mudah dikelola.
      </p>
      <div className="mt-6 flex flex-col gap-3">
        <Button href="/masuk?redirect=/buat-janji" size="lg" className="w-full">
          Masuk
        </Button>
        <Button href="/daftar?redirect=/buat-janji" variant="outline" size="lg" className="w-full">
          Buat akun baru
        </Button>
      </div>
    </div>
  );
}

export function BookingWizard({
  services,
  doctors,
}: {
  services: ServiceVM[];
  doctors: DoctorVM[];
}) {
  const { patient, loading } = usePatientAuth();

  const [serviceSlug, setServiceSlug] = useState("");
  const [doctorId, setDoctorId] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [message, setMessage] = useState("");

  const [slots, setSlots] = useState<Slot[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const service = useMemo(
    () => services.find((s) => s.slug === serviceSlug) ?? null,
    [services, serviceSlug],
  );
  const doctor = useMemo(
    () => doctors.find((d) => String(d.id) === doctorId) ?? null,
    [doctors, doctorId],
  );

  // Doctors eligible for the chosen service (by specialty). Falls back to all
  // when the service is unknown or no doctor matches, so booking never dead-ends.
  const eligibleDoctors = useMemo(() => {
    if (!service) return doctors;
    const allowed = specialtiesForService(service.title);
    if (!allowed) return doctors;
    const filtered = doctors.filter((d) =>
      allowed.some(
        (a) =>
          d.specialty.toLowerCase().includes(a.toLowerCase()) ||
          a.toLowerCase().includes(d.specialty.toLowerCase()),
      ),
    );
    return filtered.length ? filtered : doctors;
  }, [service, doctors]);

  function handleServiceChange(slug: string) {
    setServiceSlug(slug);
    // Clear downstream selections in the event handler, not an effect.
    setDoctorId("");
    setDate("");
    setTime("");
    setSlots([]);
  }

  const serviceOptions: ComboOption[] = useMemo(
    () =>
      services.map((s) => ({
        value: s.slug,
        label: s.title,
        sublabel: s.short,
        keywords: s.title,
        leading: (
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary-700">
            <ServiceIcon name={s.icon} className="h-5 w-5" />
          </span>
        ),
      })),
    [services],
  );

  const doctorOptions: ComboOption[] = useMemo(
    () =>
      eligibleDoctors.map((d) => ({
        value: String(d.id),
        label: d.name,
        sublabel: `${d.specialty} · ${d.experience}`,
        keywords: `${d.name} ${d.specialty}`,
        leading: (
          <span className="relative h-9 w-9 shrink-0 overflow-hidden rounded-lg bg-primary-50">
            {d.image ? (
              <Image src={d.image} alt="" fill sizes="36px" className="object-cover object-top" />
            ) : (
              <span className="flex h-full w-full items-center justify-center text-[0.7rem] font-bold text-primary-400">
                {d.initials}
              </span>
            )}
          </span>
        ),
      })),
    [eligibleDoctors],
  );

  const days = useMemo(
    () => Array.from({ length: 14 }, (_, i) => addDays(new Date(), i)),
    [],
  );

  function handleDoctorChange(id: string) {
    setDoctorId(id);
    setDate("");
    setTime("");
    setSlots([]);
  }

  useEffect(() => {
    if (!doctor || !date) return;
    setSlotsLoading(true);
    setTime("");
    patientApi
      .availability(doctor.id, date)
      .then((r) => setSlots(r.slots))
      .catch(() => setSlots([]))
      .finally(() => setSlotsLoading(false));
  }, [doctor, date]);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
      </div>
    );
  }
  if (!patient) return <AuthGate />;

  if (done) {
    return (
      <div className="mx-auto max-w-md rounded-3xl border border-ink-100 bg-white p-8 text-center shadow-card sm:p-10">
        <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-accent-50 text-accent-600">
          <CheckCircle2 className="h-9 w-9" />
        </span>
        <h2 className="mt-5 text-2xl font-bold tracking-tight text-ink-900">
          Janji temu terkirim!
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-ink-500">
          Janji dengan{" "}
          <span className="font-semibold text-ink-700">{doctor?.name}</span> pada{" "}
          <span className="font-semibold text-ink-700">
            {date && format(new Date(date), "EEEE, d MMMM yyyy", { locale: idLocale })} · {time}
          </span>{" "}
          telah kami terima. Tim kami akan mengonfirmasi via WhatsApp.
        </p>
        <div className="mt-6 flex flex-col gap-3">
          <Button href="/akun" size="lg" className="w-full">
            Lihat Janji Temu Saya
          </Button>
          <Button
            variant="outline"
            size="lg"
            className="w-full"
            onClick={() => {
              setDone(false);
              setServiceSlug("");
              setDoctorId("");
              setDate("");
              setTime("");
              setMessage("");
            }}
          >
            Buat janji lain
          </Button>
        </div>
      </div>
    );
  }

  async function submit() {
    if (!doctor || !service || !date || !time) return;
    setError(null);
    setSubmitting(true);
    try {
      await patientApi.book({
        doctorId: doctor.id,
        service: service.title,
        appointmentDate: date,
        appointmentTime: time,
        message,
      });
      setDone(true);
    } catch (err) {
      setError(err instanceof PatientApiError ? err.message : "Gagal membuat janji.");
      if (err instanceof PatientApiError && err.code === "SLOT_TAKEN" && doctor && date) {
        patientApi.availability(doctor.id, date).then((r) => setSlots(r.slots));
        setTime("");
      }
    } finally {
      setSubmitting(false);
    }
  }

  const canSubmit = Boolean(service && doctor && date && time) && !submitting;

  return (
    <div className="mx-auto max-w-2xl">
      <div className="rounded-3xl border border-ink-100 bg-white p-6 shadow-card sm:p-8">
        {error && (
          <p className="mb-5 rounded-xl border border-danger/20 bg-danger/5 px-4 py-3 text-sm font-medium text-danger">
            {error}
          </p>
        )}

        <div className="space-y-5">
          {/* Service */}
          <Field label="Layanan">
            <Combobox
              value={serviceSlug}
              onChange={handleServiceChange}
              options={serviceOptions}
              placeholder="Pilih layanan…"
              searchable
              searchPlaceholder="Cari layanan…"
            />
          </Field>

          {/* Doctor — eligible doctors depend on the chosen service */}
          <Field
            label="Dokter"
            hint={service ? `(${eligibleDoctors.length} dokter untuk layanan ini)` : undefined}
          >
            <Combobox
              value={doctorId}
              onChange={handleDoctorChange}
              options={doctorOptions}
              placeholder="Pilih dokter…"
              disabledPlaceholder="Pilih layanan terlebih dahulu"
              disabled={!service}
              searchable
              searchPlaceholder="Cari nama atau spesialisasi…"
            />
          </Field>

          {/* Date — appears once a doctor is chosen */}
          {doctor && (
            <Field label="Tanggal">
              <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {days.map((d) => {
                  const value = format(d, "yyyy-MM-dd");
                  const selected = value === date;
                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setDate(value)}
                      aria-label={format(d, "EEEE, d MMMM yyyy", { locale: idLocale })}
                      aria-pressed={selected}
                      className={cn(
                        "flex shrink-0 flex-col items-center rounded-xl border px-3.5 py-2.5 transition-colors",
                        selected
                          ? "border-primary-600 bg-primary-600 text-white"
                          : "border-ink-100 bg-white text-ink-700 hover:border-primary-300",
                      )}
                    >
                      <span aria-hidden="true" className={cn("text-[0.65rem] font-semibold uppercase", selected ? "text-white/80" : "text-ink-400")}>
                        {format(d, "EEE", { locale: idLocale })}
                      </span>
                      <span aria-hidden="true" className="mt-0.5 text-base font-bold tabular-nums">{format(d, "d")}</span>
                      <span aria-hidden="true" className={cn("text-[0.65rem]", selected ? "text-white/80" : "text-ink-400")}>
                        {format(d, "MMM", { locale: idLocale })}
                      </span>
                    </button>
                  );
                })}
              </div>
            </Field>
          )}

          {/* Time slots — appears once a date is chosen */}
          {doctor && date && (
            <Field label="Jam tersedia">
              {slotsLoading ? (
                <div className="flex justify-center py-6">
                  <Loader2 className="h-5 w-5 animate-spin text-primary-500" />
                </div>
              ) : slots.length === 0 ? (
                <p className="rounded-xl bg-surface-muted py-6 text-center text-sm text-ink-400">
                  {doctor.name} tidak praktik pada tanggal ini. Pilih tanggal lain.
                </p>
              ) : (
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6">
                  {slots.map((s) => (
                    <button
                      key={s.time}
                      type="button"
                      disabled={!s.available}
                      onClick={() => setTime(s.time)}
                      aria-label={`${s.time} WIB${!s.available ? ", tidak tersedia" : ""}`}
                      aria-pressed={s.available && time === s.time}
                      className={cn(
                        "rounded-lg border py-2 text-sm font-semibold tabular-nums transition-colors",
                        !s.available && "cursor-not-allowed border-ink-100 bg-ink-50 text-ink-300 line-through",
                        s.available && time === s.time && "border-primary-600 bg-primary-600 text-white",
                        s.available && time !== s.time && "border-ink-200 bg-white text-ink-700 hover:border-primary-400 hover:text-primary-700",
                      )}
                    >
                      {s.time}
                    </button>
                  ))}
                </div>
              )}
            </Field>
          )}

          {/* Note */}
          <Field label="Catatan untuk dokter" hint="(opsional)">
            <textarea
              rows={2}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Keluhan singkat atau permintaan khusus…"
              className="w-full rounded-xl border border-ink-200 bg-white px-4 py-3 text-sm text-ink-900 outline-none transition-colors placeholder:text-ink-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/15"
            />
          </Field>
        </div>

        {/* Summary + submit */}
        {time && doctor && service && (
          <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-1.5 rounded-xl bg-surface-muted px-4 py-3 text-sm text-ink-600">
            <span className="flex items-center gap-1.5">
              <Stethoscope className="h-3.5 w-3.5 text-primary-600" /> {service.title}
            </span>
            <span className="flex items-center gap-1.5">
              <UserRound className="h-3.5 w-3.5 text-primary-600" /> {doctor.name}
            </span>
            <span className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-primary-600" />
              {format(new Date(date), "d MMM yyyy", { locale: idLocale })}
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-primary-600" /> {time} WIB
            </span>
          </div>
        )}

        <Button size="lg" className="mt-6 w-full" disabled={!canSubmit} onClick={submit}>
          {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <Check className="h-5 w-5" />}
          {submitting ? "Memproses…" : "Konfirmasi Janji Temu"}
        </Button>
      </div>
    </div>
  );
}
