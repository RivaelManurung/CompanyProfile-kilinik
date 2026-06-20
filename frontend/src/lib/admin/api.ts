import type {
  Admin,
  AdminSession,
  Appointment,
  AppointmentStatus,
  AvailabilityResponse,
  Article,
  AuditLog,
  ClinicLocation,
  ListEnvelope,
  Doctor,
  DoctorSchedule,
  DoctorScheduleWindow,
  ListParams,
  Patient,
  PatientDetail,
  Promotion,
  RolesResponse,
  Service,
  StatsResponse,
} from "./types";

const BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";
const ASSET_BASE = BASE.replace(/\/api\/?$/, "");
const REQUEST_TIMEOUT = 12000;

/** Resolve a stored image path to an absolute URL.
 * - Absolute URLs (http...) are returned as-is.
 * - Backend uploads ("/uploads/..") are prefixed with the API host.
 * - Other relative paths ("/doctors/..") stay relative to the frontend's public/. */
export function assetUrl(path?: string | null): string {
  if (!path) return "";
  if (/^https?:\/\//.test(path)) return path;
  if (path.startsWith("/uploads/")) return `${ASSET_BASE}${path}`;
  return path;
}

export class ApiError extends Error {
  status: number;
  code: string;
  details?: { field: string; message: string }[];
  constructor(status: number, code: string, message: string, details?: { field: string; message: string }[]) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

function qs(params: ListParams = {}) {
  const search = new URLSearchParams();
  search.set("page", String(params.page ?? 1));
  search.set("limit", String(params.limit ?? 20));
  if (params.q) search.set("q", params.q);
  if (params.status) search.set("status", params.status);
  if (params.sort) search.set("sort", params.sort);
  if (params.direction) search.set("direction", params.direction);
  return search.toString();
}

async function request<T>(path: string, options: RequestInit & { timeoutMs?: number; retry?: boolean } = {}): Promise<T> {
  const { timeoutMs, retry, signal, ...init } = options;
  void retry;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs ?? REQUEST_TIMEOUT);

  try {
    const res = await fetch(`${BASE}${path}`, {
      credentials: "include",
      ...init,
      headers: { "Content-Type": "application/json", ...(init.headers || {}) },
      signal: signal ?? controller.signal,
    });

    if (res.status === 204) return undefined as T;

    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      const err = body?.error ?? {};
      throw new ApiError(res.status, err.code ?? "ERROR", err.message ?? "Terjadi kesalahan", err.details);
    }
    return body as T;
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") {
      throw new ApiError(408, "TIMEOUT", "Permintaan terlalu lama. Coba lagi.");
    }
    if (err instanceof TypeError) {
      throw new ApiError(0, "NETWORK_ERROR", "Tidak bisa terhubung ke backend. Pastikan server API sedang berjalan.");
    }
    throw err;
  } finally {
    clearTimeout(timeout);
  }
}

type Envelope<T> = { data: T };
// ---- Auth ----
export const authApi = {
  login: (email: string, password: string) =>
    request<Envelope<AdminSession>>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }).then((r) => r.data),
  logout: () => request<unknown>("/auth/logout", { method: "POST" }),
  me: () => request<Envelope<AdminSession>>("/auth/me").then((r) => r.data),
};

// ---- Stats ----
export const statsApi = {
  get: () => request<Envelope<StatsResponse>>("/admin/stats").then((r) => r.data),
};

// ---- Appointments ----
type AppointmentInput = Partial<Appointment> & Record<string, unknown>;

/** Body accepted by the appointment update endpoint (status changes, reschedule, reassign). */
export interface AppointmentUpdateInput {
  status?: AppointmentStatus;
  cancelReason?: string;
  doctorId?: number;
  appointmentDate?: string;
  appointmentTime?: string;
  service?: string;
  doctor?: string;
}

export interface AppointmentListParams {
  status?: string;
  q?: string;
  page?: number;
  limit?: number;
  from?: string;
  to?: string;
  doctorId?: number;
  sort?: string;
  direction?: "asc" | "desc";
}

function appointmentQuery(params: AppointmentListParams): string {
  const search = new URLSearchParams();
  search.set("page", String(params.page ?? 1));
  search.set("limit", String(params.limit ?? 20));
  if (params.q) search.set("q", params.q);
  if (params.status) search.set("status", params.status);
  if (params.from) search.set("from", params.from);
  if (params.to) search.set("to", params.to);
  if (params.doctorId) search.set("doctorId", String(params.doctorId));
  if (params.sort) search.set("sort", params.sort);
  if (params.direction) search.set("direction", params.direction);
  return search.toString();
}

