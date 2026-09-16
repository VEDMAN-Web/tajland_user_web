"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState, type ClipboardEvent, type FormEvent, type KeyboardEvent } from "react";
import { routes } from "@/lib/constants/routes";
import { otpSchema } from "./schemas/otp.schema";

const OTP_LENGTH = 6;

function OtpPageContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email") ?? "your email address";
  const [digits, setDigits] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [secondsRemaining, setSecondsRemaining] = useState(30);
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
    const nextDigits = [...digits];
    nextDigits[index] = digit;
    setDigits(nextDigits);
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

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const code = digits.join("");
    const result = otpSchema.safeParse(code);

    if (!result.success) {
      setError(result.error.issues[0]?.message ?? "Enter the complete 6-digit code");
      setMessage("");
      return;
    }

    // No OTP API exists yet, so the entered code cannot be verified safely here.
    setError("OTP verification is unavailable until the backend verification service is connected.");
    setMessage("");
  }

  function resendCode() {
    if (secondsRemaining > 0) {
      return;
    }

    setSecondsRemaining(30);
    setError("");
    setMessage("A new code can be requested when the backend service is connected.");
  }

  return (
    <section className="flex flex-1 items-center bg-white px-4 py-8 sm:px-8 lg:px-10 lg:py-10">
      <div className="mx-auto grid w-full max-w-[1030px] overflow-hidden rounded-[1.75rem] bg-white shadow-[0_18px_55px_rgba(11,31,77,0.06)] lg:min-h-[625px] lg:grid-cols-[1.02fr_1fr] lg:shadow-none">
        <div className="relative min-h-[330px] overflow-hidden rounded-[1.75rem] bg-[#071d52] px-8 py-10 text-white sm:px-10 lg:min-h-0 lg:px-9 lg:py-10">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_12%_72%,rgba(212,232,246,0.95)_0%,rgba(125,177,225,0.8)_18%,transparent_43%),radial-gradient(ellipse_at_88%_76%,rgba(255,146,147,0.95)_0%,rgba(241,105,126,0.7)_18%,transparent_43%),linear-gradient(180deg,#061b4d_0%,#0d397e_36%,#5b95d0_67%,#e9bfd1_100%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_100%,rgba(255,255,255,0.24),transparent_42%)] opacity-80" />
          <div className="relative z-10 max-w-[300px]">
            <h1 className="text-[25px] leading-[1.18] tracking-[-0.03em] sm:text-[27px]">
              Your little piece of
              <br />
              <span className="font-display text-[30px] italic leading-none sm:text-[32px]">Thailand</span> awaits.
            </h1>
            <p className="mt-3 text-[13px] leading-5 text-white/80">
              Explore. Choose. Claim. Make a memory yours.
            </p>
          </div>
        </div>

        <div className="flex flex-col px-4 py-12 sm:px-12 lg:px-[74px] lg:py-16">
          <div className="w-full max-w-[380px] lg:mx-auto">
            <Link href={routes.login} className="text-[10px] text-foreground hover:underline">
              ← Back to Login
            </Link>
            <h2 className="mt-9 text-[24px] font-semibold tracking-[-0.03em] text-navy">Verify your identity</h2>
            <p className="mt-2 text-[11px] leading-5 text-muted">
              We&apos;ve sent a 6 digit code to {email}. Enter it below to continue.
            </p>

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
                    className={`h-10 w-10 rounded-[9px] border text-center text-[15px] font-medium text-navy outline-none transition sm:h-11 sm:w-11 ${error ? "border-[#d52b35]" : "border-[#e5e7eb] focus:border-navy focus:ring-2 focus:ring-navy/10"}`}
                  />
                ))}
              </div>

              {error ? <p role="alert" className="mt-3 text-center text-[11px] text-[#d52b35]">{error}</p> : null}
              {message ? <p role="status" className="mt-3 text-center text-[11px] text-green-600">{message}</p> : null}

              <button type="submit" className="mt-5 h-11 w-full rounded-[9px] bg-navy text-[12px] font-medium text-white shadow-[0_3px_5px_rgba(11,31,77,0.18)] transition hover:bg-navy-deep focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy">
                Verify Code
              </button>
            </form>

            <p className="mt-9 text-center text-[11px] text-foreground">
              Didn&apos;t receive the code? {secondsRemaining > 0 ? (
                <span className="text-[#d9272e]">Resend in 00:{String(secondsRemaining).padStart(2, "0")}</span>
              ) : (
                <button type="button" onClick={resendCode} className="text-[#d9272e] hover:underline">Resend code</button>
              )}
            </p>
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

export function OtpPage() {
  return (
    <Suspense fallback={<div className="min-h-[100svh] bg-white" />}>
      <OtpPageContent />
    </Suspense>
  );
}
