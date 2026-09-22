"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AccountMenu } from "./AccountMenu";
import { DashboardNavbar } from "./DashboardNavbar";
import { useAuth } from "@/lib/hooks/useAuth";
import { routes } from "@/lib/constants/routes";
import { getDashboardSettings, saveDashboardSettings, type DashboardSettings } from "@/lib/settings/settings";
import { useDashboardLanguage } from "./DashboardLanguageContext";

export function SettingsPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();
  const { language, setLanguage } = useDashboardLanguage();
  const [settings, setSettings] = useState<DashboardSettings>(() => getDashboardSettings());
  const [saved, setSaved] = useState(false);

  if (isLoading) return <main className="flex min-h-[100svh] items-center justify-center bg-[#f7fafc] text-sm text-muted">Loading settings...</main>;
  if (!isAuthenticated) {
    router.replace(routes.login);
    return null;
  }

  function updateSettings(next: Partial<DashboardSettings>) {
    setSaved(false);
    setSettings((current) => ({ ...current, ...next }));
  }

  function save() {
    saveDashboardSettings(settings);
    setSaved(true);
  }

  function cancel() {
    setSettings(getDashboardSettings());
    setSaved(false);
  }

  return (
    <div className="min-h-[100svh] bg-[#f7fafc] text-navy">
      <DashboardNavbar active="home" />
      <main className="mx-auto grid w-[92%] max-w-none gap-8 px-5 pb-12 pt-10 sm:px-8 lg:grid-cols-[256px_minmax(0,1fr)] lg:gap-7 lg:pt-14">
        <AccountMenu active="settings" />

        <section className="min-w-0">
          <div className="border-b border-[#e1e8ed] pb-4">
            <h1 className="text-[30px] font-semibold tracking-[-0.04em] text-navy sm:text-[32px]">Settings</h1>
            <p className="mt-1 text-[12px] text-[#7b858f]">Update your account preferences and security details.</p>
          </div>

          <div className="mt-5 rounded-[15px] bg-white p-5 shadow-[0_5px_24px_rgba(11,31,77,0.08)] sm:p-6">
            <div className="border-b border-[#e8edf1] pb-3">
              <h2 className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#68727c]">Account Security</h2>
              <p className="mt-1 text-[10px] text-[#b0b7be]">Authentication &amp; Safeguards</p>
            </div>

            <div className="mt-4">
              <label htmlFor="settings-language" className="text-[10px] font-bold uppercase tracking-[0.04em] text-[#9aa3ad]">Interface &amp; Chatbot Language</label>
              <select id="settings-language" value={language} onChange={(event) => { const nextLanguage = event.target.value as DashboardSettings["language"]; setLanguage(nextLanguage); updateSettings({ language: nextLanguage }); }} className="mt-2 h-10 w-full rounded-[10px] border border-[#e3e8ed] bg-white px-3 text-[12px] text-[#242b32] outline-none transition focus:border-[#9aaabd] focus:ring-1 focus:ring-[#d9e1e8]">
                <option value="EN">English (Default - Global Cadastral)</option>
                <option value="PL">Polish</option>
                <option value="TH">Thai</option>
              </select>
              <p className="mt-2 text-[10px] text-[#b0b7be]">Language applies to land title dossiers, notifications, and cadastral maps.</p>
            </div>

            <div className="mt-3 flex items-center justify-between gap-4 rounded-[10px] border border-[#e5eaf0] bg-[#f7f9fb] px-3 py-3">
              <div>
                <h3 className="text-[11px] font-medium text-[#242b32]">Email notifications</h3>
                <p className="mt-1 text-[10px] text-[#8f99a4]">You&apos;ll receive important account and purchase updates by email.</p>
              </div>
              <button type="button" role="switch" aria-checked={settings.emailNotifications} aria-label="Email notifications" onClick={() => updateSettings({ emailNotifications: !settings.emailNotifications })} className={`relative h-6 w-12 shrink-0 rounded-full transition-colors ${settings.emailNotifications ? "bg-navy" : "bg-[#c8d0d8]"}`}>
                <span className={`absolute left-0 top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${settings.emailNotifications ? "translate-x-[26px]" : "translate-x-[2px]"}`} />
              </button>
            </div>
          </div>

          <div className="mt-4 flex flex-col items-start justify-between gap-4 border-t border-[#e1e8ed] pt-4 sm:flex-row sm:items-center">
            <p className="text-[10px] text-[#b0b7be]">● All changes verified under 256-bit Cadastral Escrow protocol.</p>
            <div className="flex gap-3">
              <button type="button" onClick={cancel} className="rounded-[9px] border border-[#e1e5e9] bg-white px-6 py-3 text-[12px] text-[#68727c]">Cancel</button>
              <button type="button" onClick={save} className="rounded-[9px] bg-navy px-7 py-3 text-[12px] font-medium text-white">Save</button>
            </div>
          </div>
          {saved ? <p role="status" className="mt-3 text-right text-[11px] text-[#198b55]">Settings saved.</p> : null}
        </section>
      </main>
    </div>
  );
}
