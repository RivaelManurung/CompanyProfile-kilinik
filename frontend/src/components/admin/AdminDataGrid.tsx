"use client";

import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
  type VisibilityState,
} from "@tanstack/react-table";
import { ChevronLeft, ChevronRight, Columns3, RefreshCw, Search } from "lucide-react";
import { useMemo, useState } from "react";
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

export type GridFilter = {
  value: string;
  label: string;
};

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
  onSearchChange: (value: string) => void;
  onFilterChange?: (value: string) => void;
  onPageChange: (page: number) => void;
  onRefresh: () => void;
}) {
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
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
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder={searchPlaceholder}
              className="pl-9"
            />
          </div>
          {filters.length > 0 && (
            <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filter tabel">
              {filters.map((filter) => (
                <button
                  key={filter.value}
                  type="button"
                  aria-pressed={activeFilter === filter.value}
                  onClick={() => onFilterChange?.(filter.value)}
                  className={
                    activeFilter === filter.value
                      ? "rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground"
                      : "rounded-md border border-border bg-background px-3 py-2 text-sm font-semibold text-muted-foreground hover:bg-muted hover:text-foreground"
                  }
                >
                  {filter.label}
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={onRefresh} aria-label="Muat ulang data">
            <RefreshCw className="h-4 w-4" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <Columns3 className="h-4 w-4" />
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

      <Card className="overflow-hidden p-0">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 6 }).map((_, index) => (
                <TableRow key={index}>
                  <TableCell colSpan={columns.length}>
                    <Skeleton className="h-7 w-full" />
                  </TableCell>
                </TableRow>
              ))
            ) : error ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="py-12 text-center">
                  <div className="mx-auto max-w-sm">
                    <p className="font-semibold text-foreground">Gagal memuat data</p>
                    <p className="mt-2 text-sm text-muted-foreground">{error}</p>
                    <Button variant="outline" className="mt-4" onClick={onRefresh}>
                      Coba lagi
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="py-12 text-center">
                  <div className="mx-auto max-w-sm">
                    <p className="font-semibold text-foreground">{emptyTitle}</p>
                    <p className="mt-2 text-sm text-muted-foreground">{emptyDescription}</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      <div className="flex flex-col gap-3 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <span>
          {safeMeta.total} data · Halaman {safeMeta.page} dari {safeMeta.totalPages}
        </span>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" disabled={safeMeta.page <= 1 || loading} onClick={() => onPageChange(safeMeta.page - 1)}>
            <ChevronLeft className="h-4 w-4" />
            Sebelumnya
          </Button>
          <Button variant="outline" size="sm" disabled={safeMeta.page >= safeMeta.totalPages || loading} onClick={() => onPageChange(safeMeta.page + 1)}>
            Berikutnya
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
