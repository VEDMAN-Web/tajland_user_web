"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { BrandLogo } from "@/components/ui/BrandLogo";
import { routes } from "@/lib/constants/routes";
import { useDashboardLanguage } from "./DashboardLanguageContext";

type DashboardNavbarProps = {
  active: "home" | "explore" | "my-land" | "none";
  overlay?: boolean;
};

const controlHeight = "h-11";
const controlShadow = "shadow-[0_6px_20px_rgba(11,31,77,0.08)]";

function Icon({
  children,
  active = false,
  badge,
}: {
  children: React.ReactNode;
  active?: boolean;
  badge?: number;
}) {
  return (
    <span
      className={`relative box-border flex ${controlHeight} w-11 items-center justify-center rounded-full ${controlShadow} ${active ? "bg-navy" : "bg-white"}`}
    >
      {children}
      {badge && badge > 0 ? (
        <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#e11d2e] px-1 font-manrope text-[10px] font-semibold leading-none text-white">
          {badge}
        </span>
      ) : null}
    </span>
  );
}

function useCartCount() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("tajlandia_cart");
      if (stored === null) {
        setCount(4);
        return;
      }
      const parsed: unknown = JSON.parse(stored);
      setCount(Array.isArray(parsed) ? parsed.length : 0);
    } catch {
      setCount(0);
    }
  }, []);

  return count;
}

export function DashboardNavbar({ active, overlay = false }: DashboardNavbarProps) {
  const pathname = usePathname();
  const { language, setLanguage, t } = useDashboardLanguage();
  const [isLanguageOpen, setIsLanguageOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const cartCount = useCartCount();
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
      className={`relative ${navClass} ${overlay ? "bg-transparent" : "bg-[#f7f9fc]"}`}
    >
      <div className="mx-auto flex h-16 w-full max-w-[1180px] items-center justify-between px-5 sm:px-8">
        <BrandLogo compact href={routes.dashboard} />
        <div className="flex items-center gap-3">
          <nav className={`hidden ${controlHeight} items-center gap-0.5 rounded-full bg-white p-1 ${controlShadow} lg:flex`}>
            <Link
              href={routes.dashboard}
              className={`inline-flex h-9 items-center rounded-full px-4 font-manrope text-[14px] font-medium leading-none ${isHomeActive ? activeClass : "text-navy"}`}
            >
              {t("Home")}
            </Link>
            <Link
              href="/dashboard/explore"
              className={`inline-flex h-9 items-center rounded-full px-4 font-manrope text-[14px] font-medium leading-none ${active === "explore" ? activeClass : "text-navy"}`}
            >
              {t("Explore Map")}
            </Link>
            <Link
              href={routes.land}
              className={`inline-flex h-9 items-center rounded-full px-4 font-manrope text-[14px] font-medium leading-none ${active === "my-land" ? activeClass : "text-navy"}`}
            >
              {t("My Land")}
            </Link>
          </nav>
          <button
            type="button"
            aria-label="Open dashboard menu"
            aria-expanded={isMobileMenuOpen}
            onClick={() => setIsMobileMenuOpen((open) => !open)}
            className={`flex ${controlHeight} w-11 flex-col items-center justify-center gap-1.5 rounded-full bg-white ${controlShadow} lg:hidden`}
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
                className={`flex ${controlHeight} items-center gap-2 rounded-full bg-white px-3.5 font-manrope text-[14px] font-medium leading-none text-navy ${controlShadow}`}
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
                  className="h-3.5 w-5 rounded-[2px] object-cover"
                />
                <span>{language}</span>
                <svg viewBox="0 0 12 12" aria-hidden="true" className="h-2.5 w-2.5">
                  <path d="M2.5 4.25 6 7.75l3.5-3.5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              {isLanguageOpen ? (
                <div className="absolute right-0 top-12 z-20 w-40 rounded-xl bg-white p-1 text-[12px] shadow-[0_8px_24px_rgba(11,31,77,0.14)]">
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
            <Link href={routes.cart} aria-label={cartCount > 0 ? `Cart, ${cartCount} items` : "Cart"} className="inline-flex">
              <Icon active={isCartActive} badge={cartCount}>
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
            <Link href={routes.profile} aria-label="Profile" className="inline-flex">
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
