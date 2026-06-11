"use client";

import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SearchInput } from "@/components/admin/search-input";
import { FilterTabs, type FilterTab } from "@/components/admin/filter-tabs";
import { cn } from "@/lib/utils";

interface Props {
  search: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  filters?: FilterTab[];
  activeFilter?: string;
  onFilterChange?: (value: string) => void;
  onRefresh: () => void;
  columnVisibility?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}

export function DataToolbar({
  search,
  onSearchChange,
  searchPlaceholder,
  filters,
  activeFilter,
  onFilterChange,
  onRefresh,
  columnVisibility,
  children,
  className,
}: Props) {
  return (
    <div className={cn("flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between", className)}>
      <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
        <SearchInput
          value={search}
          onChange={onSearchChange}
          placeholder={searchPlaceholder}
        />
        {filters && filters.length > 0 && onFilterChange && (
          <FilterTabs
            tabs={filters}
            active={activeFilter ?? ""}
            onChange={onFilterChange}
          />
        )}
        {children}
      </div>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" className="h-9" onClick={onRefresh} aria-label="Muat ulang data">
          <RefreshCw className="h-3.5 w-3.5" />
        </Button>
        {columnVisibility}
      </div>
    </div>
  );
}
