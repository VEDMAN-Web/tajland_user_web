import { headers } from "next/headers";
import type { MapRegion } from "@/components/maps/MapboxMap";
import { JsonLd } from "@/components/shared/JsonLd";
import { createWebsiteJsonLd } from "@/lib/seo/json-ld";
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
  const content = await getHomePageContent();
  const nonce = (await headers()).get("x-nonce") ?? undefined;

  return (
    <>
      <JsonLd data={createWebsiteJsonLd()} nonce={nonce} />
      <HeroSection content={content.hero} />
      <FeatureSection content={content.features} />
      <WorldSection content={content.world} />
      <MapPreviewSection content={content.map} regions={mapRegions} />
      <HowItWorksSection content={content.howItWorks} />
      <TestimonialsSection content={content.testimonials} />
      <CtaSection content={content.cta} />
    </>
  );
}
