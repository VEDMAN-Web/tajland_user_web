"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import { routes } from "@/lib/constants/routes";
import { ScrollAnimatedElement } from "@/components/animations/ScrollAnimatedElement";
import { signupSchema, type SignupFormValues } from "./schemas/signup.schema";
import { requestSignupOtpAction } from "./services/signup.service";

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

      // Prepare for OTP verification and redirect to OTP page
      const actionResult = await requestSignupOtpAction(result.data);

      if (actionResult.ok && actionResult.redirectUrl) {
        setSuccessMessage("Redirecting to OTP verification...");
        // Redirect to OTP page with default 123456 for testing
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
    return `h-12 w-full rounded-[12px] border bg-white px-3.5 text-[14px] text-[#1c1c1c] outline-none transition placeholder:text-[#c5c9d1] focus:border-navy focus:ring-2 focus:ring-navy/10 ${hasError ? "border-[#d52b35]" : "border-[#e6e8ee]"}`;
  }

  return (
    <section className="flex flex-1 items-center bg-white px-4 py-8 sm:px-8 lg:px-12 lg:py-10">
      <div className="mx-auto grid w-full max-w-[1080px] items-center gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:gap-14">
        <div className="relative min-h-[420px] overflow-hidden rounded-[28px] bg-[#0b1f4d] text-white sm:min-h-[560px] lg:min-h-[680px]">
          <Image
            src="/images/auth/img_signup.png"
            alt=""
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 540px"
            className="object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/15 via-transparent to-transparent" />
          <div className="relative z-10 px-7 py-8 [text-shadow:0_1px_10px_rgba(0,0,0,0.28)] sm:px-8 sm:py-9">
            <h1 className="text-[26px] font-semibold leading-tight tracking-[-0.03em] text-white sm:text-[30px]">
              Your Portal to Paradise.
            </h1>
            <p className="mt-3 text-[13px] font-normal leading-[1.45] text-white sm:text-[14px]">
              <span className="block">Join our exclusive community of travelers and collectors.</span>
              <span className="block">Experience Thailand through a refined digital lens.</span>
            </p>
          </div>
        </div>

        <div className="flex items-center px-1 py-2 sm:px-4">
          <ScrollAnimatedElement animation="slide-in-right" duration={600} className="mx-auto w-full max-w-[440px]">
            <h2 className="text-[28px] font-semibold tracking-[-0.03em] text-navy sm:text-[30px]">Create your account</h2>
            <p className="mt-2 text-[14px] text-[#8b939e]">start your journey and claim your little piece of Thailand.</p>

            <form className="mt-7" noValidate onSubmit={handleSubmit}>
              <div className="grid gap-4 sm:grid-cols-2 sm:gap-4">
                <div>
                  <label htmlFor="signup-first-name" className="text-[14px] font-medium text-[#1c1c1c]">First name</label>
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
                    className={`mt-2 ${fieldClass(Boolean(errors.firstName))}`}
                  />
                  {errors.firstName ? <p id="signup-first-name-error" className="mt-1.5 text-[12px] text-[#d52b35]">{errors.firstName}</p> : null}
                </div>
                <div>
                  <label htmlFor="signup-last-name" className="text-[14px] font-medium text-[#1c1c1c]">Last name</label>
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
                    className={`mt-2 ${fieldClass(Boolean(errors.lastName))}`}
                  />
                  {errors.lastName ? <p id="signup-last-name-error" className="mt-1.5 text-[12px] text-[#d52b35]">{errors.lastName}</p> : null}
                </div>
              </div>

              <div className="mt-4">
                <label htmlFor="signup-email" className="text-[14px] font-medium text-[#1c1c1c]">Email</label>
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
                  className={`mt-2 ${fieldClass(Boolean(errors.email))}`}
                />
                {errors.email ? <p id="signup-email-error" className="mt-1.5 text-[12px] text-[#d52b35]">{errors.email}</p> : null}
              </div>

              <div className="mt-4">
                <label htmlFor="signup-new-password" className="text-[14px] font-medium text-[#1c1c1c]">New password</label>
                <div className="relative mt-2">
                  <input
                    id="signup-new-password"
                    name="newPassword"
                    type={showNewPassword ? "text" : "password"}
                    autoComplete="new-password"
                    placeholder="hello@example.com"
                    value={values.newPassword}
                    onChange={(event) => updateField("newPassword", event.target.value)}
                    aria-invalid={Boolean(errors.newPassword)}
                    aria-describedby={errors.newPassword ? "signup-new-password-error" : undefined}
                    className={`${fieldClass(Boolean(errors.newPassword))} pr-11`}
                  />
                  <button type="button" aria-label={showNewPassword ? "Hide new password" : "Show new password"} onMouseDown={(event) => event.preventDefault()} onClick={() => setShowNewPassword((current) => !current)} className="absolute right-3.5 top-1/2 -translate-y-1/2 cursor-pointer text-[#b7b8bb] focus-visible:rounded focus-visible:outline-2 focus-visible:outline-navy">
                    <EyeIcon hidden={!showNewPassword} />
                  </button>
                </div>
                {errors.newPassword ? <p id="signup-new-password-error" className="mt-1.5 text-[12px] text-[#d52b35]">{errors.newPassword}</p> : null}
              </div>

              <div className="mt-4">
                <label htmlFor="signup-confirm-password" className="text-[14px] font-medium text-[#1c1c1c]">Confirm password</label>
                <div className="relative mt-2">
                  <input
                    id="signup-confirm-password"
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    autoComplete="new-password"
                    placeholder="hello@example.com"
                    value={values.confirmPassword}
                    onChange={(event) => updateField("confirmPassword", event.target.value)}
                    aria-invalid={Boolean(errors.confirmPassword)}
                    aria-describedby={errors.confirmPassword ? "signup-confirm-password-error" : undefined}
                    className={`${fieldClass(Boolean(errors.confirmPassword))} pr-11`}
                  />
                  <button type="button" aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"} onMouseDown={(event) => event.preventDefault()} onClick={() => setShowConfirmPassword((current) => !current)} className="absolute right-3.5 top-1/2 -translate-y-1/2 cursor-pointer text-[#b7b8bb] focus-visible:rounded focus-visible:outline-2 focus-visible:outline-navy">
                    <EyeIcon hidden={!showConfirmPassword} />
                  </button>
                </div>
                {errors.confirmPassword ? <p id="signup-confirm-password-error" className="mt-1.5 text-[12px] text-[#d52b35]">{errors.confirmPassword}</p> : null}
              </div>

              <div className="mt-4">
                <label className="flex cursor-pointer items-start gap-2 text-[13px] leading-5 text-[#9aa3ad]">
                  <input
                    type="checkbox"
                    name="termsAccepted"
                    checked={values.termsAccepted}
                    onChange={(event) => updateField("termsAccepted", event.target.checked)}
                    aria-invalid={Boolean(errors.termsAccepted)}
                    aria-describedby={errors.termsAccepted ? "signup-terms-error" : undefined}
                    className="mt-0.5 h-4 w-4 shrink-0 rounded border-[#d7d8da] accent-navy"
                  />
                  <span>
                    I agree to the <Link href={routes.terms} className="font-medium text-[#e11d2e] hover:underline">Terms of Service</Link> and <Link href={routes.privacy} className="font-medium text-[#e11d2e] hover:underline">Privacy Policy</Link>
                  </span>
                </label>
                {errors.termsAccepted ? <p id="signup-terms-error" className="mt-1.5 text-[12px] text-[#d52b35]">{errors.termsAccepted}</p> : null}
              </div>

              {successMessage ? (
                <p role="status" className="mt-4 text-center text-[13px] font-medium text-green-600">
                  {successMessage}
                </p>
              ) : null}
              {apiError ? (
                <p role="alert" className="mt-4 text-center text-[13px] text-[#d52b35]">
                  {apiError}
                </p>
              ) : null}
              <button type="submit" disabled={isSubmitting} className="mt-5 h-12 w-full cursor-pointer rounded-[12px] bg-navy text-[15px] font-medium text-white transition hover:bg-navy-deep focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy disabled:cursor-not-allowed disabled:opacity-60">
                {isSubmitting ? "Creating Account..." : "Create Account"}
              </button>
            </form>

            <p className="mt-6 text-center text-[14px] text-[#1c1c1c]">
              Already have an account? <Link href={routes.login} className="font-medium text-[#e11d2e] hover:underline">Log in</Link>
            </p>
          </ScrollAnimatedElement>
        </div>
      </div>
    </section>
  );
}
