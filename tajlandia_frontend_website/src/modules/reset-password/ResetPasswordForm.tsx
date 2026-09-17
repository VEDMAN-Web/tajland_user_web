"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import React, { useState } from "react";
import { routes } from "@/lib/constants/routes";
import { resetPasswordSchema, type ResetPasswordFormValues } from "./schemas/reset-password.schema";
import { resetPasswordAction } from "./services/reset-password.service";

type ResetPasswordErrors = Partial<Record<keyof ResetPasswordFormValues, string>>;

const initialValues: ResetPasswordFormValues = {
  newPassword: "",
  confirmPassword: "",
};

function EyeIcon({ hidden }: { hidden: boolean }) {
  return hidden ? (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4">
      <path d="M3 3l18 18M10.6 10.6a2 2 0 0 0 2.8 2.8M9.9 5.2A10.8 10.8 0 0 1 12 5c5.3 0 8.8 4.2 9.8 6.1a1.8 1.8 0 0 1 0 .8 12.5 12.5 0 0 1-3.2 4.1M6.2 6.2A12.5 12.5 0 0 0 2.2 11a1.8 1.8 0 0 0 0 .8C3.2 13.7 6.7 18 12 18c1 0 1.9-.1 2.8-.4" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
    </svg>
  ) : (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4">
      <path d="M2.2 12S5.7 5 12 5s9.8 7 9.8 7-3.5 7-9.8 7-9.8-7-9.8-7Z" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
      <circle cx="12" cy="12" r="2.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

function getStrength(password: string) {
  const criteria = [
    password.length >= 8,
    /[A-Z]/.test(password),
    /[a-z]/.test(password),
    /\d/.test(password),
    /[!@#$%^&*(),.?":{}|<>[\]\\/~`_+;='-]/.test(password),
  ];
  const score = criteria.filter(Boolean).length;

  if (score === 5) return { label: "Strong", color: "#16b981", width: "100%" };
  if (score >= 3) return { label: "Medium", color: "#e39a24", width: "66.66%" };
  return { label: "Weak", color: "#d9272e", width: score > 0 ? "33.33%" : "0%" };
}

export function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") ?? "";
  const otp = searchParams.get("otp") ?? "";

  React.useEffect(() => {
    console.log("[ResetPasswordForm] Email from URL:", email, "Type:", typeof email, "Length:", email.length);
    console.log("[ResetPasswordForm] OTP from URL:", otp, "Type:", typeof otp, "Length:", otp.length);
    console.log("[ResetPasswordForm] Raw search params:", searchParams.toString());
  }, [email, otp, searchParams]);

  const [values, setValues] = useState<ResetPasswordFormValues>(initialValues);
  const [errors, setErrors] = useState<ResetPasswordErrors>({});
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [apiError, setApiError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const strength = getStrength(values.newPassword);

  function updateField(field: keyof ResetPasswordFormValues, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
    setSuccessMessage("");
    setApiError("");
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    // Validate URL parameters first
    if (!email || email.trim() === "") {
      console.error("[ResetPasswordForm] Email missing from URL");
      setApiError("Email is required. Please start the password reset process from the forgot password page.");
      return;
    }

    if (!otp || otp.trim() === "") {
      console.error("[ResetPasswordForm] OTP missing from URL");
      setApiError("OTP is missing. Please complete the OTP verification first.");
      return;
    }

    const result = resetPasswordSchema.safeParse(values);

    if (!result.success) {
      const nextErrors: ResetPasswordErrors = {};
      for (const issue of result.error.issues) {
        const field = issue.path[0];
        if ((field === "newPassword" || field === "confirmPassword") && !nextErrors[field]) {
          nextErrors[field] = issue.message;
        }
      }
      setErrors(nextErrors);
      setSuccessMessage("");
      setApiError("");
      return;
    }

    setErrors({});
    setSuccessMessage("");
    setApiError("");
    setIsSubmitting(true);

    try {
      console.log("[ResetPasswordForm] Submitting with email:", email, "otp:", otp);
      console.log("[ResetPasswordForm] Passwords match:", result.data.newPassword === result.data.confirmPassword);

      const actionResult = await resetPasswordAction(email, otp, result.data);
      console.log("[ResetPasswordForm] Action result:", JSON.stringify(actionResult, null, 2));

      if (actionResult.ok) {
        console.log("[ResetPasswordForm] Password reset successful!");
        setSuccessMessage(actionResult.message || "Password reset successfully! Redirecting to login...");
        setApiError("");

        // Redirect to login after a short delay
        setTimeout(() => {
          console.log("[ResetPasswordForm] Redirecting to login...");
          router.push(routes.login);
        }, 2000);
      } else {
        console.log("[ResetPasswordForm] Password reset failed:", actionResult.message);
        setApiError(actionResult.message || "Failed to reset password. Please try again.");
        setSuccessMessage("");
      }
    } catch (error) {
      console.error("[ResetPasswordForm] Exception:", error);
      setApiError("Unable to reset password right now. Please try again.");
      setSuccessMessage("");
    } finally {
      setIsSubmitting(false);
    }
  }

  function inputClass(hasError: boolean) {
    return `mt-2 h-10 w-full rounded-[9px] border px-3 pr-10 text-[12px] text-foreground outline-none transition placeholder:text-[#c6c7ca] focus:border-navy focus:ring-2 focus:ring-navy/10 ${hasError ? "border-[#d52b35]" : "border-[#e5e7eb]"}`;
  }

  return (
    <div className="flex flex-col px-4 py-12 sm:px-12 lg:px-[74px] lg:py-16">
      <div className="w-full max-w-[365px] lg:mx-auto">
        <Link href={routes.login} className="text-[10px] text-foreground hover:underline">← Back to Login</Link>
        <h2 className="mt-9 text-[24px] font-semibold tracking-[-0.03em] text-navy">Reset your password</h2>
        <p className="mt-2 text-[11px] leading-5 text-muted">Create a new password for your account.</p>

        <form className="mt-7" noValidate onSubmit={handleSubmit}>
          <div>
            <label htmlFor="reset-new-password" className="text-[12px] font-medium text-foreground">New password</label>
            <div className="relative mt-2">
              <input id="reset-new-password" name="newPassword" type={showNewPassword ? "text" : "password"} autoComplete="new-password" placeholder="hello@example.com" value={values.newPassword} onChange={(event) => updateField("newPassword", event.target.value)} aria-invalid={Boolean(errors.newPassword)} aria-describedby={errors.newPassword ? "reset-new-password-error" : "reset-password-strength"} className={inputClass(Boolean(errors.newPassword))} />
              <button type="button" aria-label={showNewPassword ? "Hide new password" : "Show new password"} onClick={() => setShowNewPassword((current) => !current)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#b7b8bb] focus-visible:rounded focus-visible:outline-2 focus-visible:outline-navy"><EyeIcon hidden={!showNewPassword} /></button>
            </div>
            <div id="reset-password-strength" className="mt-4 flex items-center gap-1" aria-live="polite">
              <div className="h-[3px] flex-1 overflow-hidden bg-[#e5e7eb]"><div className="h-full transition-all" style={{ width: strength.width, backgroundColor: strength.color }} /></div>
              <span className="ml-1 min-w-[34px] text-right text-[10px]" style={{ color: strength.color }}>{strength.label}</span>
            </div>
            {errors.newPassword ? <p id="reset-new-password-error" className="mt-1.5 text-[11px] text-[#d52b35]">{errors.newPassword}</p> : null}
          </div>

          <div className="mt-5">
            <label htmlFor="reset-confirm-password" className="text-[12px] font-medium text-foreground">Confirm password</label>
            <div className="relative mt-2">
              <input id="reset-confirm-password" name="confirmPassword" type={showConfirmPassword ? "text" : "password"} autoComplete="new-password" placeholder="hello@example.com" value={values.confirmPassword} onChange={(event) => updateField("confirmPassword", event.target.value)} aria-invalid={Boolean(errors.confirmPassword)} aria-describedby={errors.confirmPassword ? "reset-confirm-password-error" : undefined} className={inputClass(Boolean(errors.confirmPassword))} />
              <button type="button" aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"} onClick={() => setShowConfirmPassword((current) => !current)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#b7b8bb] focus-visible:rounded focus-visible:outline-2 focus-visible:outline-navy"><EyeIcon hidden={!showConfirmPassword} /></button>
            </div>
            {errors.confirmPassword ? <p id="reset-confirm-password-error" className="mt-1.5 text-[11px] text-[#d52b35]">{errors.confirmPassword}</p> : null}
          </div>

          {successMessage ? <p role="status" className="mt-4 text-center text-[12px] font-medium text-green-600">{successMessage}</p> : null}
          {successMessage ? (
            <p role="status" className="mt-5 text-center text-[12px] font-medium text-green-600">
              {successMessage}
            </p>
          ) : null}
          {apiError ? (
            <p role="alert" className="mt-5 text-center text-[12px] text-[#d52b35]">
              {apiError}
            </p>
          ) : null}
          <button type="submit" disabled={isSubmitting} className="mt-6 h-11 w-full rounded-[9px] bg-navy text-[12px] font-medium text-white shadow-[0_3px_5px_rgba(11,31,77,0.18)] transition hover:bg-navy-deep focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy disabled:cursor-not-allowed disabled:opacity-60">
            {isSubmitting ? "Resetting Password..." : "Reset Password"}
          </button>
        </form>
      </div>

      <div className="mt-auto pt-16 text-center text-[10px] text-[#8e8e91]">
        <div className="flex justify-center gap-4"><Link href={routes.privacy} className="hover:underline">Privacy Policy</Link><Link href={routes.terms} className="hover:underline">Terms of Service</Link><Link href={routes.contact} className="hover:underline">Contact Support</Link></div>
        <p className="mt-4 text-[9px] text-foreground">© 2026 Tajlandia.pl. All rights reserved.</p>
      </div>
    </div>
  );
}
