export const routes = {
  home: "/",
  dashboard: "/dashboard",
  profile: "/dashboard/profile",
  editProfile: "/dashboard/profile/edit",
  changePassword: "/dashboard/change-password",
  settings: "/dashboard/settings",
  helpSupport: "/dashboard/help-support",
  referral: "/dashboard/referral",
  land: "/dashboard/my-land",
  leaderboard: "/dashboard/leaderboard",
  publicLeaderboard: "/leaderboard",
  dashboardExplore: "/dashboard/explore",
  purchases: "/dashboard/purchases",
  certificates: "/dashboard/certificates",
  cart: "/dashboard/cart",
  checkout: "/dashboard/checkout",
  explore: "/explore",
  blog: "/blog",
  contact: "/contact",
  login: "/login",
  signup: "/signup",
  privacy: "/privacy",
  terms: "/terms",
  dashboardPrivacy: "/dashboard/privacy",
  dashboardTerms: "/dashboard/terms",
} as const;

/** URL slug of a legal page's title: "Terms & Conditions" → "terms-and-conditions". */
export function legalSlug(title: string) {
  return title
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** A legal page from `GET /page/legal-pages`, shown at `/legal/{slug}` (no id in the URL). */
export function legalPagePath(title: string) {
  return `/legal/${legalSlug(title)}`;
}

export type AppRoute = (typeof routes)[keyof typeof routes];

export function leaderboardOwnerPath(userId: string) {
  return `${routes.leaderboard}/${encodeURIComponent(userId)}`;
}

/** Explore Map opened on one region's plots; signed-out users log in first. */
export function exploreRegionPath(region: { id: string; name: string }, signedIn: boolean) {
  const query = new URLSearchParams({ regionId: region.id, region: region.name });
  const path = `${routes.dashboardExplore}?${query.toString()}`;
  return signedIn ? path : `${routes.login}?next=${encodeURIComponent(path)}`;
}