export const appointmentsApi = {
  list: (params: AppointmentListParams = {}) => {
    return request<ListEnvelope<Appointment>>(`/admin/appointments?${appointmentQuery(params)}`);
  },
  get: (id: number) => request<Envelope<Appointment>>(`/admin/appointments/${id}`).then((r) => r.data),
  create: (body: AppointmentInput) =>
    request<Envelope<Appointment>>("/admin/appointments", {
      method: "POST",
      body: JSON.stringify(body),
    }).then((r) => r.data),
  update: (id: number, body: AppointmentUpdateInput) =>
    request<Envelope<Appointment>>(`/admin/appointments/${id}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }).then((r) => r.data),
  remove: (id: number) => request<unknown>(`/admin/appointments/${id}`, { method: "DELETE" }),
  /** Public slot availability for a doctor on a given date (no auth required). */
  availability: (doctorId: number, date: string) => {
    const search = new URLSearchParams({ doctorId: String(doctorId), date });
    return request<Envelope<AvailabilityResponse>>(`/public/availability?${search.toString()}`).then((r) => r.data);
  },
};

// ---- Generic resource factory ----
function resource<T, Input>(name: string) {
  return {
    list: (params: ListParams = {}) => request<ListEnvelope<T>>(`/admin/${name}?${qs(params)}`),
    get: (id: number) => request<Envelope<T>>(`/admin/${name}/${id}`).then((r) => r.data),
    create: (body: Input) =>
      request<Envelope<T>>(`/admin/${name}`, { method: "POST", body: JSON.stringify(body) }).then((r) => r.data),
    update: (id: number, body: Input) =>
      request<Envelope<T>>(`/admin/${name}/${id}`, { method: "PUT", body: JSON.stringify(body) }).then((r) => r.data),
    remove: (id: number) => request<unknown>(`/admin/${name}/${id}`, { method: "DELETE" }),
  };
}

const doctorsResource = resource<Doctor, Partial<Doctor>>("doctors");

/** Body accepted by the doctor schedule endpoint. `slotMinutes` omitted = keep existing. */
export interface DoctorScheduleInput {
  slotMinutes?: number;
  windows: DoctorScheduleWindow[];
}

export const doctorsApi = {
  ...doctorsResource,
  /** Weekly working windows + slot length for a doctor. */
  getSchedule: (id: number) =>
    request<Envelope<DoctorSchedule>>(`/admin/doctors/${id}/schedule`).then((r) => r.data),
  /** Replace the doctor's entire weekly schedule (PUT replaces all windows). */
  updateSchedule: (id: number, body: DoctorScheduleInput) =>
    request<Envelope<DoctorSchedule>>(`/admin/doctors/${id}/schedule`, {
      method: "PUT",
      body: JSON.stringify(body),
    }).then((r) => r.data),
};

// ---- Patients (read-only admin surface) ----
export const patientsApi = {
  list: (params: ListParams = {}) => request<ListEnvelope<Patient>>(`/admin/patients?${qs(params)}`),
  get: (id: number) => request<Envelope<PatientDetail>>(`/admin/patients/${id}`).then((r) => r.data),
};

export const articlesApi = resource<Article, Partial<Article>>("articles");
export const servicesApi = resource<Service, Partial<Service>>("services");
export const locationsApi = resource<ClinicLocation, Partial<ClinicLocation>>("locations");
export const promotionsApi = {
  ...resource<Promotion, Partial<Promotion>>("promotions"),
  // Promotions support an extra server-side campaign-type filter.
  list: (params: ListParams & { campaign?: string } = {}) => {
    const query = qs(params);
    const extra = params.campaign ? `&campaign=${encodeURIComponent(params.campaign)}` : "";
    return request<ListEnvelope<Promotion>>(`/admin/promotions?${query}${extra}`);
  },
};
export const usersApi = resource<Admin, Record<string, unknown>>("users");

export const auditApi = {
  list: (params: ListParams = {}) => request<ListEnvelope<AuditLog>>(`/admin/audit-logs?${qs(params)}`),
};

// ---- Roles (editable RBAC matrix) ----
export const rolesApi = {
  list: () => request<Envelope<RolesResponse>>("/admin/roles").then((r) => r.data),
  updatePermissions: (key: string, permissions: string[]) =>
    request<Envelope<RolesResponse>>(`/admin/roles/${key}/permissions`, {
      method: "PUT",
      body: JSON.stringify({ permissions }),
    }).then((r) => r.data),
};

// ---- File upload (multipart) ----
export const uploadApi = {
  async image(file: File, folder = "general"): Promise<{ url: string }> {
    const form = new FormData();
    form.append("file", file);
    form.append("folder", folder);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);
    try {
      const res = await fetch(`${BASE}/admin/upload`, {
        method: "POST",
        credentials: "include",
        body: form,
        signal: controller.signal,
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        const err = body?.error ?? {};
        throw new ApiError(res.status, err.code ?? "ERROR", err.message ?? "Gagal mengunggah", err.details);
      }
      return body.data as { url: string };
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        throw new ApiError(408, "TIMEOUT", "Unggahan terlalu lama. Coba lagi.");
      }
      if (err instanceof TypeError) {
        throw new ApiError(0, "NETWORK_ERROR", "Tidak bisa terhubung ke backend.");
      }
      throw err;
    } finally {
      clearTimeout(timeout);
    }
  },
};

// ---- Dropdown option helpers (dynamic select lists) ----
export interface SelectOption { value: string; label: string }

export const optionsApi = {
  async doctors(): Promise<SelectOption[]> {
    const res = await doctorsApi.list({ limit: 100, sort: "name", direction: "asc" });
    return res.data.map((d) => ({ value: d.name, label: `${d.name}${d.specialty ? ` — ${d.specialty}` : ""}` }));
  },
  /** Doctor options keyed by id (string value) — use when the backend expects `doctorId`. */
  async doctorIds(): Promise<SelectOption[]> {
    const res = await doctorsApi.list({ limit: 100, sort: "name", direction: "asc" });
    return res.data.map((d) => ({
      value: String(d.id),
      label: `${d.name}${d.specialty ? ` — ${d.specialty}` : ""}`,
    }));
  },
  async services(): Promise<SelectOption[]> {
    const res = await servicesApi.list({ limit: 100, sort: "order_index", direction: "asc" });
    return res.data.map((s) => ({ value: s.title, label: s.title }));
  },
};

/** Map known appointment ApiError codes to friendly Indonesian messages. */
export function appointmentErrorMessage(err: unknown, fallback = "Terjadi kesalahan"): string {
  if (err instanceof ApiError) {
    switch (err.code) {
      case "SLOT_TAKEN":
        return "Slot waktu tersebut sudah terisi. Silakan pilih waktu lain.";
      case "INVALID_DOCTOR":
        return "Dokter yang dipilih tidak valid.";
      default:
        return err.message || fallback;
    }
  }
  return fallback;
}
