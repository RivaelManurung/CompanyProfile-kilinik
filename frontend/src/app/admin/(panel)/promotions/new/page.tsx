"use client";

import { useMemo, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, Controller, useWatch, type Resolver } from "react-hook-form";
import { toast } from "sonner";
import { ArrowLeft, Loader2, Eye, CheckCircle2, Circle } from "lucide-react";
import { promotionSchema } from "@/lib/admin/schemas/promotion.schema";
import { promotionsApi, ApiError } from "@/lib/admin/api";
import { mapPromotionPayload } from "@/lib/admin/payload-mapper";
import type { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { PageHeader } from "@/components/admin/page-header";
import { FormShell, FormGrid, FieldGroup, FormActions } from "@/components/admin/form-shell";
import { DatePicker } from "@/components/ui/date-picker";
import { PreviewPanel } from "@/components/admin/preview-panel";
import { StatusBadge } from "@/components/admin/status-badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { AdminImage } from "@/components/admin/admin-image";
import { ImageUrlField } from "@/components/admin/image-url-field";
import { cn } from "@/lib/utils";

type FormValues = z.infer<typeof promotionSchema>;

const ACCENT_COLORS = [
  { value: "teal", label: "Teal" },
  { value: "emerald", label: "Emerald" },
  { value: "cyan", label: "Cyan" },
  { value: "blue", label: "Blue" },
  { value: "slate", label: "Slate" },
] as const;

const accentGradient: Record<string, string> = {
  teal: "from-teal-500 to-teal-600",
  emerald: "from-emerald-500 to-emerald-600",
  cyan: "from-cyan-500 to-cyan-600",
  blue: "from-blue-500 to-blue-600",
  slate: "from-slate-500 to-slate-600",
};

const accentBg: Record<string, string> = {
  teal: "bg-teal-500",
  emerald: "bg-emerald-500",
  cyan: "bg-cyan-500",
  blue: "bg-blue-500",
  slate: "bg-slate-500",
};

const CAMPAIGN_TYPE_OPTIONS = [
  { value: "discount", label: "Discount" },
  { value: "bundle", label: "Bundle" },
  { value: "seasonal", label: "Seasonal" },
  { value: "new_patient", label: "New Patient" },
  { value: "wellness", label: "Wellness" },
];

const STATUS_OPTIONS = [
  { value: "draft", label: "Draft" },
  { value: "scheduled", label: "Scheduled" },
  { value: "active", label: "Active" },
  { value: "expired", label: "Expired" },
  { value: "hidden", label: "Hidden" },
];

const AUDIENCE_OPTIONS = [
  { value: "general", label: "General" },
  { value: "new_patient", label: "New Patient" },
  { value: "existing_patient", label: "Existing Patient" },
  { value: "family", label: "Family" },
  { value: "corporate", label: "Corporate" },
];

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function parsePrice(s?: string): number {
  if (!s) return 0;
  return Number(s.replace(/[^0-9]/g, "")) || 0;
}

function formatPrice(s?: string): string {
  if (!s) return "0";
  const num = parsePrice(s);
  return new Intl.NumberFormat("id-ID").format(num);
}

const defaultValues: FormValues = {
  title: "",
  tag: "",
  price: "",
  oldPrice: "",
  desc: "",
  slug: "",
  status: "draft",
  campaignType: "discount",
  startDate: "",
  endDate: "",
  coverImage: "",
  terms: "",
  featured: false,
  displayOrder: 0,
  maxClaims: undefined,
  accentColor: "teal",
  currency: "IDR",
  priceNote: "",
  fullDescription: "",
  targetAudience: "general",
};

export default function NewPromotionPage() {
  const router = useRouter();
  const slugManuallyEdited = useRef(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(promotionSchema) as unknown as Resolver<FormValues>,
    defaultValues,
  });

  const watchedTitle = useWatch({ control: form.control, name: "title" });
  const watchedPrice = useWatch({ control: form.control, name: "price" });
  const watchedOldPrice = useWatch({ control: form.control, name: "oldPrice" });
  const watchedDesc = useWatch({ control: form.control, name: "desc" });
  const watchedStartDate = useWatch({ control: form.control, name: "startDate" });
  const watchedEndDate = useWatch({ control: form.control, name: "endDate" });
  const watchedTag = useWatch({ control: form.control, name: "tag" });
  const watchedStatus = useWatch({ control: form.control, name: "status" });
  const watchedAccent = useWatch({ control: form.control, name: "accentColor" });
  const watchedCover = useWatch({ control: form.control, name: "coverImage" });
  const watchedOldPrice2 = useWatch({ control: form.control, name: "oldPrice" });
  const watchedCampaignType = useWatch({ control: form.control, name: "campaignType" });
  const watchedAudience = useWatch({ control: form.control, name: "targetAudience" });
  const watchedCurrency = useWatch({ control: form.control, name: "currency" });
  const watchedPriceNote = useWatch({ control: form.control, name: "priceNote" });

  useEffect(() => {
    if (!slugManuallyEdited.current && watchedTitle) {
      form.setValue("slug", generateSlug(watchedTitle), { shouldValidate: false });
    }
  }, [watchedTitle, form]);

  const discountPercent = useMemo(() => {
    const p = parsePrice(watchedPrice);
    const op = parsePrice(watchedOldPrice2);
    if (op > 0 && p > 0 && op > p) {
      return Math.round((1 - p / op) * 100);
    }
    return 0;
  }, [watchedPrice, watchedOldPrice2]);

  const priceValid = Boolean(watchedPrice) && Boolean(watchedOldPrice2) && parsePrice(watchedPrice) > 0 && parsePrice(watchedOldPrice2) > parsePrice(watchedPrice);
  const scheduleValid = Boolean(watchedStartDate) && Boolean(watchedEndDate) && new Date(watchedEndDate!) > new Date(watchedStartDate!);
  const descValid = Boolean(watchedDesc && watchedDesc.length >= 10);
  const titleValid = Boolean(watchedTitle && watchedTitle.length >= 2);

  const checklistItems = [
    { label: "Judul terisi", done: titleValid },
    { label: "Harga promo valid", done: priceValid },
    { label: "Jadwal valid", done: scheduleValid },
    { label: "Deskripsi terisi", done: descValid },
  ];

  const readyCount = checklistItems.filter((i) => i.done).length;

  async function submitWithStatus(status: FormValues["status"]) {
    form.setValue("status", status);
    const valid = await form.trigger();
    if (!valid) {
      toast.error("Perbaiki error pada form sebelum menyimpan");
      return;
    }
    const values = form.getValues();
    const payload = mapPromotionPayload({ ...values, status });
    try {
      await promotionsApi.create(payload);
      toast.success(status === "active" ? "Promosi diterbitkan" : "Draf promosi disimpan");
      router.push("/admin/promotions");
    } catch (err) {
      if (err instanceof ApiError && err.details?.length) {
        for (const detail of err.details) {
          form.setError(detail.field as keyof FormValues, { message: detail.message });
        }
        return;
      }
      toast.error(err instanceof ApiError ? err.message : "Gagal menyimpan promosi");
    }
  }

  function renderField(
    name: keyof FormValues,
    label: string,
    options?: {
      type?: "text" | "number" | "textarea" | "switch";
      placeholder?: string;
      hint?: string;
      required?: boolean;
      full?: boolean;
      disabled?: boolean;
    },
  ) {
    const { type = "text", placeholder, hint, required, full, disabled } = options || {};
    const errorMessage = form.formState.errors[name]?.message;
    const Component = form.register(name);

    return (
      <FieldGroup key={name} className={full ? "md:col-span-2" : undefined}>
        {type !== "switch" && (
          <Label htmlFor={name}>
            {label}
            {required ? <span className="ml-0.5 text-destructive">*</span> : null}
          </Label>
        )}
        {type === "textarea" ? (
          <Textarea id={name} rows={4} placeholder={placeholder} disabled={disabled} {...Component} aria-invalid={Boolean(errorMessage)} />
        ) : type === "switch" ? (
          <div className="flex items-center gap-3 rounded-lg border border-border p-3">
            <Controller
              control={form.control}
              name={name}
              render={({ field }) => (
                <Switch
                  id={name}
                  checked={Boolean(field.value)}
                  onCheckedChange={(checked) => field.onChange(checked)}
                />
              )}
            />
            <div>
              <Label htmlFor={name} className="text-sm font-medium">{label}</Label>
              {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
            </div>
          </div>
        ) : type === "number" ? (
          <Input
            id={name}
            type="number"
            placeholder={placeholder}
            disabled={disabled}
            {...Component}
            onChange={(e) => {
              const val = e.target.value === "" ? "" : Number(e.target.value);
              form.setValue(name, val as never, { shouldDirty: true, shouldValidate: true });
            }}
            aria-invalid={Boolean(errorMessage)}
          />
      ) : (
        <Input
          id={name}
          type="text"
          placeholder={placeholder}
          disabled={disabled}
          {...Component}
          aria-invalid={Boolean(errorMessage)}
        />
      )}
        {hint && type !== "switch" && <p className="text-xs text-muted-foreground">{hint}</p>}
        {errorMessage && <p className="text-xs font-medium text-destructive">{String(errorMessage)}</p>}
      </FieldGroup>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Promotions"
        title="Tambah Promosi"
        backButton={
          <Button variant="ghost" size="sm" onClick={() => router.push("/admin/promotions")}>
            <ArrowLeft className="h-4 w-4" /> Kembali
          </Button>
        }
      />

      <form>
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          <div className="space-y-6 xl:col-span-2">
            <FormShell title="Identitas Kampanye" description="Informasi dasar promosi.">
              <FormGrid>
                {renderField("title", "Judul Promo", { placeholder: "Contoh: IV Therapy untuk GERD", required: true, full: true })}
                {renderField("tag", "Tag / Badge", { placeholder: "Hemat 20%", hint: "Label pendek di badge (maks 20 karakter)", required: false })}
                {renderField("slug", "Slug", {
                  placeholder: "otomatis dari judul",
                  hint: "URL identifier. Edit manual jika perlu.",
                  full: true,
                  disabled: false,
                })}
                <FieldGroup>
                  <Label htmlFor="campaignType">Tipe Kampanye <span className="ml-0.5 text-destructive">*</span></Label>
                  <Controller
                    control={form.control}
                    name="campaignType"
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Pilih tipe kampanye" />
                        </SelectTrigger>
                        <SelectContent>
                          {CAMPAIGN_TYPE_OPTIONS.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {form.formState.errors.campaignType && (
                    <p className="text-xs font-medium text-destructive">{String(form.formState.errors.campaignType.message)}</p>
                  )}
                </FieldGroup>
                <FieldGroup>
                  <Label htmlFor="targetAudience">Target Audiens</Label>
                  <Controller
                    control={form.control}
                    name="targetAudience"
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Pilih audiens" />
                        </SelectTrigger>
                        <SelectContent>
                          {AUDIENCE_OPTIONS.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </FieldGroup>
              </FormGrid>
            </FormShell>

            <FormShell title="Harga" description="Harga normal dan harga promo.">
              <FormGrid>
                <FieldGroup>
                  <Label htmlFor="price">Harga Promo <span className="ml-0.5 text-destructive">*</span></Label>
                  <div className="relative">
                    <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">Rp</span>
                    <Input
                      id="price"
                      type="text"
                      inputMode="numeric"
                      placeholder="0"
                      className="pl-9"
                      value={watchedPrice}
                      onChange={(e) => form.setValue("price", e.target.value.replace(/[^0-9]/g, ""), { shouldDirty: true, shouldValidate: true })}
                      aria-invalid={Boolean(form.formState.errors.price)}
                    />
                  </div>
                  {form.formState.errors.price && <p className="text-xs font-medium text-destructive">{String(form.formState.errors.price.message)}</p>}
                </FieldGroup>
                <FieldGroup>
                  <Label htmlFor="oldPrice">Harga Asli (Coret) <span className="ml-0.5 text-destructive">*</span></Label>
                  <div className="relative">
                    <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">Rp</span>
                    <Input
                      id="oldPrice"
                      type="text"
                      inputMode="numeric"
                      placeholder="0"
                      className="pl-9"
                      value={watchedOldPrice}
                      onChange={(e) => form.setValue("oldPrice", e.target.value.replace(/[^0-9]/g, ""), { shouldDirty: true, shouldValidate: true })}
                      aria-invalid={Boolean(form.formState.errors.oldPrice)}
                    />
                  </div>
                  {form.formState.errors.oldPrice && <p className="text-xs font-medium text-destructive">{String(form.formState.errors.oldPrice.message)}</p>}
                </FieldGroup>
                <FieldGroup>
                  <Label>Diskon</Label>
                  <div className="flex h-9 items-center rounded-lg border border-border bg-muted/30 px-3 text-sm">
                    {discountPercent > 0 ? (
                      <span className="font-semibold text-emerald-600">{discountPercent}%</span>
                    ) : (
                      <span className="text-muted-foreground/50">Otomatis terhitung</span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">Terhitung otomatis dari harga asli dan harga promo.</p>
                </FieldGroup>
                <FieldGroup>
                  <Label htmlFor="currency">Mata Uang</Label>
                  <Controller
                    control={form.control}
                    name="currency"
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="IDR">IDR (Rp)</SelectItem>
                          <SelectItem value="USD">USD ($)</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                </FieldGroup>
                {renderField("priceNote", "Catatan Harga", { placeholder: "Contoh: Harga berlaku untuk 1x sesi", hint: "Opsional, muncul di samping harga.", full: true })}
              </FormGrid>
            </FormShell>

            <FormShell title="Konten Kampanye" description="Deskripsi dan informasi detail promosi.">
              <FormGrid>
                {renderField("desc", "Deskripsi Singkat", { type: "textarea", placeholder: "Deskripsi utama yang tampil di kartu promosi (min 10 karakter)", required: true, full: true })}
                {renderField("fullDescription", "Deskripsi Lengkap", { type: "textarea", placeholder: "Informasi detail untuk halaman promosi", full: true })}
                {renderField("terms", "Syarat & Ketentuan", { type: "textarea", placeholder: "Syarat dan ketentuan promosi", full: true })}
              </FormGrid>
            </FormShell>

            <FormShell title="Jadwal & Visibilitas" description="Atur waktu tayang dan visibilitas promosi.">
              <FormGrid>
                <FieldGroup>
                  <Label htmlFor="startDate">Tanggal Mulai</Label>
                  <DatePicker
                    id="startDate"
                    value={watchedStartDate}
                    onChange={(v) => form.setValue("startDate", v, { shouldDirty: true, shouldValidate: true })}
                  />
                </FieldGroup>
                <FieldGroup>
                  <Label htmlFor="endDate">Tanggal Akhir</Label>
                  <DatePicker
                    id="endDate"
                    value={watchedEndDate}
                    onChange={(v) => form.setValue("endDate", v, { shouldDirty: true, shouldValidate: true })}
                  />
                  {form.formState.errors.endDate && <p className="text-xs font-medium text-destructive">{String(form.formState.errors.endDate.message)}</p>}
                </FieldGroup>
                <FieldGroup>
                  <Label htmlFor="status">Status</Label>
                  <Controller
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {STATUS_OPTIONS.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </FieldGroup>
                {renderField("featured", "Tampilkan sebagai Unggulan", { type: "switch", hint: "Promosi unggulan muncul di posisi prioritas." })}
                {renderField("displayOrder", "Urutan Tampil", { type: "number", placeholder: "0", hint: "Semakin kecil semakin prioritas." })}
                {renderField("maxClaims", "Maksimal Klaim (opsional)", { type: "number", placeholder: "Tidak terbatas", hint: "Kosongkan jika tidak ada batasan." })}
              </FormGrid>
            </FormShell>

            <FormShell title="Media" description="Visual promosi.">
              <FormGrid>
                <FieldGroup className="md:col-span-2">
                  <ImageUrlField
                    id="coverImage"
                    label="URL Gambar Cover"
                    value={watchedCover ?? ""}
                    onChange={(v) => form.setValue("coverImage", v, { shouldDirty: true })}
                    helperText="URL gambar untuk kartu promosi dan halaman publik."
                    previewAlt="Pratinjau cover promosi"
                  />
                </FieldGroup>
                <FieldGroup>
                  <Label htmlFor="accentColor">Warna Aksen</Label>
                  <Controller
                    control={form.control}
                    name="accentColor"
                    render={({ field }) => (
                      <div className="flex flex-wrap gap-2">
                        {ACCENT_COLORS.map((c) => (
                          <Button
                            key={c.value}
                            type="button"
                            variant="ghost"
                            size="icon"
                            className={cn(
                              "h-9 w-9 rounded-full border-2 transition-all",
                              field.value === c.value
                                ? "border-foreground ring-2 ring-foreground/20"
                                : "border-transparent hover:border-muted-foreground/30",
                            )}
                            aria-label={c.label}
                            title={c.label}
                            onClick={() => field.onChange(c.value)}
                          >
                            <span className={cn("h-5 w-5 rounded-full", accentBg[c.value])} />
                          </Button>
                        ))}
                      </div>
                    )}
                  />
                </FieldGroup>
              </FormGrid>
            </FormShell>
          </div>

          <div className="space-y-6">
            <PreviewPanel
              sticky
              sections={[
                {
                  title: "Pratinjau Kampanye",
                  children: (
                    <div className="space-y-3">
                      <div className={cn(
                        "relative overflow-hidden rounded-xl border border-border bg-gradient-to-br p-5 text-white shadow-sm",
                        accentGradient[watchedAccent ?? "teal"] || "from-teal-500 to-teal-600",
                      )}>
                        {watchedCover && (
                          <div className="absolute inset-0 opacity-20">
                            <AdminImage src={watchedCover} alt="" className="h-full w-full object-cover" />
                          </div>
                        )}
                        <div className="relative">
                          <div className="mb-3 flex items-center gap-2">
                            {watchedTag && (
                              <span className="rounded-full bg-white/20 px-2.5 py-0.5 text-[11px] font-medium uppercase tracking-wider backdrop-blur-sm">
                                {watchedTag}
                              </span>
                            )}
                            <StatusBadge status={watchedStatus || "draft"} size="sm" />
                          </div>
                          <h3 className="text-lg font-bold leading-tight">{watchedTitle || "Judul Promosi"}</h3>
                          {watchedDesc && (
                            <p className="mt-1.5 text-sm text-white/80 line-clamp-2">{watchedDesc}</p>
                          )}
                          <div className="mt-3 flex items-baseline gap-2">
                            <span className="text-2xl font-bold">Rp {formatPrice(watchedPrice)}</span>
                            {watchedOldPrice && (
                              <span className="text-sm text-white/60 line-through">Rp {formatPrice(watchedOldPrice)}</span>
                            )}
                            {discountPercent > 0 && (
                              <span className="rounded-full bg-emerald-400/30 px-2 py-0.5 text-[11px] font-medium backdrop-blur-sm">
                                -{discountPercent}%
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <Card className="p-4">
                        <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">Detail Promosi</h4>
                        <div className="mt-3 space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Tipe</span>
                            <span className="font-medium">{CAMPAIGN_TYPE_OPTIONS.find((o) => o.value === watchedCampaignType)?.label || "-"}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Audiens</span>
                            <span className="font-medium">{AUDIENCE_OPTIONS.find((o) => o.value === watchedAudience)?.label || "-"}</span>
                          </div>
                          {watchedCurrency && (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Mata Uang</span>
                              <span className="font-medium">{watchedCurrency}</span>
                            </div>
                          )}
                          {watchedPriceNote && (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Catatan</span>
                              <span className="font-medium">{watchedPriceNote}</span>
                            </div>
                          )}
                        </div>
                      </Card>
                    </div>
                  ),
                },
                {
                  title: "Checklist Publikasi",
                  children: (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span className="font-semibold text-foreground">{readyCount}</span>
                        <span>/ {checklistItems.length} siap</span>
                      </div>
                      <div className="space-y-2">
                        {checklistItems.map((item) => (
                          <div key={item.label} className="flex items-center gap-2">
                            {item.done ? (
                              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                            ) : (
                              <Circle className="h-4 w-4 shrink-0 text-muted-foreground/40" />
                            )}
                            <span className={cn("text-sm", item.done ? "text-foreground" : "text-muted-foreground")}>
                              {item.label}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ),
                },
              ]}
            />
          </div>
        </div>

        <FormActions>
          <Button type="button" variant="outline" onClick={() => router.push("/admin/promotions")}>
            Batal
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={form.formState.isSubmitting}
            onClick={() => submitWithStatus("draft")}
          >
            {form.formState.isSubmitting ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Menyimpan</>
            ) : "Simpan Draft"}
          </Button>
          <Button
            type="button"
            disabled={form.formState.isSubmitting}
            onClick={() => submitWithStatus("active")}
          >
            {form.formState.isSubmitting ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Menerbitkan</>
            ) : (
              <><Eye className="h-4 w-4" /> Simpan & Terbitkan</>
            )}
          </Button>
        </FormActions>
      </form>
    </div>
  );
}
