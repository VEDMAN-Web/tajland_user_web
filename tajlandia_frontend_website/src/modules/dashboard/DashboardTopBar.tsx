"use client";

import Link from "next/link";
import { routes } from "@/lib/constants/routes";
import { MAIN_MENU_ACCOUNT_PAGES, type AccountKey } from "./AccountMenu";
import { useDashboardLanguage } from "./DashboardLanguageContext";

const PAGE: Record<AccountKey, { label: string; href: string }> = {
  profile: { label: "Profile", href: routes.profile },
  password: { label: "Change Password", href: routes.changePassword },
  purchases: { label: "My Purchases", href: routes.purchases },
  certificates: { label: "My Certificates", href: routes.certificates },
  referral: { label: "Refer & Earn", href: routes.referral },
  settings: { label: "Settings", href: routes.settings },
  help: { label: "Help & Support", href: routes.helpSupport },
  terms: { label: "Term & Condition", href: routes.dashboardTerms },
  privacy: { label: "Privacy Policy", href: routes.dashboardPrivacy },
};

const isPath = (pathname: string, base: string) => pathname === base || pathname.startsWith(`${base}/`);

/** Where the page sits, starting at Home. */
function trailFor(account: AccountKey | null, pathname: string): { label: string; href: string }[] {
  const trail: { label: string; href: string }[] = [{ label: "Home", href: routes.dashboard }];
  if (account) {
    // Pages linked from the main menu sit directly under Home; the rest under Profile.
    if (!MAIN_MENU_ACCOUNT_PAGES.has(account)) trail.push(PAGE.profile);
    if (account !== "profile") trail.push(PAGE[account]);
    if (pathname.startsWith(`${routes.editProfile}`)) {
      trail.push({ label: "Edit Profile", href: routes.editProfile });
    } else if (account === "purchases" && pathname !== routes.purchases && pathname !== `${routes.purchases}/`) {
      trail.push({ label: "Order Details", href: pathname });
    }
    return trail;
  }
  if (isPath(pathname, routes.leaderboard)) {
    trail.push({ label: "Leaderboard", href: routes.leaderboard });
    if (pathname !== routes.leaderboard && pathname !== `${routes.leaderboard}/`) trail.push({ label: "Owner", href: pathname });
  } else if (isPath(pathname, routes.land)) {
    trail.push({ label: "My Land", href: routes.land });
  } else if (isPath(pathname, routes.cart)) {
    trail.push({ label: "My Cart", href: routes.cart });
  } else if (isPath(pathname, routes.checkout)) {
    trail.push({ label: "My Cart", href: routes.cart }, { label: "Checkout", href: routes.checkout });
  } else if (isPath(pathname, routes.certificates)) {
    trail.push(PAGE.certificates, { label: "Certificate", href: pathname });
  }
  return trail;
}

/**
 * The top bar of every dashboard page at lg and up (not Explore Map): where the page sits on
 * the left, and the language / notifications / cart buttons (DashboardNavbar, fixed at the
 * top right) centred in it on the right. Below lg the navbar's own top bar is used.
 *
 * 76px tall: the 44px buttons sit 16px from the top (top-4) so they get 16px above and below.
 * It stays at the top while the page scrolls under it. The sticky wrapper has no height, so
 * it does not push the page down; the shell pads every page by the bar's height instead.
 */
export function DashboardTopBar({ account, pathname }: { account: AccountKey | null; pathname: string }) {
  const { t } = useDashboardLanguage();
  const trail = trailFor(account, pathname);

  return (
    <div className="sticky top-0 z-30 hidden h-0 lg:block">
      <div aria-hidden="true" className="absolute inset-x-0 top-0 h-[76px] border-b border-[#e6eaf3] bg-white/90 backdrop-blur-md" />
      <nav
        aria-label={t("Breadcrumb")}
        className="absolute left-10 top-7 max-w-[calc(100%-16rem)]"
      >
        <ol className="flex items-center gap-1.5 font-manrope text-[12px] leading-5 text-[#8b949e]">
          {trail.map((crumb, index) => {
            const isLast = index === trail.length - 1;
            return (
              <li key={crumb.href + crumb.label} className="flex min-w-0 items-center gap-1.5">
                {index > 0 ? (
                  <svg viewBox="0 0 16 16" aria-hidden="true" className="h-3 w-3 shrink-0 text-[#c0c7d0]">
                    <path d="m6 3.5 4.5 4.5L6 12.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ) : null}
                {isLast ? (
                  <span aria-current="page" className="truncate font-medium text-navy">
                    {t(crumb.label)}
                  </span>
                ) : (
                  <Link href={crumb.href} className="truncate transition-colors hover:text-navy">
                    {t(crumb.label)}
                  </Link>
                )}
              </li>
            );
          })}
        </ol>
      </nav>
    </div>
  );
}
