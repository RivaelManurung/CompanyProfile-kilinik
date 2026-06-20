"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { ArrowLeft, Calendar, CheckCircle2, Clock, Loader2, Stethoscope, User, XCircle } from "lucide-react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PageHeader } from "@/components/admin/page-header";
import { FormShell, FormGrid, FieldGroup, FormActions } from "@/components/admin/form-shell";
import { DatePicker } from "@/components/ui/date-picker";
import { AsyncSelect } from "@/components/admin/async-select";
import { PreviewPanel } from "@/components/admin/preview-panel";
import { StatusBadge } from "@/components/admin/status-badge";
import { appointmentsApi, optionsApi, appointmentErrorMessage } from "@/lib/admin/api";
import type { AvailabilitySlot } from "@/lib/admin/types";
import { cn } from "@/lib/utils";

const appointmentFormSchema = z.object({
  name: z.string().min(2, "Nama minimal 2 karakter").max(120),
  phone: z.string().min(6, "Nomor telepon minimal 6 karakter").max(30),
  email: z.string().email("Email tidak valid").optional().or(z.literal("")),
  patientType: z.enum(["new", "returning"]),
  service: z.string().min(1, "Layanan wajib diisi").max(120),
  doctorId: z.string().min(1, "Dokter wajib dipilih"),
  appointmentDate: z.string().min(1, "Tanggal wajib diisi"),
  appointmentTime: z.string().min(1, "Waktu wajib diisi"),
  source: z.enum(["admin", "website", "whatsapp", "phone"]),
  message: z.string().max(2000, "Pesan maksimal 2000 karakter").optional().or(z.literal("")),
});

type FormValues = z.infer<typeof appointmentFormSchema>;

