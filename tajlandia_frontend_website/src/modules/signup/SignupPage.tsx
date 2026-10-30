"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import { routes } from "@/lib/constants/routes";
import { ScrollAnimatedElement } from "@/components/animations/ScrollAnimatedElement";
import { signupSchema, type SignupFormValues } from "./schemas/signup.schema";
import { requestSignupOtpAction } from "./services/signup.service";
import { BackLink } from "@/components/ui/BackLink";

type SignupErrors = Partial<Record<keyof SignupFormValues, string>>;

function EyeIcon({ hidden }: { hidden: boolean }) {
  return hidden ? (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4">
      <path
        d="M3 3l18 18M10.6 10.6a2 2 0 0 0 2.8 2.8M9.9 5.2A10.8 10.8 0 0 1 12 5c5.3 0 8.8 4.2 9.8 6.1a1.8 1.8 0 0 1 0 .8 12.5 12.5 0 0 1-3.2 4.1M6.2 6.2A12.5 12.5 0 0 0 2.2 11a1.8 1.8 0 0 0 0 .8C3.2 13.7 6.7 18 12 18c1 0 1.9-.1 2.8-.4"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
      />
    </svg>
  ) : (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4">
      <path
        d="M2.2 12S5.7 5 12 5s9.8 7 9.8 7-3.5 7-9.8 7-9.8-7-9.8-7Z"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
      />
      <circle cx="12" cy="12" r="2.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

function UserIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className}>
      <circle cx="12" cy="8.5" r="3.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <path d="M5 19.5c.8-3.3 3.6-5 7-5s6.2 1.7 7 5" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.5" />
    </svg>
  );
}

function MailIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className}>
      <rect x="3" y="5" width="18" height="14" rx="3" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <path d="m4 7.5 8 5.5 8-5.5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
    </svg>
  );
}

function LockIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className}>
      <rect x="4.5" y="10.5" width="15" height="9.5" rx="2.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.5" />
    </svg>
  );
}

const initialValues: SignupFormValues = {
  firstName: "",
  lastName: "",
  email: "",
  newPassword: "",
  confirmPassword: "",
  termsAccepted: false,
};

