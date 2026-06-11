"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { ColumnDef } from "@tanstack/react-table";
import { Shield, History, AlertTriangle, CheckCircle2, Info } from "lucide-react";
import { AdminDataGrid } from "@/components/admin/AdminDataGrid";
import { PageHeader } from "@/components/admin/page-header";
import { SummaryCard } from "@/components/admin/summary-card";
import { auditApi, ApiError } from "@/lib/admin/api";
import type { AuditLog, ListMeta, ListParams } from "@/lib/admin/types";

const emptyMeta: ListMeta = { total: 0, page: 1, limit: 20, totalPages: 1 };

function fmt(iso: string) {
  return new Date(iso).toLocaleString("id-ID", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
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

export default function AuditLogsPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const params = useMemo(() => paramsFromUrl(searchParams), [searchParams]);
  const [rows, setRows] = useState<AuditLog[]>([]);
  const [meta, setMeta] = useState<ListMeta>(emptyMeta);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    auditApi.list(params)
      .then((res) => {
        setRows(res.data);
        setMeta(res.meta);
      })
      .catch((err) => {
        setError(err instanceof ApiError ? err.message : "Gagal memuat audit log");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [params]);

  const load = useCallback(async (showLoader = false) => {
    if (showLoader) setLoading(true);
    setError(null);
    try {
      const res = await auditApi.list(params);
      setRows(res.data);
      setMeta(res.meta);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Gagal memuat audit log");
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

  const columns = useMemo<ColumnDef<AuditLog>[]>(
    () => [
      {
        id: "Waktu",
        header: "Time",
        cell: ({ row }) => <span className="text-sm text-muted-foreground">{fmt(row.original.createdAt)}</span>,
      },
      {
        id: "Admin",
        header: "Admin",
        cell: ({ row }) => <span className="text-sm font-medium text-foreground">{row.original.adminEmail || "system"}</span>,
      },
      {
        id: "Aksi",
        header: "Action",
        cell: ({ row }) => <span className="font-medium text-foreground">{row.original.action}</span>,
      },
      {
        id: "Resource",
        header: "Resource",
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {row.original.resource}
            {row.original.resourceId ? <span className="text-xs ml-1 text-muted-foreground/60">#{row.original.resourceId}</span> : null}
          </span>
        ),
      },
      {
        id: "IP",
        header: "IP",
        cell: ({ row }) => <code className="text-xs text-muted-foreground">{row.original.ip}</code>,
      },
    ],
    [],
  );

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="System"
        title="Audit Logs"
        description="Track administrative actions, security-sensitive changes, and system activity."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard icon={<History className="h-5 w-5" />} label="Total Events" value={meta.total} />
        <SummaryCard icon={<Info className="h-5 w-5" />} label="Today Events" value={rows.filter((r) => new Date(r.createdAt).toDateString() === new Date().toDateString()).length} variant="info" />
        <SummaryCard icon={<AlertTriangle className="h-5 w-5" />} label="High Risk Actions" value={rows.filter((r) => r.action.toLowerCase().includes("delete") || r.action.toLowerCase().includes("create")).length} variant="warning" />
        <SummaryCard icon={<CheckCircle2 className="h-5 w-5" />} label="Success Rate" value={rows.length > 0 ? "100%" : "0%"} variant="success" />
      </div>

      <AdminDataGrid
        data={rows}
        columns={columns}
        meta={meta}
        loading={loading}
        error={error}
        search={params.q}
        searchPlaceholder="Cari admin, aksi, resource..."
        emptyTitle="No audit activity"
        emptyDescription="System activities will appear here after admins make changes."
        emptyIcon={<Shield className="h-6 w-6" />}
        onSearchChange={(q) => updateParams({ q, page: 1 })}
        onPageChange={(page) => updateParams({ page })}
        onRefresh={() => load(true)}
      />
    </div>
  );
}
