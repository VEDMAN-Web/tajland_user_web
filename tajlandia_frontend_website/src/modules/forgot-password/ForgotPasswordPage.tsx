"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { routes } from "@/lib/constants/routes";
import {
  forgotPasswordSchema,
  type ForgotPasswordFormValues,
} from "./schemas/forgot-password.schema";
import { forgotPasswordAction } from "./services/forgot-password.service";

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

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
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
      const actionResult = await forgotPasswordAction(result.data);

      if (actionResult.ok) {
        // Navigate to OTP page with email
        router.push(`/otp?email=${encodeURIComponent(actionResult.email)}`);
      } else {
        setApiError(actionResult.message);
      }
    } catch {
      setApiError("Unable to process your request right now. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="flex flex-1 items-center bg-white px-4 py-8 sm:px-8 lg:px-10 lg:py-10">
      <div className="mx-auto grid w-full max-w-[1030px] overflow-hidden rounded-[1.75rem] bg-white shadow-[0_18px_55px_rgba(11,31,77,0.06)] lg:min-h-[625px] lg:grid-cols-[1.02fr_1fr] lg:shadow-none">
        <div className="relative min-h-[330px] overflow-hidden rounded-[1.75rem] bg-[#071d52] px-8 py-10 text-white sm:px-10 lg:min-h-0 lg:px-9 lg:py-10">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_12%_72%,rgba(212,232,246,0.95)_0%,rgba(125,177,225,0.8)_18%,transparent_43%),radial-gradient(ellipse_at_88%_76%,rgba(255,146,147,0.95)_0%,rgba(241,105,126,0.7)_18%,transparent_43%),linear-gradient(180deg,#061b4d_0%,#0d397e_36%,#5b95d0_67%,#e9bfd1_100%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_100%,rgba(255,255,255,0.24),transparent_42%)] opacity-80" />
          <div className="relative z-10 max-w-[300px]">
            <h1 className="text-[25px] font-medium leading-[1.18] tracking-[-0.03em] sm:text-[27px]">
              Recover your access
              <br />
              securely.
            </h1>
            <p className="mt-3 text-[13px] leading-5 text-white/80">
              Our digital concierge is ready to assist you in regaining access to your premium travel and collectible portfolio.
            </p>
          </div>
        </div>

        <div className="flex flex-col px-4 py-12 sm:px-12 lg:px-[74px] lg:py-16">
          <div className="w-full max-w-[380px] lg:mx-auto">
            <Link href={routes.login} className="text-[10px] text-foreground hover:underline">
              ← Back to Login
            </Link>

            <h2 className="mt-9 text-[24px] font-semibold tracking-[-0.03em] text-navy">
              Forgot your password?
            </h2>
            <p className="mt-2 text-[11px] leading-5 text-muted">
              No worries. Enter your email and we&apos;ll send you a link to reset your password.
            </p>

            <form className="mt-7" noValidate onSubmit={handleSubmit}>
              <div>
                <label htmlFor="forgot-password-email" className="text-[12px] font-medium text-foreground">
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
                  className={`mt-2 h-10 w-full rounded-[9px] border px-3 text-[12px] text-foreground outline-none transition placeholder:text-[#c6c7ca] focus:border-navy focus:ring-2 focus:ring-navy/10 ${errors.email ? "border-[#d52b35]" : "border-[#e5e7eb]"}`}
                />
                {errors.email ? (
                  <p id="forgot-password-email-error" className="mt-1.5 text-[11px] text-[#d52b35]">
                    {errors.email}
                  </p>
                ) : null}
              </div>

              <div className="mt-4">
                <label className="flex items-start gap-2 text-[11px] leading-5 text-[#b8b9bd]">
                  <input
                    type="checkbox"
                    name="termsAccepted"
                    checked={values.termsAccepted}
                    onChange={(event) => updateField("termsAccepted", event.target.checked)}
                    aria-invalid={Boolean(errors.termsAccepted)}
                    aria-describedby={errors.termsAccepted ? "forgot-password-terms-error" : undefined}
                    className="mt-0.5 h-3.5 w-3.5 shrink-0 rounded border-[#d7d8da] accent-navy"
                  />
                  <span>
                    I agree to the <Link href={routes.terms} className="text-[#d9272e] hover:underline">Terms of Service</Link> and <Link href={routes.privacy} className="text-[#d9272e] hover:underline">Privacy Policy</Link>.
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

              <button type="submit" disabled={isSubmitting} className="mt-5 h-11 w-full rounded-[9px] bg-navy text-[12px] font-medium text-white shadow-[0_3px_5px_rgba(11,31,77,0.18)] transition hover:bg-navy-deep focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy disabled:cursor-not-allowed disabled:opacity-60">
                {isSubmitting ? "Sending Code..." : "Send Code"}
              </button>
            </form>
          </div>

          <div className="mt-auto pt-16 text-center text-[10px] text-[#8e8e91]">
            <div className="flex justify-center gap-4">
              <Link href={routes.privacy} className="hover:underline">Privacy Policy</Link>
              <Link href={routes.terms} className="hover:underline">Terms of Service</Link>
              <Link href={routes.contact} className="hover:underline">Contact Support</Link>
            </div>
            <p className="mt-4 text-[9px] text-foreground">© 2026 Tajlandia.pl. All rights reserved.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