export default function NewAppointmentPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(appointmentFormSchema),
    defaultValues: {
      name: "",
      phone: "",
      email: "",
      patientType: "new",
      service: "",
      doctorId: "",
      appointmentDate: "",
      appointmentTime: "",
      source: "admin",
      message: "",
    },
  });

  const { register, handleSubmit, setValue, control, formState: { errors } } = form;

  const watched = useWatch({ control });
  const doctorId = watched.doctorId ?? "";
  const appointmentDate = watched.appointmentDate ?? "";

  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  const fetchSlots = useCallback(async () => {
    if (!doctorId || !appointmentDate) {
      setSlots([]);
      return;
    }
    setLoadingSlots(true);
    try {
      const res = await appointmentsApi.availability(Number(doctorId), appointmentDate.slice(0, 10));
      setSlots(res.slots);
    } catch (err) {
      setSlots([]);
      toast.error(appointmentErrorMessage(err, "Gagal memuat slot waktu"));
    } finally {
      setLoadingSlots(false);
    }
  }, [doctorId, appointmentDate]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchSlots();
  }, [fetchSlots]);

  // Clear a chosen time that is no longer offered after slots refresh.
  useEffect(() => {
    const current = watched.appointmentTime;
    if (current && slots.length > 0 && !slots.some((s) => s.time === current && s.available)) {
      setValue("appointmentTime", "");
    }
  }, [slots, watched.appointmentTime, setValue]);

  async function save(values: FormValues) {
    setSubmitting(true);
    try {
      await appointmentsApi.create({
        name: values.name,
        phone: values.phone,
        email: values.email,
        patientType: values.patientType,
        service: values.service,
        doctorId: Number(values.doctorId),
        appointmentDate: values.appointmentDate.slice(0, 10),
        appointmentTime: values.appointmentTime,
        source: values.source,
        message: values.message,
      });
      toast.success("Janji temu berhasil dibuat");
      router.push("/admin/appointments");
    } catch (err) {
      toast.error(appointmentErrorMessage(err, "Gagal menyimpan"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Operations"
        title="Create Appointment"
        backButton={
          <Button variant="ghost" size="sm" onClick={() => router.push("/admin/appointments")}>
            <ArrowLeft className="h-4 w-4" /> Kembali
          </Button>
        }
      />

      <form onSubmit={handleSubmit(save)}>
        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
          <div className="space-y-6">
            <FormShell title="Patient Information" description="Data diri pasien">
              <FormGrid>
                <FieldGroup>
                  <Label htmlFor="name">
                    Nama <span className="text-destructive ml-0.5">*</span>
                  </Label>
                  <Input id="name" placeholder="Nama pasien" {...register("name")} aria-invalid={Boolean(errors.name)} />
                  {errors.name && <p className="text-xs font-medium text-destructive">{errors.name.message}</p>}
                </FieldGroup>
                <FieldGroup>
                  <Label htmlFor="phone">
                    Telepon <span className="text-destructive ml-0.5">*</span>
                  </Label>
                  <Input id="phone" placeholder="Nomor telepon" {...register("phone")} aria-invalid={Boolean(errors.phone)} />
                  {errors.phone && <p className="text-xs font-medium text-destructive">{errors.phone.message}</p>}
                </FieldGroup>
                <FieldGroup>
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" placeholder="Email (opsional)" {...register("email")} aria-invalid={Boolean(errors.email)} />
                  {errors.email && <p className="text-xs font-medium text-destructive">{errors.email.message}</p>}
                </FieldGroup>
                <FieldGroup>
                  <Label htmlFor="patientType">Tipe Pasien</Label>
                  <Select
                    value={watched.patientType}
                    onValueChange={(v) => setValue("patientType", v as "new" | "returning")}
                  >
                    <SelectTrigger id="patientType" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="new">New Patient</SelectItem>
                      <SelectItem value="returning">Returning Patient</SelectItem>
                    </SelectContent>
                  </Select>
                </FieldGroup>
              </FormGrid>
            </FormShell>

            <FormShell title="Appointment Details" description="Informasi janji temu">
              <FormGrid>
                <FieldGroup>
                  <Label htmlFor="service">
                    Layanan <span className="text-destructive ml-0.5">*</span>
                  </Label>
                  <AsyncSelect
                    id="service"
                    value={watched.service ?? ""}
                    onChange={(v) => setValue("service", v, { shouldValidate: true })}
                    loader={optionsApi.services}
                    placeholder="Pilih layanan"
                    aria-invalid={Boolean(errors.service)}
                  />
                  {errors.service && <p className="text-xs font-medium text-destructive">{errors.service.message}</p>}
                </FieldGroup>
                <FieldGroup>
                  <Label htmlFor="doctorId">
                    Dokter <span className="text-destructive ml-0.5">*</span>
                  </Label>
                  <AsyncSelect
                    id="doctorId"
                    value={doctorId}
                    onChange={(v) => {
                      setValue("doctorId", v, { shouldValidate: true });
                      setValue("appointmentTime", "");
                    }}
                    loader={optionsApi.doctorIds}
                    placeholder="Pilih dokter"
                    aria-invalid={Boolean(errors.doctorId)}
                  />
                  {errors.doctorId && <p className="text-xs font-medium text-destructive">{errors.doctorId.message}</p>}
                </FieldGroup>
                <FieldGroup>
                  <Label htmlFor="appointmentDate">
                    Tanggal <span className="text-destructive ml-0.5">*</span>
                  </Label>
                  <DatePicker
                    id="appointmentDate"
                    value={appointmentDate}
                    onChange={(v) => {
                      setValue("appointmentDate", v, { shouldValidate: true });
                      setValue("appointmentTime", "");
                    }}
                    aria-invalid={Boolean(errors.appointmentDate)}
                  />
                  {errors.appointmentDate && <p className="text-xs font-medium text-destructive">{errors.appointmentDate.message}</p>}
                </FieldGroup>
                <FieldGroup className="sm:col-span-2">
                  <Label>
                    Slot Waktu <span className="text-destructive ml-0.5">*</span>
                  </Label>
                  {!doctorId || !appointmentDate ? (
                    <p className="text-sm text-muted-foreground">Pilih dokter dan tanggal untuk melihat slot tersedia.</p>
                  ) : loadingSlots ? (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="size-4 animate-spin" /> Memuat slot…
                    </div>
                  ) : slots.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Tidak ada slot untuk pilihan ini.</p>
                  ) : (
                    <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                      {slots.map((slot) => (
                        <Button
                          key={slot.time}
                          type="button"
                          size="sm"
                          variant={watched.appointmentTime === slot.time ? "default" : "outline"}
                          disabled={!slot.available}
                          aria-pressed={watched.appointmentTime === slot.time}
                          className={cn("text-xs", !slot.available && "opacity-40")}
                          onClick={() => setValue("appointmentTime", slot.time, { shouldValidate: true })}
                        >
                          {slot.time}
                        </Button>
                      ))}
                    </div>
                  )}
                  {errors.appointmentTime && <p className="text-xs font-medium text-destructive">{errors.appointmentTime.message}</p>}
                </FieldGroup>
                <FieldGroup>
                  <Label htmlFor="source">Sumber</Label>
                  <Select
                    value={watched.source}
                    onValueChange={(v) => setValue("source", v as "admin" | "website" | "whatsapp" | "phone")}
                  >
                    <SelectTrigger id="source" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="website">Website</SelectItem>
                      <SelectItem value="whatsapp">WhatsApp</SelectItem>
                      <SelectItem value="phone">Phone</SelectItem>
                    </SelectContent>
                  </Select>
                </FieldGroup>
              </FormGrid>
            </FormShell>

            <FormShell title="Notes" description="Keluhan atau catatan tambahan">
              <FieldGroup>
                <Label htmlFor="message">Pesan</Label>
                <Textarea id="message" rows={4} placeholder="Keluhan atau catatan tambahan" {...register("message")} aria-invalid={Boolean(errors.message)} />
                {errors.message && <p className="text-xs font-medium text-destructive">{errors.message.message}</p>}
              </FieldGroup>
            </FormShell>
          </div>

          <div>
            <PreviewPanel
              sections={[
                {
                  title: "Appointment Summary",
                  children: (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 shrink-0 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">{watched.name || "Belum diisi"}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Stethoscope className="h-4 w-4 shrink-0 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">{watched.service || "Belum diisi"}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 shrink-0 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">
                          {watched.appointmentDate || "Belum diisi"}
                          {watched.appointmentTime && <>{` ${watched.appointmentTime}`}</>}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 shrink-0 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">Status: </span>
                        <StatusBadge status="pending" />
                      </div>
                    </div>
                  ),
                },
                {
                  title: "Validation",
                  children: (
                    <div className="space-y-2">
                      <ValidationItem label="Nama pasien" ok={Boolean(watched.name)} />
                      <ValidationItem label="Nomor telepon" ok={Boolean(watched.phone)} />
                      <ValidationItem label="Layanan" ok={Boolean(watched.service)} />
                      <ValidationItem label="Dokter" ok={Boolean(watched.doctorId)} />
                      <ValidationItem label="Tanggal" ok={Boolean(watched.appointmentDate)} />
                      <ValidationItem label="Slot waktu" ok={Boolean(watched.appointmentTime)} />
                    </div>
                  ),
                },
              ]}
            />
          </div>
        </div>

        <FormActions>
          <Button type="button" variant="outline" onClick={() => router.push("/admin/appointments")} disabled={submitting}>
            Cancel
          </Button>
          <Button type="submit" disabled={submitting}>
            {submitting ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Creating</>
            ) : (
              "Create Appointment"
            )}
          </Button>
        </FormActions>
      </form>
    </div>
  );
}

function ValidationItem({ label, ok }: { label: string; ok: boolean }) {
  return (
    <div className="flex items-center gap-2">
      {ok ? (
        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
      ) : (
        <XCircle className="h-4 w-4 text-muted-foreground/40" />
      )}
      <span className={cn("text-xs", ok ? "text-emerald-600 font-medium" : "text-muted-foreground/50")}>
        {label}
      </span>
    </div>
  );
}
