"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import { routes } from "@/lib/constants/routes";
import { ScrollAnimatedElement } from "@/components/animations/ScrollAnimatedElement";
import {
  forgotPasswordSchema,
  type ForgotPasswordFormValues,
} from "./schemas/forgot-password.schema";
import { requestPasswordResetOtpAction } from "./services/forgot-password.service";

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
    <section className="flex flex-1 items-center bg-white px-4 py-8 sm:px-8 lg:px-12 lg:py-10">
      <div className="mx-auto grid w-full max-w-[1080px] items-stretch gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:gap-14">
        <div className="relative min-h-[420px] overflow-hidden rounded-[28px] bg-[#0b1f4d] text-white sm:min-h-[560px] lg:min-h-[680px]">
          <Image
            src="/images/auth/img_forget-pass.png"
            alt=""
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 540px"
            className="object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/25 via-transparent to-transparent" />
          <div className="relative z-10 px-7 py-8 [text-shadow:0_1px_10px_rgba(0,0,0,0.35)] sm:px-8 sm:py-9">
            <h1 className="text-[26px] font-semibold leading-tight tracking-[-0.03em] text-white sm:text-[30px]">
              Recover your access securely.
            </h1>
            <p className="mt-3 text-[13px] font-normal leading-[1.45] text-white sm:text-[14px]">
              <span className="block">Our digital concierge is ready to assist you in regaining access to</span>
              <span className="block">your premium travel and collectible portfolio.</span>
            </p>
          </div>
        </div>

        <div className="flex min-h-[640px] flex-col px-1 py-2 sm:px-4">
          <ScrollAnimatedElement animation="slide-in-right" duration={600} className="mx-auto flex w-full max-w-[420px] flex-1 flex-col">
            <Link href={routes.login} className="text-[13px] text-[#6b7280] hover:text-navy hover:underline">
              ← Back to Login
            </Link>

            <h2 className="mt-8 text-[28px] font-semibold tracking-[-0.03em] text-navy sm:text-[30px]">
              Forgot your password?
            </h2>
            <p className="mt-2 text-[14px] leading-6 text-[#8b939e]">
              No worries. Enter your email and we&apos;ll send you a link to reset your password.
            </p>

            <form className="mt-7" noValidate onSubmit={handleSubmit}>
              <div>
                <label htmlFor="forgot-password-email" className="text-[14px] font-medium text-[#1c1c1c]">
                  Email Address
                </label>
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
                  className={`mt-2 h-12 w-full rounded-[12px] border bg-white px-3.5 text-[14px] text-[#1c1c1c] outline-none transition placeholder:text-[#c5c9d1] focus:border-navy focus:ring-2 focus:ring-navy/10 ${errors.email ? "border-[#d52b35]" : "border-[#e6e8ee]"}`}
                />
                {errors.email ? (
                  <p id="forgot-password-email-error" className="mt-1.5 text-[11px] text-[#d52b35]">
                    {errors.email}
                  </p>
                ) : null}
              </div>

              <div className="mt-4">
                <label className="flex cursor-pointer items-start gap-2 text-[13px] leading-5 text-[#9aa3ad]">
                  <input
                    type="checkbox"
                    name="termsAccepted"
                    checked={values.termsAccepted}
                    onChange={(event) => updateField("termsAccepted", event.target.checked)}
                    aria-invalid={Boolean(errors.termsAccepted)}
                    aria-describedby={errors.termsAccepted ? "forgot-password-terms-error" : undefined}
                    className="mt-0.5 h-4 w-4 shrink-0 rounded border-[#d7d8da] accent-navy"
                  />
                  <span>
                    I agree to the <Link href={routes.terms} className="font-medium text-[#e11d2e] hover:underline">Terms of Service</Link> and <Link href={routes.privacy} className="font-medium text-[#e11d2e] hover:underline">Privacy Policy</Link>.
                  </span>
                </label>
                {errors.termsAccepted ? (
                  <p id="forgot-password-terms-error" className="mt-1.5 text-[11px] text-[#d52b35]">
                    {errors.termsAccepted}
                  </p>
                ) : null}
              </div>

              {successMessage ? (
                <p role="status" className="mt-4 text-center text-[12px] font-medium text-green-600">
                  {successMessage}
                </p>
              ) : null}
              {apiError ? (
                <p role="alert" className="mt-4 text-center text-[12px] text-[#d52b35]">
                  {apiError}
                </p>
              ) : null}

              <button type="submit" disabled={isSubmitting} className="mt-5 h-12 w-full cursor-pointer rounded-[12px] bg-navy text-[15px] font-medium text-white transition hover:bg-navy-deep focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy disabled:cursor-not-allowed disabled:opacity-60">
                {isSubmitting ? "Sending..." : "Send Code"}
              </button>
            </form>

            <div className="mt-auto pt-16 text-center text-[12px] text-[#8e8e91]">
              <div className="flex justify-center gap-4">
                <Link href={routes.privacy} className="hover:underline">Privacy Policy</Link>
                <Link href={routes.terms} className="hover:underline">Terms of Service</Link>
                <Link href={routes.contact} className="hover:underline">Contact Support</Link>
              </div>
              <p className="mt-4 text-[12px] text-[#1c1c1c]">© 2026 Tajlandia.pl. All rights reserved.</p>
            </div>
          </ScrollAnimatedElement>
        </div>
      </div>
    </section>
  );
}
