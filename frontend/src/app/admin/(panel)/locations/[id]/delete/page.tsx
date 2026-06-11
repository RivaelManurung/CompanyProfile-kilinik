"use client";

import { DeletePage } from "@/components/admin/DeletePage";
import { locationsApi } from "@/lib/admin/api";

export default function DeleteLocationPage() {
  return (
    <DeletePage
      singular="Lokasi"
      api={locationsApi}
      backUrl="/admin/locations"
    />
  );
}
