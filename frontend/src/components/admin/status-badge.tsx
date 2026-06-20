import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

type Status =
  | "active" | "inactive"
  | "pending" | "confirmed" | "done" | "cancelled" | "no_show"
  | "draft" | "published" | "scheduled" | "archived"
  | "success" | "warning" | "danger" | "info"
  | "waiting" | "expired" | "hidden" | "suspended"
  | string;

const map: Record<string, { dot: string; bg: string; text: string }> = {
  active:    { dot: "bg-emerald-500", bg: "bg-emerald-50 dark:bg-emerald-950/30", text: "text-emerald-700 dark:text-emerald-300" },
  inactive:  { dot: "bg-slate-400",   bg: "bg-slate-100 dark:bg-slate-800",      text: "text-slate-600 dark:text-slate-400" },
  pending:   { dot: "bg-amber-500",   bg: "bg-amber-50 dark:bg-amber-950/30",    text: "text-amber-700 dark:text-amber-300" },
  waiting:   { dot: "bg-amber-500",   bg: "bg-amber-50 dark:bg-amber-950/30",    text: "text-amber-700 dark:text-amber-300" },
  confirmed: { dot: "bg-blue-500",    bg: "bg-blue-50 dark:bg-blue-950/30",      text: "text-blue-700 dark:text-blue-300" },
  done:      { dot: "bg-emerald-500", bg: "bg-emerald-50 dark:bg-emerald-950/30", text: "text-emerald-700 dark:text-emerald-300" },
  cancelled: { dot: "bg-rose-500",    bg: "bg-rose-50 dark:bg-rose-950/30",       text: "text-rose-700 dark:text-rose-300" },
  no_show:   { dot: "bg-amber-600",   bg: "bg-amber-100/70 dark:bg-amber-950/40", text: "text-amber-800 dark:text-amber-300" },
  draft:     { dot: "bg-slate-400",   bg: "bg-slate-100 dark:bg-slate-800",       text: "text-slate-600 dark:text-slate-400" },
  published: { dot: "bg-emerald-500", bg: "bg-emerald-50 dark:bg-emerald-950/30", text: "text-emerald-700 dark:text-emerald-300" },
  scheduled: { dot: "bg-blue-500",    bg: "bg-blue-50 dark:bg-blue-950/30",       text: "text-blue-700 dark:text-blue-300" },
  archived:  { dot: "bg-slate-500",   bg: "bg-slate-100 dark:bg-slate-800",       text: "text-slate-600 dark:text-slate-400" },
  expired:   { dot: "bg-orange-500",  bg: "bg-orange-50 dark:bg-orange-950/30",   text: "text-orange-700 dark:text-orange-300" },
  hidden:    { dot: "bg-slate-400",   bg: "bg-slate-100 dark:bg-slate-800",       text: "text-slate-500 dark:text-slate-400" },
  suspended: { dot: "bg-red-500",     bg: "bg-red-50 dark:bg-red-950/30",         text: "text-red-700 dark:text-red-300" },
  success:   { dot: "bg-emerald-500", bg: "bg-emerald-50 dark:bg-emerald-950/30", text: "text-emerald-700 dark:text-emerald-300" },
  warning:   { dot: "bg-amber-500",   bg: "bg-amber-50 dark:bg-amber-950/30",     text: "text-amber-700 dark:text-amber-300" },
  danger:    { dot: "bg-rose-500",    bg: "bg-rose-50 dark:bg-rose-950/30",       text: "text-rose-700 dark:text-rose-300" },
  info:      { dot: "bg-blue-500",    bg: "bg-blue-50 dark:bg-blue-950/30",       text: "text-blue-700 dark:text-blue-300" },
};

const labels: Record<string, string> = {
  active: "Aktif", inactive: "Nonaktif",
  pending: "Menunggu", waiting: "Menunggu",
  confirmed: "Dikonfirmasi", done: "Selesai", cancelled: "Dibatalkan", no_show: "Tidak Hadir",
  draft: "Draf", published: "Terbit", scheduled: "Terjadwal", archived: "Arsip",
  expired: "Kadaluarsa", hidden: "Disembunyikan", suspended: "Ditangguhkan",
  success: "Berhasil", warning: "Peringatan", danger: "Gagal", info: "Info",
};

interface Props {
  status: Status;
  label?: string;
  dot?: boolean;
  className?: string;
  size?: "sm" | "md";
}

export function StatusBadge({ status, label, dot = true, className, size = "sm" }: Props) {
  const style = map[status] ?? map.inactive;
  const sizeClass = size === "md" ? "px-3 py-1 text-sm" : "px-2.5 py-0.5 text-xs";
  return (
    <Badge
      variant="secondary"
      className={cn(
        "border-transparent",
        sizeClass, style.bg, style.text, className,
      )}
    >
      {dot && <span className={cn("h-1.5 w-1.5 rounded-full shrink-0", style.dot)} />}
      {label ?? labels[status] ?? status}
    </Badge>
  );
}
