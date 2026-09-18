"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { AccountMenu } from "./AccountMenu";
import { DashboardNavbar } from "./DashboardNavbar";
import { useAuth } from "@/lib/hooks/useAuth";
import { routes } from "@/lib/constants/routes";
import { strongPasswordSchema } from "@/lib/validation/password";

type PasswordValues = { currentPassword: string; newPassword: string; confirmPassword: string };

function getPasswordStrength(password: string) {
  const checks = [password.length >= 8, /[A-Z]/.test(password), /[a-z]/.test(password), /\d/.test(password), /[^A-Za-z0-9]/.test(password)];
  const score = checks.filter(Boolean).length;

  if (score === checks.length) return { label: "Strong", color: "#08a878", level: 3 };
  if (score >= 2) return { label: "Average", color: "#d39e00", level: 2 };
  return { label: "Weak", color: "#dc3545", level: 1 };
}

export function ChangePasswordPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();
  const [values, setValues] = useState<PasswordValues>({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [visible, setVisible] = useState({ current: false, next: false, confirm: false });
  const [message, setMessage] = useState("");
  const [showErrorPopup, setShowErrorPopup] = useState(false);
  const strength = getPasswordStrength(values.newPassword);

  if (isLoading) return <main className="flex min-h-[100svh] items-center justify-center bg-[#f7fafc] text-sm text-muted">Loading...</main>;
  if (!isAuthenticated) { router.replace(routes.login); return null; }

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    if (!values.currentPassword || !values.newPassword || !values.confirmPassword) { setMessage("Please complete all password fields."); return; }
    const parsed = z.object({ newPassword: strongPasswordSchema, confirmPassword: z.string().min(1, "Confirm password is required") }).superRefine((data, context) => { if (data.newPassword !== data.confirmPassword) context.addIssue({ code: "custom", path: ["confirmPassword"], message: "Passwords do not match" }); }).safeParse({ newPassword: values.newPassword, confirmPassword: values.confirmPassword });
    if (!parsed.success) { setMessage(parsed.error.issues[0]?.message ?? "Please check the new password."); return; }
    // The backend currently exposes reset-password only; never claim a client-only password change succeeded.
    setMessage("Password change is unavailable because the backend does not provide an authenticated password-change endpoint.");
    setShowErrorPopup(true);
  }

  return <div className="min-h-[100svh] bg-[#f7fafc] text-navy">
    <DashboardNavbar active="home" />
    <main className="mx-auto grid w-[92%] max-w-none gap-8 px-5 pb-12 pt-10 sm:px-8 lg:grid-cols-[256px_minmax(0,1fr)] lg:gap-7 lg:pt-14">
      <AccountMenu active="password" />
      <section className="min-w-0">
        <div className="border-b border-[#e1e8ed] pb-4"><h1 className="text-[30px] font-semibold tracking-[-0.04em] text-navy sm:text-[32px]">Change Password</h1><p className="mt-1 text-[12px] text-[#7b858f]">Update your password to keep your account secure.</p></div>
        <form onSubmit={submit} className="mt-5 rounded-[15px] bg-white p-5 shadow-[0_5px_24px_rgba(11,31,77,0.08)] sm:p-6">
          <div className="space-y-4">
            <PasswordField label="Current Password" value={values.currentPassword} visible={visible.current} autoComplete="current-password" onToggle={() => setVisible((current) => ({ ...current, current: !current }))} onChange={(value) => setValues((current) => ({ ...current, currentPassword: value }))} />
            <div><PasswordField label="New Password" value={values.newPassword} visible={visible.next} autoComplete="new-password" onToggle={() => setVisible((current) => ({ ...current, next: !current }))} onChange={(value) => { setMessage(""); setValues((current) => ({ ...current, newPassword: value })); }} />{values.newPassword ? <div className="mt-2 flex items-center gap-1" aria-live="polite"><div className="flex flex-1 gap-1">{[1, 2, 3].map((bar) => <span key={bar} className="h-[3px] flex-1 rounded-full transition-colors" style={{ backgroundColor: bar <= strength.level ? strength.color : "#dfe6eb" }} />)}</div><span className="ml-1 min-w-[42px] text-right text-[10px]" style={{ color: strength.color }}>{strength.label}</span></div> : null}</div>
            <PasswordField label="Confirm Password" value={values.confirmPassword} visible={visible.confirm} autoComplete="new-password" onToggle={() => setVisible((current) => ({ ...current, confirm: !current }))} onChange={(value) => setValues((current) => ({ ...current, confirmPassword: value }))} />
          </div>
          {message ? <p role="alert" className="mt-4 text-[12px] text-[#b42318]">{message}</p> : null}
          <div className="mt-6 flex justify-end gap-3"><button type="button" onClick={() => router.replace(routes.editProfile)} className="rounded-[9px] border border-[#e1e5e9] bg-white px-6 py-3 text-[12px] text-[#68727c]">Cancel</button><button type="submit" className="rounded-[9px] bg-navy px-6 py-3 text-[12px] font-medium text-white">Change Password</button></div>
        </form>
      </section>
    </main>
    {showErrorPopup ? <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#071536]/35 px-4"><div role="dialog" aria-modal="true" aria-labelledby="password-error-title" className="relative w-full max-w-[350px] rounded-[14px] bg-white px-6 py-7 text-center shadow-[0_18px_55px_rgba(11,31,77,0.2)]"><button type="button" aria-label="Close" onClick={() => setShowErrorPopup(false)} className="absolute right-4 top-3 text-[18px] text-[#b2b7bd]">×</button><div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#fff0f0] text-[25px] text-[#d7193f]">!</div><h2 id="password-error-title" className="mt-4 text-[18px] font-semibold text-[#151515]">Something went wrong.</h2><p className="mt-2 text-[11px] text-[#7b858f]">We couldn&apos;t update your password. Your credentials remain unchanged.</p><button type="button" onClick={() => setShowErrorPopup(false)} className="mt-5 h-10 w-full rounded-[8px] bg-navy text-[12px] font-medium text-white">Try again</button></div></div> : null}
  </div>;
}

function PasswordField({ label, value, visible, autoComplete, onToggle, onChange }: { label: string; value: string; visible: boolean; autoComplete: string; onToggle: () => void; onChange: (value: string) => void }) {
  return <label className="block text-[11px] text-[#242b32]"><span>{label}</span><span className="mt-1.5 flex h-10 items-center rounded-[10px] border border-[#e3e8ed] px-3 transition-colors focus-within:border-[#9aaabd] focus-within:ring-1 focus-within:ring-[#d9e1e8]"><input type={visible ? "text" : "password"} value={value} onChange={(event) => onChange(event.target.value)} className="min-w-0 flex-1 bg-transparent text-[12px] text-[#242b32] outline-none focus:outline-none focus-visible:outline-none" autoComplete={autoComplete} /><button type="button" aria-label={visible ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`} onMouseDown={(event) => event.preventDefault()} onClick={onToggle} className="rounded-sm text-[11px] text-[#81909d] outline-none focus-visible:ring-2 focus-visible:ring-[#9aaabd] focus-visible:ring-offset-1">{visible ? "Hide" : "Show"}</button></span></label>;
}
