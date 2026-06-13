"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { SelectOption } from "@/lib/admin/api";

interface Props {
  value: string;
  onChange: (value: string) => void;
  loader: () => Promise<SelectOption[]>;
  placeholder?: string;
  id?: string;
  "aria-invalid"?: boolean;
  /** Show a "—" option that clears the value. */
  clearable?: boolean;
  clearLabel?: string;
}

/** A shadcn Select whose options are fetched from the API on mount.
 *  If the current value isn't in the fetched list (e.g. legacy free-text),
 *  it's appended so existing records still display correctly. */
export function AsyncSelect({
  value,
  onChange,
  loader,
  placeholder = "Pilih…",
  id,
  clearable = false,
  clearLabel = "— Tidak ada —",
  ...aria
}: Props) {
  const [options, setOptions] = useState<SelectOption[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    loader()
      .then((opts) => { if (active) setOptions(opts); })
      .catch(() => { if (active) setOptions([]); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const merged =
    value && !options.some((o) => o.value === value)
      ? [{ value, label: value }, ...options]
      : options;

  const CLEAR = "__clear__";

  return (
    <Select
      value={value || undefined}
      onValueChange={(v) => onChange(v === CLEAR ? "" : v)}
    >
      <SelectTrigger id={id} className="w-full" aria-invalid={aria["aria-invalid"]}>
        {loading ? (
          <span className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="size-4 animate-spin" /> Memuat…
          </span>
        ) : (
          <SelectValue placeholder={placeholder} />
        )}
      </SelectTrigger>
      <SelectContent>
        {clearable && <SelectItem value={CLEAR}>{clearLabel}</SelectItem>}
        {merged.map((opt) => (
          <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
        ))}
        {!loading && merged.length === 0 && (
          <div className="px-2 py-1.5 text-sm text-muted-foreground">Belum ada data</div>
        )}
      </SelectContent>
    </Select>
  );
}
