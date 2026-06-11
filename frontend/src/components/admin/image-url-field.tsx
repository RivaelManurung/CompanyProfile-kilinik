"use client";

import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AdminImage } from "@/components/admin/admin-image";

interface ImageUrlFieldProps {
  id: string;
  label: string;
  value?: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  error?: string;
  helperText?: string;
  previewAlt?: string;
}

export function ImageUrlField({
  id,
  label,
  value = "",
  onChange,
  onBlur,
  error,
  helperText = "Masukkan URL gambar. TODO: replace ImageUrlField with upload component when upload API is available.",
  previewAlt,
}: ImageUrlFieldProps) {
  const errorId = error ? `${id}-error` : undefined;
  const helperId = helperText ? `${id}-helper` : undefined;

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="flex gap-2">
        <Input
          id={id}
          type="url"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onBlur={onBlur}
          placeholder="https://example.com/image.jpg"
          aria-invalid={Boolean(error)}
          aria-describedby={[errorId, helperId].filter(Boolean).join(" ") || undefined}
        />
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={() => onChange("")}
          disabled={!value}
          aria-label={`Bersihkan ${label}`}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
      {helperText ? <p id={helperId} className="text-xs text-muted-foreground">{helperText}</p> : null}
      {error ? <p id={errorId} className="text-xs font-medium text-destructive">{error}</p> : null}
      <div className="aspect-video overflow-hidden rounded-lg border border-border bg-muted">
        <AdminImage src={value} alt={previewAlt ?? label} className="h-full w-full object-cover" />
      </div>
    </div>
  );
}
