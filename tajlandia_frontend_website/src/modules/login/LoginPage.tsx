"use client";

import { useRouter } from "next/navigation";
import React, { useState } from "react";
import Link from "next/link";
import { routes } from "@/lib/constants/routes";
import { ScrollAnimatedElement } from "@/components/animations/ScrollAnimatedElement";
import { setAuthToken, setAuthUser } from "@/lib/api/auth.utils";
import { getRememberedLogin, saveRememberedLogin } from "@/lib/api/remember-me.utils";
import { loginSchema, type LoginFormValues } from "./schemas/login.schema";
import { loginAction } from "./services/login.service";

type LoginErrors = Partial<Record<keyof LoginFormValues, string>>;

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

function AppleIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4 fill-current">
      <path d="M16.7 12.7c0-2 1.6-3 1.7-3.1a3.8 3.8 0 0 0-3-1.6c-1.3-.1-2.5.8-3.1.8-.7 0-1.7-.8-2.8-.8a4.2 4.2 0 0 0-3.5 2.1c-1.5 2.6-.4 6.5 1 8.6.7 1 1.5 2.1 2.6 2.1 1 0 1.4-.6 2.7-.6s1.7.6 2.7.6c1.1 0 1.8-1 2.5-2.1.8-1.2 1.1-2.4 1.1-2.5-.1 0-1.9-.7-1.9-3.5Zm-2.1-6c.6-.7 1-1.7.9-2.7-.9 0-2 .6-2.7 1.3-.6.6-1 1.6-.9 2.6 1 .1 2-.5 2.7-1.2Z" />
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
  const [rememberMe, setRememberMe] = useState(true);
  const [apiError, setApiError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

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
        // Redirect to dashboard
        router.push(routes.dashboard);
      } else {
        setApiError(actionResult.message);
      }
    } catch {
      setApiError("Unable to log in right now. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="flex flex-1 items-center bg-white px-4 py-8 sm:px-8 lg:px-10 lg:py-10">
      <div className="mx-auto grid w-full max-w-[1080px] overflow-hidden rounded-[1.75rem] bg-white shadow-[0_18px_55px_rgba(11,31,77,0.06)] lg:min-h-[660px] lg:grid-cols-[1.02fr_1fr] lg:shadow-none">
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

        <div className="flex items-center px-4 py-12 sm:px-12 lg:px-[76px] lg:py-16">
          <ScrollAnimatedElement animation="slide-in-right" duration={600} className="w-full max-w-[410px] lg:mx-auto">
            <Link href="/" className="mb-4 inline-flex text-[12px] font-medium text-muted transition hover:text-navy">
              ← Back to Home
            </Link>
            <h2 className="text-[27px] font-semibold tracking-[-0.03em] text-navy">Welcome back</h2>
            <p className="mt-2 text-[12px] text-muted">Sign in to continue your Tajlandia journey.</p>

            <form className="mt-9" noValidate onSubmit={handleSubmit}>
              <div>
                <label htmlFor="login-email" className="text-[12px] font-medium text-foreground">Email</label>
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
                  className="mt-2 h-10 w-full rounded-[9px] border border-[#e5e7eb] px-3 text-[12px] text-foreground outline-none transition placeholder:text-[#c6c7ca] focus:border-navy focus:ring-2 focus:ring-navy/10 aria-[invalid=true]:border-[#d52b35]"
                />
                {errors.email ? <p id="login-email-error" className="mt-1.5 text-[11px] text-[#d52b35]">{errors.email}</p> : null}
              </div>

              <div className="mt-5">
                <label htmlFor="login-password" className="text-[12px] font-medium text-foreground">Password</label>
                <div className="relative mt-2">
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
                    className="h-10 w-full rounded-[9px] border border-[#e5e7eb] px-3 pr-10 text-[12px] text-foreground outline-none focus:outline-none focus-visible:outline-none transition placeholder:text-[#c6c7ca] focus:border-navy focus:ring-2 focus:ring-navy/10 aria-[invalid=true]:border-[#d52b35]"
                  />
                  <button
                    type="button"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => setShowPassword((current) => !current)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-sm text-[#b7b8bb] outline-none focus:outline-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9aaabd] focus-visible:ring-offset-1"
                  >
                    <EyeIcon hidden={!showPassword} />
                  </button>
                </div>
                {errors.password ? <p id="login-password-error" className="mt-1.5 text-[11px] text-[#d52b35]">{errors.password}</p> : null}
              </div>

              <div className="mt-4 flex items-center justify-between gap-4 text-[11px]">
                <label className="flex items-center gap-2 text-[#b8b9bd]">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(event) => setRememberMe(event.target.checked)}
                    className="h-3.5 w-3.5 rounded border-[#d7d8da] accent-navy"
                  />
                  Remember me
                </label>
                <Link href="/forgot-password" className="font-medium text-[#d9272e] hover:underline">Forgot password?</Link>
              </div>

              {apiError ? (
                <p role="alert" className="mt-5 text-center text-[12px] text-[#d52b35]">
                  {apiError}
                </p>
              ) : null}
              <button type="submit" disabled={isSubmitting} className="mt-6 h-11 w-full rounded-[9px] bg-navy text-[12px] font-medium text-white shadow-[0_3px_5px_rgba(11,31,77,0.18)] transition hover:bg-navy-deep focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy disabled:cursor-not-allowed disabled:opacity-60">
                {isSubmitting ? "Logging in..." : "Log In"}
              </button>
            </form>

            <div className="my-7 flex items-center gap-3 text-[9px] text-[#c5c6c9]">
              <span className="h-px flex-1 bg-[#ececee]" />
              <span>OR CONTINUE WITH</span>
              <span className="h-px flex-1 bg-[#ececee]" />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button type="button" className="flex h-10 items-center justify-center gap-2 rounded-[9px] bg-[#f8f8f8] text-[11px] text-foreground transition hover:bg-[#f1f1f1] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy">
                <AppleIcon /> Continue with Apple
              </button>
              <button type="button" className="flex h-10 items-center justify-center gap-2 rounded-[9px] bg-[#f8f8f8] text-[11px] text-foreground transition hover:bg-[#f1f1f1] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy">
                <GoogleIcon /> Continue with Google
              </button>
            </div>

            <p className="mt-8 text-center text-[11px] text-foreground">
              Don&apos;t have an account? <a href="/signup" className="font-medium text-[#d9272e] hover:underline">Create Account</a>
            </p>
          </ScrollAnimatedElement>
        </div>
      </div>
    </section>
  );
}
