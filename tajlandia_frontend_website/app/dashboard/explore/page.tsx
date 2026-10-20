import { Suspense } from "react";
import type { Metadata } from "next";
import { PageLoader } from "@/components/ui/PageLoader";
import { createPageMetadata } from "@/lib/seo/metadata";
import { AuthenticatedExploreMapPage } from "@/modules/explore-map/AuthenticatedExploreMapPage";

export const metadata: Metadata = createPageMetadata({
  title: "Explore Map",
  description: "Explore land plots across Thailand on the map.",
  path: "/dashboard/explore",
  index: false,
});

export default function DashboardExplorePage() {
  return (
    <Suspense fallback={<PageLoader label="Loading map..." />}>
      <AuthenticatedExploreMapPage />
    </Suspense>
  );
}
