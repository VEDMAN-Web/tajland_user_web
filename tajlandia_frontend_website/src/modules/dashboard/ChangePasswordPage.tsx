"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { z } from "zod";
import { clearAuth } from "@/lib/api/auth.utils";
import { routes } from "@/lib/constants/routes";
import { useAuth } from "@/lib/hooks/useAuth";
import { strongPasswordSchema } from "@/lib/validation/password";
import { AccountMenu } from "./AccountMenu";
import { DashboardNavbar } from "./DashboardNavbar";
import { useDashboardLanguage } from "./DashboardLanguageContext";
import { changePassword } from "./services/change-password.client";

type PasswordValues = { currentPassword: string; newPassword: string; confirmPassword: string };
type PasswordErrors = Partial<Record<keyof PasswordValues, string>>;
type VisibleFields = { current: boolean; next: boolean; confirm: boolean };

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, "This field is required").min(8, "Password must be at least 8 characters").max(100, "Password must be at most 100 characters"),
    newPassword: strongPasswordSchema.max(100, "Password must be at most 100 characters"),
    confirmPassword: z.string().min(1, "Confirm password is required"),
  })
  .superRefine((data, context) => {
    if (data.currentPassword && data.newPassword && data.currentPassword === data.newPassword) {
      context.addIssue({ code: "custom", path: ["newPassword"], message: "New password must differ from current password" });
    }

    if (data.newPassword && data.confirmPassword && data.newPassword !== data.confirmPassword) {
      context.addIssue({ code: "custom", path: ["confirmPassword"], message: "Passwords do not match" });
    }
  });

function getPasswordStrength(password: string) {
  const checks = [password.length >= 8, /[A-Z]/.test(password), /[a-z]/.test(password), /\d/.test(password), /[^A-Za-z0-9]/.test(password)];
  const score = checks.filter(Boolean).length;

  if (score === checks.length) return { label: "Strong", color: "#1aae6f", width: "100%" };
  if (score >= 3) return { label: "Average", color: "#e0aa2b", width: "66%" };
  return { label: "Weak", color: "#e11d2e", width: score > 0 ? "33%" : "0%" };
}

function EyeIcon({ revealed }: { revealed: boolean }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5">
      <path d="M2.5 12S6.2 6.5 12 6.5 21.5 12 21.5 12 17.8 17.5 12 17.5 2.5 12 2.5 12Z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <circle cx="12" cy="12" r="2.4" fill="none" stroke="currentColor" strokeWidth="1.8" />
      {revealed ? <path d="M5 19 19 5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /> : null}
    </svg>
  );
}

