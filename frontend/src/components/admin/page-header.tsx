"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface Props {
  eyebrow: string;
  title: string;
  description?: string;
  action?: ReactNode;
  backButton?: ReactNode;
  metadata?: { label: string; value: string }[];
  className?: string;
}

export function PageHeader({ eyebrow, title, description, action, backButton, metadata, className }: Props) {
  return (
    <div className={cn("flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between", className)}>
      <div className="min-w-0 space-y-1">
        {backButton}
        <div className="space-y-0.5">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground/60">
            {eyebrow}
          </p>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">{title}</h1>
          {description && (
            <p className="max-w-2xl text-sm text-muted-foreground leading-relaxed">{description}</p>
          )}
          {metadata && metadata.length > 0 && (
            <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1">
              {metadata.map((item) => (
                <div key={item.label} className="flex items-center gap-1.5">
                  <span className="text-xs text-muted-foreground/60">{item.label}:</span>
                  <span className="text-xs font-medium text-foreground">{item.value}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      {action && <div className="flex shrink-0 items-start gap-2">{action}</div>}
    </div>
  );
}
