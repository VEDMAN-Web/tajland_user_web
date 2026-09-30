"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import React, { Suspense, useEffect, useRef, useState, type ClipboardEvent, type KeyboardEvent } from "react";
import { routes } from "@/lib/constants/routes";
import { ScrollAnimatedElement } from "@/components/animations/ScrollAnimatedElement";
import { setAuthToken, setAuthUser } from "@/lib/api/auth.utils";
import { otpSchema } from "./schemas/otp.schema";
import type { SignupFormValues } from "@/modules/signup/schemas/signup.schema";
import { verifyOtpAction, resendOtpAction, completeSignupWithOtpAction } from "./services/otp.service";
import { verifyPasswordResetOtpAction } from "@/modules/reset-password/services/reset-password.service";

const OTP_LENGTH = 6;

function OtpPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") ?? "your email address";
  const mode = searchParams.get("mode") ?? "login"; // "login" or "signup"
  const [digits, setDigits] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [secondsRemaining, setSecondsRemaining] = useState(30);
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
        // Signup mode: verify OTP and create account
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
          // Clear signup data from sessionStorage
          sessionStorage.removeItem("signupFormData");

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
        setSecondsRemaining(30);
        setMessage("A new code has been sent to your email.");
      } else {
        setError(actionResult.message);
      }
    } catch {
      setError("Unable to resend OTP right now. Please try again.");
    } finally {
      setIsResending(false);
    }
  }

  return (
    <section className="flex flex-1 items-center bg-white px-4 py-8 sm:px-8 lg:px-12 lg:py-10">
      <div className="mx-auto grid w-full max-w-[1080px] items-stretch gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:gap-14">
        <div className="relative min-h-[420px] overflow-hidden rounded-[28px] bg-[#0b1f4d] text-white sm:min-h-[560px] lg:min-h-[680px]">
          <Image
            src="/images/auth/img_otp.png"
            alt=""
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 540px"
            className="object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-transparent" />
          <div className="relative z-10 px-7 py-8 [text-shadow:0_1px_10px_rgba(0,0,0,0.35)] sm:px-8 sm:py-9">
            <h1 className="text-[26px] font-semibold leading-[1.15] tracking-[-0.03em] text-white sm:text-[30px]">
              <span className="block">Your little piece of</span>
              <span className="mt-1 block">
                <span className="font-display text-[1.08em] font-medium italic">Thailand</span>
                <span className="ml-1.5">awaits.</span>
              </span>
            </h1>
            <p className="mt-3 text-[13px] font-normal leading-5 text-white sm:text-[14px]">
              Explore. Choose. Claim. Make a memory yours.
            </p>
          </div>
        </div>

        <div className="flex min-h-[640px] flex-col px-1 py-2 sm:px-4">
          <ScrollAnimatedElement animation="slide-in-right" duration={600} className="mx-auto flex w-full max-w-[420px] flex-1 flex-col">
            <Link href={mode === "signup" ? routes.signup : routes.login} className="text-[13px] text-[#6b7280] hover:text-navy hover:underline">
              ← Back to {mode === "signup" ? "Sign Up" : "Login"}
            </Link>
            <h2 className="mt-8 text-[28px] font-semibold tracking-[-0.03em] text-navy sm:text-[30px]">
              {mode === "signup" ? "Verify your email" : "Verify your identity"}
            </h2>
            <p className="mt-2 text-[14px] leading-6 text-[#8b939e]">
              We&apos;ve sent a 6 digit code to {email}. Enter it below to {mode === "signup" ? "complete your account creation" : "continue"}.
            </p>
            {mode === "signup" && (
              <p className="mt-2 text-[10px] leading-4 text-gray-500">
                <strong>Testing:</strong> Use code <span className="font-mono font-bold">123456</span>
              </p>
            )}

            <form className="mt-7" onSubmit={handleSubmit} noValidate>
              <div className="flex justify-between gap-2" onPaste={handlePaste}>
                {digits.map((digit, index) => (
                  <input
                    key={index}
                    ref={(element) => {
                      inputRefs.current[index] = element;
                    }}
                    aria-label={`Verification digit ${index + 1}`}
                    inputMode="numeric"
                    maxLength={1}
                    type="text"
                    value={digit}
                    onChange={(event) => updateDigit(index, event.target.value)}
                    onKeyDown={(event) => handleKeyDown(index, event)}
                    className={`h-12 w-12 rounded-[12px] border text-center text-[18px] font-medium text-navy outline-none transition ${error ? "border-[#d52b35]" : "border-[#d7dce3] focus:border-navy focus:ring-2 focus:ring-navy/10"}`}
                  />
                ))}
              </div>

              {error ? <p role="alert" className="mt-3 text-center text-[11px] text-[#d52b35]">{error}</p> : null}
              {message ? <p role="status" className="mt-3 text-center text-[11px] text-green-600">{message}</p> : null}

              <button type="submit" disabled={isSubmitting} className="mt-5 h-12 w-full cursor-pointer rounded-[12px] bg-navy text-[15px] font-medium text-white transition hover:bg-navy-deep focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy disabled:cursor-not-allowed disabled:opacity-60">
                {isSubmitting ? "Verifying..." : "Verify Code"}
              </button>
            </form>

            <p className="mt-6 text-center text-[14px] text-[#1c1c1c]">
              Didn&apos;t receive the code? {secondsRemaining > 0 ? (
                <span className="font-medium text-[#e11d2e]">Resend in 00:{String(secondsRemaining).padStart(2, "0")}</span>
              ) : (
                <button type="button" onClick={resendCode} disabled={isResending} className="cursor-pointer font-medium text-[#e11d2e] hover:underline disabled:cursor-not-allowed disabled:opacity-60">
                  {isResending ? "Sending..." : "Resend code"}
                </button>
              )}
            </p>

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

export function OtpPage() {
  return (
    <Suspense fallback={<div className="min-h-[100svh] bg-white" />}>
      <OtpPageContent />
    </Suspense>
  );
}
