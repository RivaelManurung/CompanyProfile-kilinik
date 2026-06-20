"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { patientApi, type Patient } from "@/lib/patient/api";

interface PatientAuthContextValue {
  patient: Patient | null;
  loading: boolean;
  refresh: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  register: (body: {
    name: string;
    email: string;
    phone: string;
    password: string;
    consentAccepted: boolean;
    nik?: string;
    dateOfBirth?: string;
    sex?: string;
    address?: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (body: {
    name?: string;
    phone?: string;
    currentPassword?: string;
    newPassword?: string;
    dateOfBirth?: string;
    sex?: string;
    address?: string;
    nik?: string;
  }) => Promise<void>;
}

const PatientAuthContext = createContext<PatientAuthContextValue | null>(null);

export function PatientAuthProvider({ children }: { children: React.ReactNode }) {
  const [patient, setPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      setPatient(await patientApi.me());
    } catch {
      setPatient(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial session load on mount. Uses promise callbacks (not a synchronous
  // setState in the effect body) so it satisfies the hooks lint rules; `refresh`
  // remains exposed for consumers and is reused by login/logout.
  useEffect(() => {
    let active = true;
    patientApi
      .me()
      .then((p) => {
        if (active) setPatient(p);
      })
      .catch(() => {
        if (active) setPatient(null);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setPatient(await patientApi.login({ email, password }));
  }, []);

  const register = useCallback(
    async (body: {
      name: string;
      email: string;
      phone: string;
      password: string;
      consentAccepted: boolean;
      nik?: string;
      dateOfBirth?: string;
      sex?: string;
      address?: string;
    }) => {
      setPatient(await patientApi.register(body));
    },
    [],
  );

  const logout = useCallback(async () => {
    await patientApi.logout();
    setPatient(null);
  }, []);

  const updateProfile = useCallback(
    async (body: {
      name?: string;
      phone?: string;
      currentPassword?: string;
      newPassword?: string;
      dateOfBirth?: string;
      sex?: string;
      address?: string;
      nik?: string;
    }) => {
      setPatient(await patientApi.updateProfile(body));
    },
    [],
  );

  return (
    <PatientAuthContext.Provider
      value={{ patient, loading, refresh, login, register, logout, updateProfile }}
    >
      {children}
    </PatientAuthContext.Provider>
  );
}

export function usePatientAuth() {
  const ctx = useContext(PatientAuthContext);
  if (!ctx) {
    throw new Error("usePatientAuth must be used within a PatientAuthProvider");
  }
  return ctx;
}
