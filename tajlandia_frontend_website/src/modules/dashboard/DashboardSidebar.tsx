"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { BrandLogo } from "@/components/ui/BrandLogo";
import { brand } from "@/lib/constants/brand";
import { routes } from "@/lib/constants/routes";
import { AccountMenu, LogoutButton, type AccountKey } from "./AccountMenu";
import { useDashboardLanguage } from "./DashboardLanguageContext";

export type NavbarActive = "home" | "explore" | "leaderboard" | "my-land" | "none";

export const LANGUAGE_OPTIONS = [
  { code: "EN", label: "English", flag: "/images/dashboard/en-flag.svg" },
  { code: "PL", label: "Polish", flag: "/images/dashboard/pl-flag.svg" },
  { code: "TH", label: "Thai", flag: "/images/dashboard/th-flag.png" },
] as const;

function NavIcon({ children }: { children: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="h-5 w-5 shrink-0"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {children}
    </svg>
  );
}

const HomeIcon = () => (
  <NavIcon>
    <path d="M3.5 11 12 4l8.5 7M5.5 9.5V20h13V9.5M10 20v-5.5h4V20" />
  </NavIcon>
);
const MapIcon = () => (
  <NavIcon>
    <path d="m9 4-5.5 2v14L9 18l6 2 5.5-2V4L15 6 9 4ZM9 4v14M15 6v14" />
  </NavIcon>
);
const TrophyIcon = () => (
  <NavIcon>
    <path d="M8 4h8v5a4 4 0 0 1-8 0V4ZM8 6H4.5v1.5A3.5 3.5 0 0 0 8 11M16 6h3.5v1.5A3.5 3.5 0 0 1 16 11M12 13v4M8.5 20h7M9.5 17h5" />
  </NavIcon>
);
const LandIcon = () => (
  <NavIcon>
    <path d="m12 3 9 4.5-9 4.5-9-4.5L12 3ZM3 12l9 4.5 9-4.5M3 16.5 12 21l9-4.5" />
  </NavIcon>
);

function ArrowLeftIcon() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true" className="h-4 w-4 shrink-0 transition-transform group-hover:-translate-x-0.5 motion-reduce:transition-none">
      <path d="M13 8H3m4-4L3 8l4 4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function flagOf(code: string) {
  return LANGUAGE_OPTIONS.find((option) => option.code === code)?.flag ?? LANGUAGE_OPTIONS[0].flag;
}

