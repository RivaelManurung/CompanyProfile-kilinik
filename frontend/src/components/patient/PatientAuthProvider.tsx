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
  }) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (body: {
    name?: string;
    phone?: string;
    currentPassword?: string;
    newPassword?: string;
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

  // `refresh` is a stable useCallback with no deps. Calling it here triggers
  // the initial session load on mount; the same function is reused by login/logout.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { refresh(); }, []);

  const login = useCallback(async (email: string, password: string) => {
    setPatient(await patientApi.login({ email, password }));
  }, []);

  const register = useCallback(
    async (body: { name: string; email: string; phone: string; password: string }) => {
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
