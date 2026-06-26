"use client";

import dynamic from "next/dynamic";
import type { ServiceVM, DoctorVM } from "@/lib/public/api";

const DynamicBookingWizard = dynamic(
  () => import("./BookingWizard").then((mod) => mod.BookingWizard),
  { ssr: false }
);

export function BookingWizard(props: { services: ServiceVM[]; doctors: DoctorVM[] }) {
  return <DynamicBookingWizard {...props} />;
}
