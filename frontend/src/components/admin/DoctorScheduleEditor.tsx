"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { AlertTriangle, CalendarClock, Loader2, Plus, Trash2 } from "lucide-react";
import { ApiError, doctorsApi } from "@/lib/admin/api";
import type { DoctorScheduleWindow } from "@/lib/admin/types";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

/** Weekday labels — index matches backend weekday (0=Sunday … 6=Saturday). */
const WEEKDAY_LABELS = [
  "Minggu",
  "Senin",
  "Selasa",
  "Rabu",
  "Kamis",
  "Jumat",
  "Sabtu",
] as const;

/** Display order: Senin first, Minggu last (Indonesian week convention). */
const WEEKDAY_ORDER = [1, 2, 3, 4, 5, 6, 0];

const SLOT_OPTIONS = [10, 15, 20, 30, 45, 60, 90, 120];
const DEFAULT_SLOT_MINUTES = 30;
const DEFAULT_START_MINUTE = 8 * 60; // 08:00
const DEFAULT_END_MINUTE = 16 * 60; // 16:00

/** Convert minutes-from-midnight to a "HH:MM" string for <input type="time">. */
function minutesToTime(minutes: number): string {
  const safe = Math.max(0, Math.min(1440, minutes));
  const h = Math.floor(safe / 60);
  const m = safe % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/** Convert a "HH:MM" string to minutes-from-midnight. Returns null when invalid. */
function timeToMinutes(value: string): number | null {
  const match = /^(\d{1,2}):(\d{2})$/.exec(value);
  if (!match) return null;
  const h = Number(match[1]);
  const m = Number(match[2]);
  if (h < 0 || h > 24 || m < 0 || m > 59) return null;
  return h * 60 + m;
}

interface EditableWindow {
  /** Stable client key for React lists (windows have no persistent id pre-save). */
  key: string;
  weekday: number;
  startMinute: number;
  endMinute: number;
}

let windowKeyCounter = 0;
function nextWindowKey(): string {
  windowKeyCounter += 1;
  return `w-${windowKeyCounter}`;
}

interface Props {
  doctorId: number;
}

export function DoctorScheduleEditor({ doctorId }: Props) {
  const [windows, setWindows] = useState<EditableWindow[]>([]);
  const [slotMinutes, setSlotMinutes] = useState(DEFAULT_SLOT_MINUTES);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const data = await doctorsApi.getSchedule(doctorId);
      setSlotMinutes(data.slotMinutes > 0 ? data.slotMinutes : DEFAULT_SLOT_MINUTES);
      setWindows(
        (data.windows ?? []).map((w) => ({
          key: nextWindowKey(),
          weekday: w.weekday,
          startMinute: w.startMinute,
          endMinute: w.endMinute,
        })),
      );
    } catch (err) {
      setLoadError(err instanceof ApiError ? err.message : "Gagal memuat jadwal");
    } finally {
      setLoading(false);
    }
  }, [doctorId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  function addWindow(weekday: number) {
    setWindows((prev) => [
      ...prev,
      {
        key: nextWindowKey(),
        weekday,
        startMinute: DEFAULT_START_MINUTE,
        endMinute: DEFAULT_END_MINUTE,
      },
    ]);
  }

  function removeWindow(key: string) {
    setWindows((prev) => prev.filter((w) => w.key !== key));
  }

  function updateWindow(key: string, patch: Partial<Pick<EditableWindow, "startMinute" | "endMinute">>) {
    setWindows((prev) => prev.map((w) => (w.key === key ? { ...w, ...patch } : w)));
  }

  async function save() {
    // Validate end > start for every window before sending.
    for (const w of windows) {
      if (w.endMinute <= w.startMinute) {
        toast.error(
          `${WEEKDAY_LABELS[w.weekday]}: jam selesai harus setelah jam mulai.`,
        );
        return;
      }
    }

    setSaving(true);
    try {
      const payload: DoctorScheduleWindow[] = windows.map((w) => ({
        weekday: w.weekday,
        startMinute: w.startMinute,
        endMinute: w.endMinute,
      }));
      const data = await doctorsApi.updateSchedule(doctorId, { slotMinutes, windows: payload });
      setSlotMinutes(data.slotMinutes > 0 ? data.slotMinutes : DEFAULT_SLOT_MINUTES);
      setWindows(
        (data.windows ?? []).map((w) => ({
          key: nextWindowKey(),
          weekday: w.weekday,
          startMinute: w.startMinute,
          endMinute: w.endMinute,
        })),
      );
      toast.success("Jadwal praktik disimpan");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Gagal menyimpan jadwal");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <CardHeader className="border-b">
        <CardTitle className="flex items-center gap-2">
          <CalendarClock className="size-5 text-primary" />
          Jadwal Praktik
        </CardTitle>
        <CardDescription>
          Atur jam praktik mingguan dokter. Jadwal ini yang menentukan slot janji
          temu yang tersedia di situs publik. Menyimpan akan mengganti seluruh jadwal.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-10 w-48" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        ) : loadError ? (
          <div className="flex flex-col items-center py-10 text-center">
            <div className="mb-3 flex size-12 items-center justify-center rounded-2xl bg-destructive/10">
              <AlertTriangle className="size-6 text-destructive" />
            </div>
            <p className="font-semibold text-foreground">Gagal memuat jadwal</p>
            <p className="mt-1.5 text-sm text-muted-foreground">{loadError}</p>
            <Button variant="outline" className="mt-4" onClick={load}>
              Muat Ulang
            </Button>
          </div>
        ) : (
          <>
            <div className="flex flex-col gap-2 sm:max-w-xs">
              <Label htmlFor="slot-minutes">Durasi slot (menit)</Label>
              <Select
                value={String(slotMinutes)}
                onValueChange={(v) => setSlotMinutes(Number(v))}
              >
                <SelectTrigger id="slot-minutes" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SLOT_OPTIONS.map((opt) => (
                    <SelectItem key={opt} value={String(opt)}>
                      {opt} menit
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Panjang setiap slot janji temu yang dibuat dari jam praktik.
              </p>
            </div>

            <div className="space-y-4">
              {WEEKDAY_ORDER.map((weekday) => {
                const dayWindows = windows.filter((w) => w.weekday === weekday);
                return (
                  <div key={weekday} className="rounded-lg border p-4">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-foreground">
                        {WEEKDAY_LABELS[weekday]}
                      </p>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => addWindow(weekday)}
                      >
                        <Plus className="size-3.5" /> Tambah Jam
                      </Button>
                    </div>

                    {dayWindows.length === 0 ? (
                      <p className="mt-3 text-xs text-muted-foreground">
                        Tidak praktik / libur.
                      </p>
                    ) : (
                      <ul className="mt-3 space-y-3">
                        {dayWindows.map((w) => {
                          const invalid = w.endMinute <= w.startMinute;
                          return (
                            <li
                              key={w.key}
                              className="flex flex-wrap items-end gap-3 rounded-md bg-muted/40 p-3"
                            >
                              <div className="space-y-1.5">
                                <Label htmlFor={`${w.key}-start`} className="text-xs">
                                  Mulai
                                </Label>
                                <Input
                                  id={`${w.key}-start`}
                                  type="time"
                                  className="w-32"
                                  value={minutesToTime(w.startMinute)}
                                  onChange={(e) => {
                                    const mins = timeToMinutes(e.target.value);
                                    if (mins !== null) updateWindow(w.key, { startMinute: mins });
                                  }}
                                />
                              </div>
                              <div className="space-y-1.5">
                                <Label htmlFor={`${w.key}-end`} className="text-xs">
                                  Selesai
                                </Label>
                                <Input
                                  id={`${w.key}-end`}
                                  type="time"
                                  className="w-32"
                                  value={minutesToTime(w.endMinute)}
                                  onChange={(e) => {
                                    const mins = timeToMinutes(e.target.value);
                                    if (mins !== null) updateWindow(w.key, { endMinute: mins });
                                  }}
                                  aria-invalid={invalid}
                                />
                              </div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="size-9 text-destructive hover:text-destructive"
                                aria-label={`Hapus jam praktik ${WEEKDAY_LABELS[w.weekday]}`}
                                onClick={() => removeWindow(w.key)}
                              >
                                <Trash2 className="size-4" />
                              </Button>
                              {invalid && (
                                <p className="w-full text-xs font-medium text-destructive">
                                  Jam selesai harus setelah jam mulai.
                                </p>
                              )}
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-end gap-3 border-t pt-4">
              <Button type="button" onClick={save} disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="size-4 animate-spin" /> Menyimpan
                  </>
                ) : (
                  "Simpan Jadwal"
                )}
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
