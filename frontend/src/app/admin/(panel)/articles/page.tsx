"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Eye, Pencil, Plus, Trash2, FileText, CheckCircle, Clock,
  Star, CalendarDays, Archive,
} from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";
import { toast } from "sonner";

import { AdminDataGrid, type GridFilter } from "@/components/admin/AdminDataGrid";
import { PageHeader } from "@/components/admin/page-header";
import { SummaryCard } from "@/components/admin/summary-card";
import { StatusBadge } from "@/components/admin/status-badge";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { AdminImage } from "@/components/admin/admin-image";
import { MetricCardsSkeleton } from "@/components/admin/loading-state";
import { useAdminSession } from "@/components/admin/AdminShell";
import { articlesApi, ApiError } from "@/lib/admin/api";
import { can, permissions } from "@/lib/admin/permissions";
import type { Article, ListMeta, ListParams } from "@/lib/admin/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const emptyMeta: ListMeta = { total: 0, page: 1, limit: 20, totalPages: 1 };

function getParams(sp: URLSearchParams): Required<ListParams> {
  return {
    page: Number(sp.get("page") || 1),
    limit: Number(sp.get("limit") || 20),
    q: sp.get("q") || "",
    status: sp.get("status") || "",
    sort: sp.get("sort") || "published_at",
    direction: (sp.get("direction") as "asc" | "desc") || "desc",
  };
}

const statusFilters: GridFilter[] = [
  { value: "", label: "Semua" },
  { value: "draft", label: "Draf" },
  { value: "published", label: "Terbit" },
  { value: "scheduled", label: "Terjadwal" },
  { value: "archived", label: "Arsip" },
];

async function fetchStats() {
  const [all, pub, dr, sch] = await Promise.allSettled([
    articlesApi.list({ limit: 1 }),
    articlesApi.list({ status: "published", limit: 1 }),
    articlesApi.list({ status: "draft", limit: 1 }),
    articlesApi.list({ status: "scheduled", limit: 1 }),
  ]);
  return {
    total: all.status === "fulfilled" ? all.value.meta.total : 0,
    published: pub.status === "fulfilled" ? pub.value.meta.total : 0,
    draft: dr.status === "fulfilled" ? dr.value.meta.total : 0,
    scheduled: sch.status === "fulfilled" ? sch.value.meta.total : 0,
  };
}

