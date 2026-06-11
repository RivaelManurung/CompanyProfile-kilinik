import { cn } from "@/lib/utils";
import { Reveal } from "./Reveal";

export function Eyebrow({
  children,
  className,
  light = false,
}: {
  children: React.ReactNode;
  className?: string;
  light?: boolean;
}) {
  return (
    <div className={cn("inline-flex items-center gap-3", className)}>
      <span
        className={cn(
          "h-px w-8 shrink-0",
          light ? "bg-primary-300/40" : "bg-primary-500/80"
        )}
        aria-hidden="true"
      />
      <p
        className={cn(
          "text-sm font-semibold tracking-wide",
          light ? "text-primary-100" : "text-primary-700"
        )}
      >
        {children}
      </p>
    </div>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "center",
  light = false,
  className,
}: {
  eyebrow?: string;
  title: React.ReactNode;
  description?: React.ReactNode;
  align?: "center" | "left";
  light?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-4",
        align === "center" ? "items-center text-center mx-auto max-w-2xl" : "items-start text-left max-w-2xl",
        className,
      )}
    >
      {eyebrow && (
        <Reveal>
          <Eyebrow light={light}>{eyebrow}</Eyebrow>
        </Reveal>
      )}
      <Reveal delay={0.05}>
        <h2
          className={cn(
            "text-3xl font-bold leading-[1.1] sm:text-4xl lg:text-[2.75rem]",
            light ? "text-white" : "text-ink-900",
          )}
        >
          {title}
        </h2>
      </Reveal>
      {description && (
        <Reveal delay={0.1}>
          <p className={cn("text-base leading-relaxed sm:text-lg", light ? "text-primary-100/80" : "text-ink-500")}>
            {description}
          </p>
        </Reveal>
      )}
    </div>
  );
}
