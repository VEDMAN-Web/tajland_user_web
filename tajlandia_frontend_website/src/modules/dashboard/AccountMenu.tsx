"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
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

export function AccountMenu({
  active,
}: {
  active:
    | "profile"
    | "password"
    | "purchases"
    | "certificates"
    | "settings"
    | "help"
    | "terms"
    | "privacy";
}) {
  const router = useRouter();
  const { t } = useDashboardLanguage();
  const [isLogoutOpen, setIsLogoutOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
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
      <aside className="h-fit rounded-[15px] bg-white p-5 shadow-[0_5px_24px_rgba(11,31,77,0.08)]">
        <p className="px-1 text-[10px] font-medium uppercase tracking-[0.08em] text-[#7b858f]">
          {t("Account Menu")}
        </p>
        <nav className="mt-4 space-y-1">
          {items.map((item) => {
            const isActive = item.key === active;
            const className = `flex h-10 items-center gap-3 rounded-[9px] px-3 text-[12px] ${isActive ? "bg-navy font-medium text-white" : "text-[#81909d] hover:bg-[#f3f6f8]"}`;
            return (
              <Link key={item.label} href={item.href} className={className}>
                <MenuIcon src={item.icon} active={isActive} />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="my-3 border-t border-[#e8edf1]" />
        <button
          type="button"
          onClick={() => setIsLogoutOpen(true)}
          className="flex h-10 w-full items-center gap-3 rounded-[9px] px-3 text-[12px] text-[#ec2633] hover:bg-[#fff3f4]"
        >
          <MenuIcon src="/images/dashboard/account-menu/logout.png" />
          Logout
        </button>
      </aside>
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
