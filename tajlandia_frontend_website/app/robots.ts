import type { MetadataRoute } from "next";
import { getPublicEnv } from "@/lib/config/public-env";

export default function robots(): MetadataRoute.Robots {
  const { NEXT_PUBLIC_SITE_URL } = getPublicEnv();

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/login"],
    },
    sitemap: new URL("/sitemap.xml", NEXT_PUBLIC_SITE_URL).toString(),
  };
}
