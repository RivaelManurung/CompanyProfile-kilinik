"use client";

import { Suspense, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/brand-button";
import {
  TextField,
  TextAreaField,
  FormError,
  fieldControlClass,
} from "@/components/ui/Field";
import { AuthShell, AuthFormSkeleton } from "@/components/patient/AuthShell";
import { PasswordStrength } from "@/components/patient/PasswordStrength";
import { usePatientAuth } from "@/components/patient/PatientAuthProvider";
import { PatientApiError } from "@/lib/patient/api";
import { cn } from "@/lib/utils";

function safeRedirect(value: string | null, fallback = "/akun"): string {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return fallback;
  return value;
}

type FieldErrors = {
  name?: string;
  email?: string;
  phone?: string;
  password?: string;
  nik?: string;
  dateOfBirth?: string;
  sex?: string;
  consent?: string;
};

/** Maps backend register error codes to the field that should surface them. */
function mapRegisterError(
  err: PatientApiError,
): { field?: keyof FieldErrors; message: string } {
  switch (err.code) {
    case "CONSENT_REQUIRED":
      return { field: "consent", message: "Anda harus menyetujui kebijakan privasi untuk mendaftar." };
    case "INVALID_NIK":
      return { field: "nik", message: "NIK harus terdiri dari 16 digit angka." };
    case "NIK_TAKEN":
      return { field: "nik", message: "NIK ini sudah terdaftar." };
    case "EMAIL_TAKEN":
      return { field: "email", message: "Email ini sudah terdaftar." };
    case "INVALID_DOB":
      return { field: "dateOfBirth", message: "Tanggal lahir tidak valid." };
    default:
      return { message: err.message || "Gagal mendaftar." };
  }
}

function RegisterForm() {
  const { register } = usePatientAuth();
  const router = useRouter();
  const params = useSearchParams();
  const redirect = safeRedirect(params.get("redirect"));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [password, setPassword] = useState("");
  const [consent, setConsent] = useState(false);

  const passwordHint = useMemo(
    () => (password ? undefined : "Minimal 8 karakter."),
    [password],
  );

  function validate(values: {
    name: string;
    email: string;
    phone: string;
    password: string;
    nik: string;
    dateOfBirth: string;
    sex: string;
    consent: boolean;
  }): FieldErrors {
    const errors: FieldErrors = {};
    if (values.name.trim().length < 2) errors.name = "Nama lengkap wajib diisi.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email))
      errors.email = "Masukkan alamat email yang valid.";
    if (values.phone.replace(/\D/g, "").length < 9)
      errors.phone = "Masukkan nomor WhatsApp/HP yang valid.";
    if (values.password.length < 8)
      errors.password = "Kata sandi minimal 8 karakter.";
    if (values.nik && !/^\d{16}$/.test(values.nik))
      errors.nik = "NIK harus terdiri dari 16 digit angka.";
    if (!values.consent)
      errors.consent = "Anda harus menyetujui kebijakan privasi untuk mendaftar.";
    return errors;
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    const values = {
      name: String(fd.get("name") ?? ""),
      email: String(fd.get("email") ?? ""),
      phone: String(fd.get("phone") ?? ""),
      password: String(fd.get("password") ?? ""),
      nik: String(fd.get("nik") ?? "").trim(),
      dateOfBirth: String(fd.get("dateOfBirth") ?? ""),
      sex: String(fd.get("sex") ?? ""),
      consent,
    };

    const errors = validate(values);
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setBusy(true);
    try {
      await register({
        name: values.name,
        email: values.email,
        phone: values.phone,
        password: values.password,
        consentAccepted: values.consent,
        ...(values.nik ? { nik: values.nik } : {}),
        ...(values.dateOfBirth ? { dateOfBirth: values.dateOfBirth } : {}),
        ...(values.sex ? { sex: values.sex } : {}),
        ...(fd.get("address") ? { address: String(fd.get("address")).trim() } : {}),
      });
      router.push(redirect);
    } catch (err) {
      if (err instanceof PatientApiError) {
        const mapped = mapRegisterError(err);
        if (mapped.field) {
          setFieldErrors((p) => ({ ...p, [mapped.field as keyof FieldErrors]: mapped.message }));
        } else {
          setError(mapped.message);
        }
      } else {
        setError("Gagal mendaftar.");
      }
      setBusy(false);
    }
  }

  const clearError = (key: keyof FieldErrors) =>
    setFieldErrors((p) => ({ ...p, [key]: undefined }));

  const selectId = "daftar-sex";
  const selectMsgId = fieldErrors.sex ? `${selectId}-msg` : undefined;

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-4">
      {error && <FormError>{error}</FormError>}
      <TextField
        label="Nama lengkap"
        name="name"
        required
        autoComplete="name"
        placeholder="Nama Anda"
        error={fieldErrors.name}
        onChange={() => clearError("name")}
      />
      <TextField
        label="Email"
        name="email"
        type="email"
        required
        autoComplete="email"
        placeholder="email@contoh.com"
        error={fieldErrors.email}
        onChange={() => clearError("email")}
      />
      <TextField
        label="Nomor WhatsApp / HP"
        name="phone"
        type="tel"
        required
        autoComplete="tel"
        placeholder="08xx xxxx xxxx"
        error={fieldErrors.phone}
        onChange={() => clearError("phone")}
      />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <TextField
          label="Tanggal lahir"
          name="dateOfBirth"
          type="date"
          autoComplete="bday"
          error={fieldErrors.dateOfBirth}
          onChange={() => clearError("dateOfBirth")}
        />
        <div className="space-y-1.5">
          <label htmlFor={selectId} className="text-sm font-semibold text-ink-700">
            Jenis kelamin
          </label>
          <select
            id={selectId}
            name="sex"
            defaultValue=""
            aria-invalid={fieldErrors.sex ? true : undefined}
            aria-describedby={selectMsgId}
            className={cn("h-12", fieldControlClass)}
            onChange={() => clearError("sex")}
          >
            <option value="">Pilih…</option>
            <option value="L">Laki-laki</option>
            <option value="P">Perempuan</option>
          </select>
          {fieldErrors.sex && (
            <p id={selectMsgId} className="text-xs font-medium text-danger">
              {fieldErrors.sex}
            </p>
          )}
        </div>
      </div>
      <TextField
        label="NIK (opsional)"
        name="nik"
        inputMode="numeric"
        autoComplete="off"
        maxLength={16}
        placeholder="16 digit Nomor Induk Kependudukan"
        hint={fieldErrors.nik ? undefined : "Isi jika ingin mempercepat verifikasi rekam medis."}
        error={fieldErrors.nik}
        onChange={() => clearError("nik")}
      />
      <TextAreaField
        label="Alamat (opsional)"
        name="address"
        rows={2}
        autoComplete="street-address"
        placeholder="Alamat tempat tinggal"
      />
      <div>
        <TextField
          label="Kata sandi"
          name="password"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          placeholder="Minimal 8 karakter"
          hint={passwordHint}
          error={fieldErrors.password}
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            clearError("password");
          }}
        />
        <PasswordStrength value={password} />
      </div>

      <div className="space-y-1.5">
        <label className="flex items-start gap-3">
          <input
            type="checkbox"
            name="consent"
            checked={consent}
            onChange={(e) => {
              setConsent(e.target.checked);
              clearError("consent");
            }}
            aria-invalid={fieldErrors.consent ? true : undefined}
            aria-describedby={fieldErrors.consent ? "consent-msg" : undefined}
            className="mt-0.5 h-5 w-5 shrink-0 rounded border-ink-300 text-primary-600 accent-primary-600 focus:ring-2 focus:ring-primary-500/30"
          />
          <span className="text-sm leading-relaxed text-ink-600">
            Saya menyetujui{" "}
            <Link
              href="/kebijakan-privasi"
              className="font-semibold text-primary-700 hover:text-primary-800"
            >
              kebijakan privasi
            </Link>{" "}
            dan pemrosesan data kesehatan saya.
          </span>
        </label>
        {fieldErrors.consent && (
          <p id="consent-msg" className="text-xs font-medium text-danger">
            {fieldErrors.consent}
          </p>
        )}
      </div>

      <Button type="submit" size="lg" className="w-full" disabled={busy}>
        {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <UserPlus className="h-5 w-5" />}
        {busy ? "Memproses…" : "Buat Akun"}
      </Button>
    </form>
  );
}

export default function DaftarPage() {
  return (
    <AuthShell
      eyebrow="Portal Pasien"
      title="Buat akun pasien"
      description="Daftar sekali, lalu pesan janji temu kapan pun dengan mudah."
      footer={
        <>
          Sudah punya akun?{" "}
          <Link href="/masuk" className="font-semibold text-primary-700 hover:text-primary-800">
            Masuk di sini
          </Link>
        </>
      }
    >
      <Suspense fallback={<AuthFormSkeleton fields={4} />}>
        <RegisterForm />
      </Suspense>
    </AuthShell>
  );
}
