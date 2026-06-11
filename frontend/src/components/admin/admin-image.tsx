"use client";

import { useState } from "react";
import { ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface AdminImageProps {
  src?: string | null;
  alt?: string;
  className?: string;
  fallbackClassName?: string;
}

export function AdminImage({ src, alt = "", className, fallbackClassName }: AdminImageProps) {
  const [failedKeys, setFailedKeys] = useState<Set<string>>(new Set());
  const cleanSrc = src?.trim();

  if (!cleanSrc || failedKeys.has(cleanSrc)) {
    return (
      <div className={cn("flex h-full w-full items-center justify-center bg-muted", fallbackClassName)}>
        <ImageIcon className="h-5 w-5 text-muted-foreground/40" aria-hidden="true" />
      </div>
    );
  }

  // eslint-disable-next-line @next/next/no-img-element
  return <img src={cleanSrc} alt={alt} className={className} onError={() => setFailedKeys((prev) => new Set(prev).add(cleanSrc))} />;
}
