"use client";

import { useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch, type Resolver } from "react-hook-form";
import { toast } from "sonner";
import { ArrowLeft, Loader2, Clock, CheckCircle2, XCircle } from "lucide-react";

import { articlesApi, ApiError } from "@/lib/admin/api";
import { mapArticlePayload } from "@/lib/admin/payload-mapper";
import { articleSchema } from "@/lib/admin/schemas/article.schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
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
import { PreviewPanel, PreviewCard } from "@/components/admin/preview-panel";
import { RichTextEditor, htmlToPlainText } from "@/components/admin/rich-text-editor";
import { ImageUpload } from "@/components/admin/image-upload";
import { AdminImage } from "@/components/admin/admin-image";

interface FormValues {
  title: string;
  slug: string;
  category: string;
  tags: string;
  author: string;
  coverImage: string;
  content: string;
  excerpt: string;
  readMins: number;
  status: "draft" | "published" | "scheduled" | "archived";
  scheduledAt: string;
  featured: boolean;
  seoTitle: string;
  seoDescription: string;
  ogImage: string;
  focusKeyword: string;
}

function toSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .substring(0, 80);
}

function estimateReadMins(content: string): number {
  if (!content) return 0;
  const words = content.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

const defaultValues: FormValues = {
  title: "",
  slug: "",
  category: "",
  tags: "",
  author: "",
  coverImage: "",
  content: "",
  excerpt: "",
  readMins: 4,
  status: "draft",
  scheduledAt: "",
  featured: false,
  seoTitle: "",
  seoDescription: "",
  ogImage: "",
  focusKeyword: "",
};

export default function NewArticlePage() {
  const router = useRouter();
  const slugTouched = useRef(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(articleSchema) as unknown as Resolver<FormValues>,
    defaultValues,
  });

  const { control } = form;

  const title = useWatch({ control, name: "title" });
  const slug = useWatch({ control, name: "slug" });
  const content = useWatch({ control, name: "content" });
  const category = useWatch({ control, name: "category" });
  const excerpt = useWatch({ control, name: "excerpt" });
  const author = useWatch({ control, name: "author" });
  const coverImage = useWatch({ control, name: "coverImage" });
  const status = useWatch({ control, name: "status" });
  const seoTitle = useWatch({ control, name: "seoTitle" });
  const seoDescription = useWatch({ control, name: "seoDescription" });
  const ogImage = useWatch({ control, name: "ogImage" });
  const featured = useWatch({ control, name: "featured" });

  useEffect(() => {
    if (!slugTouched.current && title) {
      form.setValue("slug", toSlug(title));
    }
  }, [title, form]);

  const readingTime = useMemo(() => estimateReadMins(htmlToPlainText(content ?? "")), [content]);

  useEffect(() => {
    form.setValue("readMins", readingTime);
  }, [readingTime, form]);

  async function save(publishStatus: "draft" | "published" | "scheduled" | "archived") {
    const valid = await form.trigger();
    if (!valid) {
      const first = Object.values(form.formState.errors)[0];
      toast.error((first?.message as string) || "Mohon periksa kembali isian form");
      return;
    }
    const values = form.getValues();
    const payload = mapArticlePayload({
      ...values,
      readMins: readingTime,
      slug: values.slug || toSlug(values.title),
      status: publishStatus,
    });

    try {
      await articlesApi.create(payload);
      toast.success(publishStatus === "draft" ? "Draf disimpan" : "Artikel diterbitkan");
      router.push("/admin/articles");
    } catch (err) {
      if (err instanceof ApiError && err.details?.length) {
        for (const detail of err.details) {
          form.setError(detail.field as keyof FormValues, { message: detail.message });
        }
        return;
      }
      toast.error(err instanceof ApiError ? err.message : "Gagal menyimpan");
    }
  }

  const checklist = useMemo(() => [
    { label: "Judul", ok: title.length >= 4 },
    { label: "Slug", ok: slug.length > 0 },
    { label: "Ringkasan (≥10 karakter)", ok: excerpt.length >= 10 },
    { label: "Kategori", ok: category.length > 0 },
    { label: "Konten (>20 karakter)", ok: htmlToPlainText(content ?? "").length > 20 },
  ], [title, slug, excerpt, category, content]);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Blog"
        title="Tulis Artikel Baru"
        backButton={
          <Button variant="ghost" size="sm" onClick={() => router.push("/admin/articles")}>
            <ArrowLeft className="h-4 w-4" /> Kembali
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* Form - left */}
        <div className="space-y-6 xl:col-span-2">

          <FormShell title="Identitas Artikel" description="Judul, kategori, tags, dan penulis.">
            <FormGrid>
              <FieldGroup className="md:col-span-2">
                <Label htmlFor="title">Judul <span className="text-destructive">*</span></Label>
                <Input id="title" placeholder="Masukkan judul artikel" {...form.register("title")} />
                {form.formState.errors.title && (
                  <p className="text-xs font-medium text-destructive">{String(form.formState.errors.title.message)}</p>
                )}
              </FieldGroup>
              <FieldGroup>
                <Label htmlFor="slug">Slug</Label>
                <Input
                  id="slug"
                  placeholder="auto-generated"
                  value={slug}
                  onChange={(e) => {
                    slugTouched.current = true;
                    form.setValue("slug", e.target.value, { shouldValidate: true });
                  }}
                />
                <p className="text-xs text-muted-foreground">Biarkan kosong untuk generate otomatis</p>
                {form.formState.errors.slug && (
                  <p className="text-xs font-medium text-destructive">{String(form.formState.errors.slug.message)}</p>
                )}
              </FieldGroup>
              <FieldGroup>
                <Label htmlFor="category">Kategori <span className="text-destructive">*</span></Label>
                <Input id="category" placeholder="cth: Kesehatan Wanita" {...form.register("category")} />
                {form.formState.errors.category && (
                  <p className="text-xs font-medium text-destructive">{String(form.formState.errors.category.message)}</p>
                )}
              </FieldGroup>
              <FieldGroup>
                <Label htmlFor="tags">Tags</Label>
                <Input id="tags" placeholder="pisahkan dengan koma" {...form.register("tags")} />
              </FieldGroup>
              <FieldGroup>
                <Label htmlFor="author">Penulis</Label>
                <Input id="author" placeholder="Nama penulis" {...form.register("author")} />
              </FieldGroup>
            </FormGrid>
          </FormShell>

          <FormShell title="Konten" description="Tulis isi artikel dengan editor lengkap.">
            <FormGrid>
              <FieldGroup className="md:col-span-2">
                <RichTextEditor
                  id="content"
                  label="Konten"
                  value={content ?? ""}
                  onChange={(v) => form.setValue("content", v, { shouldValidate: true })}
                  onBlur={() => form.trigger("content")}
                  error={form.formState.errors.content?.message as string | undefined}
                  placeholder="Tulis isi artikel di sini..."
                  required
                />
              </FieldGroup>
              <FieldGroup>
                <Label>Estimasi Waktu Baca</Label>
                <Input value={`${readingTime} menit`} disabled className="text-muted-foreground" />
                <p className="text-xs text-muted-foreground">Dihitung otomatis (~200 kata/menit)</p>
              </FieldGroup>
              <FieldGroup className="md:col-span-2">
                <Label htmlFor="excerpt">Ringkasan <span className="text-destructive">*</span></Label>
                <Textarea id="excerpt" rows={3} placeholder="Ringkasan singkat artikel..." {...form.register("excerpt")} />
                <div className="flex items-center justify-between">
                  {form.formState.errors.excerpt && (
                    <p className="text-xs font-medium text-destructive">{String(form.formState.errors.excerpt.message)}</p>
                  )}
                  <p className="text-xs text-muted-foreground ml-auto">{excerpt.length}/500</p>
                </div>
              </FieldGroup>
            </FormGrid>
          </FormShell>

          <FormShell title="SEO & Social" description="Optimasi mesin pencari dan media sosial.">
            <FormGrid>
              <FieldGroup>
                <Label htmlFor="seoTitle">Judul SEO</Label>
                <Input id="seoTitle" placeholder="Judul untuk hasil pencarian" {...form.register("seoTitle")} />
                <p className={`text-xs ${seoTitle.length > 60 ? "text-amber-600" : "text-muted-foreground"}`}>
                  {seoTitle.length}/60 karakter {seoTitle.length > 60 ? "· melebihi anjuran" : ""}
                </p>
              </FieldGroup>
              <FieldGroup>
                <Label htmlFor="focusKeyword">Kata Kunci Fokus</Label>
                <Input id="focusKeyword" placeholder="kata kunci utama" {...form.register("focusKeyword")} />
              </FieldGroup>
              <FieldGroup className="md:col-span-2">
                <Label htmlFor="seoDescription">Deskripsi SEO</Label>
                <Textarea id="seoDescription" rows={2} placeholder="Deskripsi untuk hasil pencarian" {...form.register("seoDescription")} />
                <p className={`text-xs ${seoDescription.length > 160 ? "text-amber-600" : "text-muted-foreground"}`}>
                  {seoDescription.length}/160 karakter {seoDescription.length > 160 ? "· melebihi anjuran" : ""}
                </p>
              </FieldGroup>
              <FieldGroup className="md:col-span-2">
                <Label htmlFor="ogImage">Gambar OG (Open Graph)</Label>
                <div className="max-w-xs">
                  <ImageUpload
                    value={ogImage ?? ""}
                    onChange={(v) => form.setValue("ogImage", v)}
                    folder="articles"
                    aspect="video"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Gambar saat artikel dibagikan ke media sosial. Ideal 1200×630px.
                </p>
              </FieldGroup>
            </FormGrid>
          </FormShell>
        </div>

        {/* Sidebar - right */}
        <div className="space-y-6">
          <PreviewPanel
            sticky
            sections={[
              {
                title: "Gambar Sampul",
                children: (
                  <ImageUpload
                    value={coverImage ?? ""}
                    onChange={(v) => form.setValue("coverImage", v)}
                    folder="articles"
                    aspect="video"
                  />
                ),
              },
              {
                title: "Pengaturan Publikasi",
                children: (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="status">Status</Label>
                      <Select
                        value={status}
                        onValueChange={(val) => form.setValue("status", val as FormValues["status"])}
                      >
                        <SelectTrigger id="status" className="h-9">
                          <SelectValue placeholder="Pilih status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="draft">Draf</SelectItem>
                          <SelectItem value="published">Terbit</SelectItem>
                          <SelectItem value="scheduled">Terjadwal</SelectItem>
                          <SelectItem value="archived">Arsip</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {status === "scheduled" && (
                      <div className="space-y-2">
                        <Label htmlFor="scheduledAt">Jadwal Terbit</Label>
                        <DatePicker
                          id="scheduledAt"
                          withTime
                          value={form.watch("scheduledAt") ?? ""}
                          onChange={(v) => form.setValue("scheduledAt", v, { shouldDirty: true, shouldValidate: true })}
                        />
                      </div>
                    )}
                    <div className="flex items-center gap-3 rounded-lg border border-border p-3">
                      <Switch
                        id="featured"
                        checked={featured}
                        onCheckedChange={(checked) => form.setValue("featured", checked)}
                      />
                      <div>
                        <Label htmlFor="featured" className="text-sm font-medium">Artikel Unggulan</Label>
                        <p className="text-xs text-muted-foreground">Tampilkan di bagian unggulan</p>
                      </div>
                    </div>
                  </div>
                ),
              },
              {
                title: "Pratinjau Artikel",
                children: (
                  <PreviewCard>
                    <div className="aspect-video w-full overflow-hidden bg-muted">
                      <AdminImage src={coverImage} alt="Pratinjau sampul" className="h-full w-full object-cover" />
                    </div>
                    <div className="p-3 space-y-2">
                      {category && (
                        <span className="inline-block rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-medium text-primary">
                          {category}
                        </span>
                      )}
                      <h3 className="text-sm font-semibold leading-snug text-foreground line-clamp-2">
                        {title || "Judul Artikel"}
                      </h3>
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {excerpt || "Ringkasan artikel akan tampil di sini..."}
                      </p>
                      <div className="flex items-center gap-3 pt-1 text-[11px] text-muted-foreground">
                        {author && <span>{author}</span>}
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" /> {readingTime} min read
                        </span>
                      </div>
                    </div>
                  </PreviewCard>
                ),
              },
              {
                title: "Pratinjau SEO",
                children: (
                  <div className="space-y-1.5">
                    <p className="text-sm font-semibold text-blue-700 truncate">
                      {seoTitle || title || "Judul Artikel"}
                    </p>
                    <p className="text-xs text-green-700 truncate">
                      {process.env.NEXT_PUBLIC_SITE_URL || "https://kliniksehatnusantara.com"}/artikel/{slug || "nama-artikel"}
                    </p>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {seoDescription || excerpt || "Deskripsi untuk hasil pencarian..."}
                    </p>
                  </div>
                ),
              },
              {
                title: "Ceklis Publikasi",
                children: (
                  <div className="space-y-2">
                    {checklist.map((item) => (
                      <div key={item.label} className="flex items-center gap-2 text-xs">
                        {item.ok ? (
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                        ) : (
                          <XCircle className="h-3.5 w-3.5 text-muted-foreground/40 shrink-0" />
                        )}
                        <span className={item.ok ? "text-foreground" : "text-muted-foreground/60"}>
                          {item.label}
                        </span>
                      </div>
                    ))}
                  </div>
                ),
              },
            ]}
          />
        </div>
      </div>

      <FormActions>
        <Button type="button" variant="outline" onClick={() => router.push("/admin/articles")} disabled={form.formState.isSubmitting}>
          Batal
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => save("draft")}
          disabled={form.formState.isSubmitting}
        >
          {form.formState.isSubmitting ? (
            <><Loader2 className="h-4 w-4 animate-spin" /> Menyimpan</>
          ) : "Simpan sebagai Draf"}
        </Button>
        <Button
          type="button"
          onClick={() => save(status === "draft" ? "published" : status)}
          disabled={form.formState.isSubmitting}
        >
          {form.formState.isSubmitting ? (
            <><Loader2 className="h-4 w-4 animate-spin" /> Menyimpan</>
          ) : status === "scheduled" ? "Jadwalkan" : status === "archived" ? "Arsipkan" : "Terbitkan"}
        </Button>
      </FormActions>
    </div>
  );
}
