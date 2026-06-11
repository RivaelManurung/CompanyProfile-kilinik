"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Loader2, MessageSquare, Phone, Mail, Calendar, User, Stethoscope } from "lucide-react";
import { StatusBadge } from "@/components/admin/status-badge";
import { PageHeader } from "@/components/admin/page-header";
import { appointmentsApi, ApiError } from "@/lib/admin/api";
import type { Appointment } from "@/lib/admin/types";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

function fmt(iso: string) {
  return new Date(iso).toLocaleString("id-ID", {
    day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

export default function AppointmentDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = useMemo(() => (params?.id ? Number(params.id) : null), [params?.id]);
  const idValid = id !== null && !isNaN(id);

  const [detail, setDetail] = useState<Appointment | null>(null);
  const [loading, setLoading] = useState(() => idValid);
  const [notFound, setNotFound] = useState(() => !idValid);

  useEffect(() => {
    if (!idValid || !id) return;
    appointmentsApi.get(id)
      .then(setDetail)
      .catch((err) => {
        if (err instanceof ApiError && err.status === 404) setNotFound(true);
      })
      .finally(() => setLoading(false));
  }, [id, idValid]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (notFound || !detail) {
    return (
      <div className="space-y-6">
        <PageHeader eyebrow="Appointments" title="Detail Janji Temu" backButton={
          <Button variant="ghost" size="sm" onClick={() => router.push("/admin/appointments")}>
            <ArrowLeft className="h-4 w-4" /> Kembali
          </Button>
        } />
        <Card className="flex flex-col items-center py-16 text-center">
          <p className="font-semibold text-foreground">Janji temu tidak ditemukan</p>
          <p className="mt-1.5 text-sm text-muted-foreground">Data mungkin telah dihapus.</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Queue operasional"
        title="Detail Janji Temu"
        backButton={
          <Button variant="ghost" size="sm" onClick={() => router.push("/admin/appointments")}>
            <ArrowLeft className="h-4 w-4" /> Kembali
          </Button>
        }
        metadata={[
          { label: "Status", value: detail.status },
          { label: "Dibuat", value: fmt(detail.createdAt) },
        ]}
      />

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="p-6">
          <h3 className="mb-4 text-sm font-semibold text-foreground">Informasi Pasien</h3>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <User className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">Nama</p>
                <p className="text-sm font-semibold text-foreground">{detail.name}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <Phone className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">Telepon</p>
                <p className="text-sm font-semibold text-foreground">{detail.phone}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <Mail className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">Email</p>
                <p className="text-sm font-semibold text-foreground">{detail.email || "-"}</p>
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="mb-4 text-sm font-semibold text-foreground">Detail Janji Temu</h3>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <Stethoscope className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">Layanan</p>
                <p className="text-sm font-semibold text-foreground">{detail.service || "-"}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <Calendar className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">Tanggal Daftar</p>
                <p className="text-sm font-semibold text-foreground">{fmt(detail.createdAt)}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <span className="h-3 w-3 rounded-full bg-primary/40" />
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">Status</p>
                <StatusBadge status={detail.status} />
              </div>
            </div>
          </div>
        </Card>
      </div>

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
        <Button variant="default" onClick={() => router.push(`/admin/appointments/${id}/delete`)}>
          Hapus
        </Button>
      </div>
    </div>
  );
}
