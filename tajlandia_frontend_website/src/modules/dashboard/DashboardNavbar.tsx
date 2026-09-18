"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { BrandLogo } from "@/components/ui/BrandLogo";
import { clearAuth } from "@/lib/api/auth.utils";
import { routes } from "@/lib/constants/routes";
import { cn } from "@/lib/utils/cn";

export type DashboardNavActive = "home" | "explore" | "my-land";

type DashboardNavbarProps = {
  active: DashboardNavActive;
  /** True on the map page where the nav floats over the map */
  overlay?: boolean;
};

// ─── Small helper: icon button bubble ─────────────────────────────────────────
function IconBtn({
  children,
  label,
  onClick,
  expanded,
}: {
  children: React.ReactNode;
  label: string;
  onClick?: () => void;
  expanded?: boolean;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-expanded={expanded}
      onClick={onClick}
      className="flex h-9 w-9 items-center justify-center rounded-full bg-white transition-shadow hover:shadow-[0_8px_24px_rgba(0,31,84,0.12)] shadow-[0_5px_20px_rgba(0,31,84,0.08)]"
    >
      {children}
    </button>
  );
}

export function DashboardNavbar({ active, overlay = false }: DashboardNavbarProps) {
  const router = useRouter();
  const [language, setLanguage] = useState<"EN" | "PL">("EN");
  const [langOpen, setLangOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  function logout() {
    clearAuth();
    router.replace(routes.home);
  }

  const positionClass = overlay
    ? "absolute inset-x-0 top-0 z-20"
    : "sticky top-0 z-50";

  return (
    <header className={cn(positionClass, "bg-transparent")}>
      {/*
       * Figma: navbar height 54px, max-w-[1280px], horizontal padding 64px@lg
       * Items: logo | pill-nav | [lang] [cart] [profile]
       */}
      <div className="mx-auto flex h-[54px] w-full max-w-[1280px] items-center justify-between px-5 sm:px-8 lg:px-16">

        {/* ── Logo ── */}
        <BrandLogo compact href={routes.dashboard} />

        {/* ── Right cluster ── */}
        <div className="flex items-center gap-3">

          {/* ── Pill nav — Figma: bg white, h-10, p-1, rounded-full, shadow ── */}
          <nav
            aria-label="Dashboard navigation"
            className="hidden h-10 items-center gap-1 rounded-full bg-white p-1 shadow-[0_5px_20px_rgba(0,31,84,0.10)] sm:flex"
          >
            {(
              [
                { href: routes.dashboard,        key: "home",    label: "Home" },
                { href: routes.dashboardExplore, key: "explore", label: "Explore Map" },
                { href: routes.dashboardMyLand,  key: "my-land", label: "My Land" },
              ] as const
            ).map(({ href, key, label }) => (
              <Link
                key={key}
                href={href}
                className={cn(
                  // Figma: 16px Manrope 500, h-8, px-4, rounded-full
                  "inline-flex h-8 items-center rounded-full px-4 font-[family-name:var(--font-manrope)]",
                  "text-[16px] font-medium leading-[18px] transition-colors",
                  active === key
                    ? "bg-[#001f54] text-white"
                    : "text-[#001f54] hover:bg-[#f5f7fa]",
                )}
              >
                {label}
              </Link>
            ))}
          </nav>

          {/* ── Action buttons ── */}
          <div className="flex items-center gap-2">

            {/* Language selector — Figma: Rethink Sans 15px/500, flag 20×14 */}
            <div className="relative hidden sm:block">
              <button
                type="button"
                aria-label="Select language"
                aria-expanded={langOpen}
                onClick={() => setLangOpen((o) => !o)}
                className="flex h-9 min-w-[82px] items-center justify-center gap-[7px] rounded-full bg-white px-3 shadow-[0_5px_20px_rgba(0,31,84,0.08)] transition-shadow hover:shadow-[0_8px_24px_rgba(0,31,84,0.12)]"
              >
                <Image
                  src={language === "EN" ? "/images/dashboard/en-flag.svg" : "/images/dashboard/pl-flag.svg"}
                  alt={language === "EN" ? "English" : "Polish"}
                  width={20}
                  height={14}
                  className="shrink-0"
                />
                <span
                  className="text-[15px] font-medium leading-[22.5px] tracking-[-0.01em] text-[#001f54]"
                  style={{ fontFamily: "'Rethink Sans', sans-serif" }}
                >
                  {language}
                </span>
                {/* chevron */}
                <svg
                  width="10"
                  height="6"
                  viewBox="0 0 10 6"
                  fill="none"
                  className={cn("transition-transform text-[#001f54]", langOpen && "rotate-180")}
                  aria-hidden="true"
                >
                  <path d="M1 1l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>

              {langOpen && (
                <div className="absolute right-0 top-[calc(100%+6px)] z-30 min-w-[148px] overflow-hidden rounded-xl bg-white p-1 shadow-[0_8px_24px_rgba(0,31,84,0.14)]">
                  {(["EN", "PL"] as const).map((lang) => (
                    <button
                      key={lang}
                      type="button"
                      onClick={() => { setLanguage(lang); setLangOpen(false); }}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-[13px] text-[#001f54] hover:bg-[#f5f7fa]"
                    >
                      <Image
                        src={lang === "EN" ? "/images/dashboard/en-flag.svg" : "/images/dashboard/pl-flag.svg"}
                        alt=""
                        width={20}
                        height={14}
                      />
                      {lang === "EN" ? "EN — English" : "PL — Polish"}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Cart */}
            <IconBtn label="Open cart">
              <Image src="/images/dashboard/cart.png" alt="" width={22} height={19} />
            </IconBtn>

            {/* Profile */}
            <div className="relative">
              <IconBtn
                label="Open profile menu"
                expanded={profileOpen}
                onClick={() => setProfileOpen((o) => !o)}
              >
                <Image src="/images/dashboard/profile.png" alt="" width={20} height={20} />
              </IconBtn>

              {profileOpen && (
                <div className="absolute right-0 top-[calc(100%+6px)] z-30 min-w-[148px] overflow-hidden rounded-xl bg-white p-1 shadow-[0_8px_24px_rgba(0,31,84,0.14)]">
                  <Link
                    href={routes.dashboard}
                    onClick={() => setProfileOpen(false)}
                    className="block rounded-lg px-4 py-2 text-[13px] text-[#001f54] hover:bg-[#f5f7fa]"
                  >
                    My Profile
                  </Link>
                  <button
                    type="button"
                    onClick={logout}
                    className="w-full rounded-lg px-4 py-2 text-left text-[13px] text-[#001f54] hover:bg-[#f5f7fa]"
                  >
                    Log out
                  </button>
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
    </header>
  );
}
