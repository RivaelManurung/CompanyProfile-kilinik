"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, type Resolver } from "react-hook-form";
import type { ColumnDef } from "@tanstack/react-table";
import { toast } from "sonner";
import { Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { AdminDataGrid, type GridFilter } from "@/components/admin/AdminDataGrid";
import { ApiError } from "@/lib/admin/api";
import type { ListEnvelope, ListMeta, ListParams } from "@/lib/admin/types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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

export type FieldType = "text" | "textarea" | "number" | "checkbox" | "tags" | "url";
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
  fields: Field[];
  schema: Parameters<typeof zodResolver>[0];
  toForm: (row?: T) => FormState;
  searchPlaceholder?: string;
  filters?: GridFilter[];
  defaultSort?: string;
  canCreate?: boolean;
  canEdit?: boolean;
  canDelete?: boolean;
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
  fields,
  schema,
  toForm,
  searchPlaceholder,
  filters = [],
  defaultSort,
  canCreate = true,
  canEdit = true,
  canDelete = true,
}: Props<T>) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const params = useMemo(() => getParams(searchParams, defaultSort), [searchParams, defaultSort]);

  const [rows, setRows] = useState<T[]>([]);
  const [meta, setMeta] = useState<ListMeta>(emptyMeta);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<T | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<T | null>(null);
  const [deleting, setDeleting] = useState(false);

  const form = useForm<FormState>({
    resolver: zodResolver(schema) as Resolver<FormState>,
    defaultValues: toForm(),
  });

  const load = useCallback(async () => {
    setLoading(true);
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
    void load();
  }, [load]);

  function updateParams(next: Partial<ListParams>) {
    const sp = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(next)) {
      if (value === undefined || value === "" || value === null) {
        sp.delete(key);
      } else {
        sp.set(key, String(value));
      }
    }
    router.replace(`${pathname}?${sp.toString()}`, { scroll: false });
  }

  function openCreate() {
    setEditing(null);
    form.reset(toForm());
    setOpen(true);
  }

  const openEdit = useCallback((row: T) => {
    setEditing(row);
    form.reset(toForm(row));
    setOpen(true);
  }, [form, toForm]);

  function requestClose(nextOpen: boolean) {
    if (!nextOpen && form.formState.isDirty && !window.confirm("Perubahan belum disimpan. Tutup form?")) {
      return;
    }
    setOpen(nextOpen);
  }

  async function save(values: FormState) {
    try {
      const payload: Record<string, unknown> = { ...values };
      if (editing) {
        await api.update(editing.id, payload);
        toast.success(`${singular} diperbarui`);
      } else {
        await api.create(payload);
        toast.success(`${singular} ditambahkan`);
      }
      setOpen(false);
      await load();
    } catch (err) {
      if (err instanceof ApiError && err.details?.length) {
        for (const detail of err.details) {
          form.setError(detail.field, { message: detail.message });
        }
        return;
      }
      toast.error(err instanceof ApiError ? err.message : "Gagal menyimpan");
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.remove(deleteTarget.id);
      toast.success(`${singular} dihapus`);
      setDeleteTarget(null);
      await load();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Gagal menghapus");
    } finally {
      setDeleting(false);
    }
  }

  const tableColumns = useMemo<ColumnDef<T>[]>(() => {
    const mapped: ColumnDef<T>[] = columns.map((column) => ({
      id: column.header,
      header: column.header,
      cell: ({ row }) => <div className={column.className}>{column.cell(row.original)}</div>,
    }));

    mapped.push({
      id: "Aksi",
      header: () => <span className="sr-only">Aksi</span>,
      enableHiding: false,
      cell: ({ row }) => (
        <div className="flex justify-end gap-1">
          {canEdit && (
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(row.original)} aria-label={`Edit ${singular}`}>
              <Pencil className="h-4 w-4" />
            </Button>
          )}
          {canDelete && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-destructive hover:text-destructive"
              onClick={() => setDeleteTarget(row.original)}
              aria-label={`Hapus ${singular}`}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      ),
    });
    return mapped;
  }, [columns, canDelete, canEdit, openEdit, singular]);

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">Data operasional</p>
          <h2 className="text-2xl font-bold tracking-normal text-foreground">{title}</h2>
        </div>
        {canCreate && (
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" />
            Tambah {singular}
          </Button>
        )}
      </div>

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
        onSearchChange={(q) => updateParams({ q, page: 1 })}
        onFilterChange={(status) => updateParams({ status, page: 1 })}
        onPageChange={(page) => updateParams({ page })}
        onRefresh={load}
      />

      <Dialog open={open} onOpenChange={requestClose}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editing ? `Edit ${singular}` : `Tambah ${singular}`}</DialogTitle>
            <DialogDescription>
              Field bertanda wajib harus diisi. Validasi ditampilkan langsung di bawah field.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={form.handleSubmit(save)} className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              {fields.map((field) => {
                const type = field.type ?? "text";
                const errorMessage = form.formState.errors[field.name]?.message;
                const value = form.watch(field.name);
                return (
                  <div key={field.name} className={cn("space-y-2", field.full || type === "textarea" ? "col-span-2" : "col-span-2 sm:col-span-1")}>
                    {type !== "checkbox" && (
                      <Label htmlFor={field.name}>
                        {field.label}
                        {field.required ? <span className="text-destructive"> *</span> : null}
                      </Label>
                    )}
                    {type === "textarea" ? (
                      <Textarea id={field.name} rows={5} placeholder={field.placeholder} {...form.register(field.name)} aria-invalid={Boolean(errorMessage)} />
                    ) : type === "checkbox" ? (
                      <div className="flex items-center gap-2 rounded-md border border-border p-3">
                        <Switch
                          id={field.name}
                          checked={Boolean(value)}
                          onCheckedChange={(checked) => form.setValue(field.name, checked, { shouldDirty: true, shouldValidate: true })}
                        />
                        <Label htmlFor={field.name}>{field.label}</Label>
                      </div>
                    ) : type === "tags" ? (
                      <Input
                        id={field.name}
                        value={Array.isArray(value) ? value.join(", ") : ""}
                        placeholder={field.placeholder}
                        onChange={(event) =>
                          form.setValue(
                            field.name,
                            event.target.value.split(",").map((part) => part.trim()).filter(Boolean),
                            { shouldDirty: true, shouldValidate: true },
                          )
                        }
                        aria-invalid={Boolean(errorMessage)}
                      />
                    ) : type === "number" ? (
                      <Input
                        id={field.name}
                        type="number"
                        value={String(value ?? "")}
                        placeholder={field.placeholder}
                        onChange={(event) =>
                          form.setValue(field.name, event.target.value === "" ? "" : Number(event.target.value), {
                            shouldDirty: true,
                            shouldValidate: true,
                          })
                        }
                        aria-invalid={Boolean(errorMessage)}
                      />
                    ) : (
                      <Input id={field.name} type={type === "url" ? "url" : "text"} placeholder={field.placeholder} {...form.register(field.name)} aria-invalid={Boolean(errorMessage)} />
                    )}
                    {field.hint && <p className="text-xs text-muted-foreground">{field.hint}</p>}
                    {errorMessage && <p className="text-xs font-medium text-destructive">{String(errorMessage)}</p>}
                  </div>
                );
              })}
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => requestClose(false)} disabled={form.formState.isSubmitting}>
                Batal
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Menyimpan
                  </>
                ) : (
                  "Simpan"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={(next) => !next && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus {singular.toLowerCase()}?</AlertDialogTitle>
            <AlertDialogDescription>
              Tindakan ini permanen dan tercatat di audit log. Pastikan data ini memang tidak dibutuhkan.
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
