"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { routes } from "@/lib/constants/routes";
import { useAuth } from "@/lib/hooks/useAuth";
import { useDashboardLanguage } from "./DashboardLanguageContext";
import { PageLoader } from "@/components/ui/PageLoader";

export function DashboardAuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, isLoading } = useAuth();
  const { t } = useDashboardLanguage();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace(routes.login);
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading || !isAuthenticated) {
    // Explore Map is a map, not the dashboard: a plain "Loading" there.
    const label = pathname.startsWith(routes.dashboardExplore) ? "Loading..." : "Loading dashboard...";
    return <PageLoader label={t(label)} />;
  }

  return children;
}
