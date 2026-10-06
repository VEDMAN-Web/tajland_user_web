"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { routes } from "@/lib/constants/routes";
import { useAuth } from "@/lib/hooks/useAuth";
import { getDashboardSettings, saveDashboardSettings, type DashboardSettings } from "@/lib/settings/settings";
import { AccountMenu } from "./AccountMenu";
import { DashboardNavbar } from "./DashboardNavbar";
import { useDashboardLanguage } from "./DashboardLanguageContext";
import { PageLoader } from "@/components/ui/PageLoader";

const languageOptions = [
  { value: "EN", label: "English (Default - Global Cadastral)" },
  { value: "PL", label: "Polish" },
  { value: "TH", label: "Thai" },
] as const;

function readDraft(): DashboardSettings {
  const stored = getDashboardSettings();

  try {
    const savedLanguage = localStorage.getItem("tajlandia_dashboard_language");
    if (savedLanguage === "EN" || savedLanguage === "PL" || savedLanguage === "TH") {
      return { ...stored, language: savedLanguage };
    }
  } catch {
    // Storage can be unavailable during the first server render.
  }

  return stored;
}

export function SettingsPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();
  const { setLanguage, t } = useDashboardLanguage();
  const [settings, setSettings] = useState<DashboardSettings>(() => readDraft());
  const [savedSnapshot, setSavedSnapshot] = useState<DashboardSettings>(() => readDraft());

  useEffect(() => {
    const draft = readDraft();
    // Saved preferences are only available in the browser.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSettings(draft);
    setSavedSnapshot(draft);
  }, []);

  if (isLoading) {
    return <PageLoader label={t("Loading settings...")} />;
  }

  if (!isAuthenticated) {
    router.replace(routes.login);
    return null;
  }

  function updateSettings(next: Partial<DashboardSettings>) {
    setSettings((current) => ({ ...current, ...next }));
  }

  function save() {
    saveDashboardSettings(settings);
    setLanguage(settings.language);
    setSavedSnapshot(settings);
  }

  function cancel() {
    setSettings(savedSnapshot);
  }

  return (
    <div className="min-h-[100svh] bg-[#f7f9fc] text-navy">
      <DashboardNavbar active="home" />
      <main className="mx-auto grid w-full max-w-[1180px] gap-6 px-5 pb-14 pt-8 sm:px-8 lg:grid-cols-[240px_minmax(0,1fr)] lg:items-start lg:gap-7">
        <AccountMenu active="settings" />

        <section className="min-w-0">
          <h1 className="font-manrope text-[28px] font-semibold leading-none tracking-[-0.03em] text-navy sm:text-[32px]">
            {t("Settings")}
          </h1>
          <p className="font-manrope mt-2 text-[14px] leading-5 text-[#8b939e]">
            {t("Update your account preferences and security details.")}
          </p>

          <div className="mt-5 rounded-[16px] bg-white px-5 py-5 shadow-[0_8px_28px_rgba(11,31,77,0.06)] sm:px-6 sm:py-6">
            <div className="border-b border-[#e4e9ef] pb-4">
              <h2 className="font-manrope text-[12px] font-semibold uppercase tracking-[0.08em] text-[#66717c]">
                {t("Account Security")}
              </h2>
              <p className="font-manrope mt-1 text-[12px] leading-4 text-[#8b939e]">
                {t("Authentication & Safeguards")}
              </p>
            </div>

            <div className="mt-5">
              <label htmlFor="settings-language" className="font-manrope text-[11px] font-semibold uppercase tracking-[0.08em] text-[#8b939e]">
                {t("Interface & Change Language")}
              </label>
              <div className="relative mt-2">
                <select
                  id="settings-language"
                  value={settings.language}
                  onChange={(event) => updateSettings({ language: event.target.value as DashboardSettings["language"] })}
                  className="font-manrope h-11 w-full appearance-none rounded-[10px] border border-[#e4e9ef] bg-white px-3.5 pr-10 text-[14px] leading-none text-[#1a1a1a] outline-none transition focus:border-navy"
                >
                  {languageOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {t(option.label)}
                    </option>
                  ))}
                </select>
                <svg viewBox="0 0 16 16" aria-hidden="true" className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#66717c]">
                  <path d="M4 6.2 8 10.2 12 6.2" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <p className="font-manrope mt-2 text-[12px] leading-4 text-[#8b939e]">
                {t("Language applies to land title dossiers, notifications, and cadastral maps.")}
              </p>
            </div>

            <div className="mt-4 flex items-center justify-between gap-4 rounded-[12px] border border-[#e8edf2] bg-[#f7f9fc] px-4 py-3">
              <div className="min-w-0">
                <h3 className="font-manrope text-[14px] font-semibold leading-5 text-[#1a1a1a]">
                  {t("Email notifications")}
                </h3>
                <p className="font-manrope mt-1 text-[12px] leading-4 text-[#8b939e]">
                  {t("You'll receive important account and purchase updates by email.")}
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={settings.emailNotifications}
                aria-label={t("Email notifications")}
                onClick={() => updateSettings({ emailNotifications: !settings.emailNotifications })}
                className={`relative h-6 w-11 shrink-0 overflow-hidden rounded-full p-0.5 transition-colors ${settings.emailNotifications ? "bg-navy" : "bg-[#d5dbe3]"}`}
              >
                <span className={`block h-5 w-5 rounded-full bg-white shadow-[0_1px_3px_rgba(17,24,39,0.18)] transition-transform ${settings.emailNotifications ? "translate-x-5" : "translate-x-0"}`} />
              </button>
            </div>
          </div>

          <div className="mt-5 flex flex-col gap-4 border-t border-[#e4e9ef] pt-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="font-manrope flex items-center gap-2 text-[12px] leading-4 text-[#8b939e]">
              <Image src="/images/profile/ic_privacy.svg" alt="" width={14} height={14} className="h-3.5 w-3.5 shrink-0" />
              <span>{t("All changes verified under 256-bit Cadastral Escrow protocol.")}</span>
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={cancel}
                className="inline-flex h-11 items-center justify-center rounded-[12px] border border-[#e4e9ef] bg-white px-5 font-manrope text-[14px] font-medium leading-none text-[#3d4650] transition hover:bg-[#f7f9fc]"
              >
                {t("Cancel")}
              </button>
              <button
                type="button"
                onClick={save}
                className="inline-flex h-11 items-center justify-center rounded-[12px] bg-navy px-5 font-manrope text-[14px] font-medium leading-none text-white transition hover:bg-navy-deep"
              >
                {t("Save Changes")}
              </button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
