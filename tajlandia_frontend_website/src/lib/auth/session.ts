import "server-only";

import { cookies } from "next/headers";
import type { AuthUser } from "@/modules/auth/types/auth.types";

/**
 * Cookie names — centralised so a rename is one-line.
 */
const COOKIE = {
  ACCESS_TOKEN: "taj_at",
  REFRESH_TOKEN: "taj_rt",
  USER: "taj_user",
} as const;

/**
 * Shared secure cookie options.
 * - httpOnly: JS cannot read the token (XSS protection)
 * - secure: HTTPS only in production
 * - sameSite: CSRF protection
 * - path: available across the whole site
 */
const BASE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  path: "/",
} as const;

/** Access token lives for 15 minutes — matches backend JWT exp */
const ACCESS_TOKEN_MAX_AGE = 15 * 60; // 900s

/** Refresh token lives for 7 days — matches backend refresh exp */
const REFRESH_TOKEN_MAX_AGE = 7 * 24 * 60 * 60; // 604800s

export type SessionTokens = {
  accessToken: string;
  refreshToken: string;
};

export type SessionData = {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
};

// ─── Write ────────────────────────────────────────────────────────────────────

/**
 * Persists a full auth session to cookies after login or register.
 */
export async function setSession(data: SessionData): Promise<void> {
  const cookieStore = await cookies();

  cookieStore.set(COOKIE.ACCESS_TOKEN, data.accessToken, {
    ...BASE_OPTIONS,
    maxAge: ACCESS_TOKEN_MAX_AGE,
  });

  cookieStore.set(COOKIE.REFRESH_TOKEN, data.refreshToken, {
    ...BASE_OPTIONS,
    maxAge: REFRESH_TOKEN_MAX_AGE,
  });

  // User data is non-sensitive (no tokens), stored as JSON for SSR reads.
  // Not httpOnly so client components can read the display name without an API call.
  cookieStore.set(COOKIE.USER, JSON.stringify(data.user), {
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: REFRESH_TOKEN_MAX_AGE,
  });
}

/**
 * Updates only the access token — used after a silent token refresh.
 */
export async function setAccessToken(accessToken: string): Promise<void> {
  const cookieStore = await cookies();

  cookieStore.set(COOKIE.ACCESS_TOKEN, accessToken, {
    ...BASE_OPTIONS,
    maxAge: ACCESS_TOKEN_MAX_AGE,
  });
}

// ─── Read ─────────────────────────────────────────────────────────────────────

/**
 * Returns both tokens or null if either is absent.
 */
export async function getSessionTokens(): Promise<SessionTokens | null> {
  const cookieStore = await cookies();

  const accessToken = cookieStore.get(COOKIE.ACCESS_TOKEN)?.value;
  const refreshToken = cookieStore.get(COOKIE.REFRESH_TOKEN)?.value;

  if (!accessToken || !refreshToken) {
    return null;
  }

  return { accessToken, refreshToken };
}

/**
 * Returns the stored user object or null if the cookie is absent / malformed.
 */
export async function getSessionUser(): Promise<AuthUser | null> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(COOKIE.USER)?.value;

  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

/**
 * Returns the raw access token string or null.
 */
export async function getAccessToken(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(COOKIE.ACCESS_TOKEN)?.value ?? null;
}

/**
 * Returns the raw refresh token string or null.
 */
export async function getRefreshToken(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(COOKIE.REFRESH_TOKEN)?.value ?? null;
}

// ─── Destroy ──────────────────────────────────────────────────────────────────

/**
 * Clears all auth cookies — called on logout.
 */
export async function clearSession(): Promise<void> {
  const cookieStore = await cookies();

  cookieStore.delete(COOKIE.ACCESS_TOKEN);
  cookieStore.delete(COOKIE.REFRESH_TOKEN);
  cookieStore.delete(COOKIE.USER);
}

/**
 * Returns true if a session exists (tokens present in cookies).
 * Does not validate expiry — use requireAuth() for that.
 */
export async function hasSession(): Promise<boolean> {
  const tokens = await getSessionTokens();
  return tokens !== null;
}
