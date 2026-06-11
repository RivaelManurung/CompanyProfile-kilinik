import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface Section {
  title: string;
  children: React.ReactNode;
}

interface Props {
  sections: Section[];
  className?: string;
  sticky?: boolean;
}

export function PreviewPanel({ sections, className, sticky = true }: Props) {
  return (
    <div className={cn("space-y-6", sticky && "sticky top-24", className)}>
      {sections.map((section) => (
        <Card key={section.title} className="overflow-hidden">
          <div className="border-b border-border bg-muted/30 px-4 py-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">
              {section.title}
            </h4>
          </div>
          <div className="p-4">
            {section.children}
          </div>
        </Card>
      ))}
    </div>
  );
}

export function PreviewCard({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("overflow-hidden rounded-xl border border-border bg-card shadow-sm", className)}>
      {children}
    </div>
  );
}
