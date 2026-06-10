// Types mirroring the Go backend models (JSON shapes).

export interface Admin {
  id: number;
  name: string;
  email: string;
  role: string;
  createdAt: string;
  updatedAt: string;
}

export interface AdminSession {
  admin: Admin;
  permissions: string[];
}

export type AppointmentStatus = "pending" | "confirmed" | "done" | "cancelled";

export interface Appointment {
  id: number;
  name: string;
  phone: string;
  email: string;
  service: string;
  message: string;
  status: AppointmentStatus;
  createdAt: string;
  updatedAt: string;
}

export interface Doctor {
  id: number;
  slug: string;
  name: string;
  specialty: string;
  experience: string;
  imageUrl: string;
  accent: string;
  orderIndex: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Article {
  id: number;
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  content: string;
  readMins: number;
  published: boolean;
  publishedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface Service {
  id: number;
  slug: string;
  title: string;
  short: string;
  description: string;
  icon: string;
  points: string[];
  orderIndex: number;
}

export interface ClinicLocation {
  id: number;
  slug: string;
  name: string;
  area: string;
  address: string;
  hours: string;
  phone: string;
  lat: number;
  lng: number;
}

export interface Promotion {
  id: number;
  slug: string;
  title: string;
  tag: string;
  price: string;
  oldPrice: string;
  desc: string;
  active: boolean;
}

export interface StatsResponse {
  totals: {
    appointments: number;
    pending: number;
    todayAppointments: number;
    overdueFollowUp: number;
    doctors: number;
    articles: number;
    draftArticles: number;
    locations: number;
    promotions: number;
  };
  byStatus: { status: AppointmentStatus; count: number }[];
  series: { day: string; count: number }[];
  recent: Appointment[];
  busiestServices: { service: string; count: number }[];
  recentActivity: AuditLog[];
}

export interface ListMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ListEnvelope<T> {
  data: T[];
  meta: ListMeta;
}

export interface ListParams {
  page?: number;
  limit?: number;
  q?: string;
  status?: string;
  sort?: string;
  direction?: "asc" | "desc";
}

export interface AuditLog {
  id: number;
  adminId: string;
  adminEmail: string;
  action: string;
  resource: string;
  resourceId: string;
  ip: string;
  userAgent: string;
  createdAt: string;
}
