"use client";

import dynamic from "next/dynamic";
import type { ClinicLocation } from "@/lib/data";

const DynamicClinicMap = dynamic(
  () => import("./ClinicMap").then((mod) => mod.ClinicMap),
  { ssr: false }
);

export function ClinicMap(props: {
  locations?: ClinicLocation[];
  className?: string;
  zoom?: number;
}) {
  return <DynamicClinicMap {...props} />;
}
