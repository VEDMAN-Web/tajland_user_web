import type { Metadata } from "next";
import { getPublicEnv } from "@/lib/config/public-env";
import { localizeHref, isTranslatedPath, openGraphLocale, type Locale } from "@/lib/i18n/locale";
import { resolveInternalPath } from "@/lib/security/urls";
import { defaultOgImage, isIndexingDisabled } from "./indexing";

type PageMetadataInput = {
  title: string;
  description: string;
  path: string;
  index?: boolean;
  /** Language of this copy; `/pl/*` pages get their own canonical URL. */
  locale?: Locale;
  /** Share image path; defaults to the site-wide one. */
  image?: { url: string; width?: number; height?: number; alt?: string };
};

export function createPageMetadata({
  title,
  description,
  path,
  index = true,
  locale = "en",
  image = defaultOgImage,
}: PageMetadataInput): Metadata {
  const { NEXT_PUBLIC_SITE_URL, NEXT_PUBLIC_SITE_NAME } = getPublicEnv();
  const safePath = resolveInternalPath(path);

  if (!safePath) {
    throw new Error("Page metadata path must be a same-origin absolute path");
  }

  const url = new URL(localizeHref(locale, safePath), NEXT_PUBLIC_SITE_URL).toString();

  // Polish pages with untranslated copy stay out of the index, and a host
  // flagged NEXT_PUBLIC_NOINDEX is never indexed.
  const hasPolishCopy = locale === "en" || isTranslatedPath(safePath);
  const indexable = index && hasPolishCopy && !isIndexingDisabled();
  const pairs = index && isTranslatedPath(safePath);
  const languages = pairs
    ? {
        en: new URL(safePath, NEXT_PUBLIC_SITE_URL).toString(),
        pl: new URL(localizeHref("pl", safePath), NEXT_PUBLIC_SITE_URL).toString(),
        "x-default": new URL(safePath, NEXT_PUBLIC_SITE_URL).toString(),
      }
    : undefined;
  const images = [image];

  return {
    title,
    description,
    alternates: { canonical: url, ...(languages ? { languages } : {}) },
    openGraph: {
      title,
      description,
      url,
      siteName: NEXT_PUBLIC_SITE_NAME,
      locale: openGraphLocale(locale),
      type: "website",
      images,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: images.map((item) => item.url),
    },
    robots: indexable ? { index: true, follow: true } : { index: false, follow: false },
  };
}

export function serializeJsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

/** Same as `createPageMetadata`, with the locale taken from the current request. */
export async function getPageMetadata(input: Omit<PageMetadataInput, "locale">): Promise<Metadata> {
  const { getRequestLocale } = await import("@/lib/i18n/request");
  return createPageMetadata({ ...input, locale: await getRequestLocale() });
}
