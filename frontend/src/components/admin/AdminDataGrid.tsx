"use client";

import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
  type VisibilityState,
} from "@tanstack/react-table";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Columns3,
  RefreshCw,
  Search,
  Inbox,
} from "lucide-react";
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
import { cn } from "@/lib/utils";

export type GridFilter = { value: string; label: string };

export type BulkAction<TData> = {
  label: string;
  variant?: "default" | "destructive" | "outline" | "secondary";
  icon?: React.ReactNode;
  onClick: (selectedRows: TData[], clearSelection: () => void) => void | Promise<void>;
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
  emptyIcon,
  enableSelection = true,
  bulkActions = [],
  onSearchChange,
  onFilterChange,
  onPageChange,
  onLimitChange,
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
  enableSelection?: boolean;
  bulkActions?: BulkAction<TData>[];
  onSearchChange: (value: string) => void;
  onFilterChange?: (value: string) => void;
  onPageChange: (page: number) => void;
  onLimitChange?: (limit: number) => void;
  onRefresh: () => void;
}) {
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({});

  // Reset row selection when data changes (page/search change)
  useEffect(() => {
    setRowSelection({});
  }, [data]);

  // Debounce search so we don't fire a request on every keystroke.
  const [searchInput, setSearchInput] = useState(search);
  useEffect(() => {
    setSearchInput(search);
  }, [search]);
  useEffect(() => {
    if (searchInput === search) return;
    const t = setTimeout(() => onSearchChange(searchInput), 350);
    return () => clearTimeout(t);
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

  const finalColumns = useMemo(() => {
    if (!enableSelection) return columns;

    const selectColumn: ColumnDef<TData> = {
      id: "select",
      header: ({ table }) => (
        <div className="flex items-center justify-center pl-1">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-muted/50 text-primary focus:ring-primary bg-background cursor-pointer"
            checked={table.getIsAllPageRowsSelected()}
            ref={(el) => {
              if (el) {
                el.indeterminate = table.getIsSomePageRowsSelected();
              }
            }}
            onChange={table.getToggleAllPageRowsSelectedHandler()}
            aria-label="Pilih semua"
          />
        </div>
      ),
      cell: ({ row }) => (
        <div className="flex items-center justify-center pl-1">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-muted/50 text-primary focus:ring-primary bg-background cursor-pointer"
            checked={row.getIsSelected()}
            disabled={!row.getCanSelect()}
            onChange={row.getToggleSelectedHandler()}
            aria-label="Pilih baris"
          />
        </div>
      ),
      enableHiding: false,
    };

    return [selectColumn, ...columns];
  }, [columns, enableSelection]);

  const table = useReactTable({
    data,
    columns: finalColumns,
    state: { columnVisibility, rowSelection },
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    pageCount: safeMeta.totalPages,
    enableRowSelection: true,
  });

  return (
    <div className="space-y-4 relative">
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
                    {finalColumns.map((_, ci) => (
                      <TableCell key={ci} className="px-4 py-3">
                        <Skeleton className={cn("h-4", ci === 0 ? "w-1/2" : "w-3/4")} />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : error ? (
                <TableRow>
                  <TableCell colSpan={finalColumns.length} className="px-4 py-12 text-center">
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
                  <TableCell colSpan={finalColumns.length} className="px-4 py-12">
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

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between px-1">
        <span className="text-xs text-muted-foreground">
          {enableSelection ? (
            <>
              {table.getSelectedRowModel().rows.length} dari {safeMeta.total} baris dipilih
            </>
          ) : (
            <>
              Total {safeMeta.total} data
            </>
          )}
        </span>
        
        <div className="flex flex-wrap items-center gap-4 sm:gap-6">
          {onLimitChange && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground whitespace-nowrap">Baris per halaman</span>
              <select
                value={safeMeta.limit}
                onChange={(e) => onLimitChange(Number(e.target.value))}
                className="h-8 rounded-md border border-input bg-background text-xs px-2 py-1 focus:outline-none focus:ring-1 focus:ring-ring cursor-pointer font-medium text-foreground"
              >
                {[10, 20, 50, 100].map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
            </div>
          )}

          <span className="text-xs text-muted-foreground min-w-[80px] text-center font-medium">
            Halaman {safeMeta.page} dari {safeMeta.totalPages}
          </span>

          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              disabled={safeMeta.page <= 1 || loading}
              onClick={() => onPageChange(1)}
              aria-label="Halaman pertama"
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              disabled={safeMeta.page <= 1 || loading}
              onClick={() => onPageChange(safeMeta.page - 1)}
              aria-label="Halaman sebelumnya"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              disabled={safeMeta.page >= safeMeta.totalPages || loading}
              onClick={() => onPageChange(safeMeta.page + 1)}
              aria-label="Halaman berikutnya"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              disabled={safeMeta.page >= safeMeta.totalPages || loading}
              onClick={() => onPageChange(safeMeta.totalPages)}
              aria-label="Halaman terakhir"
            >
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {enableSelection && table.getSelectedRowModel().rows.length > 0 && bulkActions.length > 0 && (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 flex items-center gap-4 rounded-full border border-border bg-background/90 px-6 py-3.5 shadow-2xl backdrop-blur-md animate-in fade-in slide-in-from-bottom-4 duration-300">
          <span className="text-xs font-semibold text-muted-foreground whitespace-nowrap">
            <strong className="text-foreground text-sm font-bold mr-1">{table.getSelectedRowModel().rows.length}</strong> dipilih
          </span>
          <div className="h-4 w-px bg-border" />
          <div className="flex items-center gap-1.5">
            {bulkActions.map((action, idx) => (
              <Button
                key={idx}
                variant={action.variant || "outline"}
                size="sm"
                className="h-8 rounded-full text-xs font-semibold px-4"
                onClick={() => {
                  const selectedItems = table.getSelectedRowModel().rows.map(r => r.original);
                  action.onClick(selectedItems, () => table.resetRowSelection());
                }}
              >
                {action.icon && <span className="mr-1.5 h-3.5 w-3.5 flex items-center">{action.icon}</span>}
                {action.label}
              </Button>
            ))}
            <Button
              variant="ghost"
              size="sm"
              className="h-8 rounded-full text-xs font-semibold px-4 hover:bg-muted"
              onClick={() => table.resetRowSelection()}
            >
              Batal
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
