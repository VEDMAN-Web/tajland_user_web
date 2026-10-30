"use client";

import { usePathname } from "next/navigation";
import { routes } from "@/lib/constants/routes";
import { AccountMenu, type AccountKey } from "./AccountMenu";
import { DashboardNavbar } from "./DashboardNavbar";
import { DashboardSidebar, type NavbarActive } from "./DashboardSidebar";

const isPath = (pathname: string, base: string) => pathname === base || pathname.startsWith(`${base}/`);

/** Which sidebar link is current. Account / cart pages highlight none of them. */
function navbarActive(pathname: string): NavbarActive {
  if (pathname === routes.dashboard) return "home";
  if (isPath(pathname, routes.dashboardExplore)) return "explore";
  if (isPath(pathname, routes.leaderboard)) return "leaderboard";
  if (isPath(pathname, routes.land)) return "my-land";
  return "none";
}

/** The pages that show the account menu, and which entry is current. */
function accountKey(pathname: string): AccountKey | null {
  if (isPath(pathname, routes.profile)) return "profile";
  if (isPath(pathname, routes.changePassword)) return "password";
  if (isPath(pathname, routes.purchases)) return "purchases";
  // A certificate's own page (/certificates/[id]) has no account menu, the list does.
  if (pathname === routes.certificates || pathname === `${routes.certificates}/`) return "certificates";
  if (isPath(pathname, routes.settings)) return "settings";
  if (isPath(pathname, routes.helpSupport)) return "help";
  if (isPath(pathname, routes.dashboardTerms)) return "terms";
  if (isPath(pathname, routes.dashboardPrivacy)) return "privacy";
  return null;
}

/**
 * The dashboard's frame, kept mounted in the route layout so a link click swaps only the
 * page content (no flicker, no cart badge reload).
 *
 * lg and up: a fixed sidebar on the left (an icon rail on Explore Map) and the cart button
 * floating at the top right; the content is shifted right by the sidebar's width. On an
 * account page the sidebar shows the account menu (Back returns to the normal links).
 * Below lg: a fixed top bar (65px) with a drawer; account pages keep the row of pills.
 */
export function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? "";
  const active = navbarActive(pathname);
  const account = accountKey(pathname);
  const overlay = active === "explore";
  // Pages size themselves to the full viewport; below the top bar (h-16 + 1px border) that is
  // 65px less, at lg and up there is no bar. Written out in full so Tailwind sees the class.
  // At lg and up each page also starts 32px down. Pages add their own 24-32px on top, so a
  // right-aligned header button lands at about 64px, just below the language + cart buttons
  // floating at the top right (they end at 60px). Kept small so there's no empty band above.
  // The padding is on the page's own root, so its background still reaches the top.
  const fillViewport = "[&>*]:min-h-[calc(100svh-65px)] lg:[&>*]:min-h-svh lg:[&>*]:pt-8";

  return (
    <div className="relative">
      <DashboardSidebar mode={account ? "account" : "main"} active={active} account={account} rail={overlay} />
      <DashboardNavbar active={active} overlay={overlay} />
      <div
        className={`lg:transition-[padding-left] lg:duration-300 motion-reduce:lg:transition-none ${overlay ? "lg:pl-[76px]" : "lg:pl-[220px]"}`}
      >
        {account ? (
          <div className="bg-[#f7f9fc] pt-[65px] lg:pt-0">
            <AccountMenu active={account} />
            <div className={`min-w-0 ${fillViewport}`}>{children}</div>
          </div>
        ) : (
          // The Explore Map sits under the top bar (the bar floats over it).
          <div className={overlay ? undefined : `pt-[65px] lg:pt-0 ${fillViewport}`}>{children}</div>
        )}
      </div>
    </div>
  );
}
