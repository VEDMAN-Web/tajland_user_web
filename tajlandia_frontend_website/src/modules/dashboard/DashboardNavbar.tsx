"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { BrandLogo } from "@/components/ui/BrandLogo";
import { getStoredToken } from "@/lib/api/auth.utils";
import { isAbortError } from "@/lib/api/browser-client";
import { CART_CHANGED_EVENT } from "@/lib/cart/cart-events";
import { routes } from "@/lib/constants/routes";
import { logError } from "@/lib/logging/logger";
import { useDashboardLanguage } from "./DashboardLanguageContext";
import { getCart } from "./services/cart.client";

type DashboardNavbarProps = {
  active: "home" | "explore" | "leaderboard" | "my-land" | "none";
  overlay?: boolean;
};

const LANGUAGE_OPTIONS = [
  { code: "EN", label: "English", flag: "/images/dashboard/en-flag.svg" },
  { code: "PL", label: "Polish", flag: "/images/dashboard/pl-flag.svg" },
  { code: "TH", label: "Thai", flag: "/images/dashboard/th-flag.png" },
] as const;

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

// Items in the cart (`GET /cart`), reloaded whenever the cart changes elsewhere and
// when the tab comes back into focus (reservations may have expired meanwhile).
function useCartCount() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let controller: AbortController | null = null;

    function load() {
      if (!getStoredToken()) return;
      controller?.abort();
      controller = new AbortController();
      // The badge is secondary: a failure keeps the last count and never logs out.
      getCart({ signal: controller.signal, redirectOnUnauthorized: false })
        .then((cart) => setCount(cart.items.length))
        .catch((error: unknown) => {
          if (!isAbortError(error)) logError(error, "Failed to load cart count");
        });
    }

    load();
    window.addEventListener(CART_CHANGED_EVENT, load);
    window.addEventListener("focus", load);
    return () => {
      controller?.abort();
      window.removeEventListener(CART_CHANGED_EVENT, load);
      window.removeEventListener("focus", load);
    };
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
  // Overlay (Explore Map): above the map's search bar (z-20) and panels (z-30), so
  // the mobile menu and account dropdown open on top of them.
  const navClass = overlay ? "absolute inset-x-0 top-0 z-40" : "sticky top-0 z-50";
  const mobileLinks = [
    { href: routes.dashboard, label: t("Home"), active: isHomeActive },
    { href: routes.dashboardExplore, label: t("Explore Map"), active: active === "explore" },
    { href: routes.leaderboard, label: t("Leaderboard"), active: active === "leaderboard" },
    { href: routes.land, label: t("My Land"), active: active === "my-land" },
  ];

  function closeMobileMenu() {
    setIsMobileMenuOpen(false);
  }

  // Open sidebar: Escape closes it and the page behind doesn't scroll.
  useEffect(() => {
    if (!isMobileMenuOpen) return;
    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape") setIsMobileMenuOpen(false);
    }
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKey);
    return () => {
      document.body.style.overflow = overflow;
      window.removeEventListener("keydown", handleKey);
    };
  }, [isMobileMenuOpen]);

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
              href={routes.leaderboard}
              className={`inline-flex h-9 items-center rounded-full px-4 font-manrope text-[14px] font-medium leading-none ${active === "leaderboard" ? activeClass : "text-navy"}`}
            >
              {t("Leaderboard")}
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
            aria-label={t("Open dashboard menu")}
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
      {/* Phones / tablets: the menu slides in from the right as a sidebar. Kept
          mounted so it can animate out. */}
      <div
        className={`fixed inset-0 z-[60] lg:hidden ${isMobileMenuOpen ? "" : "pointer-events-none"}`}
        aria-hidden={!isMobileMenuOpen}
        inert={!isMobileMenuOpen}
      >
        <button
          type="button"
          tabIndex={-1}
          aria-label={t("Close")}
          onClick={closeMobileMenu}
          className={`absolute inset-0 cursor-default bg-[#071536]/40 transition-opacity duration-300 motion-reduce:transition-none ${isMobileMenuOpen ? "opacity-100" : "opacity-0"}`}
        />
        <aside
          role="dialog"
          aria-modal="true"
          aria-label={t("Menu")}
          className={`absolute inset-y-0 right-0 flex w-[min(300px,85vw)] flex-col bg-white shadow-[-12px_0_32px_rgba(11,31,77,0.16)] transition-transform duration-300 ease-out motion-reduce:transition-none ${isMobileMenuOpen ? "translate-x-0" : "translate-x-full"}`}
        >
          <div className="flex h-16 shrink-0 items-center justify-between border-b border-[#edf0f3] px-5">
            <BrandLogo compact href={routes.dashboard} />
            <button
              type="button"
              aria-label={t("Close")}
              onClick={closeMobileMenu}
              className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-[#f4f7fa] text-navy"
            >
              <svg viewBox="0 0 16 16" aria-hidden="true" className="h-3.5 w-3.5">
                <path d="M3.5 3.5l9 9M12.5 3.5l-9 9" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            </button>
          </div>
          <nav className="grid gap-1 px-4 pt-4">
            {mobileLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={closeMobileMenu}
                aria-current={link.active ? "page" : undefined}
                className={`rounded-[10px] px-4 py-3 font-manrope text-[14px] font-medium ${link.active ? "bg-navy text-white" : "text-navy hover:bg-[#f5f7fa]"}`}
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <div className="mt-auto border-t border-[#edf0f3] px-4 pb-6 pt-4" data-language-selector="true">
            <p className="px-1 font-manrope text-[10px] font-semibold uppercase tracking-[0.08em] text-[#8b949e]">
              {t("Language")}
            </p>
            <div className="mt-2.5 grid gap-1.5">
              {LANGUAGE_OPTIONS.map((option) => (
                <button
                  key={option.code}
                  type="button"
                  aria-pressed={language === option.code}
                  onClick={() => {
                    setLanguage(option.code);
                    closeMobileMenu();
                  }}
                  className={`flex cursor-pointer items-center gap-3 rounded-[10px] border px-3 py-2.5 font-manrope text-[13px] ${language === option.code ? "border-navy bg-navy text-white" : "border-[#e3e8ed] text-navy hover:bg-[#f5f7fa]"}`}
                >
                  <Image src={option.flag} alt="" width={20} height={14} className="h-3.5 w-5 rounded-[2px] object-cover" />
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </header>
  );
}
