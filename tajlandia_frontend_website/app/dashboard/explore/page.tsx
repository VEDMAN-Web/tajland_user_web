import { Suspense } from "react";
import { PageLoader } from "@/components/ui/PageLoader";
import { AuthenticatedExploreMapPage } from "@/modules/explore-map/AuthenticatedExploreMapPage";

export default function DashboardExplorePage() {
  return (
    <Suspense fallback={<PageLoader label="Loading map..." />}>
      <AuthenticatedExploreMapPage />
    </Suspense>
  );
}
