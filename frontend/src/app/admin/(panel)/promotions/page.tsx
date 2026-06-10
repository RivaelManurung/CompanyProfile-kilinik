"use client";

import { CrudManager, type Column, type Field, type FormState } from "@/components/admin/CrudManager";
import { useAdminSession } from "@/components/admin/AdminShell";
import { promotionsApi } from "@/lib/admin/api";
import { can, permissions } from "@/lib/admin/permissions";
import { promotionSchema } from "@/lib/admin/schemas/promotion.schema";
import type { Promotion } from "@/lib/admin/types";

const columns: Column<Promotion>[] = [
  { header: "Promo", cell: (p) => <span className="font-medium text-foreground">{p.title}</span> },
  { header: "Tag", cell: (p) => <span className="rounded-full bg-accent px-2 py-0.5 text-xs font-medium text-accent-foreground">{p.tag}</span> },
  { header: "Harga", cell: (p) => <span className="font-semibold text-primary">{p.price}</span> },
  {
    header: "Status",
    cell: (p) => (
      <span className={p.active ? "text-emerald-600" : "text-muted-foreground"}>{p.active ? "Aktif" : "Nonaktif"}</span>
    ),
  },
];

const fields: Field[] = [
  { name: "title", label: "Judul Promo", placeholder: "IV Therapy untuk GERD", full: true },
  { name: "tag", label: "Tag", placeholder: "Hemat 20%" },
  { name: "price", label: "Harga", placeholder: "Rp 480.000" },
  { name: "oldPrice", label: "Harga Coret", placeholder: "Rp 600.000" },
  { name: "desc", label: "Deskripsi", type: "textarea" },
  { name: "slug", label: "Slug (opsional)", placeholder: "otomatis dari judul", full: true },
  { name: "active", label: "Aktif (tampil di situs)", type: "checkbox" },
];

function toForm(p?: Promotion): FormState {
  return {
    title: p?.title ?? "",
    tag: p?.tag ?? "",
    price: p?.price ?? "",
    oldPrice: p?.oldPrice ?? "",
    desc: p?.desc ?? "",
    slug: p?.slug ?? "",
    active: p?.active ?? true,
  };
}

export default function PromotionsPage() {
  const session = useAdminSession();
  return (
    <CrudManager<Promotion>
      title="Promo"
      singular="Promo"
      api={promotionsApi}
      columns={columns}
      fields={fields}
      schema={promotionSchema}
      toForm={toForm}
      searchPlaceholder="Cari promo, tag, atau slug..."
      defaultSort="created_at"
      filters={[
        { value: "", label: "Semua" },
        { value: "active", label: "Aktif" },
        { value: "inactive", label: "Nonaktif" },
      ]}
      canCreate={can(session, permissions.contentWrite)}
      canEdit={can(session, permissions.contentWrite)}
      canDelete={can(session, permissions.contentDelete)}
    />
  );
}
