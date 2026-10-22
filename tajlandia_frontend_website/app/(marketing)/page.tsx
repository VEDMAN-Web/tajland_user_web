import type { Metadata } from "next";
import { fetchPublicMapRegions } from "@/modules/explore-map";
import { HomePage } from "@/modules/home";
import { HomeEntryRedirect } from "@/modules/home/HomeEntryRedirect";
import { createPageMetadata } from "@/lib/seo/metadata";
import { brand } from "@/lib/constants/brand";
import { routes } from "@/lib/constants/routes";

export const metadata: Metadata = createPageMetadata({
  title: brand.tagline,
  description: brand.description,
  path: routes.home,
});

export default async function Page() {
  const mapRegions = await fetchPublicMapRegions();

  return (
    <HomeEntryRedirect>
      <HomePage mapRegions={mapRegions} />
    </HomeEntryRedirect>
  );
}
