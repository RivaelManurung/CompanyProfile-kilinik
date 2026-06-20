"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowLeft,
  BadgeCheck,
  Calendar,
  CreditCard,
  Eye,
  Loader2,
  Mail,
  MailCheck,
  MailX,
  MapPin,
  MessageCircle,
  Phone,
  ShieldCheck,
  ShieldX,
  User,
} from "lucide-react";
import { StatusBadge } from "@/components/admin/status-badge";
import { PageHeader } from "@/components/admin/page-header";
import { patientsApi, ApiError } from "@/lib/admin/api";
import type { Appointment, PatientDetail } from "@/lib/admin/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { waLink } from "@/lib/utils";

const sexLabels: Record<string, string> = {
  male: "Laki-laki",
  female: "Perempuan",
  m: "Laki-laki",
  f: "Perempuan",
};

function sexLabel(sex: string): string {
  if (!sex) return "—";
  return sexLabels[sex.toLowerCase()] ?? sex;
}

function fmtDate(iso?: string | null): string {
  if (!iso) return "—";
  const date = new Date(iso);
  if (isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
}

function fmtDateTime(iso?: string | null): string {
  if (!iso) return "—";
  const date = new Date(iso);
  if (isNaN(date.getTime())) return "—";
  return date.toLocaleString("id-ID", {
    day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

function fmtSchedule(appointment: Appointment): string {
  if (appointment.appointmentDate) {
    const date = new Date(appointment.appointmentDate);
    const datePart = isNaN(date.getTime())
      ? appointment.appointmentDate
      : date.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
    return appointment.appointmentTime ? `${datePart}, ${appointment.appointmentTime}` : datePart;
  }
  if (appointment.scheduledAt) return fmtDateTime(appointment.scheduledAt);
  return "Belum dijadwalkan";
}

export default function PatientDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = useMemo(() => (params?.id ? Number(params.id) : null), [params?.id]);
  const idValid = id !== null && !isNaN(id);

  const [detail, setDetail] = useState<PatientDetail | null>(null);
  const [loading, setLoading] = useState(() => idValid);
  const [notFound, setNotFound] = useState(() => !idValid);
  const [loadError, setLoadError] = useState<string | null>(null);

  const fetchDetail = useCallback(async () => {
    if (!idValid || id === null) return;
    setLoadError(null);
    try {
      const data = await patientsApi.get(id);
      setDetail(data);
      setNotFound(false);
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) setNotFound(true);
      else setLoadError(err instanceof ApiError ? err.message : "Gagal memuat data pasien");
    } finally {
      setLoading(false);
    }
  }, [id, idValid]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchDetail();
  }, [fetchDetail]);

  const backButton = (
    <Button variant="ghost" size="sm" onClick={() => router.push("/admin/patients")}>
      <ArrowLeft className="h-4 w-4" /> Kembali
    </Button>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="space-y-6">
        <PageHeader eyebrow="Pasien" title="Detail Pasien" backButton={backButton} />
        <Card className="flex flex-col items-center py-16 text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-destructive/10">
            <AlertTriangle className="h-6 w-6 text-destructive" />
          </div>
          <p className="font-semibold text-foreground">Gagal memuat pasien</p>
          <p className="mt-1.5 text-sm text-muted-foreground">{loadError}</p>
          <Button variant="outline" className="mt-4" onClick={() => { setLoading(true); fetchDetail(); }}>
            Muat Ulang
          </Button>
        </Card>
      </div>
    );
  }

  if (notFound || !detail) {
    return (
      <div className="space-y-6">
        <PageHeader eyebrow="Pasien" title="Detail Pasien" backButton={backButton} />
        <Card className="flex flex-col items-center py-16 text-center">
          <p className="font-semibold text-foreground">Pasien tidak ditemukan</p>
          <p className="mt-1.5 text-sm text-muted-foreground">Data mungkin telah dihapus.</p>
        </Card>
      </div>
    );
  }

  const { patient, appointments } = detail;
  const wa = waLink(patient.phone);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Direktori pasien"
        title={patient.name}
        backButton={backButton}
        metadata={[
          { label: "No. RM", value: patient.medicalRecordNo || "—" },
          { label: "Status", value: patient.active ? "Aktif" : "Nonaktif" },
          { label: "Terdaftar", value: fmtDate(patient.createdAt) },
        ]}
        action={
          <div className="flex items-center gap-2">
            {wa && (
              <Button variant="outline" size="sm" asChild>
                <a href={wa} target="_blank" rel="noopener noreferrer" aria-label="Hubungi via WhatsApp">
                  <MessageCircle className="size-4" /> WhatsApp
                </a>
              </Button>
            )}
            {patient.phone && (
              <Button variant="outline" size="sm" asChild>
                <a href={`tel:${patient.phone}`} aria-label="Telepon pasien">
                  <Phone className="size-4" /> Telepon
                </a>
              </Button>
            )}
          </div>
        }
      />

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="p-6">
          <h3 className="mb-4 text-sm font-semibold text-foreground">Profil Pasien</h3>
          <div className="space-y-4">
            <InfoRow icon={<User className="h-4 w-4 text-primary" />} label="Nama Lengkap" value={patient.name} />
            <InfoRow icon={<Mail className="h-4 w-4 text-primary" />} label="Email" value={patient.email || "—"} />
            <InfoRow icon={<Phone className="h-4 w-4 text-primary" />} label="Telepon" value={patient.phone || "—"} />
            <InfoRow icon={<User className="h-4 w-4 text-primary" />} label="Jenis Kelamin" value={sexLabel(patient.sex)} />
            <InfoRow icon={<Calendar className="h-4 w-4 text-primary" />} label="Tanggal Lahir" value={fmtDate(patient.dateOfBirth)} />
            <InfoRow icon={<MapPin className="h-4 w-4 text-primary" />} label="Alamat" value={patient.address || "—"} />
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="mb-4 text-sm font-semibold text-foreground">Identitas & Status</h3>
          <div className="space-y-4">
            <InfoRow
              icon={<BadgeCheck className="h-4 w-4 text-primary" />}
              label="No. Rekam Medis"
              value={patient.medicalRecordNo || "—"}
            />
            <InfoRow
              icon={<CreditCard className="h-4 w-4 text-primary" />}
              label="NIK (disamarkan)"
              value={patient.nik || "—"}
            />
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                {patient.emailVerifiedAt ? (
                  <MailCheck className="h-4 w-4 text-primary" />
                ) : (
                  <MailX className="h-4 w-4 text-primary" />
                )}
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">Verifikasi Email</p>
                {patient.emailVerifiedAt ? (
                  <StatusBadge status="success" label={`Terverifikasi · ${fmtDate(patient.emailVerifiedAt)}`} />
                ) : (
                  <StatusBadge status="warning" label="Belum terverifikasi" />
                )}
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                {patient.consentAcceptedAt ? (
                  <ShieldCheck className="h-4 w-4 text-primary" />
                ) : (
                  <ShieldX className="h-4 w-4 text-primary" />
                )}
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">Persetujuan (Consent)</p>
                {patient.consentAcceptedAt ? (
                  <StatusBadge status="success" label={`Disetujui · ${fmtDate(patient.consentAcceptedAt)}`} />
                ) : (
                  <StatusBadge status="warning" label="Belum disetujui" />
                )}
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <span className="h-3 w-3 rounded-full bg-primary/40" />
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">Status Akun</p>
                <StatusBadge status={patient.active ? "active" : "inactive"} />
              </div>
            </div>
          </div>
        </Card>
      </div>

      <Card>
        <CardHeader className="border-b">
          <CardTitle className="text-sm">
            Riwayat Janji Temu
            <span className="ml-2 text-xs font-normal text-muted-foreground">
              ({appointments.length})
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="py-0">
          {appointments.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              Pasien ini belum memiliki janji temu.
            </p>
          ) : (
            <ul className="divide-y">
              {appointments.map((appt) => (
                <li key={appt.id} className="flex flex-wrap items-center justify-between gap-3 py-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-foreground">{appt.service || "Layanan belum dipilih"}</p>
                      <StatusBadge status={appt.status} />
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {fmtSchedule(appt)}
                      {appt.doctor ? ` · ${appt.doctor}` : ""}
                    </p>
                  </div>
                  <Button variant="ghost" size="icon" className="h-8 w-8" asChild aria-label="Lihat detail janji temu">
                    <Link href={`/admin/appointments/${appt.id}`}>
                      <Eye className="h-4 w-4" />
                    </Link>
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <div className="flex">
        <Button variant="outline" onClick={() => router.push("/admin/patients")}>
          <ArrowLeft className="h-4 w-4" /> Kembali ke daftar pasien
        </Button>
      </div>
    </div>
  );
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">{icon}</div>
      <div className="min-w-0">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <p className="text-sm font-semibold text-foreground break-words">{value}</p>
      </div>
    </div>
  );
}
