import type {
  AdminSession,
  Appointment,
  Article,
  AuditLog,
  ClinicLocation,
  ListEnvelope,
  Doctor,
  ListParams,
  Promotion,
  Service,
  StatsResponse,
} from "./types";

const BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";
const REQUEST_TIMEOUT = 12000;

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
export const appointmentsApi = {
  list: (params: { status?: string; q?: string; page?: number; limit?: number } = {}) => {
    return request<ListEnvelope<Appointment>>(`/admin/appointments?${qs(params)}`);
  },
  update: (id: number, body: Partial<Appointment>) =>
    request<Envelope<Appointment>>(`/admin/appointments/${id}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }).then((r) => r.data),
  remove: (id: number) => request<unknown>(`/admin/appointments/${id}`, { method: "DELETE" }),
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

export const doctorsApi = resource<Doctor, Partial<Doctor>>("doctors");
export const articlesApi = resource<Article, Partial<Article>>("articles");
export const servicesApi = resource<Service, Partial<Service>>("services");
export const locationsApi = resource<ClinicLocation, Partial<ClinicLocation>>("locations");
export const promotionsApi = resource<Promotion, Partial<Promotion>>("promotions");

export const auditApi = {
  list: (params: ListParams = {}) => request<ListEnvelope<AuditLog>>(`/admin/audit-logs?${qs(params)}`),
};
