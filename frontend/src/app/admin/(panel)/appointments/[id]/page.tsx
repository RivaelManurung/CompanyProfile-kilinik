"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Loader2,
  MessageSquare,
  MessageCircle,
  Phone,
  Mail,
  Calendar,
  User,
  Stethoscope,
  CheckCircle2,
  XCircle,
  UserX,
  CalendarClock,
  AlertTriangle,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { StatusBadge } from "@/components/admin/status-badge";
import { PageHeader } from "@/components/admin/page-header";
import { useAdminSession } from "@/components/admin/AdminShell";
import { appointmentsApi, ApiError, appointmentErrorMessage } from "@/lib/admin/api";
import { can, permissions } from "@/lib/admin/permissions";
import type { Appointment, AppointmentStatus } from "@/lib/admin/types";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { RescheduleDialog } from "./reschedule-dialog";
import { waLink } from "@/lib/utils";

const sourceLabels: Record<string, string> = {
  admin: "Admin",
  website: "Website",
  whatsapp: "WhatsApp",
  phone: "Telepon",
};

const patientTypeLabels: Record<string, string> = {
  new: "Pasien Baru",
  returning: "Pasien Lama",
};

const statusLabels: Record<AppointmentStatus, string> = {
  pending: "Menunggu",
  confirmed: "Dikonfirmasi",
  done: "Selesai",
  cancelled: "Dibatalkan",
  no_show: "Tidak Hadir",
};

