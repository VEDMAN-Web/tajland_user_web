"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/hooks/useAuth";
import { routes } from "@/lib/constants/routes";
import { cn } from "@/lib/utils/cn";

export function HomeEntryRedirect({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && isAuthenticated) router.replace(routes.dashboard);
  }, [isAuthenticated, isLoading, router]);

  // Always the same wrapper: swapping it would remount (and reload) the whole
  // page once auth resolves. `contents` keeps it out of the layout. Signed-in
  // visitors are sent on before paint by the marketing layout's inline script,
  // so the page only needs hiding once we know they are signed in.
  return <div className={cn("contents", isAuthenticated && "invisible")}>{children}</div>;
}
