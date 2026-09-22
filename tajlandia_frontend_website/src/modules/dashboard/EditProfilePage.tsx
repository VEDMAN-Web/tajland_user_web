"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { setAuthUser } from "@/lib/api/auth.utils";
import { routes } from "@/lib/constants/routes";
import { useDashboardLanguage } from "./DashboardLanguageContext";
import { useAuth } from "@/lib/hooks/useAuth";
import { AccountMenu } from "./AccountMenu";
import { DashboardNavbar } from "./DashboardNavbar";

type FormValues = { firstName: string; lastName: string; email: string; phone: string };

export function EditProfilePage() {
  const router = useRouter();
  const { isAuthenticated, user, isLoading } = useAuth();
  const { t } = useDashboardLanguage();
  const fileRef = useRef<HTMLInputElement>(null);
  const [values, setValues] = useState<FormValues>({ firstName: "", lastName: "", email: "", phone: "" });
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>();
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    if (!user) return;
    const [firstName = "", ...lastParts] = (user.name ?? "").trim().split(/\s+/);
    // Auth data becomes available after the client-side auth check completes.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setValues({ firstName, lastName: lastParts.join(" "), email: user.email ?? "", phone: user.phone ?? "" });
    setAvatarUrl(user.avatarUrl);
  }, [user]);

  if (isLoading) return <main className="flex min-h-[100svh] items-center justify-center bg-[#f7fafc] text-sm text-muted">{t("Loading profile...")}</main>;
  if (!isAuthenticated) { router.replace(routes.login); return null; }

  function update(field: keyof FormValues, value: string) {
    setError("");
    setValues((current) => ({ ...current, [field]: value }));
  }

  function changePhoto(file: File | undefined) {
    if (!file) return;
    if (!file.type.startsWith("image/")) { setError("Please choose an image file."); return; }
    if (file.size > 5 * 1024 * 1024) { setError("Profile photo must be smaller than 5 MB."); return; }
    const reader = new FileReader();
    reader.onload = () => setAvatarUrl(typeof reader.result === "string" ? reader.result : undefined);
    reader.readAsDataURL(file);
  }

  function discard() {
    const [firstName = "", ...lastParts] = (user?.name ?? "").trim().split(/\s+/);
    setValues({ firstName, lastName: lastParts.join(" "), email: user?.email ?? "", phone: user?.phone ?? "" });
    setAvatarUrl(user?.avatarUrl);
    setAgreed(false);
    setError("");
    router.replace(routes.editProfile);
  }

  function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!values.firstName.trim() || !values.lastName.trim() || !values.email.trim() || !values.phone.trim()) { setError("Please complete all required fields."); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) { setError("Please enter a valid email address."); return; }
    if (!agreed) { setError("You must agree to the Terms of Service and Privacy Policy."); return; }
    setAuthUser({ ...(user ?? {}), name: `${values.firstName.trim()} ${values.lastName.trim()}`, email: values.email.trim(), phone: values.phone.trim(), ...(avatarUrl ? { avatarUrl } : {}) });
    setShowSuccess(true);
  }

  return <div className="min-h-[100svh] bg-[#f7fafc] text-navy"><DashboardNavbar active="none" /><main className="mx-auto grid w-[92%] max-w-none gap-8 px-5 pb-12 pt-10 sm:px-8 lg:grid-cols-[256px_minmax(0,1fr)] lg:gap-7 lg:pt-14"><AccountMenu active="profile" /><section className="min-w-0"><div className="border-b border-[#e1e8ed] pb-4"><h1 className="text-[30px] font-semibold tracking-[-0.04em] text-navy sm:text-[32px]">Edit Profile</h1><p className="mt-1 text-[12px] text-[#7b858f]">Manage your personal information and account.</p></div><div className="mt-5 flex flex-col items-start justify-between gap-4 rounded-[15px] bg-white p-5 shadow-[0_5px_24px_rgba(11,31,77,0.08)] sm:flex-row sm:items-center sm:p-6"><div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-full bg-[#e9eef2]">{avatarUrl ? <img src={avatarUrl} alt="Profile" className="h-full w-full object-cover" /> : <img src="/images/dashboard/profile-placeholder.png" alt="Profile placeholder" className="h-10 w-10 object-contain" />}</div><div className="flex gap-3"><input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(event) => changePhoto(event.target.files?.[0])} /><button type="button" onClick={() => fileRef.current?.click()} className="rounded-[9px] bg-navy px-6 py-3 text-[12px] text-white">{avatarUrl ? "Change Photo" : "Add Photo"}</button><button type="button" onClick={discard} className="rounded-[9px] border border-[#d2d7dc] bg-white px-5 py-3 text-[12px] text-[#68727c]">Discard</button></div></div><form onSubmit={save} className="mt-5 rounded-[15px] bg-white p-5 shadow-[0_5px_24px_rgba(11,31,77,0.08)] sm:p-6"><div className="border-b border-[#e8edf1] pb-3"><h2 className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#68727c]">Personal Information</h2><p className="mt-1 text-[10px] text-[#b0b7be]">Official account information registered on file</p></div><div className="mt-4 grid gap-4 sm:grid-cols-2"><EditField label="First name" value={values.firstName} required onChange={(value) => update("firstName", value)} /><EditField label="Last name" value={values.lastName} required onChange={(value) => update("lastName", value)} /><div className="sm:col-span-2"><EditField label="Email" value={values.email} required type="email" onChange={(value) => update("email", value)} /></div><div className="sm:col-span-2"><EditField label="Mobile Number" value={values.phone} required onChange={(value) => update("phone", value)} /></div></div><label className="mt-4 flex items-start gap-2 text-[11px] text-[#9aa3ad]"><input type="checkbox" checked={agreed} onChange={(event) => { setAgreed(event.target.checked); setError(""); }} className="mt-0.5 accent-[#06245f]" required /> <span>I agree to the <Link href={routes.terms} className="text-brand-red">Terms of Service</Link> and <Link href={routes.privacy} className="text-brand-red">Privacy Policy</Link>.</span></label>{error ? <p role="alert" className="mt-4 text-[12px] text-[#b42318]">{error}</p> : null}<div className="mt-6 flex justify-end gap-3"><Link href={routes.profile} className="rounded-[9px] border border-[#e1e5e9] bg-white px-6 py-3 text-[12px] text-[#68727c]">Cancel</Link><button type="submit" className="rounded-[9px] bg-navy px-7 py-3 text-[12px] font-medium text-white">Save Changes</button></div></form></section></main>{showSuccess ? <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#071536]/35 px-4"><div role="dialog" aria-modal="true" aria-labelledby="profile-success-title" className="relative w-full max-w-[310px] rounded-[14px] bg-white px-6 py-7 text-center shadow-[0_18px_55px_rgba(11,31,77,0.2)]"><button type="button" aria-label="Close" onClick={() => setShowSuccess(false)} className="absolute right-4 top-3 text-[18px] text-[#b2b7bd]">×</button><div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#eafaf2] text-[24px] text-[#008a5a]">♧</div><h2 id="profile-success-title" className="mt-4 text-[16px] font-semibold text-[#151515]">Profile updated successfully.</h2><p className="mt-1 text-[11px] text-[#7b858f]">Your profile has been saved successfully.</p><button type="button" onClick={() => setShowSuccess(false)} className="mt-5 h-10 w-full rounded-[8px] bg-navy text-[12px] font-medium text-white">Okay</button></div></div> : null}</div>;
}

function EditField({ label, value, required, type = "text", onChange }: { label: string; value: string; required?: boolean; type?: string; onChange: (value: string) => void }) {
  return <label className="block text-[11px] text-[#242b32]"><span>{label}{required ? <b className="text-brand-red">*</b> : null}</span><input type={type} value={value} onChange={(event) => onChange(event.target.value)} className="mt-1.5 flex h-10 w-full rounded-[10px] border border-[#e3e8ed] px-3 text-[12px] outline-none focus:border-navy" required={required} /></label>;
}
