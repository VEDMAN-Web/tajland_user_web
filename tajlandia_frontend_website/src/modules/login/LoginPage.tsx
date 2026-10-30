"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import { GoogleLogin, GoogleOAuthProvider, type CredentialResponse } from "@react-oauth/google";
import Link from "next/link";
import { routes } from "@/lib/constants/routes";
import { toSafeInternalRedirect } from "@/lib/security/redirects";
import { ScrollAnimatedElement } from "@/components/animations/ScrollAnimatedElement";
import { setAuthToken, setAuthUser } from "@/lib/api/auth.utils";
import { getRememberedLogin, saveRememberedLogin } from "@/lib/api/remember-me.utils";
import { loginSchema, type LoginFormValues } from "./schemas/login.schema";
import { googleLoginAction, loginAction } from "./services/login.service";
import { BackLink } from "@/components/ui/BackLink";

type LoginErrors = Partial<Record<keyof LoginFormValues, string>>;

// Public OAuth client ID; the client secret lives only on the backend.
const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

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

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4">
      <path fill="#4285F4" d="M21.6 12.2c0-.7-.1-1.4-.2-2H12v3.8h5.4a4.6 4.6 0 0 1-2 3v2.5h3.2c1.9-1.8 3-4.3 3-7.3Z" />
      <path fill="#34A853" d="M12 22c2.7 0 5-.9 6.6-2.5l-3.2-2.5c-.9.6-2 1-3.4 1-2.6 0-4.8-1.8-5.6-4.2H3.1v2.6A10 10 0 0 0 12 22Z" />
      <path fill="#FBBC05" d="M6.4 13.8a6 6 0 0 1 0-3.6V7.6H3.1a10 10 0 0 0 0 8.8l3.3-2.6Z" />
      <path fill="#EA4335" d="M12 6c1.5 0 2.8.5 3.8 1.5l2.8-2.8C17 3 14.7 2 12 2a10 10 0 0 0-8.9 5.6l3.3 2.6C7.2 7.8 9.4 6 12 6Z" />
    </svg>
  );
}

