"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import type { ColumnDef } from "@tanstack/react-table";
import { Eye, MailCheck, MailX, UsersRound } from "lucide-react";
import { AdminDataGrid } from "@/components/admin/AdminDataGrid";
import { StatusBadge } from "@/components/admin/status-badge";
import { PageHeader } from "@/components/admin/page-header";
import { patientsApi, ApiError } from "@/lib/admin/api";
import type { ListMeta, ListParams, Patient } from "@/lib/admin/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const emptyMeta: ListMeta = { total: 0, page: 1, limit: 20, totalPages: 1 };

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

function getParams(searchParams: URLSearchParams): Required<ListParams> {
  return {
    page: Number(searchParams.get("page") || 1),
    limit: Number(searchParams.get("limit") || 20),
    q: searchParams.get("q") || "",
    status: searchParams.get("status") || "",
    sort: searchParams.get("sort") || "created_at",
    direction: (searchParams.get("direction") as "asc" | "desc") || "desc",
  };
}

export default function PatientsPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const params = useMemo(() => getParams(searchParams), [searchParams]);

  const [rows, setRows] = useState<Patient[]>([]);
  const [meta, setMeta] = useState<ListMeta>(emptyMeta);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (showLoader = false) => {
    if (showLoader) setLoading(true);
    setError(null);
    try {
      const res = await patientsApi.list(params);
      setRows(res.data);
      setMeta(res.meta);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Gagal memuat data pasien");
    } finally {
      setLoading(false);
    }
  }, [params]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  function updateParams(next: Partial<ListParams>) {
    const sp = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(next)) {
      if (value === undefined || value === "" || value === null) sp.delete(key);
      else sp.set(key, String(value));
    }
    router.replace(`${pathname}?${sp.toString()}`, { scroll: false });
  }

  const columns = useMemo<ColumnDef<Patient>[]>(
    () => [
      {
        id: "No. RM",
        header: "No. RM",
        cell: ({ row }) =>
          row.original.medicalRecordNo ? (
            <Badge variant="outline" className="font-mono text-xs">
              {row.original.medicalRecordNo}
            </Badge>
          ) : (
            <span className="text-xs text-muted-foreground">—</span>
          ),
      },
      {
        id: "Pasien",
        header: "Pasien",
        cell: ({ row }) => (
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
              {row.original.name?.charAt(0)?.toUpperCase() || "?"}
            </div>
            <div className="min-w-0">
              <p className="font-medium text-foreground">{row.original.name}</p>
              <p className="truncate text-xs text-muted-foreground">{row.original.email || "—"}</p>
            </div>
          </div>
        ),
      },
      {
        id: "Telepon",
        header: "Telepon",
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">{row.original.phone || "—"}</span>
        ),
      },
      {
        id: "Kelamin",
        header: "Kelamin",
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">{sexLabel(row.original.sex)}</span>
        ),
      },
      {
        id: "Email",
        header: "Email Terverifikasi",
        cell: ({ row }) =>
          row.original.emailVerifiedAt ? (
            <Badge variant="secondary" className="gap-1 border-transparent bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300">
              <MailCheck className="size-3" /> Terverifikasi
            </Badge>
          ) : (
            <Badge variant="secondary" className="gap-1 border-transparent bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-300">
              <MailX className="size-3" /> Belum
            </Badge>
          ),
      },
      {
        id: "Status",
        header: "Status",
        cell: ({ row }) => <StatusBadge status={row.original.active ? "active" : "inactive"} />,
      },
      {
        id: "Aksi",
        header: () => <span className="sr-only">Aksi</span>,
        enableHiding: false,
        cell: ({ row }) => (
          <div className="flex justify-end">
            <Button variant="ghost" size="icon" className="h-8 w-8" asChild aria-label="Lihat detail pasien">
              <Link href={`/admin/patients/${row.original.id}`}>
                <Eye className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        ),
      },
    ],
    [],
  );

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Operations"
        title="Pasien"
        description="Direktori pasien terdaftar. Cari berdasarkan nama, email, telepon, NIK, atau No. RM, lalu buka detail untuk melihat riwayat janji temu."
      />

      <AdminDataGrid
        data={rows}
        columns={columns}
        meta={meta}
        loading={loading}
        error={error}
        search={params.q}
        searchPlaceholder="Cari nama, email, telepon, NIK, atau No. RM..."
        emptyIcon={<UsersRound className="h-6 w-6" />}
        emptyTitle="Belum ada pasien"
        emptyDescription="Data pasien akan muncul di sini setelah pasien mendaftar atau filter diubah."
        enableSelection={false}
        onSearchChange={(q) => updateParams({ q, page: 1 })}
        onPageChange={(page) => updateParams({ page })}
        onLimitChange={(limit) => updateParams({ limit, page: 1 })}
        onRefresh={() => load(true)}
      />
    </div>
  );
}