export function SignupPage() {
  const router = useRouter();
  const [values, setValues] = useState<SignupFormValues>(initialValues);
  const [errors, setErrors] = useState<SignupErrors>({});
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [apiError, setApiError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Skeleton until the (large) side photo has loaded.
  const [imageLoaded, setImageLoaded] = useState(false);

  function updateField(field: keyof SignupFormValues, value: string | boolean) {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
    setSuccessMessage("");
    setApiError("");
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const result = signupSchema.safeParse(values);

    if (!result.success) {
      const nextErrors: SignupErrors = {};

      for (const issue of result.error.issues) {
        const field = issue.path[0];
        if (
          (field === "firstName" ||
            field === "lastName" ||
            field === "email" ||
            field === "newPassword" ||
            field === "confirmPassword" ||
            field === "termsAccepted") &&
          !nextErrors[field]
        ) {
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
      // Store signup form data in sessionStorage for OTP verification
      sessionStorage.setItem("signupFormData", JSON.stringify(result.data));

      // Create the account and email the OTP, then go to the OTP page
      const actionResult = await requestSignupOtpAction(result.data);

      if (actionResult.ok && actionResult.redirectUrl) {
        setSuccessMessage("Redirecting to OTP verification...");
        setTimeout(() => {
          router.push(actionResult.redirectUrl!);
        }, 800);
      } else if (!actionResult.ok) {
        setApiError(actionResult.message);
        sessionStorage.removeItem("signupFormData");
      }
    } catch {
      setApiError("Unable to process signup right now. Please try again.");
      sessionStorage.removeItem("signupFormData");
    } finally {
      setIsSubmitting(false);
    }
  }

  function fieldClass(hasError: boolean) {
    return `h-12 lg:h-11 w-full rounded-[14px] border bg-white pl-11 pr-3.5 text-[14px] text-[#1c1c1c] shadow-[0_1px_2px_rgba(11,31,77,0.04)] outline-none transition placeholder:text-[#b4bbc8] focus:border-navy focus:ring-4 focus:ring-navy/10 ${hasError ? "border-[#d52b35] focus:ring-[#d52b35]/10" : "border-[#e3e7ef] hover:border-[#cfd6e4]"}`;
  }

  const iconClass = "pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-[#9aa5b8]";
  const labelClass = "text-[13px] font-medium text-[#1c1c1c]";
  const eyeButtonClass = "absolute right-3.5 top-1/2 -translate-y-1/2 cursor-pointer rounded-sm text-[#9aa5b8] transition hover:text-navy focus-visible:outline-2 focus-visible:outline-navy";

  return (
    <section className="flex min-h-[100svh] flex-1 flex-col overflow-x-clip bg-white lg:grid lg:grid-cols-[1.08fr_1fr]">
      <aside className="relative isolate h-[300px] shrink-0 overflow-hidden bg-[#0b1f4d] text-white sm:h-[360px] lg:sticky lg:top-0 lg:h-[100svh]">
        {!imageLoaded ? (
          <span aria-hidden="true" className="absolute inset-0 animate-pulse bg-[#1a2f63] motion-reduce:animate-none" />
        ) : null}
        <Image
          src="/images/auth/img_signup.png"
          alt=""
          fill
          priority
          sizes="(max-width: 1024px) 100vw, 55vw"
          onLoad={() => setImageLoaded(true)}
          className={`object-cover object-center transition-opacity duration-700 ${imageLoaded ? "auth-hero-zoom opacity-100" : "opacity-0"}`}
        />
        <div aria-hidden="true" className="absolute inset-0 bg-linear-to-b from-black/30 via-transparent to-[#071536]/85" />
        <div aria-hidden="true" className="absolute inset-0 bg-linear-to-r from-[#071536]/30 to-transparent" />

        <div className="relative z-10 flex h-full flex-col justify-between px-6 pb-12 pt-6 sm:px-10 sm:pt-8 lg:px-14 lg:pb-14 lg:pt-12">
          <span className="inline-flex w-fit items-center gap-2 rounded-full border border-white/25 bg-black/25 px-3.5 py-1.5 text-[11px] font-medium uppercase tracking-[0.16em] text-white/90">
            <span className="h-1.5 w-1.5 rounded-full bg-[#ff4b5c]" />
            Tajlandia
          </span>

          <div>
            <h1 className="text-[30px] font-semibold leading-[1.08] tracking-[-0.035em] text-white [text-shadow:0_2px_20px_rgba(0,0,0,0.35)] sm:text-[40px] lg:text-[54px]">
              <span className="block">Your Portal to</span>
              <span className="block font-display text-[1.1em] font-medium italic">Paradise.</span>
            </h1>
            <p className="mt-4 max-w-[34rem] rounded-[20px] border border-white/25 bg-black/25 px-4 py-3 text-[12px] leading-[1.55] text-white/95 sm:text-[14px]">
              <span className="block">Join our exclusive community of travelers and collectors.</span>
              <span className="block">Experience Thailand through a refined digital lens.</span>
            </p>
          </div>
        </div>
      </aside>

      <div className="relative z-10 -mt-8 flex flex-1 items-center justify-center rounded-t-[32px] bg-white px-5 pb-10 pt-8 sm:px-10 lg:mt-0 lg:rounded-none lg:bg-[#f6f8fc] lg:px-12 lg:py-4">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 hidden overflow-hidden lg:block">
          <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-[#e11d2e]/[0.05] blur-3xl" />
          <div className="absolute -bottom-24 -left-16 h-72 w-72 rounded-full bg-navy/[0.07] blur-3xl" />
          <svg viewBox="0 0 800 300" preserveAspectRatio="xMidYMax slice" className="absolute inset-x-0 bottom-0 h-[42%] w-full text-navy">
            <path d="M0 215 L80 150 L140 185 L235 100 L325 195 L415 135 L515 205 L620 120 L715 185 L800 150 V300 H0 Z" fill="currentColor" fillOpacity="0.035" />
            <path d="M0 245 L70 200 L130 228 L210 170 L300 235 L400 190 L500 240 L600 180 L700 232 L800 205 V300 H0 Z" fill="currentColor" fillOpacity="0.045" />
            <path d="M0 262 C110 232 190 282 310 258 S530 228 650 258 S760 250 800 244 V300 H0 Z" fill="currentColor" fillOpacity="0.06" />
            <path d="M0 262 C110 232 190 282 310 258 S530 228 650 258 S760 250 800 244" fill="none" stroke="currentColor" strokeOpacity="0.12" strokeWidth="1.2" />
          </svg>
          <svg viewBox="0 0 800 300" preserveAspectRatio="xMidYMax slice" className="absolute inset-x-0 top-0 h-[42%] w-full rotate-180 text-navy">
            <path d="M0 215 L80 150 L140 185 L235 100 L325 195 L415 135 L515 205 L620 120 L715 185 L800 150 V300 H0 Z" fill="currentColor" fillOpacity="0.035" />
            <path d="M0 245 L70 200 L130 228 L210 170 L300 235 L400 190 L500 240 L600 180 L700 232 L800 205 V300 H0 Z" fill="currentColor" fillOpacity="0.045" />
            <path d="M0 262 C110 232 190 282 310 258 S530 228 650 258 S760 250 800 244 V300 H0 Z" fill="currentColor" fillOpacity="0.06" />
            <path d="M0 262 C110 232 190 282 310 258 S530 228 650 258 S760 250 800 244" fill="none" stroke="currentColor" strokeOpacity="0.12" strokeWidth="1.2" />
          </svg>
        </div>

        <ScrollAnimatedElement animation="slide-in-right" duration={600} className="relative mx-auto w-full max-w-[480px]">
          <div className="rounded-[28px] bg-white lg:p-6 lg:shadow-[0_24px_60px_-24px_rgba(11,31,77,0.22)] lg:ring-1 lg:ring-[#e6eaf3]">
            <BackLink href={routes.home}>Back to Home</BackLink>
            <h2 className="mt-6 lg:mt-4 text-[24px] font-semibold tracking-[-0.03em] text-navy sm:text-[26px]">Create your account</h2>
            <p className="mt-2 text-[14px] leading-6 text-[#64748b]">Start your journey and claim your little piece of Thailand.</p>

            <form className="mt-7 lg:mt-4" noValidate onSubmit={handleSubmit}>
              <div className="grid gap-4 lg:gap-3 sm:grid-cols-2">
                <div>
                  <label htmlFor="signup-first-name" className={labelClass}>First name</label>
                  <div className="relative mt-2">
                    <UserIcon className={iconClass} />
                    <input
                      id="signup-first-name"
                      name="firstName"
                      type="text"
                      autoComplete="given-name"
                      placeholder="e.g. Rachel"
                      value={values.firstName}
                      onChange={(event) => updateField("firstName", event.target.value)}
                      aria-invalid={Boolean(errors.firstName)}
                      aria-describedby={errors.firstName ? "signup-first-name-error" : undefined}
                      className={fieldClass(Boolean(errors.firstName))}
                    />
                  </div>
                  {errors.firstName ? <p id="signup-first-name-error" className="mt-1.5 text-[12px] text-[#d52b35]">{errors.firstName}</p> : null}
                </div>
                <div>
                  <label htmlFor="signup-last-name" className={labelClass}>Last name</label>
                  <div className="relative mt-2">
                    <UserIcon className={iconClass} />
                    <input
                      id="signup-last-name"
                      name="lastName"
                      type="text"
                      autoComplete="family-name"
                      placeholder="e.g. Criston"
                      value={values.lastName}
                      onChange={(event) => updateField("lastName", event.target.value)}
                      aria-invalid={Boolean(errors.lastName)}
                      aria-describedby={errors.lastName ? "signup-last-name-error" : undefined}
                      className={fieldClass(Boolean(errors.lastName))}
                    />
                  </div>
                  {errors.lastName ? <p id="signup-last-name-error" className="mt-1.5 text-[12px] text-[#d52b35]">{errors.lastName}</p> : null}
                </div>
              </div>

              <div className="mt-4 lg:mt-3">
                <label htmlFor="signup-email" className={labelClass}>Email</label>
                <div className="relative mt-2">
                  <MailIcon className={iconClass} />
                  <input
                    id="signup-email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    placeholder="Enter your email"
                    value={values.email}
                    onChange={(event) => updateField("email", event.target.value)}
                    aria-invalid={Boolean(errors.email)}
                    aria-describedby={errors.email ? "signup-email-error" : undefined}
                    className={fieldClass(Boolean(errors.email))}
                  />
                </div>
                {errors.email ? <p id="signup-email-error" className="mt-1.5 text-[12px] text-[#d52b35]">{errors.email}</p> : null}
              </div>

              <div className="mt-4 lg:mt-3">
                <label htmlFor="signup-new-password" className={labelClass}>New password</label>
                <div className="relative mt-2">
                  <LockIcon className={iconClass} />
                  <input
                    id="signup-new-password"
                    name="newPassword"
                    type={showNewPassword ? "text" : "password"}
                    autoComplete="new-password"
                    placeholder="Create a password"
                    value={values.newPassword}
                    onChange={(event) => updateField("newPassword", event.target.value)}
                    aria-invalid={Boolean(errors.newPassword)}
                    aria-describedby={errors.newPassword ? "signup-new-password-error" : undefined}
                    className={`${fieldClass(Boolean(errors.newPassword))} pr-11`}
                  />
                  <button type="button" aria-label={showNewPassword ? "Hide new password" : "Show new password"} onMouseDown={(event) => event.preventDefault()} onClick={() => setShowNewPassword((current) => !current)} className={eyeButtonClass}>
                    <EyeIcon hidden={!showNewPassword} />
                  </button>
                </div>
                {errors.newPassword ? <p id="signup-new-password-error" className="mt-1.5 text-[12px] text-[#d52b35]">{errors.newPassword}</p> : null}
              </div>

              <div className="mt-4 lg:mt-3">
                <label htmlFor="signup-confirm-password" className={labelClass}>Confirm password</label>
                <div className="relative mt-2">
                  <LockIcon className={iconClass} />
                  <input
                    id="signup-confirm-password"
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    autoComplete="new-password"
                    placeholder="Re-enter your password"
                    value={values.confirmPassword}
                    onChange={(event) => updateField("confirmPassword", event.target.value)}
                    aria-invalid={Boolean(errors.confirmPassword)}
                    aria-describedby={errors.confirmPassword ? "signup-confirm-password-error" : undefined}
                    className={`${fieldClass(Boolean(errors.confirmPassword))} pr-11`}
                  />
                  <button type="button" aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"} onMouseDown={(event) => event.preventDefault()} onClick={() => setShowConfirmPassword((current) => !current)} className={eyeButtonClass}>
                    <EyeIcon hidden={!showConfirmPassword} />
                  </button>
                </div>
                {errors.confirmPassword ? <p id="signup-confirm-password-error" className="mt-1.5 text-[12px] text-[#d52b35]">{errors.confirmPassword}</p> : null}
              </div>

              <div className="mt-5 lg:mt-4">
                <label className="flex cursor-pointer items-start gap-2.5 text-[13px] leading-5 text-[#64748b]">
                  <input
                    type="checkbox"
                    name="termsAccepted"
                    checked={values.termsAccepted}
                    onChange={(event) => updateField("termsAccepted", event.target.checked)}
                    aria-invalid={Boolean(errors.termsAccepted)}
                    aria-describedby={errors.termsAccepted ? "signup-terms-error" : undefined}
                    className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer rounded border-[#d7d8da] accent-navy"
                  />
                  <span>
                    I agree to the <Link href={routes.terms} className="font-medium text-[#e11d2e] hover:underline">Terms of Service</Link> and <Link href={routes.privacy} className="font-medium text-[#e11d2e] hover:underline">Privacy Policy</Link>
                  </span>
                </label>
                {errors.termsAccepted ? <p id="signup-terms-error" className="mt-1.5 text-[12px] text-[#d52b35]">{errors.termsAccepted}</p> : null}
              </div>

              {successMessage ? (
                <p role="status" className="mt-4 rounded-[12px] border border-[#c8ecd3] bg-[#f1fbf4] px-3.5 py-2.5 text-center text-[13px] font-medium text-green-700">
                  {successMessage}
                </p>
              ) : null}
              {apiError ? (
                <p role="alert" className="mt-4 rounded-[12px] border border-[#f6c9cd] bg-[#fff4f5] px-3.5 py-2.5 text-center text-[13px] text-[#d52b35]">
                  {apiError}
                </p>
              ) : null}
              <button
                type="submit"
                disabled={isSubmitting}
                className="mt-5 lg:mt-4 inline-flex h-12 lg:h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-[14px] bg-linear-to-b from-[#12307a] to-navy text-[15px] font-medium text-white shadow-[0_10px_24px_-10px_rgba(11,31,77,0.7)] transition hover:-translate-y-px hover:shadow-[0_14px_28px_-10px_rgba(11,31,77,0.75)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 motion-reduce:transition-none"
              >
                {isSubmitting ? (
                  <>
                    <span aria-hidden="true" className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white motion-reduce:animate-none" />
                    Creating Account...
                  </>
                ) : (
                  "Create Account"
                )}
              </button>
            </form>

            <p className="mt-6 lg:mt-4 text-center text-[14px] text-[#64748b]">
              Already have an account?{" "}
              <Link href={routes.login} className="font-semibold text-[#e11d2e] hover:underline">Log in</Link>
            </p>
          </div>
        </ScrollAnimatedElement>
      </div>
    </section>
  );
}
