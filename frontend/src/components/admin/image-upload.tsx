"use client";

import { useRef, useState } from "react";
import { UploadCloud, X, Loader2, ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { uploadApi, assetUrl, ApiError } from "@/lib/admin/api";

interface Props {
  /** Stored image path (relative or absolute). */
  value?: string;
  onChange: (url: string) => void;
  folder?: string;
  /** Aspect ratio of the preview box. */
  aspect?: "video" | "square" | "wide";
  className?: string;
  disabled?: boolean;
}

const ACCEPT = "image/png,image/jpeg,image/webp,image/avif,image/gif";
const MAX_MB = 5;

export function ImageUpload({ value, onChange, folder = "general", aspect = "video", className, disabled }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const aspectClass = aspect === "square" ? "aspect-square" : aspect === "wide" ? "aspect-[21/9]" : "aspect-video";

  async function handleFile(file?: File) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("File harus berupa gambar");
      return;
    }
    if (file.size > MAX_MB * 1024 * 1024) {
      toast.error(`Ukuran gambar maksimal ${MAX_MB}MB`);
      return;
    }
    setUploading(true);
    try {
      const { url } = await uploadApi.image(file, folder);
      onChange(url);
      toast.success("Gambar terunggah");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Gagal mengunggah gambar");
    } finally {
      setUploading(false);
    }
  }

  const src = assetUrl(value);

  return (
    <div className={cn("space-y-2", className)}>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        className="sr-only"
        disabled={disabled || uploading}
        onChange={(e) => handleFile(e.target.files?.[0])}
      />

      {src ? (
        <div className={cn("group relative w-full overflow-hidden rounded-lg border bg-muted", aspectClass)}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={src} alt="Pratinjau" className="h-full w-full object-cover" />
          <div className="absolute inset-0 flex items-center justify-center gap-2 bg-foreground/40 opacity-0 transition-opacity group-hover:opacity-100">
            <Button type="button" size="sm" variant="secondary" onClick={() => inputRef.current?.click()} disabled={uploading}>
              {uploading ? <Loader2 className="size-4 animate-spin" /> : <UploadCloud className="size-4" />}
              Ganti
            </Button>
            <Button type="button" size="sm" variant="destructive" onClick={() => onChange("")} disabled={uploading}>
              <X className="size-4" />
              Hapus
            </Button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          disabled={disabled || uploading}
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files?.[0]); }}
          className={cn(
            "flex w-full flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed bg-muted/40 text-center transition-colors hover:border-primary/50 hover:bg-muted",
            aspectClass,
            dragOver && "border-primary bg-accent",
          )}
        >
          {uploading ? (
            <Loader2 className="size-6 animate-spin text-primary" />
          ) : (
            <ImageIcon className="size-6 text-muted-foreground" />
          )}
          <span className="text-sm font-medium text-foreground">
            {uploading ? "Mengunggah…" : "Klik atau seret gambar ke sini"}
          </span>
          <span className="text-xs text-muted-foreground">PNG, JPG, WEBP — maks {MAX_MB}MB</span>
        </button>
      )}
    </div>
  );
}
