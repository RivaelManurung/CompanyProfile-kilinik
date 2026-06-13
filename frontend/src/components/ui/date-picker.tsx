"use client";

import * as React from "react";
import { format, parseISO, isValid } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { CalendarIcon, X } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface DatePickerProps {
  /** Stored value as `yyyy-MM-dd` (or full ISO). Empty string = unset. */
  value?: string;
  onChange: (value: string) => void;
  /** Set true to keep the time portion and emit a full ISO string. */
  withTime?: boolean;
  placeholder?: string;
  disabled?: boolean;
  clearable?: boolean;
  id?: string;
  className?: string;
  "aria-invalid"?: boolean;
  "aria-describedby"?: string;
}

function toDate(value?: string): Date | undefined {
  if (!value) return undefined;
  const parsed = value.length <= 10 ? parseISO(value) : new Date(value);
  return isValid(parsed) ? parsed : undefined;
}

export function DatePicker({
  value,
  onChange,
  withTime = false,
  placeholder = "Pilih tanggal",
  disabled,
  clearable = true,
  id,
  className,
  ...aria
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false);
  const selected = toDate(value);
  const timePart = withTime && value && value.length > 10 ? value.slice(11, 16) : "00:00";

  function emit(date: Date | undefined, time = timePart) {
    if (!date) return onChange("");
    if (withTime) {
      const [h, m] = time.split(":");
      date.setHours(Number(h) || 0, Number(m) || 0, 0, 0);
      onChange(format(date, "yyyy-MM-dd'T'HH:mm"));
    } else {
      onChange(format(date, "yyyy-MM-dd"));
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          disabled={disabled}
          aria-invalid={aria["aria-invalid"]}
          aria-describedby={aria["aria-describedby"]}
          className={cn(
            "w-full justify-start text-left font-normal",
            !selected && "text-muted-foreground",
            className,
          )}
        >
          <CalendarIcon className="size-4 opacity-70" />
          <span className="flex-1 truncate">
            {selected
              ? format(selected, withTime ? "d MMM yyyy, HH:mm" : "d MMMM yyyy", { locale: idLocale })
              : placeholder}
          </span>
          {clearable && selected && (
            <span
              role="button"
              tabIndex={-1}
              aria-label="Hapus tanggal"
              className="rounded-sm opacity-60 hover:opacity-100"
              onClick={(e) => {
                e.stopPropagation();
                onChange("");
              }}
            >
              <X className="size-3.5" />
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={selected}
          defaultMonth={selected}
          onSelect={(date) => {
            emit(date);
            if (!withTime) setOpen(false);
          }}
          autoFocus
        />
        {withTime && (
          <div className="flex items-center gap-2 border-t p-3">
            <CalendarIcon className="size-4 text-muted-foreground" />
            <input
              type="time"
              value={timePart}
              disabled={!selected}
              onChange={(e) => emit(selected, e.target.value)}
              className="h-8 flex-1 rounded-md border bg-transparent px-2 text-sm outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
            />
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
