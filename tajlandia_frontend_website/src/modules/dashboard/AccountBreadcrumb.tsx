"use client";

import Link from "next/link";
import { routes } from "@/lib/constants/routes";
import type { AccountKey } from "./AccountMenu";
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

/**
 * Where an account page sits: Home / Profile / the page (/ a page inside it, such as Edit
 * Profile or an order). lg and up only, in the empty band above the page heading; below lg
 * the top bar, the drawer and the page's own heading already say where you are.
 *
 * It stays at the top while the page scrolls. The sticky wrapper has no height, so the page
 * is not pushed down; the band behind it is as tall as the language / cart buttons at the top right (64px), so
 * nothing shows through beside them while the page scrolls under it.
 */
export function AccountBreadcrumb({ account, pathname }: { account: AccountKey; pathname: string }) {
  const { t } = useDashboardLanguage();

  const trail: { label: string; href: string }[] = [
    { label: "Home", href: routes.dashboard },
    PAGE.profile,
  ];
  if (account !== "profile") trail.push(PAGE[account]);
  if (pathname.startsWith(`${routes.editProfile}`)) {
    trail.push({ label: "Edit Profile", href: routes.editProfile });
  } else if (account === "purchases" && pathname !== routes.purchases && pathname !== `${routes.purchases}/`) {
    trail.push({ label: "Order Details", href: pathname });
  }

  return (
    <div className="sticky top-0 z-30 hidden h-0 lg:block">
      <div aria-hidden="true" className="absolute inset-x-0 top-0 h-16 bg-[#f7f9fc]/95 shadow-[0_1px_0_rgba(11,31,77,0.05)] backdrop-blur-md" />
      <nav
        aria-label={t("Breadcrumb")}
        className="absolute left-10 top-7 max-w-[calc(100%-22rem)]"
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
