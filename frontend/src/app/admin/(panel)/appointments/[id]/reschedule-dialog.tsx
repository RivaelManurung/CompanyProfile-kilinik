"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { CalendarClock, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { DatePicker } from "@/components/ui/date-picker";
import { AsyncSelect } from "@/components/admin/async-select";
import { appointmentsApi, optionsApi, appointmentErrorMessage, ApiError } from "@/lib/admin/api";
import type { Appointment, AvailabilitySlot } from "@/lib/admin/types";
import { cn } from "@/lib/utils";

interface Props {
  appointment: Appointment;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDone: () => void | Promise<void>;
}

/** Reschedule / reassign an appointment: pick doctor, date, then a free slot. */
export function RescheduleDialog({ appointment, open, onOpenChange, onDone }: Props) {
  const [doctorId, setDoctorId] = useState<string>(appointment.doctorId ? String(appointment.doctorId) : "");
  const [date, setDate] = useState<string>(appointment.appointmentDate ?? "");
  const [time, setTime] = useState<string>(appointment.appointmentTime ?? "");
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Reset local state whenever the dialog (re)opens for the current record.
  useEffect(() => {
    if (open) {
      /* eslint-disable react-hooks/set-state-in-effect */
      setDoctorId(appointment.doctorId ? String(appointment.doctorId) : "");
      setDate(appointment.appointmentDate ?? "");
      setTime(appointment.appointmentTime ?? "");
      setSlots([]);
      /* eslint-enable react-hooks/set-state-in-effect */
    }
  }, [open, appointment.doctorId, appointment.appointmentDate, appointment.appointmentTime]);

  const fetchSlots = useCallback(async () => {
    if (!doctorId || !date) {
      setSlots([]);
      return;
    }
    setLoadingSlots(true);
    try {
      const res = await appointmentsApi.availability(Number(doctorId), date.slice(0, 10));
      setSlots(res.slots);
    } catch (err) {
      setSlots([]);
      toast.error(appointmentErrorMessage(err, "Gagal memuat slot waktu"));
    } finally {
      setLoadingSlots(false);
    }
  }, [doctorId, date]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (open) fetchSlots();
  }, [open, fetchSlots]);

  // Clear a chosen time that is no longer available after slots refresh.
  useEffect(() => {
    if (time && slots.length > 0 && !slots.some((s) => s.time === time && s.available)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setTime("");
    }
  }, [slots, time]);

  async function submit() {
    if (!doctorId) {
      toast.error("Pilih dokter terlebih dahulu");
      return;
    }
    if (!date || !time) {
      toast.error("Pilih tanggal dan slot waktu");
      return;
    }
    setSubmitting(true);
    try {
      await appointmentsApi.update(appointment.id, {
        doctorId: Number(doctorId),
        appointmentDate: date.slice(0, 10),
        appointmentTime: time,
      });
      toast.success("Janji temu berhasil dijadwal ulang");
      onOpenChange(false);
      await onDone();
    } catch (err) {
      if (err instanceof ApiError && err.code === "SLOT_TAKEN") {
        toast.error(appointmentErrorMessage(err));
        await fetchSlots();
      } else {
        toast.error(appointmentErrorMessage(err, "Gagal menjadwal ulang"));
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarClock className="size-5 text-primary" />
            Jadwal Ulang
          </DialogTitle>
          <DialogDescription>
            Ubah dokter, tanggal, atau waktu janji temu. Slot akan divalidasi ulang saat disimpan.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="reschedule-doctor">Dokter</Label>
            <AsyncSelect
              id="reschedule-doctor"
              value={doctorId}
              onChange={(v) => { setDoctorId(v); setTime(""); }}
              loader={optionsApi.doctorIds}
              placeholder="Pilih dokter"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="reschedule-date">Tanggal</Label>
            <DatePicker
              id="reschedule-date"
              value={date}
              onChange={(v) => { setDate(v); setTime(""); }}
              placeholder="Pilih tanggal"
            />
          </div>

          <div className="space-y-1.5">
            <Label>Slot Waktu</Label>
            {!doctorId || !date ? (
              <p className="text-sm text-muted-foreground">Pilih dokter dan tanggal untuk melihat slot tersedia.</p>
            ) : loadingSlots ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" /> Memuat slot…
              </div>
            ) : slots.length === 0 ? (
              <p className="text-sm text-muted-foreground">Tidak ada slot untuk pilihan ini.</p>
            ) : (
              <div className="grid grid-cols-4 gap-2">
                {slots.map((slot) => (
                  <Button
                    key={slot.time}
                    type="button"
                    size="sm"
                    variant={time === slot.time ? "default" : "outline"}
                    disabled={!slot.available}
                    aria-pressed={time === slot.time}
                    className={cn("text-xs", !slot.available && "opacity-40")}
                    onClick={() => setTime(slot.time)}
                  >
                    {slot.time}
                  </Button>
                ))}
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            Batal
          </Button>
          <Button type="button" onClick={submit} disabled={submitting || !time}>
            {submitting ? (<><Loader2 className="size-4 animate-spin" /> Menyimpan</>) : "Simpan Jadwal"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
