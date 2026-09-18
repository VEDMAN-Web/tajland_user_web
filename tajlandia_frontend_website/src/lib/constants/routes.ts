export const routes = {
  home: "/",
  dashboard: "/dashboard",
  profile: "/dashboard/profile",
  editProfile: "/dashboard/profile/edit",
  changePassword: "/dashboard/change-password",
  settings: "/dashboard/settings",
  explore: "/explore",
  blog: "/blog",
  contact: "/contact",
  login: "/login",
  signup: "/signup",
  privacy: "/privacy",
  terms: "/terms",
} as const;

export type AppRoute = (typeof routes)[keyof typeof routes];
