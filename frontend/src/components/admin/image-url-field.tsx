"use client";

import { Label } from "@/components/ui/label";
import { ImageUpload } from "@/components/admin/image-upload";

interface ImageUrlFieldProps {
  id: string;
  label: string;
  value?: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  error?: string;
  helperText?: string;
  previewAlt?: string;
  folder?: string;
  aspect?: "video" | "square" | "wide";
}

/** Image field backed by the upload API. Keeps the original prop shape so the
 *  promotion/article forms work unchanged, but now uploads a file instead of
 *  asking for a URL. */
export function ImageUrlField({
  id,
  label,
  value = "",
  onChange,
  error,
  helperText,
  folder = "media",
  aspect = "video",
}: ImageUrlFieldProps) {
  const errorId = error ? `${id}-error` : undefined;
  const helperId = helperText ? `${id}-helper` : undefined;

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <ImageUpload value={value} onChange={onChange} folder={folder} aspect={aspect} />
      {helperText ? <p id={helperId} className="text-xs text-muted-foreground">{helperText}</p> : null}
      {error ? <p id={errorId} className="text-xs font-medium text-destructive">{error}</p> : null}
    </div>
  );
}
