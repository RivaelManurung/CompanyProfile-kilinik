"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Package, Tag, Clock, AlertCircle, FileText, Plus, Pencil, Trash2, Search } from "lucide-react";
import { toast } from "sonner";
import { useAdminSession } from "@/components/admin/AdminShell";
import { PageHeader } from "@/components/admin/page-header";
import { SummaryCard } from "@/components/admin/summary-card";
import { StatusBadge } from "@/components/admin/status-badge";
import { AdminDataGrid, type BulkAction } from "@/components/admin/AdminDataGrid";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { PageSkeleton } from "@/components/admin/loading-state";
import { AdminImage } from "@/components/admin/admin-image";
import { promotionsApi } from "@/lib/admin/api";
import { can, permissions } from "@/lib/admin/permissions";
import { ApiError } from "@/lib/admin/api";
import type { ListMeta, ListParams, Promotion } from "@/lib/admin/types";
import { Button } from "@/components/ui/button";

const STATUS_FILTERS = [
  { value: "", label: "All" },
  { value: "draft", label: "Draft" },
  { value: "scheduled", label: "Scheduled" },
  { value: "active", label: "Active" },
  { value: "expired", label: "Expired" },
  { value: "hidden", label: "Hidden" },
];

const CAMPAIGN_FILTERS = [
  { value: "", label: "All Types" },
  { value: "discount", label: "Discount" },
  { value: "bundle", label: "Bundle" },
  { value: "seasonal", label: "Seasonal" },
  { value: "new_patient", label: "New Patient" },
  { value: "wellness", label: "Wellness" },
];

const CAMPAIGN_LABELS: Record<string, string> = {
  discount: "Discount",
  bundle: "Bundle",
  seasonal: "Seasonal",
  new_patient: "New Patient",
  wellness: "Wellness",
};

const emptyMeta: ListMeta = { total: 0, page: 1, limit: 20, totalPages: 1 };

function formatPrice(s?: string): string {
  if (!s) return "-";
  const num = Number(s.replace(/[^0-9]/g, ""));
  if (isNaN(num)) return s;
  return new Intl.NumberFormat("id-ID").format(num);
}

function parsePrice(s?: string): number {
  if (!s) return 0;
  return Number(s.replace(/[^0-9]/g, "")) || 0;
}

