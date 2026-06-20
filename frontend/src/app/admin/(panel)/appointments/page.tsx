"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import type { ColumnDef } from "@tanstack/react-table";
import { toast } from "sonner";
import {
  Eye,
  Trash2,
  ClipboardList,
  Clock,
  CheckCircle2,
  XCircle,
  ListChecks,
  MessageCircle,
  Phone,
} from "lucide-react";
import { AdminDataGrid, type BulkAction } from "@/components/admin/AdminDataGrid";
import { StatusBadge } from "@/components/admin/status-badge";
import { PageHeader } from "@/components/admin/page-header";
import { SummaryCard } from "@/components/admin/summary-card";
import { ActionMenu } from "@/components/admin/action-menu";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { AsyncSelect } from "@/components/admin/async-select";
import { useAdminSession } from "@/components/admin/AdminShell";
import { appointmentsApi, optionsApi, ApiError, appointmentErrorMessage } from "@/lib/admin/api";
import { can, permissions } from "@/lib/admin/permissions";
import type { Appointment, AppointmentStatus, ListMeta } from "@/lib/admin/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DatePicker } from "@/components/ui/date-picker";
import { Label } from "@/components/ui/label";
import { waLink } from "@/lib/utils";

const filters = [
  { value: "", label: "Semua" },
  { value: "pending", label: "Menunggu" },
  { value: "confirmed", label: "Dikonfirmasi" },
  { value: "done", label: "Selesai" },
  { value: "cancelled", label: "Dibatalkan" },
  { value: "no_show", label: "Tidak Hadir" },
];

const statusOptions: AppointmentStatus[] = ["pending", "confirmed", "done", "cancelled", "no_show"];

const statusLabels: Record<AppointmentStatus, string> = {
  pending: "Menunggu",
  confirmed: "Dikonfirmasi",
  done: "Selesai",
  cancelled: "Dibatalkan",
  no_show: "Tidak Hadir",
};

const sourceLabels: Record<string, string> = {
  admin: "Admin",
  website: "Website",
  whatsapp: "WhatsApp",
  phone: "Telepon",
};

const emptyMeta: ListMeta = { total: 0, page: 1, limit: 20, totalPages: 1 };

/** Display the scheduled visit time (date+time, or scheduledAt ISO), not createdAt. */
function fmtSchedule(appointment: Appointment): string {
  if (appointment.appointmentDate) {
    const date = new Date(appointment.appointmentDate);
    const datePart = isNaN(date.getTime())
      ? appointment.appointmentDate
      : date.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
    return appointment.appointmentTime ? `${datePart}, ${appointment.appointmentTime}` : datePart;
  }
  if (appointment.scheduledAt) {
    return new Date(appointment.scheduledAt).toLocaleString("id-ID", {
      day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
    });
  }
  return "Belum dijadwalkan";
}

interface AppointmentFilters {
  page: number;
  limit: number;
  q: string;
  status: string;
  from: string;
  to: string;
  doctorId: string;
  sort: string;
  direction: "asc" | "desc";
}

function paramsFromUrl(searchParams: URLSearchParams): AppointmentFilters {
  return {
    page: Number(searchParams.get("page") || 1),
    limit: Number(searchParams.get("limit") || 20),
    q: searchParams.get("q") || "",
    status: searchParams.get("status") || "",
    from: searchParams.get("from") || "",
    to: searchParams.get("to") || "",
    doctorId: searchParams.get("doctorId") || "",
    sort: searchParams.get("sort") || "appointment_date",
    direction: (searchParams.get("direction") as "asc" | "desc") || "desc",
  };
}

