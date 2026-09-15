/**
 * Centralized route definitions.
 * 
 * Benefits:
 * - Type-safe route references
 * - Single source of truth
 * - Easy refactoring (change once, updates everywhere)
 * - IDE autocomplete
 */

export const routes = {
  // ─── Public routes ──────────────────────────────────────────────────────────
  home: "/",
  explore: "/explore",
  blog: "/blog",
  contact: "/contact",
  privacy: "/privacy",
  terms: "/terms",

  // ─── Auth routes ────────────────────────────────────────────────────────────
  login: "/login",
  signup: "/signup",
  forgotPassword: "/forgot-password",
  otp: "/otp",
  resetPassword: "/reset-password",

  // ─── Protected routes (require authentication) ──────────────────────────────
  dashboard: "/dashboard",
  purchaseMap: "/dashboard/purchase-map",
  certificates: "/dashboard/certificates",
  properties: "/dashboard/properties",
  account: "/account",
  accountSettings: "/account/settings",
} as const;

/**
 * Type for all valid routes in the application.
 */
export type AppRoute = (typeof routes)[keyof typeof routes];

/**
 * Helper to build a login URL with a return path.
 * 
 * @example
 * // Redirect to login, then back to dashboard after successful login
 * redirect(buildLoginUrl("/dashboard"));
 */
export function buildLoginUrl(returnTo?: string): string {
  const url = new URL(routes.login, "http://localhost"); // Base doesn't matter for pathname
  if (returnTo) {
    url.searchParams.set("from", returnTo);
  }
  return url.pathname + url.search;
}

/**
 * Helper to extract the return path from login URL.
 * Defaults to dashboard if no return path specified.
 * 
 * @example
 * // URL: /login?from=/certificates
 * getReturnPath(searchParams) // => "/certificates"
 */
export function getReturnPath(searchParams: URLSearchParams): string {
  const from = searchParams.get("from");
  
  // Only allow internal paths (must start with /)
  if (from && from.startsWith("/") && !from.startsWith("//")) {
    return from;
  }
  
  return routes.dashboard;
}

/**
 * Check if a route requires authentication.
 */
export function isProtectedRoute(pathname: string): boolean {
  const protectedPrefixes = [
    routes.dashboard,
    routes.account,
  ];
  
  return protectedPrefixes.some((prefix) => pathname.startsWith(prefix));
}

/**
 * Check if a route is an auth page (login, signup, etc.).
 */
export function isAuthRoute(pathname: string): boolean {
  const authRoutes = [
    routes.login,
    routes.signup,
    routes.forgotPassword,
    routes.otp,
    routes.resetPassword,
  ];
  
  return authRoutes.some((route) => pathname.startsWith(route));
}
