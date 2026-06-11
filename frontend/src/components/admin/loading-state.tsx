"use client";

import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";

export function LoadingSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("animate-pulse rounded-md bg-muted/70", className)} />
  );
}

export function MetricCardsSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i} className="p-5">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <LoadingSkeleton className="h-7 w-16" />
              <LoadingSkeleton className="h-3 w-24" />
              <LoadingSkeleton className="h-2 w-20" />
            </div>
            <LoadingSkeleton className="h-10 w-10 rounded-xl" />
          </div>
        </Card>
      ))}
    </div>
  );
}

export function TableSkeleton({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <Card className="overflow-hidden rounded-xl border p-0 shadow-sm">
      <div className="border-b border-border bg-muted/30 px-4 py-3">
        <div className="flex gap-4">
          {Array.from({ length: cols }).map((_, i) => (
            <LoadingSkeleton key={i} className="h-4 flex-1" />
          ))}
        </div>
      </div>
      <div className="divide-y divide-border">
        {Array.from({ length: rows }).map((_, r) => (
          <div key={r} className="flex gap-4 px-4 py-3.5">
            {Array.from({ length: cols }).map((_, c) => (
              <LoadingSkeleton key={c} className={cn("h-4", c === 0 ? "w-1/3" : "flex-1")} />
            ))}
          </div>
        ))}
      </div>
    </Card>
  );
}

export function FormSkeleton() {
  return (
    <Card className="overflow-hidden rounded-xl border p-0 shadow-sm">
      <div className="border-b border-border px-6 py-5">
        <LoadingSkeleton className="h-5 w-48" />
        <LoadingSkeleton className="mt-1 h-3 w-72" />
      </div>
      <div className="p-6">
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <LoadingSkeleton className="h-3 w-20" />
              <LoadingSkeleton className="h-9 w-full" />
            </div>
          ))}
        </div>
      </div>
      <div className="flex items-center justify-end gap-3 border-t border-border px-6 py-4">
        <LoadingSkeleton className="h-9 w-20" />
        <LoadingSkeleton className="h-9 w-28" />
      </div>
    </Card>
  );
}

export function PageSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <LoadingSkeleton className="h-3 w-32" />
        <LoadingSkeleton className="h-8 w-64" />
        <LoadingSkeleton className="h-4 w-96" />
      </div>
      <MetricCardsSkeleton count={4} />
      <TableSkeleton />
    </div>
  );
}