export default function AppointmentsPage() {
  const router = useRouter();
  const session = useAdminSession();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const params = useMemo(() => paramsFromUrl(searchParams), [searchParams]);
  const [rows, setRows] = useState<Appointment[]>([]);
  const [meta, setMeta] = useState<ListMeta>(emptyMeta);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [confirmTarget, setConfirmTarget] = useState<{ appointment: Appointment; next: AppointmentStatus } | null>(null);
  const [bulkDeleteTarget, setBulkDeleteTarget] = useState<{ rows: Appointment[]; clear: () => void } | null>(null);

  const canWrite = can(session, permissions.appointmentsWrite);
  const canRemove = can(session, permissions.appointmentsDelete);

  const queryParams = useMemo(
    () => ({
      page: params.page,
      limit: params.limit,
      q: params.q,
      status: params.status,
      from: params.from || undefined,
      to: params.to || undefined,
      doctorId: params.doctorId ? Number(params.doctorId) : undefined,
      sort: params.sort,
      direction: params.direction,
    }),
    [params],
  );

  const load = useCallback(async (showLoader = false) => {
    if (showLoader) setLoading(true);
    setError(null);
    try {
      const res = await appointmentsApi.list(queryParams);
      setRows(res.data);
      setMeta(res.meta);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Gagal memuat data");
    } finally {
      setLoading(false);
    }
  }, [queryParams]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    load();
  }, [load]);

  function updateParams(next: Partial<AppointmentFilters>) {
    const sp = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(next)) {
      if (value === undefined || value === "" || value === null) sp.delete(key);
      else sp.set(key, String(value));
    }
    router.replace(`${pathname}?${sp.toString()}`, { scroll: false });
  }

  const changeStatus = useCallback(async (appointment: Appointment, next: AppointmentStatus) => {
    try {
      await appointmentsApi.update(appointment.id, { status: next });
      toast.success(`Status diubah ke ${statusLabels[next]}`);
      await load();
    } catch (err) {
      toast.error(appointmentErrorMessage(err, "Gagal memperbarui status"));
    }
  }, [load]);

  const columns = useMemo<ColumnDef<Appointment>[]>(
    () => [
      {
        id: "Pasien",
        header: "Pasien",
        cell: ({ row }) => (
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
              {row.original.name.charAt(0)}
            </div>
            <div>
              <p className="font-medium text-foreground">{row.original.name}</p>
              <p className="text-xs text-muted-foreground">{row.original.phone}</p>
            </div>
          </div>
        ),
      },
      {
        id: "Layanan",
        header: "Layanan",
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">{row.original.service || "Belum dipilih"}</span>
        ),
      },
      {
        id: "Dokter",
        header: "Dokter",
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">{row.original.doctor || "—"}</span>
        ),
      },
      {
        id: "Jadwal",
        header: "Jadwal",
        cell: ({ row }) => <span className="text-sm text-muted-foreground">{fmtSchedule(row.original)}</span>,
      },
      {
        id: "Sumber",
        header: "Sumber",
        cell: ({ row }) =>
          row.original.source ? (
            <Badge variant="outline" className="text-xs font-normal">
              {sourceLabels[row.original.source] ?? row.original.source}
            </Badge>
          ) : (
            <span className="text-xs text-muted-foreground">—</span>
          ),
      },
      {
        id: "Status",
        header: "Status",
        cell: ({ row }) => <StatusBadge status={row.original.status} />,
      },
      {
        id: "Aksi",
        header: () => <span className="sr-only">Aksi</span>,
        enableHiding: false,
        cell: ({ row }) => {
          const wa = waLink(row.original.phone);
          return (
            <div className="flex justify-end gap-1">
              {wa && (
                <Button variant="ghost" size="icon" className="h-8 w-8" asChild aria-label="Hubungi via WhatsApp">
                  <a href={wa} target="_blank" rel="noopener noreferrer">
                    <MessageCircle className="h-4 w-4" />
                  </a>
                </Button>
              )}
              {row.original.phone && (
                <Button variant="ghost" size="icon" className="h-8 w-8" asChild aria-label="Telepon pasien">
                  <a href={`tel:${row.original.phone}`}>
                    <Phone className="h-4 w-4" />
                  </a>
                </Button>
              )}
              <Button variant="ghost" size="icon" className="h-8 w-8" asChild aria-label="Lihat detail">
                <Link href={`/admin/appointments/${row.original.id}`}>
                  <Eye className="h-4 w-4" />
                </Link>
              </Button>
              <ActionMenu
                label="Aksi"
                actions={[
                  ...(canWrite ? [
                    ...statusOptions.filter((s) => s !== row.original.status).map((s) => ({
                      label: `Ubah ke ${statusLabels[s]}`,
                      onClick: () => setConfirmTarget({ appointment: row.original, next: s }),
                    })),
                    "separator" as const,
                  ] : []),
                  ...(canRemove ? [{
                    label: "Hapus",
                    icon: <Trash2 className="h-4 w-4" />,
                    variant: "destructive" as const,
                    onClick: () => router.push(`/admin/appointments/${row.original.id}/delete`),
                  }] : []),
                ]}
              />
            </div>
          );
        },
      },
    ],
    [canRemove, canWrite, router],
  );

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { pending: 0, confirmed: 0, done: 0, cancelled: 0, no_show: 0 };
    rows.forEach((r) => { counts[r.status] = (counts[r.status] || 0) + 1; });
    return counts;
  }, [rows]);

  const bulkActions = useMemo<BulkAction<Appointment>[]>(() => {
    const actions: BulkAction<Appointment>[] = [];
    if (canWrite) {
      actions.push({
        label: "Konfirmasi Terpilih",
        variant: "default",
        icon: <CheckCircle2 className="h-3.5 w-3.5" />,
        onClick: async (selected, clear) => {
          toast.loading(`Memperbarui status ${selected.length} janji temu...`, { id: "bulk-update" });
          try {
            await Promise.all(selected.map((item) => appointmentsApi.update(item.id, { status: "confirmed" })));
            toast.success(`Berhasil mengonfirmasi ${selected.length} janji temu`, { id: "bulk-update" });
            clear();
            await load();
          } catch {
            toast.error("Gagal memperbarui status beberapa janji temu", { id: "bulk-update" });
          }
        },
      });

      actions.push({
        label: "Selesaikan Terpilih",
        variant: "secondary",
        icon: <CheckCircle2 className="h-3.5 w-3.5" />,
        onClick: async (selected, clear) => {
          toast.loading(`Memperbarui status ${selected.length} janji temu...`, { id: "bulk-update" });
          try {
            await Promise.all(selected.map((item) => appointmentsApi.update(item.id, { status: "done" })));
            toast.success(`Berhasil menyelesaikan ${selected.length} janji temu`, { id: "bulk-update" });
            clear();
            await load();
          } catch {
            toast.error("Gagal memperbarui status beberapa janji temu", { id: "bulk-update" });
          }
        },
      });
    }

    if (canRemove) {
      actions.push({
        label: "Hapus Terpilih",
        variant: "destructive",
        icon: <Trash2 className="h-3.5 w-3.5" />,
        onClick: (selected, clear) => {
          setBulkDeleteTarget({ rows: selected, clear });
        },
      });
    }
    return actions;
  }, [canWrite, canRemove, load]);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Operations"
        title="Appointments"
        description="Manage patient bookings, queue status, confirmations, and visit completion."
        action={
          <Button asChild>
            <Link href="/admin/appointments/new">
              <ClipboardList className="h-4 w-4" />
              Create Appointment
            </Link>
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
        <SummaryCard icon={<ListChecks className="h-5 w-5" />} label="Total" value={meta.total} context="Sesuai filter aktif" />
        <SummaryCard icon={<Clock className="h-5 w-5" />} label="Menunggu" value={statusCounts.pending || 0} variant="warning" context="Di halaman ini" />
        <SummaryCard icon={<CheckCircle2 className="h-5 w-5" />} label="Dikonfirmasi" value={statusCounts.confirmed || 0} variant="info" context="Di halaman ini" />
        <SummaryCard icon={<CheckCircle2 className="h-5 w-5" />} label="Selesai" value={statusCounts.done || 0} variant="success" context="Di halaman ini" />
        <SummaryCard icon={<XCircle className="h-5 w-5" />} label="Dibatalkan" value={statusCounts.cancelled || 0} variant="danger" context="Di halaman ini" />
        <SummaryCard icon={<XCircle className="h-5 w-5" />} label="Tidak Hadir" value={statusCounts.no_show || 0} variant="warning" context="Di halaman ini" />
      </div>

      <div className="grid gap-4 rounded-xl border bg-card p-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="space-y-1.5">
          <Label htmlFor="filter-from">Dari Tanggal</Label>
          <DatePicker
            id="filter-from"
            value={params.from}
            onChange={(v) => updateParams({ from: v, page: 1 })}
            placeholder="Mulai"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="filter-to">Sampai Tanggal</Label>
          <DatePicker
            id="filter-to"
            value={params.to}
            onChange={(v) => updateParams({ to: v, page: 1 })}
            placeholder="Selesai"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="filter-doctor">Dokter</Label>
          <AsyncSelect
            id="filter-doctor"
            value={params.doctorId}
            onChange={(v) => updateParams({ doctorId: v, page: 1 })}
            loader={optionsApi.doctorIds}
            placeholder="Semua dokter"
            clearable
            clearLabel="— Semua dokter —"
          />
        </div>
      </div>

      <AdminDataGrid
        data={rows}
        columns={columns}
        meta={meta}
        loading={loading}
        error={error}
        search={params.q}
        searchPlaceholder="Cari pasien, telepon, email..."
        filters={filters}
        activeFilter={params.status}
        emptyTitle="No appointments found"
        emptyDescription="Create a new appointment or adjust your filters to see clinic bookings."
        enableSelection={canWrite || canRemove}
        bulkActions={bulkActions}
        onSearchChange={(q) => updateParams({ q, page: 1 })}
        onFilterChange={(status) => updateParams({ status, page: 1 })}
        onPageChange={(page) => updateParams({ page })}
        onLimitChange={(limit) => updateParams({ limit, page: 1 })}
        onRefresh={() => load(true)}
      />

      <ConfirmDialog
        open={!!confirmTarget}
        onOpenChange={(open) => { if (!open) setConfirmTarget(null); }}
        title="Konfirmasi Perubahan Status"
        description={
          confirmTarget
            ? `Ubah status janji temu "${confirmTarget.appointment.name}" dari "${statusLabels[confirmTarget.appointment.status]}" menjadi "${statusLabels[confirmTarget.next]}"?`
            : ""
        }
        confirmLabel="Ya, Ubah Status"
        cancelLabel="Batal"
        variant={confirmTarget?.next === "cancelled" ? "destructive" : "default"}
        onConfirm={async () => {
          if (!confirmTarget) return;
          await changeStatus(confirmTarget.appointment, confirmTarget.next);
          setConfirmTarget(null);
        }}
      />

      <ConfirmDialog
        open={!!bulkDeleteTarget}
        onOpenChange={(open) => { if (!open) setBulkDeleteTarget(null); }}
        title="Hapus Janji Temu Terpilih"
        description={
          bulkDeleteTarget
            ? `Apakah Anda yakin ingin menghapus ${bulkDeleteTarget.rows.length} janji temu terpilih? Tindakan ini tidak dapat dibatalkan.`
            : ""
        }
        confirmLabel="Ya, Hapus"
        cancelLabel="Batal"
        variant="destructive"
        onConfirm={async () => {
          if (!bulkDeleteTarget) return;
          const { rows: selected, clear } = bulkDeleteTarget;
          toast.loading(`Menghapus ${selected.length} janji temu...`, { id: "bulk-delete" });
          try {
            await Promise.all(selected.map((item) => appointmentsApi.remove(item.id)));
            toast.success(`Berhasil menghapus ${selected.length} janji temu`, { id: "bulk-delete" });
            clear();
            await load();
          } catch {
            toast.error("Gagal menghapus beberapa janji temu", { id: "bulk-delete" });
          } finally {
            setBulkDeleteTarget(null);
          }
        }}
      />
    </div>
  );
}
