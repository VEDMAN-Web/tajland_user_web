import { brand } from "@/lib/constants/brand";
import { getPublicEnv } from "@/lib/config/public-env";

export function createWebsiteJsonLd() {
  const { NEXT_PUBLIC_SITE_URL, NEXT_PUBLIC_SITE_NAME } = getPublicEnv();

  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: NEXT_PUBLIC_SITE_NAME,
    url: NEXT_PUBLIC_SITE_URL,
    description: brand.description,
  };
}
