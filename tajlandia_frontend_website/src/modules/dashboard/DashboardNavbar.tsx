"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { BrandLogo } from "@/components/ui/BrandLogo";
import { routes } from "@/lib/constants/routes";
import { useDashboardLanguage } from "./DashboardLanguageContext";

type DashboardNavbarProps = {
  active: "home" | "explore" | "my-land" | "none";
  overlay?: boolean;
};

function Icon({
  children,
  active = false,
}: {
  children: React.ReactNode;
  active?: boolean;
}) {
  return (
    <span
      className={`box-border flex h-9 w-9 items-center justify-center rounded-full p-2 shadow-[0_5px_20px_rgba(11,31,77,0.08)] ${active ? "bg-navy" : "bg-white"}`}
    >
      {children}
    </span>
  );
}

export function DashboardNavbar({ active, overlay = false }: DashboardNavbarProps) {
  const pathname = usePathname();
  const { language, setLanguage, t } = useDashboardLanguage();
  const [isLanguageOpen, setIsLanguageOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const isCartActive = pathname === routes.cart;
  const accountMenuRoutes = [
    routes.profile,
    routes.editProfile,
    routes.changePassword,
    routes.purchases,
    routes.certificates,
    routes.settings,
    routes.helpSupport,
    routes.dashboardTerms,
    routes.dashboardPrivacy,
  ];
  const isProfileActive = accountMenuRoutes.some((route) => pathname === route);
  const isHomeActive = active === "home" && pathname === routes.dashboard;
  const activeClass = "bg-navy text-white";
  const navClass = overlay ? "absolute inset-x-0 top-0 z-20" : "sticky top-0 z-50";

  return (
    <header
      className={`relative ${navClass} ${overlay ? "bg-transparent" : "bg-white"} pt-6`}
    >
      <div className="mx-auto flex h-[54px] w-[92%] max-w-none items-center justify-between px-5 sm:px-8">
        <BrandLogo compact href={routes.dashboard} />
        <div className="flex items-center gap-3">
          <nav className="hidden h-10 items-center gap-1 rounded-full bg-white p-1 shadow-[0_5px_20px_rgba(11,31,77,0.1)] lg:flex">
            <Link
              href={routes.dashboard}
              className={`inline-flex h-8 items-center rounded-full px-4 text-[14px] font-medium ${isHomeActive ? activeClass : "hover:bg-[#f5f7fa]"}`}
              style={{ fontFamily: "var(--font-manrope)" }}
            >
              {t("Home")}
            </Link>
            <Link
              href="/dashboard/explore"
              className={`inline-flex h-8 items-center rounded-full px-4 text-[14px] font-medium ${active === "explore" ? activeClass : "hover:bg-[#f5f7fa]"}`}
              style={{ fontFamily: "var(--font-manrope)" }}
            >
              {t("Explore Map")}
            </Link>
            <Link
              href={routes.land}
              className={`inline-flex h-8 items-center rounded-full px-4 text-[14px] font-medium ${active === "my-land" ? activeClass : "hover:bg-[#f5f7fa]"}`}
              style={{ fontFamily: "var(--font-manrope)" }}
            >
              {t("My Land")}
            </Link>
          </nav>
          <button
            type="button"
            aria-label="Open dashboard menu"
            aria-expanded={isMobileMenuOpen}
            onClick={() => setIsMobileMenuOpen((open) => !open)}
            className="flex h-9 w-9 flex-col items-center justify-center gap-1.5 rounded-full bg-white shadow-[0_5px_20px_rgba(11,31,77,0.08)] lg:hidden"
          >
            <span className="h-0.5 w-4 rounded-full bg-navy" />
            <span className="h-0.5 w-4 rounded-full bg-navy" />
            <span className="h-0.5 w-4 rounded-full bg-navy" />
          </button>
          <div className="flex items-center gap-2">
            <div className="relative hidden lg:block" data-language-selector="true">
              <button
                type="button"
                aria-expanded={isLanguageOpen}
                onClick={() => setIsLanguageOpen((open) => !open)}
                className="flex h-9 min-w-20 items-center justify-center gap-2 rounded-full bg-white px-3 text-[10px] shadow-[0_5px_20px_rgba(11,31,77,0.08)]"
              >
                <Image
                  src={
                    language === "EN"
                      ? "/images/dashboard/en-flag.svg"
                      : language === "PL"
                        ? "/images/dashboard/pl-flag.svg"
                        : "/images/dashboard/th-flag.png"
                  }
                  alt=""
                  width={20}
                  height={14}
                  className="h-[14px] w-5 object-cover"
                />{" "}
                <span
                  className="text-[15px] font-medium"
                  style={{ fontFamily: "'Rethink Sans', sans-serif" }}
                >
                  {language}
                </span>
                <span
                  aria-hidden="true"
                  className="ml-1 inline-block h-2 w-2 -translate-y-0.5 rotate-45 border-b-2 border-r-2 border-navy"
                />
              </button>
              {isLanguageOpen ? (
                <div className="absolute right-0 top-10 z-20 w-40 rounded-xl bg-white p-1 text-[10px] shadow-[0_8px_24px_rgba(11,31,77,0.14)]">
                  <button
                    type="button"
                    onClick={() => {
                      setLanguage("EN");
                      setIsLanguageOpen(false);
                    }}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left hover:bg-[#f5f7fa]"
                  >
                    <Image
                      src="/images/dashboard/en-flag.svg"
                      alt=""
                      width={20}
                      height={14}
                    />{" "}
                    EN — English
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setLanguage("PL");
                      setIsLanguageOpen(false);
                    }}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left hover:bg-[#f5f7fa]"
                  >
                    <Image
                      src="/images/dashboard/pl-flag.svg"
                      alt=""
                      width={20}
                      height={14}
                    />{" "}
                    PL — Polish
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setLanguage("TH");
                      setIsLanguageOpen(false);
                    }}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left hover:bg-[#f5f7fa]"
                  >
                    <Image
                      src="/images/dashboard/th-flag.png"
                      alt=""
                      width={20}
                      height={14}
                      className="h-[14px] w-5 object-cover"
                    />{" "}
                    TH — Thai
                  </button>
                </div>
              ) : null}
            </div>
            <Link href={routes.cart} aria-label="Cart">
              <Icon active={isCartActive}>
                <img
                  src={
                    isCartActive
                      ? "/images/dashboard/navbar/cart-active.png"
                      : "/images/dashboard/navbar/cart-default.png"
                  }
                  alt=""
                  className="h-5 w-5 object-contain"
                />
              </Icon>
            </Link>
            <Link href={routes.profile} aria-label="Profile">
              <Icon active={isProfileActive}>
                <img
                  src={
                    isProfileActive
                      ? "/images/dashboard/navbar/profile-active.png"
                      : "/images/dashboard/navbar/profile-default.png"
                  }
                  alt=""
                  className="h-5 w-5 object-contain"
                />
              </Icon>
            </Link>
          </div>
        </div>
      </div>
      {isMobileMenuOpen ? (
        <div className="absolute inset-x-0 top-full z-30 border-t border-[#edf0f3] bg-white px-5 pb-4 pt-3 shadow-[0_10px_24px_rgba(11,31,77,0.1)] lg:hidden">
          <nav className="grid gap-1">
            <Link
              href={routes.dashboard}
              onClick={() => setIsMobileMenuOpen(false)}
              className={`rounded-[9px] px-3 py-3 text-[13px] ${isHomeActive ? "bg-navy text-white" : "text-navy hover:bg-[#f5f7fa]"}`}
            >
              {t("Home")}
            </Link>
            <Link
              href={routes.dashboardExplore}
              onClick={() => setIsMobileMenuOpen(false)}
              className={`rounded-[9px] px-3 py-3 text-[13px] ${active === "explore" ? "bg-navy text-white" : "text-navy hover:bg-[#f5f7fa]"}`}
            >
              {t("Explore Map")}
            </Link>
            <Link
              href={routes.land}
              onClick={() => setIsMobileMenuOpen(false)}
              className={`rounded-[9px] px-3 py-3 text-[13px] ${active === "my-land" ? "bg-navy text-white" : "text-navy hover:bg-[#f5f7fa]"}`}
            >
              {t("My Land")}
            </Link>
          </nav>
          <div className="mt-3 border-t border-[#edf0f3] pt-3" data-language-selector="true">
            <p className="px-3 text-[10px] font-semibold uppercase tracking-[0.08em] text-[#8b949e]">
              {t("Language")}
            </p>
            <div className="mt-2 grid grid-cols-3 gap-2">
              {(["EN", "PL", "TH"] as const).map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => {
                    setLanguage(option);
                    setIsMobileMenuOpen(false);
                  }}
                  className={`rounded-[9px] border px-2 py-2 text-[11px] ${language === option ? "border-navy bg-navy text-white" : "border-[#e3e8ed] text-navy"}`}
                >
                  {option === "EN" ? "English" : option === "PL" ? "Polish" : "Thai"}
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </header>
  );
}
