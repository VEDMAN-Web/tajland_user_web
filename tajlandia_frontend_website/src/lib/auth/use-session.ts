"use client";

import { useEffect, useState } from "react";
import type { AuthUser } from "@/modules/auth/types/auth.types";

/**
 * Reads the taj_user cookie on the client to determine auth state.
 * This cookie is NOT httpOnly so client components can read it.
 * It is set/cleared by session.ts on the server after login/logout.
 *
 * Returns null while loading (SSR/hydration) or when logged out.
 */
export function useSession(): { user: AuthUser | null; loading: boolean } {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const raw = document.cookie
      .split("; ")
      .find((row) => row.startsWith("taj_user="))
      ?.split("=")
      .slice(1)
      .join("=");

    if (!raw) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      setUser(JSON.parse(decodeURIComponent(raw)) as AuthUser);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  return { user, loading };
}
