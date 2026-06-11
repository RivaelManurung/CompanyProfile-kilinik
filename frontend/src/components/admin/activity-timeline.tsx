import { cn } from "@/lib/utils";

interface TimelineItem {
  id: string | number;
  title: string;
  description?: string;
  timestamp: string;
  icon?: React.ReactNode;
  severity?: "default" | "success" | "warning" | "danger" | "info";
}

interface Props {
  items: TimelineItem[];
  className?: string;
  emptyMessage?: string;
}

const dotColors = {
  default: "bg-primary/60",
  success: "bg-emerald-500",
  warning: "bg-amber-500",
  danger: "bg-rose-500",
  info: "bg-blue-500",
};

export function ActivityTimeline({ items, className, emptyMessage = "Belum ada aktivitas." }: Props) {
  if (items.length === 0) {
    return <p className="py-8 text-center text-sm text-muted-foreground">{emptyMessage}</p>;
  }

  return (
    <div className={cn("space-y-0", className)}>
      {items.map((item) => (
        <div key={item.id} className="flex items-start gap-3 border-b border-border py-3 last:border-0">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted">
            {item.icon ?? (
              <div className={cn("h-2 w-2 rounded-full", dotColors[item.severity ?? "default"])} />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-foreground">{item.title}</p>
            {item.description && (
              <p className="text-xs text-muted-foreground">{item.description}</p>
            )}
            <p className="text-xs text-muted-foreground/60">{item.timestamp}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
