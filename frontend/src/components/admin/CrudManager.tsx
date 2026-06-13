"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { AdminDataGrid, type GridFilter } from "@/components/admin/AdminDataGrid";
import { PageHeader } from "@/components/admin/page-header";
import { ApiError } from "@/lib/admin/api";
import type { ListEnvelope, ListMeta, ListParams } from "@/lib/admin/types";
import { Button } from "@/components/ui/button";

export type FieldType =
  | "text"
  | "textarea"
  | "number"
  | "checkbox"
  | "tags"
  | "url"
  | "select"
  | "password"
  | "date"
  | "datetime"
  | "map"
  | "image"
  | "icon";
export type FieldValue = string | number | boolean | string[];
export type FormState = Record<string, FieldValue>;

export interface Field {
  name: string;
  label: string;
  type?: FieldType;
  placeholder?: string;
  full?: boolean;
  hint?: string;
  required?: boolean;
  section?: string;
  options?: { value: string; label: string }[];
  /** For type "map": the form field that stores longitude (this field stores latitude). */
  lngName?: string;
  /** For type "image": subfolder the upload is stored under. */
  uploadFolder?: string;
  /** For type "image": preview aspect ratio. */
  imageAspect?: "video" | "square" | "wide";
}

export interface Column<T> {
  header: string;
  cell: (row: T) => React.ReactNode;
  className?: string;
}

export interface ResourceApi<T> {
  list: (params?: ListParams) => Promise<ListEnvelope<T>>;
  create: (body: Record<string, unknown>) => Promise<T>;
  update: (id: number, body: Record<string, unknown>) => Promise<T>;
  remove: (id: number) => Promise<unknown>;
}

interface Props<T extends { id: number }> {
  title: string;
  singular: string;
  api: ResourceApi<T>;
  columns: Column<T>[];
  searchPlaceholder?: string;
  filters?: GridFilter[];
  defaultSort?: string;
  basePath: string;
  canCreate?: boolean;
  canEdit?: boolean;
  canDelete?: boolean;
  eyebrow?: string;
  description?: string;
  metricCards?: React.ReactNode;
}

const emptyMeta: ListMeta = { total: 0, page: 1, limit: 20, totalPages: 1 };

function getParams(searchParams: URLSearchParams, defaultSort?: string): Required<ListParams> {
  return {
    page: Number(searchParams.get("page") || 1),
    limit: Number(searchParams.get("limit") || 20),
    q: searchParams.get("q") || "",
    status: searchParams.get("status") || "",
    sort: searchParams.get("sort") || defaultSort || "created_at",
    direction: (searchParams.get("direction") as "asc" | "desc") || "asc",
  };
}

