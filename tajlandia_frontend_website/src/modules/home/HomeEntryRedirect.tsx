"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/hooks/useAuth";
import { routes } from "@/lib/constants/routes";

export function HomeEntryRedirect({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && isAuthenticated) router.replace(routes.dashboard);
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return <div className="invisible">{children}</div>;
  }

  if (isAuthenticated) return <div className="invisible">{children}</div>;

  return children;
}
