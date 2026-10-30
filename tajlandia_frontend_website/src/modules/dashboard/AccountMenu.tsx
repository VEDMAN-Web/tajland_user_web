"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { clearAuth } from "@/lib/api/auth.utils";
import { routes } from "@/lib/constants/routes";
import { useDashboardLanguage } from "./DashboardLanguageContext";
import { logoutFromApi } from "./services/logout.client";

function MenuIcon({ src, active = false }: { src: string; active?: boolean }) {
  return (
    <span aria-hidden="true" className="flex h-5 w-5 items-center justify-center">
      <Image
        src={src}
        alt=""
        width={20}
        height={20}
        className={active ? "brightness-0 invert" : "h-5 w-5 object-contain"}
      />
    </span>
  );
}

export type AccountKey =
  | "profile"
  | "password"
  | "purchases"
  | "certificates"
  | "settings"
  | "help"
  | "terms"
  | "privacy";

/** A button that opens the "Log Out of Tajlandia?" confirmation and signs the user out. */
export function LogoutButton({
  className,
  children,
  label,
}: {
  className: string;
  children: React.ReactNode;
  label?: string;
}) {
  const router = useRouter();
  const [isLogoutOpen, setIsLogoutOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  async function confirmLogout() {
    if (isLoggingOut) return;

    setIsLoggingOut(true);
    try {
      await logoutFromApi();
    } finally {
      clearAuth();
      router.replace(routes.login);
    }
  }

  return (
    <>
      <button type="button" aria-label={label} onClick={() => setIsLogoutOpen(true)} className={className}>
        {children}
      </button>
      {isLogoutOpen ? (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-[#071536]/35 px-4 backdrop-blur-[6px]"
          role="presentation"
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="logout-title"
            className="relative w-full max-w-[370px] rounded-[14px] bg-white px-7 py-7 text-center shadow-[0_20px_60px_rgba(11,31,77,0.2)]"
          >
            <button
              type="button"
              aria-label="Close logout confirmation"
              onClick={() => setIsLogoutOpen(false)}
              className="absolute right-5 top-4 flex h-6 w-6 items-center justify-center rounded-full text-[20px] leading-none text-[#c5c9ce] hover:text-navy"
            >
              ×
            </button>
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#fff1f1] text-brand-red">
              <svg viewBox="0 0 32 32" aria-hidden="true" className="h-9 w-9">
                <path
                  d="M14 6H8.5A2.5 2.5 0 0 0 6 8.5v15A2.5 2.5 0 0 0 8.5 26H14M19 10l6 6-6 6M11 16h14"
                  fill="none"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2.5"
                />
              </svg>
            </div>
            <h2
              id="logout-title"
              className="mt-6 text-[19px] font-semibold text-[#242b32]"
            >
              Log Out of Tajlandia?
            </h2>
            <p className="mt-1.5 text-[11px] text-[#8b949e]">
              Are you sure you want to logout of your account?
            </p>
            <div className="mt-6 grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setIsLogoutOpen(false)}
                className="h-10 rounded-[9px] border border-[#e3e8ed] bg-white text-[12px] text-[#9aa3ad] hover:bg-[#f7f9fb]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmLogout}
                disabled={isLoggingOut}
                className="h-10 rounded-[9px] bg-[#e51d2a] text-[12px] font-medium text-white shadow-[0_4px_10px_rgba(229,29,42,0.2)] hover:bg-[#cc1520]"
              >
                {isLoggingOut ? "Logging out..." : "Log Out"}
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </>
  );
}

/**
 * `pills`: one row that scrolls sideways above the page (below lg).
 * `sidebar`: the vertical list, rendered inside the dashboard sidebar (lg and up).
 */
export function AccountMenu({
  active,
  variant = "pills",
  onNavigate,
}: {
  active: AccountKey;
  variant?: "pills" | "sidebar";
  onNavigate?: () => void;
}) {
  const { t } = useDashboardLanguage();
  const asideRef = useRef<HTMLElement>(null);
  const items = [
    {
      label: t("Profile"),
      icon: "/images/dashboard/account-menu/profile.png",
      href: routes.profile,
      key: "profile" as const,
    },
    {
      label: t("Change Password"),
      icon: "/images/dashboard/account-menu/change-password.png",
      href: routes.changePassword,
      key: "password" as const,
    },
    {
      label: t("My Purchases"),
      icon: "/images/dashboard/account-menu/purchases.png",
      href: routes.purchases,
      key: "purchases" as const,
    },
    {
      label: t("My Certificates"),
      icon: "/images/dashboard/account-menu/certificates.png",
      href: routes.certificates,
      key: "certificates" as const,
    },
    {
      label: t("Settings"),
      icon: "/images/dashboard/account-menu/settings.png",
      href: routes.settings,
      key: "settings" as const,
    },
    {
      label: t("Help & Support"),
      icon: "/images/dashboard/account-menu/help-support.png",
      href: routes.helpSupport,
      key: "help" as const,
    },
    {
      label: t("Term & Condition"),
      icon: "/images/dashboard/account-menu/terms.png",
      href: routes.dashboardTerms,
      key: "terms" as const,
    },
    {
      label: t("Privacy Policy"),
      icon: "/images/dashboard/account-menu/privacy.png",
      href: routes.dashboardPrivacy,
      key: "privacy" as const,
    },
  ];

  // Below lg the menu is a row that scrolls sideways: bring the current page's pill into view.
  useEffect(() => {
    if (variant !== "pills") return;
    asideRef.current
      ?.querySelector('[aria-current="page"]')
      ?.scrollIntoView({ inline: "center", block: "nearest" });
  }, [active, variant]);

  return (
    <>
      {variant === "sidebar" ? (
        <div className="flex min-h-0 flex-1 flex-col px-3 pb-4 pt-2">
          <nav className="space-y-0.5">
            {items.map((item) => {
              const isActive = item.key === active;
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={onNavigate}
                  aria-current={isActive ? "page" : undefined}
                  className={`flex h-10 items-center gap-3 rounded-[12px] px-3 font-manrope text-[13px] font-medium leading-none ${isActive ? "bg-navy text-white" : "text-[#66717c] hover:bg-[#f4f7fa]"}`}
                >
                  <MenuIcon src={item.icon} active={isActive} />
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <div className="mb-3 mt-auto border-t border-[#e8edf1]" />
          <LogoutButton className="flex h-10 w-full cursor-pointer items-center gap-3 rounded-[12px] px-3 font-manrope text-[13px] font-medium leading-none text-[#e11d2e] hover:bg-[#fff3f4]">
            <MenuIcon src="/images/dashboard/account-menu/logout.png" />
            {t("Logout")}
          </LogoutButton>
        </div>
      ) : (
        // Below lg: one row of pills (scrolls sideways, edge to edge) above the content, so
        // the page itself isn't pushed down. lg and up uses the sidebar instead.
        <aside ref={asideRef} className="flex gap-2 overflow-x-auto px-5 pb-1 pt-5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:px-8 lg:hidden">
          <nav className="contents">
            {items.map((item) => {
              const isActive = item.key === active;
              const className = `flex h-10 shrink-0 items-center gap-2.5 whitespace-nowrap rounded-full border px-3.5 font-manrope text-[13px] font-medium leading-none ${isActive ? "border-navy bg-navy text-white" : "border-[#e6eaf3] bg-white text-[#66717c] hover:bg-[#f4f7fa]"}`;
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  aria-current={isActive ? "page" : undefined}
                  className={className}
                >
                  <MenuIcon src={item.icon} active={isActive} />
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <LogoutButton className="flex h-10 shrink-0 cursor-pointer items-center gap-2.5 whitespace-nowrap rounded-full border border-[#f6c9cd] bg-white px-3.5 font-manrope text-[13px] font-medium leading-none text-[#e11d2e] hover:bg-[#fff3f4]">
            <MenuIcon src="/images/dashboard/account-menu/logout.png" />
            {t("Logout")}
          </LogoutButton>
        </aside>
      )}
    </>
  );
}
