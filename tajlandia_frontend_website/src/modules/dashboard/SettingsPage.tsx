"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { routes } from "@/lib/constants/routes";
import { useAuth } from "@/lib/hooks/useAuth";
import { getDashboardSettings, saveDashboardSettings, type DashboardSettings } from "@/lib/settings/settings";
import { useDashboardLanguage } from "./DashboardLanguageContext";
import { PageLoader } from "@/components/ui/PageLoader";

type LanguageOption = {
  value: DashboardSettings["language"];
  label: string;
  flag: string;
  nativeName: string;
  detail: string;
};

const languageOptions: readonly LanguageOption[] = [
  {
    value: "EN",
    label: "English",
    nativeName: "Global Cadastral Default",
    flag: "/images/dashboard/en-flag.svg",
    detail: "Global standard for official land deeds, dossier, and maps",
  },
  {
    value: "PL",
    label: "Polish",
    nativeName: "Język Polski",
    flag: "/images/dashboard/pl-flag.svg",
    detail: "Pełny interfejs, powiadomienia i dokumenty własności",
  },
  {
    value: "TH",
    label: "Thai",
    nativeName: "ภาษาไทย",
    flag: "/images/dashboard/th-flag.png",
    detail: "ภาษาไทยสำหรับแปลงที่ดิน หนังสือรับรอง และแผนที่แคดาสตรัล",
  },
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
  const [isLangOpen, setIsLangOpen] = useState(false);
  const [savedToast, setSavedToast] = useState(false);
  const langDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const draft = readDraft();
    setSettings(draft);
    setSavedSnapshot(draft);
  }, []);

  // Close dropdown on outside click or Escape key
  useEffect(() => {
    if (!isLangOpen) return;
    function handlePointer(event: MouseEvent) {
      if (!langDropdownRef.current?.contains(event.target as Node)) {
        setIsLangOpen(false);
      }
    }
    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape") setIsLangOpen(false);
    }
    document.addEventListener("mousedown", handlePointer);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handlePointer);
      document.removeEventListener("keydown", handleKey);
    };
  }, [isLangOpen]);

  // Auto-hide saved notification toast
  useEffect(() => {
    if (!savedToast) return;
    const timer = setTimeout(() => setSavedToast(false), 3000);
    return () => clearTimeout(timer);
  }, [savedToast]);

  if (isLoading) {
    return <PageLoader label={t("Loading settings...")} />;
  }

  if (!isAuthenticated) {
    router.replace(routes.login);
    return null;
  }

  const hasUnsavedChanges =
    settings.language !== savedSnapshot.language ||
    settings.emailNotifications !== savedSnapshot.emailNotifications;

  const currentOption =
    languageOptions.find((opt) => opt.value === settings.language) ?? languageOptions[0]!;

  function updateSettings(next: Partial<DashboardSettings>) {
    setSettings((current) => ({ ...current, ...next }));
  }

  function save() {
    saveDashboardSettings(settings);
    setLanguage(settings.language);
    setSavedSnapshot(settings);
    setSavedToast(true);
  }

  function cancel() {
    setSettings(savedSnapshot);
    setIsLangOpen(false);
  }

  return (
    <div className="min-h-[100svh] bg-[#f7f9fc] text-navy">
      <main className="w-full px-5 pb-14 pt-6 sm:px-8 lg:p-0 lg:[&>section]:mx-0 lg:[&>section]:w-full lg:[&>section]:max-w-[1035px] lg:[&>section]:px-10 lg:[&>section]:py-8">
        <section className="min-w-0">
          {/* Header */}
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="font-manrope text-[28px] font-semibold leading-none tracking-[-0.03em] text-navy sm:text-[32px]">
                {t("Settings")}
              </h1>
              <p className="font-manrope mt-2 text-[14px] leading-5 text-[#8b939e]">
                {t("Update your account preferences and security details.")}
              </p>
            </div>
            {savedToast ? (
              <div className="flex items-center gap-2 rounded-full bg-[#eefbf4] px-4 py-2 font-manrope text-[13px] font-medium text-[#16a34a] shadow-sm animate-in fade-in slide-in-from-top-2 duration-200">
                <CheckCircleIcon />
                <span>{t("Changes saved successfully!")}</span>
              </div>
            ) : null}
          </div>

          {/* Main Card */}
          <div className="mt-6 rounded-[20px] border border-[#eef1f4] bg-white p-6 shadow-[0_8px_28px_rgba(11,31,77,0.05)] sm:p-7">
            {/* Section Header */}
            <div className="flex items-center gap-3.5 border-b border-[#eef1f4] pb-5">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[12px] bg-[#edf3ff] text-navy">
                <ShieldKeyIcon />
              </span>
              <div>
                <h2 className="font-manrope text-[16px] font-semibold text-navy">
                  {t("Account Preferences & Language")}
                </h2>
                <p className="font-manrope mt-0.5 text-[13px] leading-4 text-[#8b939e]">
                  {t("Authentication, safeguards & global cadastral localisation")}
                </p>
              </div>
            </div>

            {/* Language Selection */}
            <div className="mt-6">
              <label className="flex items-center gap-2 font-manrope text-[12px] font-semibold uppercase tracking-[0.06em] text-[#6b7785]">
                <GlobeIcon />
                {t("Interface & Change Language")}
              </label>

              {/* Custom Dropdown */}
              <div ref={langDropdownRef} className="relative mt-2.5">
                <button
                  type="button"
                  aria-haspopup="listbox"
                  aria-expanded={isLangOpen}
                  onClick={() => setIsLangOpen((open) => !open)}
                  className={`flex h-13 w-full cursor-pointer items-center justify-between rounded-[12px] border bg-white px-4 text-left transition-all ${
                    isLangOpen
                      ? "border-navy ring-2 ring-navy/15 shadow-sm"
                      : "border-[#e2e8f0] hover:border-navy/40 hover:bg-[#fafbfc]"
                  }`}
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="relative flex h-5 w-7 shrink-0 overflow-hidden rounded-[4px] border border-black/10 shadow-xs">
                      <Image
                        src={currentOption.flag}
                        alt=""
                        width={28}
                        height={20}
                        className="h-full w-full object-cover"
                      />
                    </span>
                    <div className="min-w-0">
                      <span className="block truncate font-manrope text-[14px] font-semibold text-[#1a1a1a]">
                        {t(currentOption.label)}
                      </span>
                      <span className="block truncate font-manrope text-[11px] text-[#8b939e]">
                        {currentOption.nativeName}
                      </span>
                    </div>
                  </div>
                  <ChevronDownIcon isOpen={isLangOpen} />
                </button>

                {/* Dropdown Menu Popover */}
                {isLangOpen ? (
                  <div
                    role="listbox"
                    aria-label={t("Language options")}
                    className="absolute left-0 right-0 top-[calc(100%+8px)] z-30 rounded-[14px] border border-[#e2e8f0] bg-white p-2 shadow-[0_16px_40px_rgba(11,31,77,0.14)] animate-in fade-in zoom-in-95 duration-150"
                  >
                    {languageOptions.map((option) => {
                      const isSelected = option.value === settings.language;
                      return (
                        <button
                          key={option.value}
                          type="button"
                          role="option"
                          aria-selected={isSelected}
                          onClick={() => {
                            updateSettings({ language: option.value });
                            setIsLangOpen(false);
                          }}
                          className={`group flex w-full cursor-pointer items-center justify-between gap-3 rounded-[10px] px-3.5 py-3 text-left transition-colors ${
                            isSelected
                              ? "bg-[#edf3ff] text-navy"
                              : "text-[#2d3748] hover:bg-[#f7f9fc]"
                          }`}
                        >
                          <div className="flex min-w-0 items-center gap-3">
                            <span className="relative flex h-5 w-7 shrink-0 overflow-hidden rounded-[4px] border border-black/10 shadow-xs">
                              <Image
                                src={option.flag}
                                alt=""
                                width={28}
                                height={20}
                                className="h-full w-full object-cover"
                              />
                            </span>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span className={`font-manrope text-[14px] ${isSelected ? "font-semibold text-navy" : "font-medium text-[#1a1a1a]"}`}>
                                  {t(option.label)}
                                </span>
                                <span className="font-manrope text-[11px] font-normal text-[#8b939e]">
                                  ({option.nativeName})
                                </span>
                              </div>
                              <span className="block truncate font-manrope text-[11px] text-[#8b939e]">
                                {t(option.detail)}
                              </span>
                            </div>
                          </div>
                          {isSelected ? (
                            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-navy text-white">
                              <CheckMiniIcon />
                            </span>
                          ) : null}
                        </button>
                      );
                    })}
                  </div>
                ) : null}
              </div>

              <p className="mt-2.5 flex items-center gap-1.5 font-manrope text-[12px] leading-4 text-[#8b939e]">
                <InfoIcon />
                <span>{t("Language applies to land title dossiers, notifications, and cadastral maps.")}</span>
              </p>
            </div>

          </div>

          {/* Footer Controls */}
          <div className="mt-6 flex flex-col gap-4 border-t border-[#e4e9ef] pt-5 sm:flex-row sm:items-center sm:justify-between">
            <p className="font-manrope flex items-center gap-2 text-[12px] leading-4 text-[#8b939e]">
              <Image
                src="/images/profile/ic_privacy.svg"
                alt=""
                width={15}
                height={15}
                className="h-3.5 w-3.5 shrink-0"
              />
              <span>{t("All changes verified under 256-bit Cadastral Escrow protocol.")}</span>
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={cancel}
                disabled={!hasUnsavedChanges}
                className="inline-flex h-11 cursor-pointer items-center justify-center rounded-[12px] border border-[#e4e9ef] bg-white px-5 font-manrope text-[13px] font-semibold text-[#4a5568] shadow-xs transition hover:bg-[#f7f9fc] hover:text-navy disabled:cursor-not-allowed disabled:opacity-40"
              >
                {t("Cancel")}
              </button>
              <button
                type="button"
                onClick={save}
                disabled={!hasUnsavedChanges}
                className="inline-flex h-11 cursor-pointer items-center justify-center gap-2 rounded-[12px] bg-navy px-6 font-manrope text-[13px] font-semibold text-white shadow-[0_4px_14px_rgba(11,31,77,0.16)] transition hover:bg-navy-deep hover:shadow-[0_6px_20px_rgba(11,31,77,0.24)] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <SaveIcon />
                {t("Save Changes")}
              </button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

function ShieldKeyIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <circle cx="12" cy="11" r="2" />
      <path d="M12 13v3" />
    </svg>
  );
}

function GlobeIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20z" />
      <path d="M2 12h20" />
    </svg>
  );
}

function InfoIcon() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true" className="h-3.5 w-3.5 shrink-0 text-[#8b939e]" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="8" cy="8" r="6.5" />
      <path d="M8 7.5v4M8 5.2h.01" />
    </svg>
  );
}

function ChevronDownIcon({ isOpen }: { isOpen: boolean }) {
  return (
    <svg
      viewBox="0 0 16 16"
      aria-hidden="true"
      className={`h-4 w-4 text-[#8b939e] transition-transform duration-200 ${isOpen ? "rotate-180 text-navy" : ""}`}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m4 6 4 4 4-4" />
    </svg>
  );
}

function CheckMiniIcon() {
  return (
    <svg viewBox="0 0 12 12" aria-hidden="true" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m2.5 6 2.5 2.5 4.5-5" />
    </svg>
  );
}

function CheckCircleIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true" className="h-4 w-4 shrink-0" fill="currentColor">
      <path fillRule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm3.857-9.809a.75.75 0 0 0-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 1 0-1.06 1.061l2.5 2.5a.75.75 0 0 0 1.137-.089l4-5.5Z" clipRule="evenodd" />
    </svg>
  );
}

function SaveIcon() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12.5 14H3.5A1.5 1.5 0 0 1 2 12.5v-9A1.5 1.5 0 0 1 3.5 2h6.5l3.5 3.5v7A1.5 1.5 0 0 1 12.5 14Z" />
      <path d="M10.5 14V9.5h-5V14M5 2v3.5h4" />
    </svg>
  );
}
