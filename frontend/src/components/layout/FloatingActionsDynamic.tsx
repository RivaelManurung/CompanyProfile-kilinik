"use client";

import dynamic from "next/dynamic";

const DynamicFloatingActions = dynamic(
  () => import("./FloatingActions").then((mod) => mod.FloatingActions),
  { ssr: false }
);

export function FloatingActions() {
  return <DynamicFloatingActions />;
}
