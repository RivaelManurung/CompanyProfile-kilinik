"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { ColumnDef } from "@tanstack/react-table";
import { toast } from "sonner";
import { Eye, MoreHorizontal, Trash2 } from "lucide-react";
import { AdminDataGrid } from "@/components/admin/AdminDataGrid";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { useAdminSession } from "@/components/admin/AdminShell";
import { appointmentsApi, ApiError } from "@/lib/admin/api";
import { can, permissions } from "@/lib/admin/permissions";
import type { Appointment, AppointmentStatus, ListMeta, ListParams } from "@/lib/admin/types";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const filters = [
  { value: "", label: "Semua" },
  { value: "pending", label: "Menunggu" },
  { value: "confirmed", label: "Dikonfirmasi" },
  { value: "done", label: "Selesai" },
  { value: "cancelled", label: "Dibatalkan" },
];

const statusOptions: AppointmentStatus[] = ["pending", "confirmed", "done", "cancelled"];
const statusText: Record<AppointmentStatus, string> = {
  pending: "Menunggu",
  confirmed: "Dikonfirmasi",
  done: "Selesai",
  cancelled: "Dibatalkan",
};

const emptyMeta: ListMeta = { total: 0, page: 1, limit: 20, totalPages: 1 };

function fmt(iso: string) {
  return new Date(iso).toLocaleString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
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
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const session = useAdminSession();
  const params = useMemo(() => paramsFromUrl(searchParams), [searchParams]);
  const canWrite = can(session, permissions.appointmentsWrite);
  const canRemove = can(session, permissions.appointmentsDelete);

  const [rows, setRows] = useState<Appointment[]>([]);
  const [meta, setMeta] = useState<ListMeta>(emptyMeta);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [detail, setDetail] = useState<Appointment | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Appointment | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await appointmentsApi.list(params);
      setRows(res.data);
      setMeta(res.meta);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Gagal memuat janji temu");
    } finally {
      setLoading(false);
    }
  }, [params]);

  useEffect(() => {
    const timeout = setTimeout(load, 250);
    return () => clearTimeout(timeout);
  }, [load]);

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
      toast.success(`Status diubah ke "${statusText[next]}"`);
      await load();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Gagal memperbarui status");
    }
  }, [load]);

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await appointmentsApi.remove(deleteTarget.id);
      toast.success("Janji temu dihapus");
      setDeleteTarget(null);
      await load();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Gagal menghapus");
    } finally {
      setDeleting(false);
    }
  }

  const columns = useMemo<ColumnDef<Appointment>[]>(
    () => [
      {
        id: "Pasien",
        header: "Pasien",
        cell: ({ row }) => (
          <div>
            <p className="font-medium text-foreground">{row.original.name}</p>
            <p className="text-sm text-muted-foreground">{row.original.phone}</p>
          </div>
        ),
      },
      {
        id: "Layanan",
        header: "Layanan",
        cell: ({ row }) => <span className="text-muted-foreground">{row.original.service || "Belum dipilih"}</span>,
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
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setDetail(row.original)} aria-label="Lihat detail janji temu">
              <Eye className="h-4 w-4" />
            </Button>
            {(canWrite || canRemove) && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Buka aksi janji temu">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {canWrite && (
                    <>
                      <DropdownMenuLabel>Ubah status</DropdownMenuLabel>
                      {statusOptions.map((status) => (
                        <DropdownMenuItem key={status} disabled={status === row.original.status} onClick={() => changeStatus(row.original, status)}>
                          {statusText[status]}
                        </DropdownMenuItem>
                      ))}
                    </>
                  )}
                  {canWrite && canRemove && <DropdownMenuSeparator />}
                  {canRemove && (
                    <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => setDeleteTarget(row.original)}>
                      <Trash2 className="h-4 w-4" />
                      Hapus
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        ),
      },
    ],
    [canRemove, canWrite, changeStatus],
  );

  return (
    <div className="space-y-5">
      <div>
        <p className="text-sm font-medium text-muted-foreground">Queue operasional</p>
        <h2 className="text-2xl font-bold tracking-normal text-foreground">Janji Temu</h2>
      </div>

      <AdminDataGrid
        data={rows}
        columns={columns}
        meta={meta}
        loading={loading}
        error={error}
        search={params.q}
        searchPlaceholder="Cari nama, email, atau telepon..."
        filters={filters}
        activeFilter={params.status}
        emptyTitle="Tidak ada janji temu"
        emptyDescription="Permintaan konsultasi dari website akan tampil di queue ini."
        onSearchChange={(q) => updateParams({ q, page: 1 })}
        onFilterChange={(status) => updateParams({ status, page: 1 })}
        onPageChange={(page) => updateParams({ page })}
        onRefresh={load}
      />

      <Dialog open={!!detail} onOpenChange={(open) => !open && setDetail(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Detail Janji Temu</DialogTitle>
            <DialogDescription>Data kontak dan kebutuhan awal pasien.</DialogDescription>
          </DialogHeader>
          {detail && (
            <dl className="space-y-3 text-sm">
              {[
                ["Nama", detail.name],
                ["Telepon", detail.phone],
                ["Email", detail.email || "-"],
                ["Layanan", detail.service || "-"],
                ["Tanggal", fmt(detail.createdAt)],
              ].map(([key, value]) => (
                <div key={key} className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">{key}</dt>
                  <dd className="text-right font-medium text-foreground">{value}</dd>
                </div>
              ))}
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Status</dt>
                <dd>
                  <StatusBadge status={detail.status} />
                </dd>
              </div>
              {detail.message && (
                <div className="rounded-md bg-muted p-3">
                  <dt className="mb-1 text-muted-foreground">Pesan</dt>
                  <dd className="text-foreground">{detail.message}</dd>
                </div>
              )}
            </dl>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus janji temu?</AlertDialogTitle>
            <AlertDialogDescription>
              Tindakan ini permanen dan tercatat di audit log. Hapus hanya jika data benar-benar tidak valid.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Batal</AlertDialogCancel>
            <AlertDialogAction disabled={deleting} onClick={confirmDelete} className="bg-destructive text-white hover:bg-destructive/90">
              {deleting ? "Menghapus..." : "Hapus"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
