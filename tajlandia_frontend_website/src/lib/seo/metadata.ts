import type { Metadata } from "next";
import { getPublicEnv } from "@/lib/config/public-env";
import { resolveInternalPath } from "@/lib/security/urls";

type PageMetadataInput = {
  title: string;
  description: string;
  path: string;
  index?: boolean;
};

export function createPageMetadata({
  title,
  description,
  path,
  index = true,
}: PageMetadataInput): Metadata {
  const { NEXT_PUBLIC_SITE_URL, NEXT_PUBLIC_SITE_NAME } = getPublicEnv();
  const safePath = resolveInternalPath(path);

  if (!safePath) {
    throw new Error("Page metadata path must be a same-origin absolute path");
  }

  const url = new URL(safePath, NEXT_PUBLIC_SITE_URL).toString();

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      siteName: NEXT_PUBLIC_SITE_NAME,
      locale: "en_US",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
    robots: index ? { index: true, follow: true } : { index: false, follow: false },
  };
}

export function serializeJsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
