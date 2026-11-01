import type { Metadata } from "next";
import { ExploreMapPage, fetchPublicMapRegions } from "@/modules/explore-map";
import { getPageMetadata } from "@/lib/seo/metadata";
import { routes } from "@/lib/constants/routes";

export async function generateMetadata(): Promise<Metadata> {
  return getPageMetadata({
    title: "Explore Map",
    description:
      "Browse an interactive map of Thailand by region, see which plots are available and choose the one you want to collect.",
    path: routes.explore,
  });
}

export default async function Page() {
  const regions = await fetchPublicMapRegions();
  return <ExploreMapPage regions={regions} />;
}
