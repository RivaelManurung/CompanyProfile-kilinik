const STRENGTH_LABELS = ["Sangat lemah", "Lemah", "Cukup", "Kuat", "Sangat kuat"];
const STRENGTH_COLORS = [
  "bg-danger",
  "bg-danger",
  "bg-warning",
  "bg-accent-500",
  "bg-accent-600",
];

/** Heuristic password strength score, 0–4. Shared by daftar & reset-password. */
export function passwordStrength(password: string): number {
  if (!password) return 0;
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
  if (/\d/.test(password) && /[^A-Za-z0-9]/.test(password)) score++;
  return Math.min(score, 4);
}

/** Four-segment strength meter with an Indonesian label. */
export function PasswordStrength({ value }: { value: string }) {
  const score = passwordStrength(value);
  if (!value) return null;
  return (
    <div className="mt-2" aria-live="polite">
      <div className="flex gap-1.5">
        {Array.from({ length: 4 }).map((_, i) => (
          <span
            key={i}
            className={`h-1.5 flex-1 rounded-full transition-colors ${
              i < score ? STRENGTH_COLORS[score] : "bg-ink-200"
            }`}
          />
        ))}
      </div>
      <p className="mt-1.5 text-xs text-ink-500">
        Kekuatan sandi:{" "}
        <span className="font-semibold text-ink-700">
          {STRENGTH_LABELS[score]}
        </span>
      </p>
    </div>
  );
}