export function LoginPage() {
  const router = useRouter();
  const [values, setValues] = useState<LoginFormValues>({ email: "", password: "" });
  const [errors, setErrors] = useState<LoginErrors>({});
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [apiError, setApiError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Skeleton until the (large) side photo has loaded.
  const [imageLoaded, setImageLoaded] = useState(false);
  // Google renders its own button at a fixed pixel width, so match the grid cell.
  const googleButtonRef = React.useRef<HTMLDivElement>(null);
  const [googleButtonWidth, setGoogleButtonWidth] = useState<number>();

  React.useEffect(() => {
    const element = googleButtonRef.current;
    if (!element) return;
    const observer = new ResizeObserver(() => setGoogleButtonWidth(Math.min(400, Math.round(element.offsetWidth))));
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  React.useEffect(() => {
    const rememberedLogin = getRememberedLogin();
    if (rememberedLogin) {
      setValues((current) => ({ ...current, email: rememberedLogin.email }));
      setRememberMe(rememberedLogin.rememberMe);
    }
  }, []);

  function updateField(field: keyof LoginFormValues, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
    setApiError("");
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const validationResult = loginSchema.safeParse(values);

    if (!validationResult.success) {
      const nextErrors: LoginErrors = {};
      for (const issue of validationResult.error.issues) {
        const field = issue.path[0];
        if ((field === "email" || field === "password") && !nextErrors[field]) {
          nextErrors[field] = issue.message;
        }
      }
      setErrors(nextErrors);
      setApiError("");
      return;
    }

    setErrors({});
    setApiError("");
    setIsSubmitting(true);

    try {
      const actionResult = await loginAction(validationResult.data);

      if (actionResult.ok) {
        saveRememberedLogin(validationResult.data.email, rememberMe);
        // Store authentication data
        if (actionResult.token) {
          setAuthToken(actionResult.token, rememberMe);
        }
        if (actionResult.user) {
          setAuthUser(actionResult.user, rememberMe);
        }
        const nextPath = toSafeInternalRedirect(new URLSearchParams(window.location.search).get("next"));
        router.push(nextPath ?? routes.dashboard);
      } else {
        setApiError(actionResult.message);
      }
    } catch {
      setApiError("Unable to log in right now. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleGoogleSuccess({ credential }: CredentialResponse) {
    if (isSubmitting) return;

    if (!credential) {
      setApiError("Google sign-in failed. Please try again.");
      return;
    }

    setErrors({});
    setApiError("");
    setIsSubmitting(true);

    try {
      const actionResult = await googleLoginAction(credential);

      if (actionResult.ok) {
        // Google Sign-In has no "remember me" checkbox of its own, so always persist
        // the session the way the page's checkbox does when checked (localStorage).
        // Without this, the session landed in sessionStorage and was invisible to new tabs.
        if (actionResult.token) {
          setAuthToken(actionResult.token, true);
        }
        if (actionResult.user) {
          setAuthUser(actionResult.user, true);
        }
        const nextPath = toSafeInternalRedirect(new URLSearchParams(window.location.search).get("next"));
        router.push(nextPath ?? routes.dashboard);
      } else {
        setApiError(actionResult.message);
      }
    } catch {
      setApiError("Unable to sign in with Google right now. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  const fieldClass = "h-12 w-full rounded-[14px] border border-[#e3e7ef] bg-white pl-11 pr-3.5 text-[14px] text-[#1c1c1c] shadow-[0_1px_2px_rgba(11,31,77,0.04)] outline-none transition placeholder:text-[#b4bbc8] hover:border-[#cfd6e4] focus:border-navy focus:ring-4 focus:ring-navy/10 aria-[invalid=true]:border-[#d52b35] aria-[invalid=true]:focus:ring-[#d52b35]/10";
  const iconClass = "pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-[#9aa5b8]";

  return (
    <section className="flex min-h-[100svh] flex-1 flex-col bg-white lg:grid lg:grid-cols-[1.08fr_1fr]">
      <aside className="relative isolate h-[300px] shrink-0 overflow-hidden bg-[#0b1f4d] text-white sm:h-[360px] lg:sticky lg:top-0 lg:h-[100svh]">
        {!imageLoaded ? (
          <span aria-hidden="true" className="absolute inset-0 animate-pulse bg-[#1a2f63] motion-reduce:animate-none" />
        ) : null}
        <Image
          src="/images/auth/img_login.png"
          alt=""
          fill
          priority
          sizes="(max-width: 1024px) 100vw, 55vw"
          onLoad={() => setImageLoaded(true)}
          className={`object-cover object-center transition-opacity duration-700 ${imageLoaded ? "auth-hero-zoom opacity-100" : "opacity-0"}`}
        />
        <div aria-hidden="true" className="absolute inset-0 bg-linear-to-b from-black/35 via-transparent to-[#071536]/85" />
        <div aria-hidden="true" className="absolute inset-0 bg-linear-to-r from-[#071536]/30 to-transparent" />

        <div className="relative z-10 flex h-full flex-col justify-between px-6 pb-12 pt-6 sm:px-10 sm:pt-8 lg:px-14 lg:pb-14 lg:pt-12">
          <span className="inline-flex w-fit items-center gap-2 rounded-full border border-white/25 bg-black/25 px-3.5 py-1.5 text-[11px] font-medium uppercase tracking-[0.16em] text-white/90">
            <span className="h-1.5 w-1.5 rounded-full bg-[#ff4b5c]" />
            Tajlandia
          </span>

          <div>
            <h1 className="text-[30px] font-semibold leading-[1.08] tracking-[-0.035em] text-white [text-shadow:0_2px_20px_rgba(0,0,0,0.35)] sm:text-[40px] lg:text-[54px]">
              <span className="block">Your little piece of</span>
              <span className="block">
                <span className="font-display text-[1.1em] font-medium italic">Thailand</span>{" "}
                <span>awaits.</span>
              </span>
            </h1>
            <p className="mt-4 inline-flex max-w-full rounded-full border border-white/25 bg-black/25 px-4 py-2 text-[12px] leading-5 text-white/95 sm:text-[14px]">
              Explore. Choose. Claim. Make a memory yours.
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

        <ScrollAnimatedElement animation="slide-in-right" duration={600} className="relative mx-auto w-full max-w-[440px]">
          <div className="rounded-[28px] bg-white lg:p-7 lg:shadow-[0_24px_60px_-24px_rgba(11,31,77,0.22)] lg:ring-1 lg:ring-[#e6eaf3]">
            <BackLink href={routes.home}>Back to Home</BackLink>
            <h2 className="mt-6 lg:mt-4 text-[24px] font-semibold tracking-[-0.03em] text-navy sm:text-[26px]">Welcome back</h2>
            <p className="mt-2 text-[14px] leading-6 text-[#64748b]">Sign in to continue your Tajlandia journey.</p>

            <form className="mt-7 lg:mt-5" noValidate onSubmit={handleSubmit}>
              <div>
                <label htmlFor="login-email" className="text-[13px] font-medium text-[#1c1c1c]">Email</label>
                <div className="relative mt-2">
                  <MailIcon className={iconClass} />
                  <input
                    id="login-email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    placeholder="Enter your email"
                    value={values.email}
                    onChange={(event) => updateField("email", event.target.value)}
                    aria-invalid={Boolean(errors.email)}
                    aria-describedby={errors.email ? "login-email-error" : undefined}
                    className={fieldClass}
                  />
                </div>
                {errors.email ? <p id="login-email-error" className="mt-1.5 text-[12px] text-[#d52b35]">{errors.email}</p> : null}
              </div>

              <div className="mt-5 lg:mt-4">
                <label htmlFor="login-password" className="text-[13px] font-medium text-[#1c1c1c]">Password</label>
                <div className="relative mt-2">
                  <LockIcon className={iconClass} />
                  <input
                    id="login-password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    placeholder="Enter your password"
                    value={values.password}
                    onChange={(event) => updateField("password", event.target.value)}
                    aria-invalid={Boolean(errors.password)}
                    aria-describedby={errors.password ? "login-password-error" : undefined}
                    className={`${fieldClass} pr-11`}
                  />
                  <button
                    type="button"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => setShowPassword((current) => !current)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 cursor-pointer rounded-sm text-[#9aa5b8] outline-none transition hover:text-navy focus-visible:ring-2 focus-visible:ring-[#9aaabd]"
                  >
                    <EyeIcon hidden={!showPassword} />
                  </button>
                </div>
                {errors.password ? <p id="login-password-error" className="mt-1.5 text-[12px] text-[#d52b35]">{errors.password}</p> : null}
              </div>

              <div className="mt-4 flex flex-wrap items-center justify-between gap-x-4 gap-y-2 text-[13px]">
                <label className="flex cursor-pointer items-center gap-2 text-[#64748b]">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(event) => setRememberMe(event.target.checked)}
                    className="h-4 w-4 cursor-pointer rounded border-[#d7d8da] accent-navy"
                  />
                  Remember me
                </label>
                <Link href="/forgot-password" className="font-medium text-[#e11d2e] hover:underline">Forgot password?</Link>
              </div>

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
                    Logging in...
                  </>
                ) : (
                  "Log In"
                )}
              </button>
            </form>

            <div className="my-6 lg:my-4 flex items-center gap-3 text-[11px] tracking-[0.1em] text-[#8b95a7]">
              <span className="h-px flex-1 bg-[#e6eaf3]" />
              <span>OR CONTINUE WITH</span>
              <span className="h-px flex-1 bg-[#e6eaf3]" />
            </div>

            <div className="grid grid-cols-1 gap-3">
              {GOOGLE_CLIENT_ID ? (
                // Google's rendered button can't be restyled, so it is kept mounted and
                // genuinely clickable but invisible, layered over a button styled to match.
                // The click still goes through Google's real flow.
                <div
                  ref={googleButtonRef}
                  className={`group relative h-11 overflow-hidden rounded-[14px] ${isSubmitting ? "pointer-events-none opacity-60" : ""}`}
                >
                  <div
                    aria-hidden="true"
                    className="pointer-events-none flex h-11 items-center justify-center gap-2.5 rounded-[14px] border border-[#e3e7ef] bg-white text-[13px] font-medium text-[#1c1c1c] shadow-[0_1px_2px_rgba(11,31,77,0.04)] transition group-hover:border-[#cfd6e4] group-hover:bg-[#f9fafc] group-focus-within:outline-2 group-focus-within:outline-offset-2 group-focus-within:outline-navy"
                  >
                    <GoogleIcon /> Continue with Google
                  </div>
                  {googleButtonWidth ? (
                    <div className="absolute inset-0 flex items-center justify-center opacity-0" aria-busy={isSubmitting}>
                      <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
                        <GoogleLogin
                          onSuccess={handleGoogleSuccess}
                          onError={() => setApiError("Google sign-in failed. Please try again.")}
                          text="continue_with"
                          shape="rectangular"
                          size="large"
                          width={googleButtonWidth}
                        />
                      </GoogleOAuthProvider>
                    </div>
                  ) : null}
                </div>
              ) : (
                <button type="button" className="flex h-11 cursor-pointer items-center justify-center gap-2.5 rounded-[14px] border border-[#e3e7ef] bg-white text-[13px] font-medium text-[#1c1c1c] shadow-[0_1px_2px_rgba(11,31,77,0.04)] transition hover:border-[#cfd6e4] hover:bg-[#f9fafc] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy">
                  <GoogleIcon /> Continue with Google
                </button>
              )}
            </div>

            <p className="mt-7 lg:mt-5 text-center text-[14px] text-[#64748b]">
              Don&apos;t have an account?{" "}
              <Link href="/signup" className="font-semibold text-[#e11d2e] hover:underline">Create Account</Link>
            </p>
          </div>
        </ScrollAnimatedElement>
      </div>
    </section>
  );
}
