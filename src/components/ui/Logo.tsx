import { cn } from "@/lib/utils";
import { site } from "@/lib/site";

export function Logo({
  className,
  light = false,
}: {
  className?: string;
  light?: boolean;
}) {
  return (
    <span className={cn("flex items-center gap-2.5", className)}>
      <span className="relative inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 shadow-soft">
        <svg
          viewBox="0 0 24 24"
          className="h-5 w-5 text-white"
          fill="none"
          stroke="currentColor"
          strokeWidth={2.2}
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M12 3v18M3 12h18" />
        </svg>
        <span className="absolute inset-0 rounded-xl ring-1 ring-inset ring-white/30" />
      </span>
      <span className="flex flex-col leading-none">
        <span
          className={cn(
            "font-display text-[1.05rem] font-extrabold tracking-tight",
            light ? "text-white" : "text-ink-900",
          )}
        >
          Sehat<span className="text-primary-500">Nusantara</span>
        </span>
        <span
          className={cn(
            "mt-0.5 text-[0.62rem] font-medium uppercase tracking-[0.18em]",
            light ? "text-primary-200/80" : "text-ink-400",
          )}
        >
          {site.tagline.split(" ").slice(0, 3).join(" ")}
        </span>
      </span>
    </span>
  );
}
