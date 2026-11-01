"use client";

import { usePathname } from "next/navigation";
import { useState, useSyncExternalStore } from "react";
import { routes } from "@/lib/constants/routes";
import { MAIN_MENU_ACCOUNT_PAGES, type AccountKey } from "./AccountMenu";
import { DashboardTopBar } from "./DashboardTopBar";
import { DashboardNavbar } from "./DashboardNavbar";
import { DashboardSidebar, type NavbarActive } from "./DashboardSidebar";

const RAIL_STORAGE_KEY = "tajlandia_sidebar";
const RAIL_CHANGED_EVENT = "tajlandia:sidebar-changed";
// Storage can be blocked (private windows): the choice then lasts until reload.
let memoryRailChoice: boolean | null = null;

/** The saved sidebar choice: true = rail, false = full, null = none yet (page default). */
function readRailChoice(): boolean | null {
  try {
    const saved = localStorage.getItem(RAIL_STORAGE_KEY);
    if (saved === "rail" || saved === "full") return saved === "rail";
  } catch {
    return memoryRailChoice;
  }
  return memoryRailChoice;
}

function writeRailChoice(rail: boolean) {
  memoryRailChoice = rail;
  try {
    localStorage.setItem(RAIL_STORAGE_KEY, rail ? "rail" : "full");
  } catch {
    // Not saved; it resets on reload.
  }
  window.dispatchEvent(new Event(RAIL_CHANGED_EVENT));
}

// Re-reads on a toggle here and on one in another tab. The server render has no choice
// (null), so the first client render matches it and the saved choice follows.
function subscribeRailChoice(onChange: () => void) {
  window.addEventListener(RAIL_CHANGED_EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(RAIL_CHANGED_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

const isPath =(pathname: string, base: string) => pathname === base || pathname.startsWith(`${base}/`);

/** Which sidebar link is current. Profile-menu / cart pages highlight none of them. */
function navbarActive(pathname: string): NavbarActive {
  if (pathname === routes.dashboard) return "home";
  if (isPath(pathname, routes.dashboardExplore)) return "explore";
  if (isPath(pathname, routes.leaderboard)) return "leaderboard";
  if (isPath(pathname, routes.land)) return "my-land";
  if (isPath(pathname, routes.purchases)) return "purchases";
  if (isPath(pathname, routes.certificates)) return "certificates";
  if (isPath(pathname, routes.referral)) return "referral";
  if (isPath(pathname, routes.settings)) return "settings";
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
  if (isPath(pathname, routes.referral)) return "referral";
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
 * Below lg: a fixed top bar (65px) with a drawer; on account pages the drawer holds the account menu.
 */
export function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? "";
  const active = navbarActive(pathname);
  // `account`: the page uses the account page frame (breadcrumb, background).
  // `menuAccount`: the sidebar shows the Profile menu instead of the main links.
  const account = accountKey(pathname);
  const menuAccount = account && !MAIN_MENU_ACCOUNT_PAGES.has(account) ? account : null;
  const overlay = active === "explore";
  // The user's saved choice from the sidebar's toggle applies to the normal pages (full
  // sidebar until they pick the rail). Explore Map ignores it: the map needs the room, so
  // every time it is opened the sidebar starts as a rail, and the toggle there only lasts
  // for that visit. The Profile menu has no rail form, so its pages always show the
  // full sidebar.
  const railChoice = useSyncExternalStore(subscribeRailChoice, readRailChoice, () => null);
  const [exploreExpanded, setExploreExpanded] = useState(false);
  const [wasOverlay, setWasOverlay] = useState(overlay);
  if (overlay !== wasOverlay) {
    // Arriving on (or leaving) Explore Map: back to the rail there.
    setWasOverlay(overlay);
    setExploreExpanded(false);
  }
  const rail = !menuAccount && (overlay ? !exploreExpanded : (railChoice ?? false));
  function toggleRail() {
    if (overlay) setExploreExpanded(rail);
    else writeRailChoice(!rail);
  }
  // Pages size themselves to the full viewport; below the phone top bar (h-16 + 1px border)
  // that is 65px less. Written out in full so Tailwind sees the class.
  // At lg and up every page starts below the 76px top bar (DashboardTopBar); pages add their
  // own 24-32px, so titles sit the same distance below the bar's line on every page.
  // The padding is on the page's own root, so its background still reaches the top.
  const fillViewport = "[&>*]:min-h-[calc(100svh-65px)] lg:[&>*]:min-h-svh lg:[&>*]:pt-[76px]";

  return (
    <div className="relative">
      <DashboardSidebar
        mode={menuAccount ? "account" : "main"}
        active={active}
        account={menuAccount}
        rail={rail}
        onToggleRail={menuAccount ? undefined : toggleRail}
      />
      <DashboardNavbar active={active} account={menuAccount} overlay={overlay} />
      <div
        className={`lg:transition-[padding-left] lg:duration-300 motion-reduce:lg:transition-none ${rail ? "lg:pl-[76px]" : "lg:pl-[220px]"}`}
      >
        {account ? (
          <div className="relative bg-[#f7f9fc] pt-[65px] lg:pt-0">
            <DashboardTopBar account={account} pathname={pathname} />
            <div className={`min-w-0 ${fillViewport}`}>{children}</div>
          </div>
        ) : (
          // The Explore Map sits under the top bar (the bar floats over it).
          overlay ? (
            <div>{children}</div>
          ) : (
            <div className="pt-[65px] lg:pt-0">
              <DashboardTopBar account={null} pathname={pathname} />
              <div className={`min-w-0 ${fillViewport}`}>{children}</div>
            </div>
          )
        )}
      </div>
    </div>
  );
}
