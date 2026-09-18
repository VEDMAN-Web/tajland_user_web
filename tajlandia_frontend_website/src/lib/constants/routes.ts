export const routes = {
  home: "/",
  dashboard: "/dashboard",
  dashboardExplore: "/dashboard/explore",
  dashboardMyLand: "/dashboard/my-land",
  explore: "/explore",
  blog: "/blog",
  contact: "/contact",
  login: "/login",
  signup: "/signup",
  privacy: "/privacy",
  terms: "/terms",
} as const;

export type AppRoute = (typeof routes)[keyof typeof routes];
