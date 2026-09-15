import { NextResponse, type NextRequest } from "next/server";

/**
 * Enterprise-grade middleware for route protection and authentication.
 * 
 * Runs on Vercel Edge Runtime - cannot import server-only code.
 * Performs lightweight cookie checks; full validation happens in page/action.
 */

// ─── Configuration ────────────────────────────────────────────────────────────

const COOKIE_NAMES = {
  ACCESS_TOKEN: "taj_at",
  REFRESH_TOKEN: "taj_rt",
  USER: "taj_user",
} as const;

/**
 * Routes that require authentication.
 * Matches prefix, so /dashboard/anything is protected.
 */
const PROTECTED_ROUTE_PREFIXES = [
  "/dashboard",
  "/account",
  "/certificates",
  "/properties",
] as const;

/**
 * Routes that should redirect to dashboard if user is already logged in.
 */
const AUTH_ROUTES = [
  "/login",
  "/signup",
  "/forgot-password",
  "/otp",
  "/reset-password",
] as const;

// ─── Middleware ───────────────────────────────────────────────────────────────

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if user has session cookies (lightweight check)
  const hasAccessToken = request.cookies.has(COOKIE_NAMES.ACCESS_TOKEN);
  const hasRefreshToken = request.cookies.has(COOKIE_NAMES.REFRESH_TOKEN);
  const hasUserData = request.cookies.has(COOKIE_NAMES.USER);

  // All three must be present for a valid session
  const hasSession = hasAccessToken && hasRefreshToken && hasUserData;

  // ─── Protected routes: require authentication ─────────────────────────────

  const isProtectedRoute = PROTECTED_ROUTE_PREFIXES.some((prefix) =>
    pathname.startsWith(prefix)
  );

  if (isProtectedRoute && !hasSession) {
    // No session → redirect to login with return URL
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("from", pathname);
    
    const response = NextResponse.redirect(loginUrl);
    
    // Clear any stale cookies to prevent confusion
    response.cookies.delete(COOKIE_NAMES.ACCESS_TOKEN);
    response.cookies.delete(COOKIE_NAMES.REFRESH_TOKEN);
    response.cookies.delete(COOKIE_NAMES.USER);
    
    return response;
  }

  // ─── Auth routes: redirect to dashboard if already logged in ──────────────

  const isAuthRoute = AUTH_ROUTES.some((route) => pathname.startsWith(route));

  if (isAuthRoute && hasSession) {
    // Already logged in → check for return URL or go to home
    const from = request.nextUrl.searchParams.get("from");
    const redirectTo = from && from.startsWith("/") ? from : "/";
    
    return NextResponse.redirect(new URL(redirectTo, request.url));
  }

  // ─── Allow all other routes ───────────────────────────────────────────────

  return NextResponse.next();
}

// ─── Matcher config ───────────────────────────────────────────────────────────

export const config = {
  matcher: [
    /*
     * Match all request paths EXCEPT:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - _next/webpack-hmr (dev hot reload)
     * - favicon.ico, sitemap.xml, robots.txt (meta files)
     * - Static assets (images, fonts, etc.)
     * - API routes (handle their own auth)
     */
    "/((?!_next/static|_next/image|_next/webpack-hmr|favicon.ico|sitemap.xml|robots.txt|api|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff|woff2|ttf|eot|css|js)$).*)",
  ],
};