export default function ArticlesPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const params = useMemo(() => getParams(searchParams), [searchParams]);
  const session = useAdminSession();

  const [rows, setRows] = useState<Article[]>([]);
  const [meta, setMeta] = useState<ListMeta>(emptyMeta);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [stats, setStats] = useState({ total: 0, draft: 0, published: 0, scheduled: 0 });
  const [statsLoading, setStatsLoading] = useState(true);

  const [publishTarget, setPublishTarget] = useState<Article | null>(null);

  useEffect(() => {
    fetchStats().then(setStats).finally(() => setStatsLoading(false));
  }, []);

  useEffect(() => {
    const ctrl = new AbortController();
    articlesApi.list(params)
      .then((res) => { if (!ctrl.signal.aborted) { setRows(res.data); setMeta(res.meta); } })
      .catch((err) => { if (!ctrl.signal.aborted) setError(err instanceof ApiError ? err.message : "Gagal memuat data"); })
      .finally(() => { if (!ctrl.signal.aborted) setLoading(false); });
    return () => ctrl.abort();
  }, [params]);

  function upd(next: Partial<ListParams>) {
    const sp = new URLSearchParams(searchParams.toString());
    for (const [k, v] of Object.entries(next)) {
      if (v === undefined || v === "" || v === null) sp.delete(k);
      else sp.set(k, String(v));
    }
    router.replace(`${pathname}?${sp.toString()}`, { scroll: false });
  }

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const res = await articlesApi.list(params);
      setRows(res.data);
      setMeta(res.meta);
      setError(null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Gagal memuat data");
    } finally {
      setLoading(false);
    }
  }, [params]);

  async function handlePublishToggle() {
    if (!publishTarget) return;
    const isPub = publishTarget.status === "published" || publishTarget.published;
    try {
      await articlesApi.update(publishTarget.id, {
        published: !isPub,
        status: isPub ? "archived" : "published",
        publishedAt: isPub ? null : new Date().toISOString(),
      } as Record<string, unknown>);
      toast.success(isPub ? "Artikel diarsipkan" : "Artikel diterbitkan");
      setPublishTarget(null);
      await refresh();
      setStats(await fetchStats());
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Gagal mengubah status");
    }
  }

  const columns: ColumnDef<Article>[] = useMemo(() => [
    {
      id: "Artikel",
      header: "Artikel",
      cell: ({ row }) => (
        <div className="flex items-center gap-3 min-w-0 max-w-[320px]">
          <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-muted">
            <AdminImage src={row.original.coverImage} alt="" className="h-full w-full object-cover" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-foreground">{row.original.title}</p>
            <p className="truncate text-xs text-muted-foreground">/{row.original.slug}</p>
          </div>
        </div>
      ),
    },
    {
      id: "Kategori",
      header: "Kategori",
      cell: ({ row }) => (
        <Badge variant="outline" className="text-xs font-normal">{row.original.category}</Badge>
      ),
    },
    {
      id: "Status",
      header: "Status",
      cell: ({ row }) => {
        const st = row.original.status || (row.original.published ? "published" : "draft");
        return <StatusBadge status={st} />;
      },
    },
    {
      id: "Unggulan",
      header: "Unggulan",
      cell: ({ row }) => row.original.featured ? (
        <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
      ) : <span className="text-muted-foreground/40">&mdash;</span>,
    },
    {
      id: "Terbit",
      header: "Terbit",
      cell: ({ row }) => {
        const d = row.original.publishedAt || row.original.createdAt;
        return d ? (
          <span className="text-sm text-muted-foreground whitespace-nowrap">
            {new Date(d).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
          </span>
        ) : <span className="text-sm text-muted-foreground/40">&mdash;</span>;
      },
    },
    {
      id: "Aksi",
      header: () => <span className="sr-only">Aksi</span>,
      enableHiding: false,
      cell: ({ row }) => {
        const a = row.original;
        const isPub = a.status === "published" || a.published;
        return (
          <div className="flex justify-end gap-0.5">
            <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
              <Link href={`/admin/articles/${a.id}`} aria-label="Lihat detail">
                <Eye className="h-3.5 w-3.5" />
              </Link>
            </Button>
            {can(session, permissions.contentWrite) && (
              <>
                <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                  <Link href={`/admin/articles/${a.id}`} aria-label="Edit">
                    <Pencil className="h-3.5 w-3.5" />
                  </Link>
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setPublishTarget(a)}
                  aria-label={isPub ? "Arsipkan" : "Terbitkan"}
                >
                  {isPub ? (
                    <Archive className="h-3.5 w-3.5 text-amber-500" />
                  ) : (
                    <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />
                  )}
                </Button>
              </>
            )}
            {can(session, permissions.contentDelete) && (
              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" asChild>
                <Link href={`/admin/articles/${a.id}/delete`} aria-label="Hapus">
                  <Trash2 className="h-3.5 w-3.5" />
                </Link>
              </Button>
            )}
          </div>
        );
      },
    },
  ], [session]);

  const canCreate = can(session, permissions.contentWrite);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Blog"
        title="Artikel"
        description="Kelola artikel blog, status publikasi, metadata SEO, dan konten unggulan."
        action={canCreate ? (
          <Button asChild>
            <Link href="/admin/articles/new">
              <Plus className="h-4 w-4" />
              Tulis Artikel
            </Link>
          </Button>
        ) : undefined}
      />

      {statsLoading ? (
        <MetricCardsSkeleton count={4} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <SummaryCard
            icon={<FileText className="h-5 w-5" />}
            label="Total Artikel"
            value={stats.total}
            variant="neutral"
          />
          <SummaryCard
            icon={<CheckCircle className="h-5 w-5" />}
            label="Terbit"
            value={stats.published}
            variant="success"
          />
          <SummaryCard
            icon={<Clock className="h-5 w-5" />}
            label="Draf"
            value={stats.draft}
            variant="warning"
          />
          <SummaryCard
            icon={<CalendarDays className="h-5 w-5" />}
            label="Terjadwal"
            value={stats.scheduled}
            variant="info"
          />
        </div>
      )}

      <AdminDataGrid
        data={rows}
        columns={columns}
        meta={meta}
        loading={loading}
        error={error}
        search={params.q}
        searchPlaceholder="Cari judul, kategori, atau slug..."
        filters={statusFilters}
        activeFilter={params.status}
        emptyTitle="Belum ada artikel"
        emptyDescription="Tulis artikel pertama Anda atau ubah filter pencarian."
        onSearchChange={(q) => upd({ q, page: 1 })}
        onFilterChange={(status) => upd({ status, page: 1 })}
        onPageChange={(page) => upd({ page })}
        onRefresh={refresh}
      />

      <ConfirmDialog
        open={Boolean(publishTarget)}
        onOpenChange={(open) => { if (!open) setPublishTarget(null); }}
        title={(publishTarget?.status === "published" || publishTarget?.published) ? "Arsipkan Artikel?" : "Terbitkan Artikel?"}
        description={
          (publishTarget?.status === "published" || publishTarget?.published)
            ? "Artikel akan dipindahkan ke arsip dan tidak tampil di halaman publik."
            : "Artikel akan langsung tampil di halaman publik blog."
        }
        confirmLabel={(publishTarget?.status === "published" || publishTarget?.published) ? "Ya, Arsipkan" : "Ya, Terbitkan"}
        variant={(publishTarget?.status === "published" || publishTarget?.published) ? "destructive" : "default"}
        onConfirm={handlePublishToggle}
      />
    </div>
  );
}
