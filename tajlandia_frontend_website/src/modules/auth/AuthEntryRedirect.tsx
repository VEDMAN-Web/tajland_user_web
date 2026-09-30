"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { routes } from "@/lib/constants/routes";
import { useAuth } from "@/lib/hooks/useAuth";
import { toSafeInternalRedirect } from "@/lib/security/redirects";

export function AuthEntryRedirect({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      const nextPath = toSafeInternalRedirect(new URLSearchParams(window.location.search).get("next"));
      router.replace(nextPath ?? routes.dashboard);
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading || isAuthenticated) {
    return <div className="invisible">{children}</div>;
  }

  return children;
}