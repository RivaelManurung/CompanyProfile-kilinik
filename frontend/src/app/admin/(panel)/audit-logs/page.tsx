"use client";

/* eslint-disable react-hooks/set-state-in-effect */

import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { ColumnDef } from "@tanstack/react-table";
import { AdminDataGrid } from "@/components/admin/AdminDataGrid";
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
    status: "",
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

  const load = useCallback(async () => {
    setLoading(true);
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

  useEffect(() => {
    void load();
  }, [load]);

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
      { id: "Waktu", header: "Waktu", cell: ({ row }) => <span className="text-sm text-muted-foreground">{fmt(row.original.createdAt)}</span> },
      { id: "Admin", header: "Admin", cell: ({ row }) => row.original.adminEmail || "system" },
      { id: "Aksi", header: "Aksi", cell: ({ row }) => <span className="font-medium">{row.original.action}</span> },
      { id: "Resource", header: "Resource", cell: ({ row }) => `${row.original.resource}${row.original.resourceId ? ` #${row.original.resourceId}` : ""}` },
      { id: "IP", header: "IP", cell: ({ row }) => <span className="text-muted-foreground">{row.original.ip}</span> },
    ],
    [],
  );

  return (
    <div className="space-y-5">
      <div>
        <p className="text-sm font-medium text-muted-foreground">System accountability</p>
        <h2 className="text-2xl font-bold tracking-normal text-foreground">Audit Logs</h2>
      </div>
      <AdminDataGrid
        data={rows}
        columns={columns}
        meta={meta}
        loading={loading}
        error={error}
        search={params.q}
        searchPlaceholder="Cari admin, aksi, resource..."
        emptyTitle="Belum ada audit log"
        emptyDescription="Aktivitas sensitif admin akan tercatat di sini."
        onSearchChange={(q) => updateParams({ q, page: 1 })}
        onPageChange={(page) => updateParams({ page })}
        onRefresh={load}
      />
    </div>
  );
}
