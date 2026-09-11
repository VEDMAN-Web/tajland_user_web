import type { Metadata } from "next";
import { ExploreMapPage } from "@/modules/explore-map";
import { createPageMetadata } from "@/lib/seo/metadata";
import { routes } from "@/lib/constants/routes";

export const metadata: Metadata = createPageMetadata({
  title: "Explore Map",
  description: "An interactive map of Thailand is coming next.",
  path: routes.explore,
  index: false,
});

export default function Page() {
  return <ExploreMapPage />;
}
