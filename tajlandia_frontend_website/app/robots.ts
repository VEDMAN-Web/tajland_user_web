import type { MetadataRoute } from "next";
import { getPublicEnv } from "@/lib/config/public-env";
import { isIndexingDisabled } from "@/lib/seo/indexing";

// Account, checkout and auth pages are noindex already; blocking them here
// also keeps crawlers from spending time on them.
const PRIVATE_PATHS = [
  "/dashboard",
  "/api/",
  "/login",
  "/signup",
  "/otp",
  "/forgot-password",
  "/reset-password",
];

export default function robots(): MetadataRoute.Robots {
  const { NEXT_PUBLIC_SITE_URL } = getPublicEnv();

  if (isIndexingDisabled()) {
    return { rules: { userAgent: "*", disallow: "/" } };
  }

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: PRIVATE_PATHS,
    },
    sitemap: new URL("/sitemap.xml", NEXT_PUBLIC_SITE_URL).toString(),
  };
}
