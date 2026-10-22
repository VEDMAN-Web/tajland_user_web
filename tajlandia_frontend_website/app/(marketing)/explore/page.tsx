import type { Metadata } from "next";
import { ExploreMapPage, fetchPublicMapRegions } from "@/modules/explore-map";
import { createPageMetadata } from "@/lib/seo/metadata";
import { routes } from "@/lib/constants/routes";

export const metadata: Metadata = createPageMetadata({
  title: "Explore Map",
  description: "An interactive map of Thailand is coming next.",
  path: routes.explore,
  index: false,
});

export default async function Page() {
  const regions = await fetchPublicMapRegions();
  return <ExploreMapPage regions={regions} />;
}
