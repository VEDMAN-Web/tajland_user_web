"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import { routes } from "@/lib/constants/routes";
import { AuthShell } from "@/components/auth/AuthShell";
import {
  forgotPasswordSchema,
  type ForgotPasswordFormValues,
} from "./schemas/forgot-password.schema";
import { requestPasswordResetOtpAction } from "./services/forgot-password.service";
import { BackLink } from "@/components/ui/BackLink";

type ForgotPasswordErrors = Partial<Record<keyof ForgotPasswordFormValues, string>>;

const initialValues: ForgotPasswordFormValues = {
  email: "",
  termsAccepted: false,
};

export function ForgotPasswordPage() {
  const [values, setValues] = useState<ForgotPasswordFormValues>(initialValues);
  const [errors, setErrors] = useState<ForgotPasswordErrors>({});
  const [successMessage, setSuccessMessage] = useState("");
  const [apiError, setApiError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Skeleton until the (large) side photo has loaded.
  const router = useRouter();

  function updateField(field: keyof ForgotPasswordFormValues, value: string | boolean) {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
    setSuccessMessage("");
    setApiError("");
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const result = forgotPasswordSchema.safeParse(values);

    if (!result.success) {
      const nextErrors: ForgotPasswordErrors = {};

      for (const issue of result.error.issues) {
        const field = issue.path[0];
        if ((field === "email" || field === "termsAccepted") && !nextErrors[field]) {
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
      const actionResult = await requestPasswordResetOtpAction(result.data);

      if (actionResult.ok) {
        if (actionResult.redirectUrl) {
          setSuccessMessage("OTP sent to your email! Redirecting...");
          setTimeout(() => {
            router.push(actionResult.redirectUrl!);
          }, 800);
        } else {
          setSuccessMessage("OTP sent successfully!");
        }
      } else {
        setApiError(actionResult.message);
      }
    } catch {
      setApiError("Unable to process password reset right now. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthShell
      image="/images/auth/img_forget-pass.png"
      title={
        <>
          <span className="block">Recover your</span>
          <span className="block">
            <span className="font-display text-[1.1em] font-medium italic">access</span>{" "}
            <span>securely.</span>
          </span>
        </>
      }
      blurb={
        <>
          <span className="block">Our digital concierge is ready to assist you in regaining access to</span>
          <span className="block">your premium travel and collectible portfolio.</span>
        </>
      }
    >
      <BackLink href={routes.login}>Back to Login</BackLink>
      <h2 className="mt-6 lg:mt-4 text-[24px] font-semibold tracking-[-0.03em] text-navy sm:text-[26px]">Forgot your password?</h2>
      <p className="mt-2 text-[14px] leading-6 text-[#64748b]">
        No worries. Enter your email and we&apos;ll send you a code to reset your password.
      </p>

      <form className="mt-7 lg:mt-5" noValidate onSubmit={handleSubmit}>
        <div>
          <label htmlFor="forgot-password-email" className="text-[13px] font-medium text-[#1c1c1c]">Email</label>
          <div className="relative mt-2">
            <svg viewBox="0 0 24 24" aria-hidden="true" className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-[#9aa5b8]">
              <rect x="3" y="5" width="18" height="14" rx="3" fill="none" stroke="currentColor" strokeWidth="1.5" />
              <path d="m4 7.5 8 5.5 8-5.5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
            </svg>
            <input
              id="forgot-password-email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="Enter your email"
              value={values.email}
              onChange={(event) => updateField("email", event.target.value)}
              aria-invalid={Boolean(errors.email)}
              aria-describedby={errors.email ? "forgot-password-email-error" : undefined}
              className={`h-12 lg:h-11 w-full rounded-[14px] border bg-white pl-11 pr-3.5 text-[14px] text-[#1c1c1c] shadow-[0_1px_2px_rgba(11,31,77,0.04)] outline-none transition placeholder:text-[#b4bbc8] focus:border-navy focus:ring-4 focus:ring-navy/10 ${errors.email ? "border-[#d52b35] focus:ring-[#d52b35]/10" : "border-[#e3e7ef] hover:border-[#cfd6e4]"}`}
            />
          </div>
          {errors.email ? <p id="forgot-password-email-error" className="mt-1.5 text-[12px] text-[#d52b35]">{errors.email}</p> : null}
        </div>

        <div className="mt-5 lg:mt-4">
          <label className="flex cursor-pointer items-start gap-2.5 text-[13px] leading-5 text-[#64748b]">
            <input
              type="checkbox"
              name="termsAccepted"
              checked={values.termsAccepted}
              onChange={(event) => updateField("termsAccepted", event.target.checked)}
              aria-invalid={Boolean(errors.termsAccepted)}
              aria-describedby={errors.termsAccepted ? "forgot-password-terms-error" : undefined}
              className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer rounded border-[#d7d8da] accent-navy"
            />
            <span>
              I agree to the <Link href={routes.terms} className="font-medium text-[#e11d2e] hover:underline">Terms of Service</Link> and <Link href={routes.privacy} className="font-medium text-[#e11d2e] hover:underline">Privacy Policy</Link>.
            </span>
          </label>
          {errors.termsAccepted ? <p id="forgot-password-terms-error" className="mt-1.5 text-[12px] text-[#d52b35]">{errors.termsAccepted}</p> : null}
        </div>

        {successMessage ? <p role="status" className="mt-4 rounded-[12px] border border-[#c8ecd3] bg-[#f1fbf4] px-3.5 py-2.5 text-center text-[13px] font-medium text-green-700">{successMessage}</p> : null}
        {apiError ? <p role="alert" className="mt-4 rounded-[12px] border border-[#f6c9cd] bg-[#fff4f5] px-3.5 py-2.5 text-center text-[13px] text-[#d52b35]">{apiError}</p> : null}

        <button type="submit" disabled={isSubmitting} className="mt-5 lg:mt-4 inline-flex h-12 lg:h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-[14px] bg-linear-to-b from-[#12307a] to-navy text-[15px] font-medium text-white shadow-[0_10px_24px_-10px_rgba(11,31,77,0.7)] transition hover:-translate-y-px hover:shadow-[0_14px_28px_-10px_rgba(11,31,77,0.75)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 motion-reduce:transition-none">
          {isSubmitting ? (
            <>
              <span aria-hidden="true" className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white motion-reduce:animate-none" />
              Sending...
            </>
          ) : (
            "Send Code"
          )}
        </button>
      </form>

      <p className="mt-7 lg:mt-5 text-center text-[14px] text-[#64748b]">
        Remembered your password?{" "}
        <Link href={routes.login} className="font-semibold text-[#e11d2e] hover:underline">Log in</Link>
      </p>
    </AuthShell>
  );
}
