import type { Metadata } from "next";
import { fetchPublicMapRegions } from "@/modules/explore-map";
import { HomePage } from "@/modules/home";
import { HomeEntryRedirect } from "@/modules/home/HomeEntryRedirect";
import { createPageMetadata } from "@/lib/seo/metadata";
import { siteCopy } from "@/lib/i18n/messages";
import { getRequestLocale } from "@/lib/i18n/request";
import { routes } from "@/lib/constants/routes";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();
  const copy = siteCopy[locale];

  return createPageMetadata({
    title: copy.tagline,
    description: copy.description,
    path: routes.home,
    locale,
  });
}

export default async function Page() {
  const mapRegions = await fetchPublicMapRegions();

  return (
    <HomeEntryRedirect>
      <HomePage mapRegions={mapRegions} />
    </HomeEntryRedirect>
  );
}
