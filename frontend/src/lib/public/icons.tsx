import {
  Activity,
  Ambulance,
  Baby,
  Bone,
  Brain,
  ClipboardCheck,
  ClipboardList,
  Cross,
  Droplet,
  Ear,
  Eye,
  FlaskConical,
  Heart,
  HeartPulse,
  Microscope,
  Pill,
  Scan,
  Scissors,
  ShieldCheck,
  Stethoscope,
  Syringe,
  Tablets,
  TestTube,
  Thermometer,
  type LucideIcon,
} from "lucide-react";

/**
 * Curated lucide map for the public site. Server-safe (no "use client")
 * and explicit so only the icons the clinic actually uses ship in the
 * bundle — unlike `import * as LucideIcons` which defeats tree-shaking.
 * Falls back to Stethoscope for unknown names coming from the dashboard.
 */
const ICONS: Record<string, LucideIcon> = {
  Activity,
  Ambulance,
  Baby,
  Bone,
  Brain,
  ClipboardCheck,
  ClipboardList,
  Cross,
  Droplet,
  Ear,
  Eye,
  FlaskConical,
  Heart,
  HeartPulse,
  Microscope,
  Pill,
  Scan,
  Scissors,
  ShieldCheck,
  Stethoscope,
  Syringe,
  Tablets,
  TestTube,
  Thermometer,
};

export function ServiceIcon({
  name,
  className,
}: {
  name?: string | null;
  className?: string;
}) {
  const Icon = (name && ICONS[name]) || Stethoscope;
  return <Icon className={className} aria-hidden="true" />;
}
