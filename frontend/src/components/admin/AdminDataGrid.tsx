"use client";

import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
  type VisibilityState,
} from "@tanstack/react-table";
import { ChevronLeft, ChevronRight, Columns3, RefreshCw, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { ListMeta } from "@/lib/admin/types";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState } from "@/components/admin/empty-state";
import { Inbox } from "lucide-react";
import { cn } from "@/lib/utils";

export type GridFilter = { value: string; label: string };

export function AdminDataGrid<TData>({
  data,
  columns,
  meta,
  loading,
  error,
  search,
  searchPlaceholder = "Cari data...",
  filters = [],
  activeFilter = "",
  emptyTitle = "Belum ada data",
  emptyDescription = "Data akan muncul setelah dibuat atau filter diubah.",
  emptyIcon,
  onSearchChange,
  onFilterChange,
  onPageChange,
  onRefresh,
}: {
  data: TData[];
  columns: ColumnDef<TData>[];
  meta: ListMeta;
  loading?: boolean;
  error?: string | null;
  search: string;
  searchPlaceholder?: string;
  filters?: GridFilter[];
  activeFilter?: string;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyIcon?: React.ReactNode;
  onSearchChange: (value: string) => void;
  onFilterChange?: (value: string) => void;
  onPageChange: (page: number) => void;
  onRefresh: () => void;
}) {
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});

  // Debounce search so we don't fire a request on every keystroke.
  const [searchInput, setSearchInput] = useState(search);
  useEffect(() => {
    setSearchInput(search);
  }, [search]);
  useEffect(() => {
    if (searchInput === search) return;
    const t = setTimeout(() => onSearchChange(searchInput), 350);
    return () => clearTimeout(t);
    // onSearchChange is stable enough; we intentionally watch only the input/value pair.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput, search]);

  const safeMeta = useMemo(
    () => ({
      page: meta.page || 1,
      limit: meta.limit || 20,
      total: meta.total || 0,
      totalPages: meta.totalPages || Math.max(1, Math.ceil((meta.total || 0) / (meta.limit || 20))),
    }),
    [meta],
  );

  const table = useReactTable({
    data,
    columns,
    state: { columnVisibility },
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    pageCount: safeMeta.totalPages,
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/60" />
            <Input
              type="search"
              aria-label={searchPlaceholder}
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder={searchPlaceholder}
              className="h-9 border-muted/50 bg-background pl-9 text-sm placeholder:text-muted-foreground/50"
            />
          </div>
          {filters.length > 0 && (
            <div className="flex flex-wrap gap-1" role="group" aria-label="Filter tabel">
              {filters.map((filter) => (
                <button
                  key={filter.value}
                  type="button"
                  aria-pressed={activeFilter === filter.value}
                  onClick={() => onFilterChange?.(filter.value)}
                  className={
                    activeFilter === filter.value
                      ? "rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground shadow-sm"
                      : "rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
                  }
                >
                  {filter.label}
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="h-9" onClick={onRefresh} aria-label="Muat ulang data">
            <RefreshCw className="h-3.5 w-3.5" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-9">
                <Columns3 className="h-3.5 w-3.5" />
                Kolom
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Tampilkan kolom</DropdownMenuLabel>
              {table
                .getAllLeafColumns()
                .filter((column) => column.getCanHide())
                .map((column) => (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    checked={column.getIsVisible()}
                    onCheckedChange={(value) => column.toggleVisibility(Boolean(value))}
                  >
                    {column.id}
                  </DropdownMenuCheckboxItem>
                ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <Card className="overflow-hidden rounded-xl border p-0 shadow-sm">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id} className="bg-muted/30">
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id} scope="col" className="h-10 px-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">
                      {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, index) => (
                  <TableRow key={index}>
                    {columns.map((_, ci) => (
                      <TableCell key={ci} className="px-4 py-3">
                        <Skeleton className={cn("h-4", ci === 0 ? "w-1/2" : "w-3/4")} />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : error ? (
                <TableRow>
                  <TableCell colSpan={columns.length} className="px-4 py-12 text-center">
                    <div className="mx-auto max-w-sm">
                      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-destructive/10">
                        <span className="text-destructive/60 text-lg font-bold">!</span>
                      </div>
                      <p className="font-semibold text-foreground">Gagal memuat data</p>
                      <p className="mt-1 text-sm text-muted-foreground">{error}</p>
                      <Button variant="outline" className="mt-4" onClick={onRefresh}>
                        Coba lagi
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ) : table.getRowModel().rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={columns.length} className="px-4 py-12">
                    <EmptyState
                      icon={emptyIcon ?? <Inbox className="h-6 w-6" />}
                      title={emptyTitle}
                      description={emptyDescription}
                    />
                  </TableCell>
                </TableRow>
              ) : (
                table.getRowModel().rows.map((row) => (
                  <TableRow key={row.id} className="hover:bg-muted/20 transition-colors">
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id} className="px-4 py-3 text-sm">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      <div className="flex flex-col gap-3 text-sm sm:flex-row sm:items-center sm:justify-between">
        <span className="text-muted-foreground">
          <span className="font-medium text-foreground">{safeMeta.total}</span> data
          <span className="hidden sm:inline"> &middot; Halaman {safeMeta.page} dari {safeMeta.totalPages}</span>
        </span>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={safeMeta.page <= 1 || loading}
            onClick={() => onPageChange(safeMeta.page - 1)}
          >
            <ChevronLeft className="h-4 w-4" />
            Sebelumnya
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={safeMeta.page >= safeMeta.totalPages || loading}
            onClick={() => onPageChange(safeMeta.page + 1)}
          >
            Berikutnya
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
