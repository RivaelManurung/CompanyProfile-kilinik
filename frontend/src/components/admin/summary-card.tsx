"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardAction,
  CardFooter,
} from "@/components/ui/card";

interface Props {
  icon?: ReactNode;
  label: string;
  value: string | number;
  context?: string;
  trend?: { value: string; positive: boolean };
  href?: string;
  variant?: "neutral" | "success" | "warning" | "danger" | "info";
  children?: ReactNode;
}

/** Tints the icon chip so a card can signal urgency without leaving the shadcn look. */
const iconAccent: Record<NonNullable<Props["variant"]>, string> = {
  neutral: "bg-muted text-muted-foreground",
  success: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-300",
  warning: "bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-300",
  danger: "bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-300",
  info: "bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-300",
};

export function SummaryCard({
  icon,
  label,
  value,
  context,
  trend,
  href,
  variant = "neutral",
  children,
}: Props) {
  const hasFooter = Boolean(context || trend || children);

  const card = (
    <Card
      className={cn(
        "gap-3",
        href && "transition-colors hover:border-primary/40 hover:bg-accent/40",
      )}
    >
      <CardHeader>
        <CardDescription>{label}</CardDescription>
        <CardTitle className="text-3xl font-bold tabular-nums tracking-tight">
          {value}
        </CardTitle>
        {icon && (
          <CardAction>
            <span
              className={cn(
                "flex size-9 items-center justify-center rounded-lg [&_svg]:size-5",
                iconAccent[variant],
              )}
            >
              {icon}
            </span>
          </CardAction>
        )}
      </CardHeader>
      {hasFooter && (
        <CardFooter className="flex-col items-start gap-1 text-sm">
          {trend && (
            <span
              className={cn(
                "font-medium",
                trend.positive ? "text-emerald-600" : "text-rose-600",
              )}
            >
              {trend.positive ? "↑" : "↓"} {trend.value}
            </span>
          )}
          {context && <span className="text-xs text-muted-foreground">{context}</span>}
          {children}
        </CardFooter>
      )}
    </Card>
  );

  if (!href) return card;
  return (
    <Link href={href} className="block focus-visible:outline-none">
      {card}
    </Link>
  );
}
