import type {
  InputHTMLAttributes,
  ReactNode,
  TextareaHTMLAttributes,
} from "react";
import { cn } from "@/lib/utils";

/**
 * Shared control styling for public-site form fields. Single source of truth —
 * previously duplicated across masuk/daftar/akun/ContactForm/BookingWizard.
 */
export const fieldControlClass =
  "w-full rounded-xl border border-ink-200 bg-white px-4 text-sm text-ink-900 outline-none transition-colors placeholder:text-ink-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/15 disabled:cursor-not-allowed disabled:opacity-60 aria-[invalid=true]:border-danger aria-[invalid=true]:focus:border-danger aria-[invalid=true]:focus:ring-danger/15";

function FieldLabel({
  htmlFor,
  label,
  required,
}: {
  htmlFor?: string;
  label: ReactNode;
  required?: boolean;
}) {
  return (
    <label htmlFor={htmlFor} className="text-sm font-semibold text-ink-700">
      {label}
      {required && (
        <span className="ml-0.5 text-danger" aria-hidden>
          *
        </span>
      )}
    </label>
  );
}

function FieldMessage({
  id,
  error,
  hint,
}: {
  id?: string;
  error?: string;
  hint?: string;
}) {
  if (error) {
    return (
      <p id={id} className="text-xs font-medium text-danger">
        {error}
      </p>
    );
  }
  if (hint) {
    return (
      <p id={id} className="text-xs text-ink-400">
        {hint}
      </p>
    );
  }
  return null;
}

/** Top-of-form error banner (consistent danger-token styling). */
export function FormError({ children }: { children: ReactNode }) {
  return (
    <p
      role="alert"
      className="rounded-xl border border-danger/20 bg-danger/5 px-4 py-3 text-sm font-medium text-danger"
    >
      {children}
    </p>
  );
}

type TextFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: ReactNode;
  error?: string;
  hint?: string;
};

export function TextField({
  label,
  error,
  hint,
  id,
  name,
  required,
  className,
  ...rest
}: TextFieldProps) {
  const fieldId = id ?? name;
  const messageId = fieldId ? `${fieldId}-msg` : undefined;
  return (
    <div className="space-y-1.5">
      <FieldLabel htmlFor={fieldId} label={label} required={required} />
      <input
        id={fieldId}
        name={name}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={error || hint ? messageId : undefined}
        className={cn("h-12", fieldControlClass, className)}
        {...rest}
      />
      <FieldMessage id={messageId} error={error} hint={hint} />
    </div>
  );
}

type TextAreaFieldProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label: ReactNode;
  error?: string;
  hint?: string;
};

export function TextAreaField({
  label,
  error,
  hint,
  id,
  name,
  required,
  className,
  rows = 4,
  ...rest
}: TextAreaFieldProps) {
  const fieldId = id ?? name;
  const messageId = fieldId ? `${fieldId}-msg` : undefined;
  return (
    <div className="space-y-1.5">
      <FieldLabel htmlFor={fieldId} label={label} required={required} />
      <textarea
        id={fieldId}
        name={name}
        rows={rows}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={error || hint ? messageId : undefined}
        className={cn("py-3 leading-relaxed", fieldControlClass, className)}
        {...rest}
      />
      <FieldMessage id={messageId} error={error} hint={hint} />
    </div>
  );
}
