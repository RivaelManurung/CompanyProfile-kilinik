/**
 * Patient client — talks to the public booking realm (`/api/patient/*` and
 * `/api/public/availability`). All calls send the `ksn_patient` cookie via
 * `credentials: "include"`, mirroring the admin client.
 */
const BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";

export class PatientApiError extends Error {
  status: number;
  code: string;
  details?: { field: string; message: string }[];
  constructor(
    status: number,
    code: string,
    message: string,
    details?: { field: string; message: string }[],
  ) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

async function pfetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${BASE}${path}`, {
      credentials: "include",
      headers: { "Content-Type": "application/json", ...(init.headers || {}) },
      ...init,
    });
  } catch {
    throw new PatientApiError(0, "NETWORK", "Tidak dapat terhubung ke server.");
  }
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = (json as { error?: { code?: string; message?: string; details?: { field: string; message: string }[] } }).error;
    throw new PatientApiError(
      res.status,
      err?.code || "ERROR",
      err?.message || "Terjadi kesalahan.",
      err?.details,
    );
  }
  return (json as { data: T }).data;
}

export interface Patient {
  id: number;
  name: string;
  email: string;
  phone: string;
}

export interface Slot {
  time: string;
  available: boolean;
}

export interface AvailabilityResult {
  doctorId: number;
  date: string;
  slotMinutes: number;
  slots: Slot[];
}

export interface PatientAppointment {
  id: number;
  doctor: string;
  doctorId: number;
  service: string;
  appointmentDate: string;
  appointmentTime: string;
  status: "pending" | "confirmed" | "done" | "cancelled";
  message: string;
  createdAt: string;
}

export const patientApi = {
  register: (body: { name: string; email: string; phone: string; password: string }) =>
    pfetch<Patient>("/patient/register", { method: "POST", body: JSON.stringify(body) }),

  login: (body: { email: string; password: string }) =>
    pfetch<Patient>("/patient/login", { method: "POST", body: JSON.stringify(body) }),

  logout: () => pfetch<{ ok: boolean }>("/patient/logout", { method: "POST" }),

  me: () => pfetch<Patient>("/patient/me"),

  updateProfile: (body: {
    name?: string;
    phone?: string;
    currentPassword?: string;
    newPassword?: string;
  }) => pfetch<Patient>("/patient/me", { method: "PUT", body: JSON.stringify(body) }),

  myAppointments: () => pfetch<PatientAppointment[]>("/patient/appointments"),

  book: (body: {
    doctorId: number;
    service: string;
    appointmentDate: string;
    appointmentTime: string;
    message?: string;
  }) => pfetch<PatientAppointment>("/patient/appointments", { method: "POST", body: JSON.stringify(body) }),

  availability: (doctorId: number, date: string) =>
    pfetch<AvailabilityResult>(`/public/availability?doctorId=${doctorId}&date=${date}`),
};
