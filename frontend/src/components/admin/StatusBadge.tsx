import { cn } from "@/lib/utils";
import type { AppointmentStatus } from "@/lib/admin/types";

const map: Record<AppointmentStatus, { label: string; className: string }> = {
  pending: { label: "Menunggu", className: "bg-amber-100 text-amber-700 ring-amber-200" },
  confirmed: { label: "Dikonfirmasi", className: "bg-primary/10 text-primary ring-primary/20" },
  done: { label: "Selesai", className: "bg-emerald-100 text-emerald-700 ring-emerald-200" },
  cancelled: { label: "Dibatalkan", className: "bg-rose-100 text-rose-700 ring-rose-200" },
};

export function StatusBadge({ status }: { status: AppointmentStatus }) {
  const s = map[status] ?? map.pending;
  return (
    <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset", s.className)}>
      {s.label}
    </span>
  );
}
