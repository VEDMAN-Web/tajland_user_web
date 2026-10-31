"use client";

import { useRouter, useSearchParams } from "next/navigation";
import React, { Suspense, useEffect, useRef, useState, type ClipboardEvent, type KeyboardEvent } from "react";
import { routes } from "@/lib/constants/routes";
import { AuthShell } from "@/components/auth/AuthShell";
import { setAuthToken, setAuthUser } from "@/lib/api/auth.utils";
import { otpSchema } from "./schemas/otp.schema";
import type { SignupFormValues } from "@/modules/signup/schemas/signup.schema";
import { verifyOtpAction, resendOtpAction, completeSignupWithOtpAction } from "./services/otp.service";
import { verifyPasswordResetOtpAction } from "@/modules/reset-password/services/reset-password.service";
import { BackLink } from "@/components/ui/BackLink";

const OTP_LENGTH = 6;
// The API enforces a 60-second cooldown between OTP emails.
const RESEND_COOLDOWN_SECONDS = 60;
const RESEND_MESSAGE_DURATION_MS = 3000;
const RESEND_SUCCESS_MESSAGE = "A new code has been sent to your email.";

function OtpPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") ?? "your email address";
  const mode = searchParams.get("mode") ?? "login"; // "login" or "signup"
  const [digits, setDigits] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [secondsRemaining, setSecondsRemaining] = useState(RESEND_COOLDOWN_SECONDS);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);

  useEffect(() => {
    if (secondsRemaining <= 0) {
      return;
    }

    const timer = window.setInterval(() => {
      setSecondsRemaining((current) => Math.max(current - 1, 0));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [secondsRemaining]);

  function updateDigit(index: number, value: string) {
    const digit = value.replace(/\D/g, "").slice(-1);
    setDigits((current) => {
      const nextDigits = [...current];
      nextDigits[index] = digit;
      return nextDigits;
    });
    setError("");
    setMessage("");

    if (digit && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  }

  function handleKeyDown(index: number, event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Backspace" && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  }

  function handlePaste(event: ClipboardEvent<HTMLDivElement>) {
    event.preventDefault();
    const pasted = event.clipboardData.getData("text").replace(/\D/g, "").slice(0, OTP_LENGTH);

    if (!pasted) {
      return;
    }

    const nextDigits = Array(OTP_LENGTH).fill("");
    pasted.split("").forEach((digit, index) => {
      nextDigits[index] = digit;
    });
    setDigits(nextDigits);
    setError("");
    setMessage("");
    inputRefs.current[Math.min(pasted.length, OTP_LENGTH) - 1]?.focus();
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const code = digits.join("");
    const result = otpSchema.safeParse(code);

    if (!result.success) {
      setError(result.error.issues[0]?.message ?? "Enter the complete 6-digit code");
      setMessage("");
      return;
    }

    setError("");
    setMessage("");
    setIsSubmitting(true);

    try {
      if (mode === "signup") {
        // Signup mode: verify the new account's email, then log in
        const signupDataStr = sessionStorage.getItem("signupFormData");
        if (!signupDataStr) {
          setError("Signup data not found. Please start signup again.");
          return;
        }

        const signupData: SignupFormValues = JSON.parse(signupDataStr);
        const actionResult = await completeSignupWithOtpAction(email, result.data, signupData);

        if (actionResult.ok) {
          // Store authentication data
          if (actionResult.token) {
            setAuthToken(actionResult.token);
          }
          if (actionResult.user) {
            setAuthUser(actionResult.user);
          }
          // Clear signup data (it holds the password) from sessionStorage
          sessionStorage.removeItem("signupFormData");

          if (!actionResult.token) {
            setMessage("Email verified! Please log in to continue.");
            setTimeout(() => {
              router.push(routes.login);
            }, 1500);
            return;
          }

          // Create success message with username
          const userName = actionResult.user?.name || `${signupData.firstName} ${signupData.lastName}` || "User";
          setMessage(`${userName} Create Account Successfully! Redirecting...`);

          // Redirect to dashboard
          setTimeout(() => {
            router.push(routes.dashboard);
          }, 1500);
        } else {
          setError(actionResult.message);
        }
      } else if (mode === "reset-password") {
        const actionResult = await verifyPasswordResetOtpAction(email, result.data);

        if (!actionResult.ok) {
          setError(actionResult.message);
          return;
        }

        setMessage("OTP verified successfully! Redirecting to password reset...");
        setTimeout(() => {
          router.push(`/reset-password?email=${encodeURIComponent(email)}`);
        }, 1000);
      } else {
        // Login mode: just verify OTP (for password reset or account recovery)
        const actionResult = await verifyOtpAction(email, result.data);

        if (actionResult.ok) {
          // Store authentication data
          if (actionResult.token) {
            setAuthToken(actionResult.token);
          }
          if (actionResult.user) {
            setAuthUser(actionResult.user);
          }
          setMessage("OTP verified successfully! Redirecting...");
          // Redirect to dashboard
          setTimeout(() => {
            router.push(routes.dashboard);
          }, 1000);
        } else {
          setError(actionResult.message);
        }
      }
    } catch {
      setError("Unable to verify OTP right now. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function resendCode() {
    if (secondsRemaining > 0) {
      return;
    }

    setError("");
    setMessage("");
    setIsResending(true);

    try {
      const actionResult = await resendOtpAction(email);

      if (actionResult.ok) {
        // The old code is invalid now, so clear the boxes for the new one
        setDigits(Array(OTP_LENGTH).fill(""));
        inputRefs.current[0]?.focus();
        setSecondsRemaining(RESEND_COOLDOWN_SECONDS);
        setMessage(RESEND_SUCCESS_MESSAGE);
        window.setTimeout(() => {
          setMessage((current) => (current === RESEND_SUCCESS_MESSAGE ? "" : current));
        }, RESEND_MESSAGE_DURATION_MS);
      } else {
        // Rate limited: start the cooldown again so the button isn't spammed.
        if (actionResult.rateLimited) setSecondsRemaining(RESEND_COOLDOWN_SECONDS);
        setError(actionResult.message);
      }
    } catch {
      setError("Unable to resend OTP right now. Please try again.");
    } finally {
      setIsResending(false);
    }
  }

  return (
    <AuthShell
      image="/images/auth/img_otp.png"
      title={
        <>
          <span className="block">Your little piece of</span>
          <span className="block">
            <span className="font-display text-[1.1em] font-medium italic">Thailand</span>{" "}
            <span>awaits.</span>
          </span>
        </>
      }
      blurb="Explore. Choose. Claim. Make a memory yours."
    >
      <BackLink href={mode === "signup" ? routes.signup : routes.login}>Back to {mode === "signup" ? "Sign Up" : "Login"}</BackLink>
      <h2 className="mt-6 lg:mt-4 text-[24px] font-semibold tracking-[-0.03em] text-navy sm:text-[26px]">
        {mode === "signup" ? "Verify your email" : "Verify your identity"}
      </h2>
      <p className="mt-2 text-[14px] leading-6 text-[#64748b]">
        We&apos;ve sent a 6 digit code to <span className="font-medium text-[#1c1c1c] break-all">{email}</span>. Enter it below to {mode === "signup" ? "complete your account creation" : "continue"}.
      </p>

      <form className="mt-7 lg:mt-5" onSubmit={handleSubmit} noValidate>
        <div className="flex justify-between gap-2" onPaste={handlePaste}>
          {digits.map((digit, index) => (
            <input
              key={index}
              ref={(element) => {
                inputRefs.current[index] = element;
              }}
              aria-label={`Verification digit ${index + 1}`}
              inputMode="numeric"
              autoComplete={index === 0 ? "one-time-code" : "off"}
              maxLength={1}
              type="text"
              value={digit}
              onChange={(event) => updateDigit(index, event.target.value)}
              onKeyDown={(event) => handleKeyDown(index, event)}
              className={`h-12 lg:h-11 min-w-0 flex-1 rounded-[14px] border bg-white text-center text-[18px] font-semibold text-navy shadow-[0_1px_2px_rgba(11,31,77,0.04)] outline-none transition focus:border-navy focus:ring-4 focus:ring-navy/10 ${error ? "border-[#d52b35] focus:ring-[#d52b35]/10" : "border-[#e3e7ef] hover:border-[#cfd6e4]"}`}
            />
          ))}
        </div>

        {error ? <p role="alert" className="mt-4 rounded-[12px] border border-[#f6c9cd] bg-[#fff4f5] px-3.5 py-2.5 text-center text-[13px] text-[#d52b35]">{error}</p> : null}
        {message ? <p role="status" className="mt-4 rounded-[12px] border border-[#c8ecd3] bg-[#f1fbf4] px-3.5 py-2.5 text-center text-[13px] font-medium text-green-700">{message}</p> : null}

        <button type="submit" disabled={isSubmitting} className="mt-5 lg:mt-4 inline-flex h-12 lg:h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-[14px] bg-linear-to-b from-[#12307a] to-navy text-[15px] font-medium text-white shadow-[0_10px_24px_-10px_rgba(11,31,77,0.7)] transition hover:-translate-y-px hover:shadow-[0_14px_28px_-10px_rgba(11,31,77,0.75)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 motion-reduce:transition-none">
          {isSubmitting ? (
            <>
              <span aria-hidden="true" className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white motion-reduce:animate-none" />
              Verifying...
            </>
          ) : (
            "Verify Code"
          )}
        </button>
      </form>

      <p className="mt-7 lg:mt-5 text-center text-[14px] text-[#64748b]">
        Didn&apos;t receive the code? {secondsRemaining > 0 ? (
          <span className="font-semibold text-[#e11d2e]">Resend in {String(Math.floor(secondsRemaining / 60)).padStart(2, "0")}:{String(secondsRemaining % 60).padStart(2, "0")}</span>
        ) : (
          <button type="button" onClick={resendCode} disabled={isResending} className="cursor-pointer font-semibold text-[#e11d2e] hover:underline disabled:cursor-not-allowed disabled:opacity-60">
            {isResending ? "Sending..." : "Resend code"}
          </button>
        )}
      </p>
    </AuthShell>
  );
}

export function OtpPage() {
  return (
    <Suspense fallback={<div className="min-h-[100svh] bg-white" />}>
      <OtpPageContent />
    </Suspense>
  );
}