/** The language choice as a dropdown (the top right, at lg and up). */
export function LanguageDropdown() {
  const { language, setLanguage, t } = useDashboardLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  // Open: a click elsewhere or Escape closes it.
  useEffect(() => {
    if (!isOpen) return;
    function handlePointer(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setIsOpen(false);
    }
    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape") setIsOpen(false);
    }
    document.addEventListener("mousedown", handlePointer);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handlePointer);
      document.removeEventListener("keydown", handleKey);
    };
  }, [isOpen]);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-label={t("Language")}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        onClick={() => setIsOpen((open) => !open)}
        className="flex h-11 cursor-pointer items-center gap-2 rounded-full bg-white px-3.5 font-manrope text-[14px] font-medium leading-none text-navy shadow-[0_6px_20px_rgba(11,31,77,0.08)] outline-none transition-shadow hover:shadow-[0_8px_24px_rgba(11,31,77,0.16)] focus-visible:ring-2 focus-visible:ring-navy/40 motion-reduce:transition-none"
      >
        <Image src={flagOf(language)} alt="" width={20} height={14} className="h-3.5 w-5 rounded-[2px] object-cover" />
        <span>{language}</span>
        <svg viewBox="0 0 12 12" aria-hidden="true" className={`h-2.5 w-2.5 transition-transform ${isOpen ? "rotate-180" : ""}`}>
          <path d="M2.5 4.25 6 7.75l3.5-3.5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {isOpen ? (
        <div role="listbox" className="absolute right-0 top-13 z-20 w-40 rounded-xl bg-white p-1 text-[12px] shadow-[0_8px_24px_rgba(11,31,77,0.14)]">
          {LANGUAGE_OPTIONS.map((option) => (
            <button
              key={option.code}
              type="button"
              role="option"
              aria-selected={language === option.code}
              onClick={() => {
                setLanguage(option.code);
                setIsOpen(false);
              }}
              className={`flex w-full cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-left hover:bg-[#f5f7fa] ${language === option.code ? "bg-[#f5f7fa] font-medium" : ""}`}
            >
              <Image src={option.flag} alt="" width={20} height={14} className="h-3.5 w-5 rounded-[2px] object-cover" />
              {option.code} — {option.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

type SidebarContentProps = {
  /** `main`: the dashboard links. `account`: Back + the account menu. */
  mode: "main" | "account";
  active: NavbarActive;
  account: AccountKey | null;
  /** Icons only (Explore Map, where the map needs the room). */
  rail?: boolean;
  /** The mobile drawer draws its own logo row. */
  showLogo?: boolean;
  /** The language choice: in the drawer only. At lg and up it sits at the top right. */
  showLanguage?: boolean;
  onNavigate?: () => void;
  /** Collapses / expands the desktop sidebar; the button shows only when given. */
  onToggleRail?: () => void;
};

function SidebarToggleIcon({ collapsed }: { collapsed: boolean }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3.5" y="4.5" width="17" height="15" rx="3" />
      <path d="M9.5 4.5v15" />
      <path d={collapsed ? "m13.5 9.5 2.5 2.5-2.5 2.5" : "m16 9.5-2.5 2.5 2.5 2.5"} />
    </svg>
  );
}

/**
 * What the dashboard sidebar shows. Shared by the desktop sidebar and the mobile drawer.
 * Clicking Profile switches the route to an account page, so the sidebar turns into the
 * account menu with a Back button on top; Back returns to the normal links.
 */
export function SidebarContent({
  mode,
  active,
  account,
  rail = false,
  showLogo = true,
  showLanguage = false,
  onNavigate,
  onToggleRail,
}: SidebarContentProps) {
  const { language, setLanguage, t } = useDashboardLanguage();

  const links = [
    { href: routes.dashboard, label: t("Home"), isActive: active === "home", icon: <HomeIcon /> },
    { href: routes.dashboardExplore, label: t("Explore Map"), isActive: active === "explore", icon: <MapIcon /> },
    { href: routes.leaderboard, label: t("Leaderboard"), isActive: active === "leaderboard", icon: <TrophyIcon /> },
    { href: routes.land, label: t("My Land"), isActive: active === "my-land", icon: <LandIcon /> },
  ];

  const itemBase =
    "group relative flex h-11 items-center rounded-[12px] font-manrope text-[14px] font-medium leading-none outline-none transition-colors focus-visible:ring-2 focus-visible:ring-navy/40 motion-reduce:transition-none";
  const itemShape = rail ? "justify-center" : "gap-3 px-3";
  // Rail: a label bubble to the right of the icon on hover / focus.
  const tooltip = (text: string) =>
    rail ? (
      <span
        aria-hidden="true"
        className="pointer-events-none absolute left-full top-1/2 z-50 ml-3 -translate-y-1/2 whitespace-nowrap rounded-[8px] bg-navy px-2.5 py-1.5 text-[12px] font-medium text-white opacity-0 shadow-[0_6px_16px_rgba(11,31,77,0.25)] transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100"
      >
        {text}
      </span>
    ) : null;
  const text = (value: string) => (rail ? <span className="sr-only">{value}</span> : <span className="truncate">{value}</span>);

  const toggleLabel = t(rail ? "Expand sidebar" : "Collapse sidebar");
  const toggleButton = onToggleRail ? (
    <button
      type="button"
      onClick={onToggleRail}
      aria-label={toggleLabel}
      aria-expanded={!rail}
      title={toggleLabel}
      className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-[10px] text-[#6b7785] outline-none transition-colors hover:bg-[#f4f7fa] hover:text-navy focus-visible:ring-2 focus-visible:ring-navy/40 motion-reduce:transition-none"
    >
      <SidebarToggleIcon collapsed={rail} />
    </button>
  ) : null;

  return (
    <>
      {showLogo ? (
        rail ? (
          // Rail: logo, with the expand button under it (no room beside it).
          <div className="flex shrink-0 flex-col items-center gap-1 pt-3">
            <Link href={routes.dashboard} aria-label={`${brand.name} home`}>
              <Image src={brand.logo.src} alt="" width={brand.logo.width} height={brand.logo.height} priority className="h-auto w-[52px]" />
            </Link>
            {toggleButton}
          </div>
        ) : (
          <div className="relative flex h-16 shrink-0 items-center justify-center">
            <BrandLogo compact href={routes.dashboard} />
            {onToggleRail ? <div className="absolute right-3 top-1/2 -translate-y-1/2">{toggleButton}</div> : null}
          </div>
        )
      ) : null}

      {mode === "account" && account ? (
        <div className="flex min-h-0 flex-1 flex-col">
          <div className="px-3 pb-3 pt-1">
            <Link
              href={routes.dashboard}
              onClick={onNavigate}
              className="group flex h-11 items-center gap-2.5 rounded-full border border-[#e6e8ef] bg-white py-1 pl-1 pr-4 font-manrope text-[14px] font-medium text-navy shadow-[0_1px_2px_rgba(11,31,77,0.06)] outline-none transition-colors hover:border-navy/25 hover:bg-[#f5f7fb] focus-visible:ring-2 focus-visible:ring-navy/40 motion-reduce:transition-none"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#f1f4f9] transition-colors group-hover:bg-navy group-hover:text-white motion-reduce:transition-none">
                <ArrowLeftIcon />
              </span>
              {t("Back")}
            </Link>
          </div>
          <AccountMenu variant="sidebar" active={account} onNavigate={onNavigate} />
        </div>
      ) : (
        <>
          <nav aria-label={t("Menu")} className="grid gap-1 px-3 pt-2">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={onNavigate}
                aria-current={link.isActive ? "page" : undefined}
                aria-label={rail ? link.label : undefined}
                className={`${itemBase} ${itemShape} ${link.isActive ? "bg-navy text-white" : "text-[#4b5563] hover:bg-[#f4f7fa] hover:text-navy"}`}
              >
                {link.icon}
                {text(link.label)}
                {tooltip(link.label)}
              </Link>
            ))}
          </nav>

          <div className="relative mt-auto border-t border-[#edf0f3] px-3 pb-4 pt-3">
            <Link
              href={routes.profile}
              onClick={onNavigate}
              aria-label={rail ? t("Profile") : undefined}
              className={`${itemBase} ${itemShape} text-[#4b5563] hover:bg-[#f4f7fa] hover:text-navy`}
            >
              <img src="/images/dashboard/navbar/profile-default.png" alt="" className="h-5 w-5 shrink-0 object-contain" />
              {text(t("Profile"))}
              {tooltip(t("Profile"))}
            </Link>

            {/* Stays in the sidebar on every page. */}
            <LogoutButton
              label={rail ? t("Logout") : undefined}
              className={`${itemBase} ${itemShape} mt-1 w-full cursor-pointer text-[#e11d2e] hover:bg-[#fff3f4]`}
            >
              <img src="/images/dashboard/account-menu/logout.png" alt="" className="h-5 w-5 shrink-0 object-contain" />
              {text(t("Logout"))}
              {tooltip(t("Logout"))}
            </LogoutButton>

            {showLanguage ? (
              <div className="mt-3">
                <p className="px-1 font-manrope text-[10px] font-semibold uppercase tracking-[0.08em] text-[#8b949e]">
                  {t("Language")}
                </p>
                <div className="mt-2 grid grid-cols-3 gap-1.5">
                  {LANGUAGE_OPTIONS.map((option) => (
                    <button
                      key={option.code}
                      type="button"
                      aria-pressed={language === option.code}
                      aria-label={option.label}
                      onClick={() => setLanguage(option.code)}
                      className={`flex h-9 cursor-pointer items-center justify-center gap-1.5 rounded-[10px] border font-manrope text-[12px] font-medium ${language === option.code ? "border-navy bg-navy text-white" : "border-[#e3e8ed] text-navy hover:bg-[#f5f7fa]"}`}
                    >
                      <Image src={option.flag} alt="" width={20} height={14} className="h-3 w-[18px] rounded-[2px] object-cover" />
                      {option.code}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </>
      )}
    </>
  );
}

/**
 * lg and up: a fixed full-height sidebar on the left. On Explore Map it shrinks to an
 * icon rail so the map keeps its room. Below lg the navbar's top bar and drawer are used.
 */
export function DashboardSidebar(props: Omit<SidebarContentProps, "showLogo" | "showLanguage">) {
  const { rail = false } = props;
  return (
    <aside
      className={`fixed inset-y-0 left-0 z-40 hidden flex-col border-r border-[#e6eaf3] bg-white transition-[width] duration-300 motion-reduce:transition-none lg:flex ${
        rail ? "w-[76px]" : "w-[220px] overflow-y-auto"
      }`}
    >
      <SidebarContent {...props} />
    </aside>
  );
}
