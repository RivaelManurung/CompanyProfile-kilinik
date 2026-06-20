import {
  ClipboardList,
  FileText,
  History,
  LayoutDashboard,
  MapPin,
  Settings,
  Shield,
  Stethoscope,
  Tags,
  Users,
  UsersRound,
  type LucideIcon,
} from "lucide-react";
import { permissions } from "./permissions";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  permission: string;
  exact?: boolean;
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

export const adminNavGroups: NavGroup[] = [
  {
    label: "Operations",
    items: [
      { label: "Overview", href: "/admin", icon: LayoutDashboard, permission: permissions.dashboardRead, exact: true },
      { label: "Appointments", href: "/admin/appointments", icon: ClipboardList, permission: permissions.appointmentsRead },
      { label: "Pasien", href: "/admin/patients", icon: UsersRound, permission: permissions.patientsRead },
    ],
  },
  {
    label: "Clinic Management",
    items: [
      { label: "Doctors", href: "/admin/doctors", icon: Stethoscope, permission: permissions.clinicRead },
      { label: "Services", href: "/admin/services", icon: Settings, permission: permissions.clinicRead },
      { label: "Locations", href: "/admin/locations", icon: MapPin, permission: permissions.clinicRead },
      { label: "Promotions", href: "/admin/promotions", icon: Tags, permission: permissions.contentRead },
    ],
  },
  {
    label: "Content",
    items: [
      { label: "Articles", href: "/admin/articles", icon: FileText, permission: permissions.contentRead },
    ],
  },
  {
    label: "System",
    items: [
      { label: "Admin Users", href: "/admin/users", icon: Users, permission: permissions.systemRead },
      { label: "Roles & Permissions", href: "/admin/roles", icon: Shield, permission: permissions.systemRead },
      { label: "Audit Logs", href: "/admin/audit-logs", icon: History, permission: permissions.auditRead },
    ],
  },
];

export function flatAdminNav() {
  return adminNavGroups.flatMap((group) => group.items);
}
