"use client";

import { DeletePage } from "@/components/admin/DeletePage";
import { appointmentsApi } from "@/lib/admin/api";

export default function DeleteAppointmentPage() {
  return (
    <DeletePage
      singular="Janji Temu"
      api={{ get: appointmentsApi.get, remove: appointmentsApi.remove }}
      backUrl="/admin/appointments"
    />
  );
}
