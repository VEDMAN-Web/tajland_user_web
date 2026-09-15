import "server-only";

import { redirect } from "next/navigation";
import { apiPost } from "@/lib/api/client";
import { isTokenExpired, isTokenExpiringSoon } from "@/lib/auth/token";
import {
  clearSession,
  getRefreshToken,
  getSessionTokens,
  getSessionUser,
  setAccessToken,
} from "@/lib/auth/session";
import { refreshResponseSchema } from "@/modules/auth/schemas/auth-response.schema";
import type { AuthUser } from "@/modules/auth/types/auth.types";

export type AuthGuardResult = {
  accessToken: string;
  user: AuthUser;
};

/**
 * Verifies the current session and transparently refreshes the access token
 * when it is about to expire. Redirects to /login if no valid session exists.
 *
 * Use this at the top of any server action or server component that requires
 * an authenticated user.
 *
 * @example
 * const { accessToken, user } = await requireAuth();
 */
export async function requireAuth(): Promise<AuthGuardResult> {
  const tokens = await getSessionTokens();

  // No session at all → send to login
  if (!tokens) {
    redirect("/login");
  }

  const { accessToken, refreshToken } = tokens;

  // Access token already expired → try to refresh
  if (isTokenExpired(accessToken)) {
    return refreshOrRedirect(refreshToken);
  }

  // Access token expiring within 60s → proactive refresh
  if (isTokenExpiringSoon(accessToken, 60)) {
    return refreshOrRedirect(refreshToken);
  }

  // Token is valid — read user from cookie (avoids an extra /auth/me round-trip)
  const user = await getSessionUser();

  if (!user) {
    // Cookie was somehow cleared, redirect
    redirect("/login");
  }

  return { accessToken, user };
}

/**
 * Returns the current auth result without redirecting.
 * Returns null if not authenticated or if tokens are expired and refresh fails.
 * Useful for layouts that need to conditionally show auth state.
 */
export async function getAuthOrNull(): Promise<AuthGuardResult | null> {
  const tokens = await getSessionTokens();

  if (!tokens) {
    return null;
  }

  const { accessToken, refreshToken } = tokens;

  if (isTokenExpired(accessToken)) {
    return silentRefresh(refreshToken);
  }

  if (isTokenExpiringSoon(accessToken, 60)) {
    return silentRefresh(refreshToken);
  }

  const user = await getSessionUser();

  if (!user) {
    return null;
  }

  return { accessToken, user };
}

// ─── Internal helpers ─────────────────────────────────────────────────────────

async function refreshOrRedirect(refreshToken: string): Promise<AuthGuardResult> {
  const result = await silentRefresh(refreshToken);

  if (!result) {
    await clearSession();
    redirect("/login");
  }

  return result;
}

async function silentRefresh(refreshToken: string): Promise<AuthGuardResult | null> {
  try {
    const response = await apiPost(
      "/auth/refresh",
      { refreshToken },
      refreshResponseSchema,
    );

    const newAccessToken = response.data.accessToken;
    await setAccessToken(newAccessToken);

    const user = await getSessionUser();

    if (!user) {
      return null;
    }

    return { accessToken: newAccessToken, user };
  } catch {
    // Refresh token invalid or expired — session is dead
    await clearSession();
    return null;
  }
}
