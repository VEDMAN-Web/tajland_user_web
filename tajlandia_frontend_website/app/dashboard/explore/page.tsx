import { Suspense } from "react";
import { AuthenticatedExploreMapPage } from "@/modules/explore-map/AuthenticatedExploreMapPage";

export default function DashboardExplorePage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-[100svh] items-center justify-center bg-white text-sm text-muted">
          Loading map...
        </main>
      }
    >
      <AuthenticatedExploreMapPage />
    </Suspense>
  );
}