export function CrudManager<T extends { id: number }>({
  title,
  singular,
  api,
  columns,
  searchPlaceholder,
  filters = [],
  defaultSort,
  basePath,
  canCreate = true,
  canEdit = true,
  canDelete = true,
  eyebrow,
  description,
  metricCards,
}: Props<T>) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const params = useMemo(() => getParams(searchParams, defaultSort), [searchParams, defaultSort]);

  const [rows, setRows] = useState<T[]>([]);
  const [meta, setMeta] = useState<ListMeta>(emptyMeta);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (showLoader = false) => {
    if (showLoader) setLoading(true);
    setError(null);
    try {
      const res = await api.list(params);
      setRows(res.data);
      setMeta(res.meta);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Gagal memuat data");
    } finally {
      setLoading(false);
    }
  }, [api, params]);

  useEffect(() => {
    const controller = new AbortController();
    api.list(params)
      .then((res) => {
        if (!controller.signal.aborted) {
          setRows(res.data);
          setMeta(res.meta);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!controller.signal.aborted) {
          setError(err instanceof ApiError ? err.message : "Gagal memuat data");
          setLoading(false);
        }
      });
    return () => { controller.abort(); };
  }, [api, params]);

  function updateParams(next: Partial<ListParams>) {
    const sp = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(next)) {
      if (value === undefined || value === "" || value === null) sp.delete(key);
      else sp.set(key, String(value));
    }
    router.replace(`${pathname}?${sp.toString()}`, { scroll: false });
  }

  const tableColumns = useMemo(() => {
    const mapped: {
      id: string;
      header: string | (() => React.ReactNode);
      cell: (info: { row: { original: T } }) => React.ReactNode;
      enableHiding?: boolean;
    }[] = columns.map((column) => ({
      id: column.header,
      header: column.header,
      cell: ({ row }: { row: { original: T } }) => (
        <div className={column.className}>{column.cell(row.original)}</div>
      ),
    }));

    mapped.push({
      id: "Aksi",
      header: () => <span className="sr-only">Aksi</span>,
      enableHiding: false,
      cell: ({ row }: { row: { original: T } }) => (
        <div className="flex justify-end gap-1">
          {canEdit && (
            <Button variant="ghost" size="icon" className="h-8 w-8" asChild aria-label={`Edit ${singular}`}>
              <Link href={`${basePath}/${row.original.id}`}>
                <Pencil className="h-4 w-4" />
              </Link>
            </Button>
          )}
          {canDelete && (
            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" asChild aria-label={`Hapus ${singular}`}>
              <Link href={`${basePath}/${row.original.id}/delete`}>
                <Trash2 className="h-4 w-4" />
              </Link>
            </Button>
          )}
        </div>
      ),
    });
    return mapped;
  }, [columns, canDelete, canEdit, singular, basePath]);

  const bulkActions = useMemo(() => {
    const actions = [];
    if (canDelete) {
      actions.push({
        label: "Hapus Terpilih",
        variant: "destructive" as const,
        icon: <Trash2 className="h-3.5 w-3.5" />,
        onClick: async (selectedRows: T[], clearSelection: () => void) => {
          const confirmed = window.confirm(`Apakah Anda yakin ingin menghapus ${selectedRows.length} data terpilih?`);
          if (!confirmed) return;

          toast.loading(`Menghapus ${selectedRows.length} data...`, { id: "bulk-delete" });
          try {
            await Promise.all(selectedRows.map(row => api.remove(row.id)));
            toast.success(`Berhasil menghapus ${selectedRows.length} data`, { id: "bulk-delete" });
            clearSelection();
            load(true);
          } catch (err) {
            toast.error(err instanceof ApiError ? err.message : "Gagal menghapus data", { id: "bulk-delete" });
          }
        }
      });
    }
    return actions;
  }, [canDelete, api, load]);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={eyebrow ?? "Data operasional"}
        title={title}
        description={description}
        action={
          canCreate ? (
            <Button asChild>
              <Link href={`${basePath}/new`}>
                <Plus className="h-4 w-4" />
                Tambah {singular}
              </Link>
            </Button>
          ) : undefined
        }
      />

      {metricCards && <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{metricCards}</div>}

      <AdminDataGrid
        data={rows}
        columns={tableColumns}
        meta={meta}
        loading={loading}
        error={error}
        search={params.q}
        searchPlaceholder={searchPlaceholder ?? `Cari ${title.toLowerCase()}...`}
        filters={filters}
        activeFilter={params.status}
        emptyTitle={`Belum ada ${title.toLowerCase()}`}
        emptyDescription={`Tambahkan ${singular.toLowerCase()} pertama atau ubah filter pencarian.`}
        enableSelection={canDelete}
        bulkActions={bulkActions}
        onSearchChange={(q) => updateParams({ q, page: 1 })}
        onFilterChange={(status) => updateParams({ status, page: 1 })}
        onPageChange={(page) => updateParams({ page })}
        onLimitChange={(limit) => updateParams({ limit, page: 1 })}
        onRefresh={() => load(true)}
      />
    </div>
  );
}
