"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { BrandLogo } from "@/components/ui/BrandLogo";
import { useCartSnapshot } from "@/lib/cart/cart-snapshot";
import { routes } from "@/lib/constants/routes";
import type { AccountKey } from "./AccountMenu";
import { useDashboardLanguage } from "./DashboardLanguageContext";
import { LanguageDropdown, SidebarContent, type NavbarActive } from "./DashboardSidebar";
import { NotificationBell } from "./NotificationBell";

type DashboardNavbarProps = {
  active: NavbarActive;
  /** The current account page; the drawer then shows the account menu, like the sidebar. */
  account?: AccountKey | null;
  overlay?: boolean;
};

const controlHeight = "h-11";
const controlShadow = "shadow-[0_6px_20px_rgba(11,31,77,0.08)]";

// Round icon button. With a `label` (inside a `group` link) it grows into a pill on
// hover / keyboard focus and shows the label beside the icon.
function Icon({
  children,
  active = false,
  badge,
  label,
}: {
  children: React.ReactNode;
  active?: boolean;
  badge?: number;
  label?: string;
}) {
  return (
    <span
      className={`relative box-border flex ${controlHeight} min-w-11 items-center justify-center rounded-full px-3 ${controlShadow} transition-shadow duration-300 group-hover:shadow-[0_8px_24px_rgba(11,31,77,0.16)] group-focus-visible:shadow-[0_8px_24px_rgba(11,31,77,0.16)] motion-reduce:transition-none ${active ? "bg-navy text-white" : "bg-white text-navy"}`}
    >
      {children}
      {label ? (
        <span
          aria-hidden="true"
          className="max-w-0 overflow-hidden whitespace-nowrap font-manrope text-[14px] font-medium leading-none opacity-0 transition-[max-width,opacity,margin] duration-300 ease-out group-hover:ml-2 group-hover:mr-0.5 group-hover:max-w-[96px] group-hover:opacity-100 group-focus-visible:ml-2 group-focus-visible:mr-0.5 group-focus-visible:max-w-[96px] group-focus-visible:opacity-100 motion-reduce:transition-none"
        >
          {label}
        </span>
      ) : null}
      {badge && badge > 0 ? (
        // Keyed by the count, so each change replays the pop.
        <span key={badge} className="badge-pop absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#e11d2e] px-1 font-manrope text-[10px] font-semibold leading-none text-white">
          {badge}
        </span>
      ) : null}
    </span>
  );
}

// Items in the cart: the shared snapshot, which updates the moment a plot is added or
// removed, reloads when the cart changes elsewhere and when the tab regains focus.
function useCartCount() {
  return useCartSnapshot()?.count ?? 0;
}

function CartLink({ count, isActive, label }: { count: number; isActive: boolean; label: string }) {
  return (
    <Link
      href={routes.cart}
      aria-label={count > 0 ? `Cart, ${count} items` : "Cart"}
      className="group inline-flex rounded-full outline-none focus-visible:ring-2 focus-visible:ring-navy/40"
    >
      <Icon active={isActive} badge={count} label={label}>
        <img
          src={isActive ? "/images/dashboard/navbar/cart-active.png" : "/images/dashboard/navbar/cart-default.png"}
          alt=""
          className="h-5 w-5 object-contain"
        />
      </Icon>
    </Link>
  );
}

/**
 * The dashboard's top chrome that is not the sidebar:
 * - lg and up: just the cart button, floating at the top right (the links live in the sidebar);
 * - below lg: a fixed top bar (logo, cart, profile, menu button) and the drawer that slides
 *   in from the right with the same links and the language choice.
 */
export function DashboardNavbar({ active, account = null, overlay = false }: DashboardNavbarProps) {
  const pathname = usePathname();
  const { t } = useDashboardLanguage();
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
    routes.referral,
    routes.dashboardTerms,
    routes.dashboardPrivacy,
  ];
  const isProfileActive = accountMenuRoutes.some((route) => pathname === route);
  // Overlay (Explore Map): above the map's search bar (z-20) and panels (z-30), so
  // the drawer opens on top of them. `w-screen` (the full window, scrollbar included)
  // rather than `inset-x-0`: the map page has no page scrollbar and most pages do, so
  // otherwise the bar would be a scrollbar wider on one of them.
  const barClass = overlay ? "fixed left-0 top-0 z-40 w-screen" : "fixed left-0 top-0 z-50 w-screen";

  function closeMobileMenu() {
    setIsMobileMenuOpen(false);
  }

  // Open drawer: Escape closes it and the page behind doesn't scroll.
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
    <>
      {/* lg and up: language + cart, top right (above the Explore Map's own controls, which start lower). */}
      <div className="fixed right-6 top-4 z-40 hidden items-center gap-2 lg:flex">
        <LanguageDropdown />
        <NotificationBell />
        <CartLink count={cartCount} isActive={isCartActive} label={t("Cart")} />
      </div>

      <header className={`${barClass} border-b border-[#e6eaf3] bg-white lg:hidden`}>
        <div className="relative mx-auto flex h-16 w-full items-center justify-between px-5 sm:px-8">
          <BrandLogo compact href={routes.dashboard} />
          <div className="flex items-center gap-2">
            <NotificationBell />
            <CartLink count={cartCount} isActive={isCartActive} label={t("Cart")} />
            <Link
              href={routes.profile}
              aria-label="Profile"
              className="group inline-flex rounded-full outline-none focus-visible:ring-2 focus-visible:ring-navy/40"
            >
              <Icon active={isProfileActive} label={t("Profile")}>
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
            <button
              type="button"
              aria-label={t("Open dashboard menu")}
              aria-expanded={isMobileMenuOpen}
              onClick={() => setIsMobileMenuOpen((open) => !open)}
              className={`flex ${controlHeight} w-11 flex-col items-center justify-center gap-1.5 rounded-full bg-white ${controlShadow}`}
            >
              <span className="h-0.5 w-4 rounded-full bg-navy" />
              <span className="h-0.5 w-4 rounded-full bg-navy" />
              <span className="h-0.5 w-4 rounded-full bg-navy" />
            </button>
          </div>
        </div>
      </header>

      {/* Phones / tablets: the menu slides in from the right. Kept mounted so it can animate out. */}
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
          className={`absolute inset-y-0 right-0 flex w-[min(300px,85vw)] flex-col overflow-y-auto bg-white shadow-[-12px_0_32px_rgba(11,31,77,0.16)] transition-transform duration-300 ease-out motion-reduce:transition-none ${isMobileMenuOpen ? "translate-x-0" : "translate-x-full"}`}
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
          <SidebarContent
            mode={account ? "account" : "main"}
            active={active}
            account={account}
            showLogo={false}
            showLanguage
            onNavigate={closeMobileMenu}
          />
        </aside>
      </div>
    </>
  );
}
