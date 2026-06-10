"use client";

import { CrudManager, type Column, type Field, type FormState } from "@/components/admin/CrudManager";
import { useAdminSession } from "@/components/admin/AdminShell";
import { articlesApi } from "@/lib/admin/api";
import { can, permissions } from "@/lib/admin/permissions";
import { articleSchema } from "@/lib/admin/schemas/article.schema";
import type { Article } from "@/lib/admin/types";

const columns: Column<Article>[] = [
  { header: "Judul", cell: (a) => <span className="font-medium text-foreground line-clamp-1">{a.title}</span> },
  { header: "Kategori", cell: (a) => a.category },
  { header: "Baca", cell: (a) => `${a.readMins} mnt` },
  {
    header: "Status",
    cell: (a) => (
      <span className={a.published ? "text-emerald-600" : "text-muted-foreground"}>
        {a.published ? "Terbit" : "Draf"}
      </span>
    ),
  },
];

const fields: Field[] = [
  { name: "title", label: "Judul", placeholder: "Judul artikel", full: true },
  { name: "category", label: "Kategori", placeholder: "Kesehatan Wanita" },
  { name: "readMins", label: "Menit baca", type: "number" },
  { name: "slug", label: "Slug (opsional)", placeholder: "otomatis dari judul", full: true },
  { name: "excerpt", label: "Ringkasan", type: "textarea", placeholder: "Ringkasan singkat artikel" },
  { name: "content", label: "Konten", type: "textarea", placeholder: "Isi artikel lengkap" },
  { name: "published", label: "Terbitkan", type: "checkbox" },
];

function toForm(a?: Article): FormState {
  return {
    title: a?.title ?? "",
    category: a?.category ?? "",
    readMins: a?.readMins ?? 4,
    slug: a?.slug ?? "",
    excerpt: a?.excerpt ?? "",
    content: a?.content ?? "",
    published: a?.published ?? true,
  };
}

export default function ArticlesPage() {
  const session = useAdminSession();
  return (
    <CrudManager<Article>
      title="Artikel"
      singular="Artikel"
      api={articlesApi}
      columns={columns}
      fields={fields}
      schema={articleSchema}
      toForm={toForm}
      searchPlaceholder="Cari judul, kategori, atau slug..."
      defaultSort="published_at"
      filters={[
        { value: "", label: "Semua" },
        { value: "published", label: "Terbit" },
        { value: "draft", label: "Draf" },
      ]}
      canCreate={can(session, permissions.contentWrite)}
      canEdit={can(session, permissions.contentWrite)}
      canDelete={can(session, permissions.contentDelete)}
    />
  );
}
