"use client";

import { useRouter } from "next/navigation";
import { routes } from "@/lib/constants/routes";
import { useDashboardLanguage } from "./DashboardLanguageContext";
import { PageLoader } from "@/components/ui/PageLoader";
import { useAuth } from "@/lib/hooks/useAuth";

export function DashboardPlaceholderPage({ title }: { title: string }) {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();
  const { t } = useDashboardLanguage();
  if (!isLoading && !isAuthenticated) { router.replace(routes.login); return null; }
  if (isLoading) return <PageLoader label={t("Loading...")} />;
  return <div className="min-h-[100svh] bg-white"><main className="flex min-h-[calc(100svh-54px)] flex-col items-center justify-center gap-4 px-6 text-center"><h1 className="text-3xl font-semibold text-navy">{title}</h1><p className="text-sm text-muted">This authenticated section is coming next.</p><button type="button" onClick={() => router.push(routes.dashboard)} className="rounded-full bg-navy px-5 py-3 text-sm text-white">Back to Dashboard</button></main></div>;
}
