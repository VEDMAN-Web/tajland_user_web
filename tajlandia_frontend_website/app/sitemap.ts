import type { MetadataRoute } from "next";
import { getPublicEnv } from "@/lib/config/public-env";
import { routes } from "@/lib/constants/routes";

export default function sitemap(): MetadataRoute.Sitemap {
  const { NEXT_PUBLIC_SITE_URL } = getPublicEnv();

  return [
    {
      url: new URL(routes.home, NEXT_PUBLIC_SITE_URL).toString(),
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
  ];
}