export function ChangePasswordPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();
  const { t } = useDashboardLanguage();
  const [values, setValues] = useState<PasswordValues>({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [errors, setErrors] = useState<PasswordErrors>({});
  const [visible, setVisible] = useState<VisibleFields>({ current: false, next: false, confirm: false });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState("Password changed successfully");
  const [failure, setFailure] = useState<{ message: string; sessionExpired: boolean } | null>(null);
  const strength = getPasswordStrength(values.newPassword);

  if (isLoading) {
    return <main className="flex min-h-[100svh] items-center justify-center bg-[#f7f9fc] text-sm text-muted">{t("Loading...")}</main>;
  }

  if (!isAuthenticated) {
    router.replace(routes.login);
    return null;
  }

  function update(field: keyof PasswordValues, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitting) return;

    const parsed = passwordSchema.safeParse(values);
    if (!parsed.success) {
      const nextErrors: PasswordErrors = {};
      for (const issue of parsed.error.issues) {
        const field = issue.path[0];
        if ((field === "currentPassword" || field === "newPassword" || field === "confirmPassword") && !nextErrors[field]) {
          nextErrors[field] = issue.message;
        }
      }
      setErrors(nextErrors);
      return;
    }

    setErrors({});
    void savePassword(parsed.data);
  }

  async function savePassword(data: PasswordValues) {
    setIsSubmitting(true);

    try {
      const result = await changePassword({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });

      if (result.ok) {
        setValues({ currentPassword: "", newPassword: "", confirmPassword: "" });
        setSuccessMessage(result.message || "Password changed successfully");
        setShowSuccess(true);
        return;
      }

      if (result.field) {
        setErrors({ [result.field]: result.message });
        return;
      }

      setFailure({ message: result.message, sessionExpired: Boolean(result.sessionExpired) });
    } finally {
      setIsSubmitting(false);
    }
  }

  function closeFailure() {
    const expired = failure?.sessionExpired;
    setFailure(null);
    if (expired) {
      clearAuth();
      router.replace(routes.login);
    }
  }

  return (
    <div className="min-h-[100svh] bg-[#f7f9fc] text-navy">
      <DashboardNavbar active="home" />
      <main className="mx-auto grid w-full max-w-[1180px] gap-6 px-5 pb-14 pt-8 sm:px-8 lg:grid-cols-[240px_minmax(0,1fr)] lg:items-start lg:gap-7">
        <AccountMenu active="password" />

        <section className="min-w-0">
          <h1 className="font-manrope text-[28px] font-semibold leading-none tracking-[-0.03em] text-navy sm:text-[32px]">
            {t("Change Password")}
          </h1>
          <p className="font-manrope mt-2 text-[14px] leading-5 text-[#8b939e]">
            {t("Update your password to keep your account secure.")}
          </p>

          <form noValidate onSubmit={submit} className="mt-5">
            <div className="rounded-[16px] bg-white px-5 py-5 shadow-[0_8px_28px_rgba(11,31,77,0.06)] sm:px-6 sm:py-6">
              <div className="grid gap-5">
                <PasswordField
                  id="current-password"
                  label={t("Current Password")}
                  value={values.currentPassword}
                  visible={visible.current}
                  error={errors.currentPassword ? t(errors.currentPassword) : undefined}
                  autoComplete="current-password"
                  showLabel={t("Show")}
                  hideLabel={t("Hide")}
                  onToggle={() => setVisible((state) => ({ ...state, current: !state.current }))}
                  onChange={(value) => update("currentPassword", value)}
                />
                <div>
                  <PasswordField
                    id="new-password"
                    label={t("New password")}
                    value={values.newPassword}
                    visible={visible.next}
                    error={errors.newPassword ? t(errors.newPassword) : undefined}
                    autoComplete="new-password"
                    showLabel={t("Show")}
                    hideLabel={t("Hide")}
                    onToggle={() => setVisible((state) => ({ ...state, next: !state.next }))}
                    onChange={(value) => update("newPassword", value)}
                  />
                  {values.newPassword ? (
                    <div className="mt-2 flex items-center gap-3" aria-live="polite">
                      <span className="h-1 flex-1 overflow-hidden rounded-full bg-[#e8edf2]">
                        <span className="block h-full rounded-full transition-all" style={{ width: strength.width, backgroundColor: strength.color }} />
                      </span>
                      <span className="font-manrope min-w-14 text-right text-[12px] font-medium leading-4" style={{ color: strength.color }}>
                        {t(strength.label)}
                      </span>
                    </div>
                  ) : null}
                </div>
                <PasswordField
                  id="confirm-password"
                  label={t("Confirm password")}
                  value={values.confirmPassword}
                  visible={visible.confirm}
                  error={errors.confirmPassword ? t(errors.confirmPassword) : undefined}
                  autoComplete="new-password"
                  showLabel={t("Show")}
                  hideLabel={t("Hide")}
                  onToggle={() => setVisible((state) => ({ ...state, confirm: !state.confirm }))}
                  onChange={(value) => update("confirmPassword", value)}
                />
              </div>
            </div>

            <div className="mt-5 flex flex-col gap-4 border-t border-[#e4e9ef] pt-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="font-manrope flex items-center gap-2 text-[12px] leading-4 text-[#8b939e]">
                <Image src="/images/profile/ic_privacy.svg" alt="" width={14} height={14} className="h-3.5 w-3.5 shrink-0" />
                <span>{t("All changes verified under 256-bit Cadastral Escrow protocol.")}</span>
              </p>
              <div className="flex items-center justify-end gap-3">
                <Link
                  href={routes.profile}
                  className="inline-flex h-11 items-center justify-center rounded-[12px] border border-[#e4e9ef] bg-white px-5 font-manrope text-[14px] font-medium leading-none text-[#3d4650] transition hover:bg-[#f7f9fc]"
                >
                  {t("Cancel")}
                </Link>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex h-11 items-center justify-center rounded-[12px] bg-navy px-5 font-manrope text-[14px] font-medium leading-none text-white transition hover:bg-navy-deep disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {t("Change Password")}
                </button>
              </div>
            </div>
          </form>
        </section>
      </main>

      {showSuccess ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#5c6770]/45 px-4">
          <div role="dialog" aria-modal="true" aria-labelledby="password-success-title" className="relative w-full max-w-[380px] rounded-[16px] bg-white px-6 pb-6 pt-5 text-center shadow-[0_18px_50px_rgba(17,24,39,0.18)]">
            <button type="button" aria-label={t("Close")} onClick={() => setShowSuccess(false)} className="absolute right-4 top-4 text-[#9aa3ad]">
              <svg viewBox="0 0 16 16" aria-hidden="true" className="h-4 w-4">
                <path d="M4 4 12 12M12 4 4 12" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
            </button>
            <Image src="/images/profile/ic_profile-update.png" alt="" width={56} height={56} className="mx-auto h-14 w-14" />
            <h2 id="password-success-title" className="font-manrope mt-4 text-[18px] font-semibold leading-none tracking-[-0.02em] text-[#1a1a1a]">
              {t(successMessage)}
            </h2>
            <p className="font-manrope mt-2 text-[13px] leading-5 text-[#8b939e]">
              {t("Your password has been updated successfully.")}
            </p>
            <button type="button" onClick={() => setShowSuccess(false)} className="font-manrope mt-5 h-11 w-full rounded-[10px] bg-navy text-[14px] font-medium leading-none text-white">
              {t("Okay")}
            </button>
          </div>
        </div>
      ) : null}

      {failure ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#5c6770]/45 px-4">
          <div role="dialog" aria-modal="true" aria-labelledby="password-error-title" className="relative w-full max-w-[380px] rounded-[16px] bg-white px-6 pb-6 pt-5 text-center shadow-[0_18px_50px_rgba(17,24,39,0.18)]">
            <button type="button" aria-label={t("Close")} onClick={closeFailure} className="absolute right-4 top-4 text-[#9aa3ad]">
              <svg viewBox="0 0 16 16" aria-hidden="true" className="h-4 w-4">
                <path d="M4 4 12 12M12 4 4 12" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
            </button>
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#fff1f2] font-manrope text-[28px] font-semibold leading-none text-[#e11d2e]">!</div>
            <h2 id="password-error-title" className="font-manrope mt-4 text-[18px] font-semibold leading-none tracking-[-0.02em] text-[#1a1a1a]">
              {t("Something went wrong.")}
            </h2>
            <p className="font-manrope mt-2 text-[13px] leading-5 text-[#8b939e]">
              {t(failure.message)}
            </p>
            <button type="button" onClick={closeFailure} className="font-manrope mt-5 h-11 w-full rounded-[10px] bg-navy text-[14px] font-medium leading-none text-white">
              {t(failure.sessionExpired ? "Okay" : "Try again")}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function PasswordField({
  id,
  label,
  value,
  visible,
  error,
  autoComplete,
  showLabel,
  hideLabel,
  onToggle,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  visible: boolean;
  error?: string;
  autoComplete: string;
  showLabel: string;
  hideLabel: string;
  onToggle: () => void;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={id} className="font-manrope text-[14px] font-semibold leading-5 text-[#1a1a1a]">
          {label}
        </label>
        {error ? <p id={`${id}-error`} className="font-manrope text-right text-[12px] leading-4 text-[#e11d2e]">{error}</p> : null}
      </div>
      <div className={`mt-2 flex h-11 items-center rounded-[10px] border px-3.5 ${error ? "border-[#f3c3c8] bg-[#fff1f2]" : "border-[#e4e9ef] bg-white focus-within:border-navy"}`}>
        <input
          id={id}
          type={visible ? "text" : "password"}
          value={value}
          autoComplete={autoComplete}
          onChange={(event) => onChange(event.target.value)}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : undefined}
          className="font-manrope min-w-0 flex-1 bg-transparent text-[14px] leading-none text-[#1a1a1a] outline-none [&::-ms-reveal]:hidden"
        />
        <button
          type="button"
          aria-label={visible ? `${hideLabel} ${label}` : `${showLabel} ${label}`}
          onMouseDown={(event) => {
            event.preventDefault();
            onToggle();
          }}
          className="ml-2 inline-flex h-8 w-8 shrink-0 items-center justify-center text-[#5c6770]"
        >
          <EyeIcon revealed={visible} />
        </button>
      </div>
    </div>
  );
}
