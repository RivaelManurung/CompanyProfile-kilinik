"use client";

import { DeletePage } from "@/components/admin/DeletePage";
import { servicesApi } from "@/lib/admin/api";

export default function DeleteServicePage() {
  return (
    <DeletePage
      singular="Layanan"
      api={servicesApi}
      backUrl="/admin/services"
    />
  );
}