export default function PromotionsPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const session = useAdminSession();

  const status = searchParams.get("status") || "";
  const campaign = searchParams.get("campaign") || "";
  const q = searchParams.get("q") || "";
  const page = Number(searchParams.get("page") || 1);

  const [rows, setRows] = useState<Promotion[]>([]);
  const [meta, setMeta] = useState<ListMeta>(emptyMeta);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Promotion | null>(null);
  const [deleting, setDeleting] = useState(false);

  const canEdit = can(session, permissions.contentWrite);
  const canDelete = can(session, permissions.contentDelete);

  const limit = Number(searchParams.get("limit") || 20);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: ListParams = { page, limit, q: q || undefined };
      if (status) params.status = status;
      const res = await promotionsApi.list(params);
      setRows(res.data);
      setMeta(res.meta);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Gagal memuat data");
    } finally {
      setLoading(false);
    }
  }, [page, q, status, limit]);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { load(); }, [load]);

  function updateParams(next: Record<string, string | number | undefined>) {
    const sp = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(next)) {
      if (value === undefined || value === "" || value === null) sp.delete(key);
      else sp.set(key, String(value));
    }
    router.replace(`${pathname}?${sp.toString()}`, { scroll: false });
  }

  const filteredRows = useMemo(() => {
    if (!campaign) return rows;
    return rows.filter((r) => r.campaignType === campaign);
  }, [rows, campaign]);

  const metrics = useMemo(() => {
    const total = meta.total;
    let activeCount = 0, scheduledCount = 0, expiredCount = 0, draftCount = 0;
    for (const r of rows) {
      const s = r.status || (r.active ? "active" : "draft");
      if (s === "active") activeCount++;
      else if (s === "scheduled") scheduledCount++;
      else if (s === "expired") expiredCount++;
      else if (s === "draft") draftCount++;
    }
    return { total, activeCount, scheduledCount, expiredCount, draftCount };
  }, [rows, meta.total]);

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await promotionsApi.remove(deleteTarget.id);
      setDeleteTarget(null);
      load();
    } finally {
      setDeleting(false);
    }
  }

  const columns = useMemo(() => {
    const cols: Parameters<typeof AdminDataGrid<Promotion>>[0]["columns"] = [
      {
        id: "Promotion",
        header: "Promotion",
        cell: ({ row }: { row: { original: Promotion } }) => {
          const p = row.original;
          return (
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg border border-border bg-muted">
                <AdminImage src={p.coverImage} alt="" className="h-full w-full object-cover" />
              </div>
              <div className="min-w-0">
                <p className="truncate font-medium text-foreground">{p.title}</p>
                {p.tag && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
                    <Tag className="h-2.5 w-2.5" />
                    {p.tag}
                  </span>
                )}
              </div>
            </div>
          );
        },
      },
      {
        id: "Type",
        header: "Type",
        cell: ({ row }: { row: { original: Promotion } }) => (
          <span className="text-sm text-muted-foreground">
            {CAMPAIGN_LABELS[row.original.campaignType ?? ""] || "-"}
          </span>
        ),
      },
      {
        id: "Price",
        header: "Price",
        cell: ({ row }: { row: { original: Promotion } }) => {
          const p = row.original;
          const op = parsePrice(p.oldPrice);
          const pp = parsePrice(p.price);
          const discount = op > 0 && pp > 0 && op > pp ? Math.round((1 - pp / op) * 100) : 0;
          return (
            <div className="space-y-0.5">
              <p className="font-semibold text-foreground">Rp {formatPrice(p.price)}</p>
              {p.oldPrice && (
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-muted-foreground line-through">Rp {formatPrice(p.oldPrice)}</span>
                  {discount > 0 && (
                    <span className="rounded bg-emerald-50 px-1 py-0.5 text-[11px] font-medium text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400">
                      -{discount}%
                    </span>
                  )}
                </div>
              )}
            </div>
          );
        },
      },
      {
        id: "Schedule",
        header: "Schedule",
        cell: ({ row }: { row: { original: Promotion } }) => {
          const p = row.original;
          if (!p.startDate && !p.endDate) return <span className="text-sm text-muted-foreground/50">-</span>;
          const fmt = (d?: string) => d ? new Date(d).toLocaleDateString("id-ID", { day: "numeric", month: "short" }) : "?";
          return (
            <span className="text-xs text-muted-foreground">
              {p.startDate ? fmt(p.startDate) : "?"} &ndash; {p.endDate ? fmt(p.endDate) : "?"}
            </span>
          );
        },
      },
      {
        id: "Status",
        header: "Status",
        cell: ({ row }: { row: { original: Promotion } }) => (
          <StatusBadge status={row.original.status || (row.original.active ? "active" : "draft")} />
        ),
      },
      {
        id: "Aksi",
        header: () => <span className="sr-only">Aksi</span>,
        enableHiding: false,
        cell: ({ row }: { row: { original: Promotion } }) => (
          <div className="flex justify-end gap-1">
            {canEdit && (
              <Button variant="ghost" size="icon" className="h-8 w-8" asChild aria-label="Edit">
                <Link href={`/admin/promotions/${row.original.id}`}>
                  <Pencil className="h-4 w-4" />
                </Link>
              </Button>
            )}
            {canDelete && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-destructive hover:text-destructive"
                aria-label="Hapus"
                onClick={() => setDeleteTarget(row.original)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        ),
      },
    ];
    return cols;
  }, [canEdit, canDelete]);

  const bulkActions = useMemo<BulkAction<Promotion>[]>(() => {
    const actions = [];
    if (canEdit) {
      actions.push({
        label: "Aktifkan Terpilih",
        variant: "default" as const,
        icon: <Tag className="h-3.5 w-3.5" />,
        onClick: async (selected: Promotion[], clear: () => void) => {
          toast.loading(`Mengaktifkan ${selected.length} promosi...`, { id: "bulk-promotion" });
          try {
            await Promise.all(selected.map(item => promotionsApi.update(item.id, {
              active: true,
              status: "active",
            })));
            toast.success(`Berhasil mengaktifkan ${selected.length} promosi`, { id: "bulk-promotion" });
            clear();
            await load();
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
          } catch (err) {
            toast.error("Gagal mengaktifkan beberapa promosi", { id: "bulk-promotion" });
          }
        }
      });

      actions.push({
        label: "Nonaktifkan Terpilih",
        variant: "secondary" as const,
        icon: <Clock className="h-3.5 w-3.5" />,
        onClick: async (selected: Promotion[], clear: () => void) => {
          toast.loading(`Menonaktifkan ${selected.length} promosi...`, { id: "bulk-promotion" });
          try {
            await Promise.all(selected.map(item => promotionsApi.update(item.id, {
              active: false,
              status: "draft",
            })));
            toast.success(`Berhasil menonaktifkan ${selected.length} promosi`, { id: "bulk-promotion" });
            clear();
            await load();
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
          } catch (err) {
            toast.error("Gagal menonaktifkan beberapa promosi", { id: "bulk-promotion" });
          }
        }
      });
    }

    if (canDelete) {
      actions.push({
        label: "Hapus Terpilih",
        variant: "destructive" as const,
        icon: <Trash2 className="h-3.5 w-3.5" />,
        onClick: async (selected: Promotion[], clear: () => void) => {
          const confirmed = window.confirm(`Apakah Anda yakin ingin menghapus ${selected.length} promosi terpilih?`);
          if (!confirmed) return;

          toast.loading(`Menghapus ${selected.length} promosi...`, { id: "bulk-delete" });
          try {
            await Promise.all(selected.map(item => promotionsApi.remove(item.id)));
            toast.success(`Berhasil menghapus ${selected.length} promosi`, { id: "bulk-delete" });
            clear();
            await load();
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
          } catch (err) {
            toast.error("Gagal menghapus beberapa promosi", { id: "bulk-delete" });
          }
        }
      });
    }
    return actions;
  }, [canEdit, canDelete, load]);

  if (loading && rows.length === 0) return <PageSkeleton />;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Clinic Management"
        title="Promotions"
        description="Manage patient-facing offers, discount campaigns, and service bundles."
        action={
          canEdit ? (
            <Button asChild>
              <Link href="/admin/promotions/new">
                <Plus className="h-4 w-4" />
                Tambah Promosi
              </Link>
            </Button>
          ) : undefined
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <SummaryCard label="Total Promosi" value={metrics.total} variant="neutral" icon={<Package className="h-5 w-5" />} />
        <SummaryCard label="Aktif" value={metrics.activeCount} variant="success" icon={<Tag className="h-5 w-5" />} />
        <SummaryCard label="Terjadwal" value={metrics.scheduledCount} variant="info" icon={<Clock className="h-5 w-5" />} />
        <SummaryCard label="Kadaluarsa" value={metrics.expiredCount} variant="warning" icon={<AlertCircle className="h-5 w-5" />} />
        <SummaryCard label="Draft" value={metrics.draftCount} variant="neutral" icon={<FileText className="h-5 w-5" />} />
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-1 flex-col gap-3">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/60" />
            <input
              value={q}
              onChange={(e) => updateParams({ q: e.target.value, page: 1 })}
              placeholder="Cari promo, tag, atau slug..."
              className="h-9 w-full rounded-lg border border-muted/50 bg-background pl-9 pr-3 text-sm placeholder:text-muted-foreground/50 focus:border-ring focus:outline-none focus:ring-[3px] focus:ring-ring/50"
            />
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="flex flex-wrap gap-1" role="group" aria-label="Filter status">
              {STATUS_FILTERS.map((f) => (
                <Button
                  key={f.value}
                  type="button"
                  variant={status === f.value ? "default" : "outline"}
                  size="sm"
                  className="h-7 px-3 text-xs font-medium"
                  aria-pressed={status === f.value}
                  onClick={() => updateParams({ status: f.value, page: 1 })}
                >
                  {f.label}
                </Button>
              ))}
            </div>
            <div className="flex flex-wrap gap-1" role="group" aria-label="Filter tipe kampanye">
              {CAMPAIGN_FILTERS.map((f) => (
                <Button
                  key={f.value}
                  type="button"
                  variant={campaign === f.value ? "secondary" : "outline"}
                  size="sm"
                  className="h-7 px-3 text-xs font-medium"
                  aria-pressed={campaign === f.value}
                  onClick={() => updateParams({ campaign: f.value, page: 1 })}
                >
                  {f.label}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <AdminDataGrid
        data={filteredRows}
        columns={columns}
        meta={{ ...meta, total: filteredRows.length }}
        loading={loading}
        error={error}
        search={q}
        searchPlaceholder="Cari promo..."
        enableSelection={canEdit || canDelete}
        bulkActions={bulkActions}
        onSearchChange={(newQ) => updateParams({ q: newQ, page: 1 })}
        onFilterChange={(newStatus) => updateParams({ status: newStatus, page: 1 })}
        onPageChange={(newPage) => updateParams({ page: newPage })}
        onLimitChange={(newLimit) => updateParams({ limit: newLimit, page: 1 })}
        onRefresh={load}
      />

      <ConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}
        title="Hapus Promosi"
        description={`Apakah Anda yakin ingin menghapus "${deleteTarget?.title}"? Tindakan ini permanen dan akan dicatat di audit log.`}
        confirmLabel={deleting ? "Menghapus..." : "Ya, Hapus"}
        variant="destructive"
        onConfirm={handleDelete}
      />
    </div>
  );
}
