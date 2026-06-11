"use client";

import { forwardRef } from "react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";

interface Props {
  title: string;
  description?: string;
  className?: string;
  children: React.ReactNode;
}

export function FormShell({ title, description, className, children }: Props) {
  return (
    <Card className={cn("divide-y divide-border", className)}>
      <div className="px-6 py-5">
        <h3 className="text-base font-semibold text-foreground">{title}</h3>
        {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      </div>
      <div className="px-6 py-5">{children}</div>
    </Card>
  );
}

export function FormGrid({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("grid grid-cols-1 gap-5 md:grid-cols-2", className)} {...props} />;
}

export const FieldGroup = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  function FieldGroup({ className, ...props }, ref) {
    return <div ref={ref} className={cn("space-y-2", className)} {...props} />;
  },
);

export function FormActions({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "sticky bottom-0 z-10 -mx-6 mt-6 flex items-center justify-end gap-3 border-t border-border bg-background px-6 py-4",
        className,
      )}
      {...props}
    />
  );
}
