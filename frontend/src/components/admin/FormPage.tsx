"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, type Resolver } from "react-hook-form";
import { toast } from "sonner";
import { ArrowLeft, Loader2 } from "lucide-react";
import { ApiError } from "@/lib/admin/api";
import type { FormState } from "@/components/admin/CrudManager";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageHeader } from "@/components/admin/page-header";
import { FormShell, FormGrid, FieldGroup, FormActions } from "@/components/admin/form-shell";


interface Field {
  name: string;
  label: string;
  type?: "text" | "textarea" | "number" | "checkbox" | "tags" | "url" | "select" | "password";
  placeholder?: string;
  full?: boolean;
  hint?: string;
  required?: boolean;
  section?: string;
  sectionDescription?: string;
  options?: { value: string; label: string }[];
}

interface Props {
  title: string;
  singular: string;
  api: {
    get?: (id: number) => Promise<unknown>;
    create: (body: Record<string, unknown>) => Promise<unknown>;
    update: (id: number, body: Record<string, unknown>) => Promise<unknown>;
  };
  fields: Field[];
  schema: Parameters<typeof zodResolver>[0];
  toForm: (row?: unknown) => FormState;
  backUrl: string;
  sections?: { key: string; label: string; description?: string }[];
}

export function FormPage({
  title,
  singular,
  api,
  fields,
  schema,
  toForm,
  backUrl,
  sections,
}: Props) {
  const router = useRouter();
  const params = useParams();
  const id = useMemo(() => (params?.id ? Number(params.id) : null), [params?.id]);
  const isEdit = id !== null && !isNaN(id);

  const [loading, setLoading] = useState(isEdit);
  const [notFound, setNotFound] = useState(false);

  const form = useForm<FormState>({
    resolver: zodResolver(schema) as Resolver<FormState>,
    defaultValues: toForm(),
  });

  useEffect(() => {
    if (!isEdit || !api.get) return;
    const numericId = id!;
    api.get(numericId)
      .then((data) => form.reset(toForm(data)))
      .catch((err) => {
        if (err instanceof ApiError && err.status === 404) setNotFound(true);
        else toast.error(err instanceof ApiError ? err.message : "Gagal memuat data");
      })
      .finally(() => setLoading(false));
  }, [id, isEdit, api, form, toForm]);

  async function save(values: FormState) {
    try {
      const payload: Record<string, unknown> = { ...values };
      if (isEdit && id) {
        await api.update(id, payload);
        toast.success(`${singular} diperbarui`);
      } else {
        await api.create(payload);
        toast.success(`${singular} ditambahkan`);
      }
      router.push(backUrl);
    } catch (err) {
      if (err instanceof ApiError && err.details?.length) {
        for (const detail of err.details) form.setError(detail.field, { message: detail.message });
        return;
      }
      toast.error(err instanceof ApiError ? err.message : "Gagal menyimpan");
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="space-y-6">
        <PageHeader eyebrow={title} title={`${singular} tidak ditemukan`} backButton={
          <Button variant="ghost" size="sm" onClick={() => router.push(backUrl)}>
            <ArrowLeft className="h-4 w-4" /> Kembali
          </Button>
        } />
      </div>
    );
  }

  const groupedFields = sections
    ? sections.map((section) => ({
        ...section,
        fields: fields.filter((f) => f.section === section.key),
      })).filter((s) => s.fields.length > 0)
    : [{ key: "default", label: "", fields }];

  function renderField(field: Field) {
    const type = field.type ?? "text";
    const errorMessage = form.formState.errors[field.name]?.message;
    const value = form.watch(field.name);
    const errorId = `${field.name}-error`;
    const hintId = `${field.name}-hint`;
    const describedBy = [field.hint ? hintId : null, errorMessage ? errorId : null].filter(Boolean).join(" ") || undefined;
    const invalid = Boolean(errorMessage);

    return (
      <FieldGroup key={field.name} className={field.full || type === "textarea" || type === "tags" ? "md:col-span-2" : undefined}>
        {type !== "checkbox" && (
          <Label htmlFor={field.name}>
            {field.label}
            {field.required ? <span className="text-destructive ml-0.5">*</span> : null}
          </Label>
        )}
        {type === "textarea" ? (
          <Textarea id={field.name} rows={5} placeholder={field.placeholder} {...form.register(field.name)} aria-invalid={invalid} aria-describedby={describedBy} />
        ) : type === "checkbox" ? (
          <div className="flex items-center gap-3 rounded-lg border border-border p-3">
            <Switch
              id={field.name}
              checked={Boolean(value)}
              onCheckedChange={(checked) => form.setValue(field.name, checked, { shouldDirty: true, shouldValidate: true })}
              aria-describedby={field.hint ? hintId : undefined}
            />
            <div>
              <Label htmlFor={field.name} className="text-sm font-medium">{field.label}</Label>
              {field.hint && <p id={hintId} className="text-xs text-muted-foreground">{field.hint}</p>}
            </div>
          </div>
        ) : type === "select" ? (
          <Select
            value={typeof value === "string" ? value : ""}
            onValueChange={(v) => form.setValue(field.name, v, { shouldDirty: true, shouldValidate: true })}
          >
            <SelectTrigger id={field.name} className="w-full" aria-invalid={invalid} aria-describedby={describedBy}>
              <SelectValue placeholder={field.placeholder ?? "Pilih..."} />
            </SelectTrigger>
            <SelectContent>
              {(field.options ?? []).map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : type === "tags" ? (
          <Input
            id={field.name}
            value={Array.isArray(value) ? value.join(", ") : ""}
            placeholder={field.placeholder}
            onChange={(event) =>
              form.setValue(field.name, event.target.value.split(",").map((p) => p.trim()).filter(Boolean), {
                shouldDirty: true, shouldValidate: true,
              })
            }
            aria-invalid={invalid}
            aria-describedby={describedBy}
          />
        ) : type === "number" ? (
          <Input
            id={field.name}
            type="number"
            value={String(value ?? "")}
            placeholder={field.placeholder}
            onChange={(event) =>
              form.setValue(field.name, event.target.value === "" ? "" : Number(event.target.value), {
                shouldDirty: true, shouldValidate: true,
              })
            }
            aria-invalid={invalid}
            aria-describedby={describedBy}
          />
        ) : (
          <Input id={field.name} type={type === "url" ? "url" : type === "password" ? "password" : "text"} placeholder={field.placeholder} {...form.register(field.name)} aria-invalid={invalid} aria-describedby={describedBy} />
        )}
        {field.hint && type !== "checkbox" && <p id={hintId} className="text-xs text-muted-foreground">{field.hint}</p>}
        {errorMessage && <p id={errorId} role="alert" className="text-xs font-medium text-destructive">{String(errorMessage)}</p>}
      </FieldGroup>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={title}
        title={isEdit ? `Edit ${singular}` : `Tambah ${singular}`}
        backButton={
          <Button variant="ghost" size="sm" onClick={() => router.push(backUrl)}>
            <ArrowLeft className="h-4 w-4" /> Kembali
          </Button>
        }
      />

      <form onSubmit={form.handleSubmit(save)}>
        <div className="space-y-6">
          {groupedFields.map((group) => (
            <FormShell
              key={group.key}
              title={group.label}
              description={group.description}
            >
              <FormGrid>
                {group.fields.map(renderField)}
              </FormGrid>
            </FormShell>
          ))}
        </div>

        <FormActions>
          <Button type="button" variant="outline" onClick={() => router.push(backUrl)} disabled={form.formState.isSubmitting}>
            Batal
          </Button>
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Menyimpan</>
            ) : "Simpan"}
          </Button>
        </FormActions>
      </form>
    </div>
  );
}