function fmtDateTime(iso: string) {
  return new Date(iso).toLocaleString("id-ID", {
    day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

function fmtSchedule(detail: Appointment): string {
  if (detail.appointmentDate) {
    const date = new Date(detail.appointmentDate);
    const datePart = isNaN(date.getTime())
      ? detail.appointmentDate
      : date.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
    return detail.appointmentTime ? `${datePart}, ${detail.appointmentTime}` : datePart;
  }
  if (detail.scheduledAt) return fmtDateTime(detail.scheduledAt);
  return "Belum dijadwalkan";
}

export default function AppointmentDetailPage() {
  const router = useRouter();
  const session = useAdminSession();
  const params = useParams();
  const id = useMemo(() => (params?.id ? Number(params.id) : null), [params?.id]);
  const idValid = id !== null && !isNaN(id);

  const canWrite = can(session, permissions.appointmentsWrite);

  const [detail, setDetail] = useState<Appointment | null>(null);
  const [loading, setLoading] = useState(() => idValid);
  const [notFound, setNotFound] = useState(() => !idValid);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [acting, setActing] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [rescheduleOpen, setRescheduleOpen] = useState(false);

  const fetchDetail = useCallback(async () => {
    if (!idValid || id === null) return;
    setLoadError(null);
    try {
      const data = await appointmentsApi.get(id);
      setDetail(data);
      setNotFound(false);
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        setNotFound(true);
      } else {
        setLoadError(err instanceof ApiError ? err.message : "Gagal memuat data");
      }
    } finally {
      setLoading(false);
    }
  }, [id, idValid]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchDetail();
  }, [fetchDetail]);

  const setStatus = useCallback(async (next: AppointmentStatus) => {
    if (!detail) return;
    setActing(true);
    try {
      await appointmentsApi.update(detail.id, { status: next });
      toast.success(`Status diubah ke ${statusLabels[next]}`);
      await fetchDetail();
    } catch (err) {
      toast.error(appointmentErrorMessage(err, "Gagal memperbarui status"));
    } finally {
      setActing(false);
    }
  }, [detail, fetchDetail]);

  async function submitCancel() {
    if (!detail) return;
    if (!cancelReason.trim()) {
      toast.error("Alasan pembatalan wajib diisi");
      return;
    }
    setActing(true);
    try {
      await appointmentsApi.update(detail.id, { status: "cancelled", cancelReason: cancelReason.trim() });
      toast.success("Janji temu dibatalkan");
      setCancelOpen(false);
      setCancelReason("");
      await fetchDetail();
    } catch (err) {
      toast.error(appointmentErrorMessage(err, "Gagal membatalkan janji temu"));
    } finally {
      setActing(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const backButton = (
    <Button variant="ghost" size="sm" onClick={() => router.push("/admin/appointments")}>
      <ArrowLeft className="h-4 w-4" /> Kembali
    </Button>
  );

  if (loadError) {
    return (
      <div className="space-y-6">
        <PageHeader eyebrow="Appointments" title="Detail Janji Temu" backButton={backButton} />
        <Card className="flex flex-col items-center py-16 text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-destructive/10">
            <AlertTriangle className="h-6 w-6 text-destructive" />
          </div>
          <p className="font-semibold text-foreground">Gagal memuat janji temu</p>
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
        <PageHeader eyebrow="Appointments" title="Detail Janji Temu" backButton={backButton} />
        <Card className="flex flex-col items-center py-16 text-center">
          <p className="font-semibold text-foreground">Janji temu tidak ditemukan</p>
          <p className="mt-1.5 text-sm text-muted-foreground">Data mungkin telah dihapus.</p>
        </Card>
      </div>
    );
  }

  const wa = waLink(detail.phone);
  const isClosed = detail.status === "cancelled" || detail.status === "done";

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Queue operasional"
        title="Detail Janji Temu"
        backButton={backButton}
        metadata={[
          { label: "Status", value: statusLabels[detail.status] },
          { label: "Sumber", value: sourceLabels[detail.source ?? ""] ?? detail.source ?? "—" },
          { label: "Dibuat", value: fmtDateTime(detail.createdAt) },
        ]}
      />

      {canWrite && (
        <Card className="p-4">
          <div className="flex flex-wrap items-center gap-2">
            {detail.status !== "confirmed" && !isClosed && (
              <Button size="sm" disabled={acting} onClick={() => setStatus("confirmed")}>
                <CheckCircle2 className="h-4 w-4" /> Konfirmasi
              </Button>
            )}
            {detail.status !== "done" && detail.status !== "cancelled" && (
              <Button size="sm" variant="secondary" disabled={acting} onClick={() => setStatus("done")}>
                <CheckCircle2 className="h-4 w-4" /> Selesai
              </Button>
            )}
            {detail.status !== "no_show" && !isClosed && (
              <Button size="sm" variant="outline" disabled={acting} onClick={() => setStatus("no_show")}>
                <UserX className="h-4 w-4" /> Tidak Hadir
              </Button>
            )}
            {detail.status !== "cancelled" && (
              <Button size="sm" variant="destructive" disabled={acting} onClick={() => setCancelOpen(true)}>
                <XCircle className="h-4 w-4" /> Batalkan
              </Button>
            )}
            {!isClosed && (
              <Button size="sm" variant="outline" disabled={acting} onClick={() => setRescheduleOpen(true)}>
                <CalendarClock className="h-4 w-4" /> Jadwal Ulang
              </Button>
            )}
            {acting && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
          </div>
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="p-6">
          <h3 className="mb-4 text-sm font-semibold text-foreground">Informasi Pasien</h3>
          <div className="space-y-4">
            <InfoRow icon={<User className="h-4 w-4 text-primary" />} label="Nama" value={detail.name} />
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <Phone className="h-4 w-4 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium text-muted-foreground">Telepon</p>
                <p className="text-sm font-semibold text-foreground">{detail.phone || "-"}</p>
                {detail.phone && (
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {wa && (
                      <Button size="sm" variant="outline" className="h-7 px-2 text-xs" asChild>
                        <a href={wa} target="_blank" rel="noopener noreferrer" aria-label="Hubungi via WhatsApp">
                          <MessageCircle className="size-3.5" /> WhatsApp
                        </a>
                      </Button>
                    )}
                    <Button size="sm" variant="outline" className="h-7 px-2 text-xs" asChild>
                      <a href={`tel:${detail.phone}`} aria-label="Telepon pasien">
                        <Phone className="size-3.5" /> Telepon
                      </a>
                    </Button>
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <Mail className="h-4 w-4 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium text-muted-foreground">Email</p>
                <p className="text-sm font-semibold text-foreground">{detail.email || "-"}</p>
                {detail.email && (
                  <Button size="sm" variant="outline" className="mt-1.5 h-7 px-2 text-xs" asChild>
                    <a href={`mailto:${detail.email}`} aria-label="Kirim email ke pasien">
                      <Mail className="size-3.5" /> Email
                    </a>
                  </Button>
                )}
              </div>
            </div>
            {detail.patientType && (
              <InfoRow
                icon={<User className="h-4 w-4 text-primary" />}
                label="Tipe Pasien"
                value={patientTypeLabels[detail.patientType] ?? detail.patientType}
              />
            )}
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="mb-4 text-sm font-semibold text-foreground">Detail Janji Temu</h3>
          <div className="space-y-4">
            <InfoRow icon={<Stethoscope className="h-4 w-4 text-primary" />} label="Layanan" value={detail.service || "-"} />
            <InfoRow icon={<User className="h-4 w-4 text-primary" />} label="Dokter" value={detail.doctor || "Belum ditentukan"} />
            <InfoRow icon={<Calendar className="h-4 w-4 text-primary" />} label="Jadwal Kunjungan" value={fmtSchedule(detail)} />
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <span className="h-3 w-3 rounded-full bg-primary/40" />
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">Status</p>
                <StatusBadge status={detail.status} />
              </div>
            </div>
            {detail.source && (
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <MessageSquare className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Sumber</p>
                  <Badge variant="outline" className="text-xs font-normal">
                    {sourceLabels[detail.source] ?? detail.source}
                  </Badge>
                </div>
              </div>
            )}
            {detail.handledByAdminId != null && (
              <InfoRow icon={<User className="h-4 w-4 text-primary" />} label="Ditangani Admin" value={`#${detail.handledByAdminId}`} />
            )}
          </div>
        </Card>
      </div>

      {detail.status === "cancelled" && detail.cancelReason && (
        <Card className="border-destructive/30 p-6">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-destructive">
            <XCircle className="h-4 w-4" />
            Alasan Pembatalan
          </h3>
          <p className="rounded-lg bg-destructive/5 p-4 text-sm leading-relaxed text-foreground">{detail.cancelReason}</p>
          {detail.cancelledAt && (
            <p className="mt-2 text-xs text-muted-foreground">Dibatalkan pada {fmtDateTime(detail.cancelledAt)}</p>
          )}
        </Card>
      )}

      {detail.message && (
        <Card className="p-6">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
            Pesan Pasien
          </h3>
          <p className="rounded-lg bg-muted/50 p-4 text-sm leading-relaxed text-foreground">{detail.message}</p>
        </Card>
      )}

      <div className="flex gap-3">
        <Button variant="outline" onClick={() => router.push("/admin/appointments")}>
          <ArrowLeft className="h-4 w-4" /> Kembali
        </Button>
        {can(session, permissions.appointmentsDelete) && (
          <Button variant="destructive" onClick={() => router.push(`/admin/appointments/${detail.id}/delete`)}>
            <Trash2 className="h-4 w-4" /> Hapus
          </Button>
        )}
      </div>

      <RescheduleDialog
        appointment={detail}
        open={rescheduleOpen}
        onOpenChange={setRescheduleOpen}
        onDone={fetchDetail}
      />

      <AlertDialog open={cancelOpen} onOpenChange={(open) => { if (!open) { setCancelOpen(false); } }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 sm:mx-0">
              <AlertTriangle className="h-6 w-6 text-destructive" />
            </div>
            <AlertDialogTitle>Batalkan Janji Temu</AlertDialogTitle>
            <AlertDialogDescription>
              Masukkan alasan pembatalan. Tindakan ini akan mengubah status menjadi &quot;Dibatalkan&quot;.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-1.5">
            <Label htmlFor="cancel-reason">
              Alasan <span className="text-destructive ml-0.5">*</span>
            </Label>
            <Textarea
              id="cancel-reason"
              rows={3}
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Contoh: Pasien meminta penjadwalan ulang."
              aria-invalid={cancelOpen && !cancelReason.trim()}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={acting}>Batal</AlertDialogCancel>
            <Button
              variant="destructive"
              disabled={acting || !cancelReason.trim()}
              onClick={submitCancel}
            >
              {acting ? (<><Loader2 className="h-4 w-4 animate-spin" /> Membatalkan</>) : "Ya, Batalkan"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">{icon}</div>
      <div className="min-w-0">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <p className="text-sm font-semibold text-foreground">{value}</p>
      </div>
    </div>
  );
}
