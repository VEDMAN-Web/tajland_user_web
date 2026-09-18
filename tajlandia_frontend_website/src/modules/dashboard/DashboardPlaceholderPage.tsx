"use client";

import { useRouter } from "next/navigation";
import { routes } from "@/lib/constants/routes";
import { useAuth } from "@/lib/hooks/useAuth";
import { DashboardNavbar } from "./DashboardNavbar";

export function DashboardPlaceholderPage({ title }: { title: string }) {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();
  if (!isLoading && !isAuthenticated) { router.replace(routes.login); return null; }
  if (isLoading) return <div className="flex min-h-[100svh] items-center justify-center text-sm text-muted">Loading...</div>;
  const active = title === "My Land" ? "my-land" : "explore";
  return <div className="min-h-[100svh] bg-white"><DashboardNavbar active={active} /><main className="flex min-h-[calc(100svh-54px)] flex-col items-center justify-center gap-4 px-6 text-center"><h1 className="text-3xl font-semibold text-navy">{title}</h1><p className="text-sm text-muted">This authenticated section is coming next.</p><button type="button" onClick={() => router.push(routes.dashboard)} className="rounded-full bg-navy px-5 py-3 text-sm text-white">Back to Dashboard</button></main></div>;
}
