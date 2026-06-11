"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import type { ColumnDef } from "@tanstack/react-table";
import { toast } from "sonner";
import { Eye, Trash2, ClipboardList, Clock, CheckCircle2, XCircle, ListChecks } from "lucide-react";
import { AdminDataGrid, type BulkAction } from "@/components/admin/AdminDataGrid";
import { StatusBadge } from "@/components/admin/status-badge";
import { PageHeader } from "@/components/admin/page-header";
import { SummaryCard } from "@/components/admin/summary-card";
import { ActionMenu } from "@/components/admin/action-menu";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { useAdminSession } from "@/components/admin/AdminShell";
import { appointmentsApi, ApiError } from "@/lib/admin/api";
import { can, permissions } from "@/lib/admin/permissions";
import type { Appointment, AppointmentStatus, ListMeta, ListParams } from "@/lib/admin/types";
import { Button } from "@/components/ui/button";

const filters = [
  { value: "", label: "Semua" },
  { value: "pending", label: "Menunggu" },
  { value: "confirmed", label: "Dikonfirmasi" },
  { value: "done", label: "Selesai" },
  { value: "cancelled", label: "Dibatalkan" },
];

const statusOptions: AppointmentStatus[] = ["pending", "confirmed", "done", "cancelled"];

const statusLabels: Record<AppointmentStatus, string> = {
  pending: "Menunggu",
  confirmed: "Dikonfirmasi",
  done: "Selesai",
  cancelled: "Dibatalkan",
};

const emptyMeta: ListMeta = { total: 0, page: 1, limit: 20, totalPages: 1 };

function fmt(iso: string) {
  return new Date(iso).toLocaleString("id-ID", {
    day: "numeric", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function paramsFromUrl(searchParams: URLSearchParams): Required<ListParams> {
  return {
    page: Number(searchParams.get("page") || 1),
    limit: Number(searchParams.get("limit") || 20),
    q: searchParams.get("q") || "",
    status: searchParams.get("status") || "",
    sort: searchParams.get("sort") || "created_at",
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

  const canWrite = can(session, permissions.appointmentsWrite);
  const canRemove = can(session, permissions.appointmentsDelete);

  useEffect(() => {
    appointmentsApi.list(params)
      .then((res) => {
        setRows(res.data);
        setMeta(res.meta);
        setLoading(false);
      })
      .catch((err) => {
        setError(err instanceof ApiError ? err.message : "Gagal memuat data");
        setLoading(false);
      });
  }, [params]);

  const load = useCallback(async (showLoader = false) => {
    if (showLoader) setLoading(true);
    setError(null);
    try {
      const res = await appointmentsApi.list(params);
      setRows(res.data);
      setMeta(res.meta);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Gagal memuat data");
    } finally {
      setLoading(false);
    }
  }, [params]);

  function updateParams(next: Partial<ListParams>) {
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
      toast.error(err instanceof ApiError ? err.message : "Gagal memperbarui status");
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
        id: "Status",
        header: "Status",
        cell: ({ row }) => <StatusBadge status={row.original.status} />,
      },
      {
        id: "Tanggal",
        header: "Tanggal",
        cell: ({ row }) => <span className="text-sm text-muted-foreground">{fmt(row.original.createdAt)}</span>,
      },
      {
        id: "Aksi",
        header: () => <span className="sr-only">Aksi</span>,
        enableHiding: false,
        cell: ({ row }) => (
          <div className="flex justify-end gap-1">
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
        ),
      },
    ],
    [canRemove, canWrite, router],
  );

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { pending: 0, confirmed: 0, done: 0, cancelled: 0 };
    rows.forEach((r) => { counts[r.status] = (counts[r.status] || 0) + 1; });
    return counts;
  }, [rows]);

  const bulkActions = useMemo<BulkAction<Appointment>[]>(() => {
    const actions = [];
    if (canWrite) {
      actions.push({
        label: "Konfirmasi Terpilih",
        variant: "default" as const,
        icon: <CheckCircle2 className="h-3.5 w-3.5" />,
        onClick: async (selected: Appointment[], clear: () => void) => {
          toast.loading(`Memperbarui status ${selected.length} janji temu...`, { id: "bulk-update" });
          try {
            await Promise.all(selected.map(item => appointmentsApi.update(item.id, { status: "confirmed" })));
            toast.success(`Berhasil mengonfirmasi ${selected.length} janji temu`, { id: "bulk-update" });
            clear();
            await load();
          } catch (err) {
            toast.error("Gagal memperbarui status beberapa janji temu", { id: "bulk-update" });
          }
        }
      });

      actions.push({
        label: "Selesaikan Terpilih",
        variant: "secondary" as const,
        icon: <CheckCircle2 className="h-3.5 w-3.5" />,
        onClick: async (selected: Appointment[], clear: () => void) => {
          toast.loading(`Memperbarui status ${selected.length} janji temu...`, { id: "bulk-update" });
          try {
            await Promise.all(selected.map(item => appointmentsApi.update(item.id, { status: "done" })));
            toast.success(`Berhasil menyelesaikan ${selected.length} janji temu`, { id: "bulk-update" });
            clear();
            await load();
          } catch (err) {
            toast.error("Gagal memperbarui status beberapa janji temu", { id: "bulk-update" });
          }
        }
      });
    }

    if (canRemove) {
      actions.push({
        label: "Hapus Terpilih",
        variant: "destructive" as const,
        icon: <Trash2 className="h-3.5 w-3.5" />,
        onClick: async (selected: Appointment[], clear: () => void) => {
          const confirmed = window.confirm(`Apakah Anda yakin ingin menghapus ${selected.length} janji temu terpilih?`);
          if (!confirmed) return;

          toast.loading(`Menghapus ${selected.length} janji temu...`, { id: "bulk-delete" });
          try {
            await Promise.all(selected.map(item => appointmentsApi.remove(item.id)));
            toast.success(`Berhasil menghapus ${selected.length} janji temu`, { id: "bulk-delete" });
            clear();
            await load();
          } catch (err) {
            toast.error("Gagal menghapus beberapa janji temu", { id: "bulk-delete" });
          }
        }
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

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <SummaryCard icon={<ListChecks className="h-5 w-5" />} label="Total" value={meta.total} />
        <SummaryCard icon={<Clock className="h-5 w-5" />} label="Menunggu" value={statusCounts.pending || 0} variant="warning" />
        <SummaryCard icon={<CheckCircle2 className="h-5 w-5" />} label="Dikonfirmasi" value={statusCounts.confirmed || 0} variant="info" />
        <SummaryCard icon={<CheckCircle2 className="h-5 w-5" />} label="Selesai" value={statusCounts.done || 0} variant="success" />
        <SummaryCard icon={<XCircle className="h-5 w-5" />} label="Dibatalkan" value={statusCounts.cancelled || 0} variant="danger" />
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
    </div>
  );
}
