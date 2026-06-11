"use client";

import { DeletePage } from "@/components/admin/DeletePage";
import { doctorsApi } from "@/lib/admin/api";

export default function DeleteDoctorPage() {
  return (
    <DeletePage
      singular="Dokter"
      api={doctorsApi}
      backUrl="/admin/doctors"
    />
  );
}
