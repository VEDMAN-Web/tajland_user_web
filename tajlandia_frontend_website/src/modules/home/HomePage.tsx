import { headers } from "next/headers";
import type { MapRegion } from "@/components/maps/MapboxMap";
import { JsonLd } from "@/components/shared/JsonLd";
import { createOrganizationJsonLd, createWebsiteJsonLd } from "@/lib/seo/json-ld";
import { getRequestLocale } from "@/lib/i18n/request";
import { getHomePageContent } from "./services/home.service";
import { HeroSection } from "./sections/HeroSection";
import { FeatureSection } from "./sections/FeatureSection";
import { WorldSection } from "./sections/WorldSection";
import { MapPreviewSection } from "./sections/MapPreviewSection";
import { HowItWorksSection } from "./sections/HowItWorksSection";
import { TestimonialsSection } from "./sections/TestimonialsSection";
import { CtaSection } from "./sections/CtaSection";

type HomePageProps = {
  /** Region pills for the map preview (empty hides them). */
  mapRegions?: MapRegion[];
};

export async function HomePage({ mapRegions = [] }: HomePageProps) {
  const locale = await getRequestLocale();
  const content = await getHomePageContent(locale);
  const nonce = (await headers()).get("x-nonce") ?? undefined;

  return (
    <>
      <JsonLd data={createWebsiteJsonLd(locale)} nonce={nonce} />
      <JsonLd data={createOrganizationJsonLd()} nonce={nonce} />
      <HeroSection content={content.hero} locale={locale} />
      <FeatureSection content={content.features} />
      <WorldSection content={content.world} />
      <MapPreviewSection content={content.map} regions={mapRegions} locale={locale} />
      <HowItWorksSection content={content.howItWorks} locale={locale} />
      <TestimonialsSection content={content.testimonials} locale={locale} />
      <CtaSection content={content.cta} locale={locale} />
    </>
  );
}
