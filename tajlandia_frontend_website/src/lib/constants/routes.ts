export const routes = {
  home: "/",
  dashboard: "/dashboard",
  profile: "/dashboard/profile",
  editProfile: "/dashboard/profile/edit",
  changePassword: "/dashboard/change-password",
  settings: "/dashboard/settings",
  helpSupport: "/dashboard/help-support",
  land: "/dashboard/my-land",
  leaderboard: "/dashboard/leaderboard",
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
