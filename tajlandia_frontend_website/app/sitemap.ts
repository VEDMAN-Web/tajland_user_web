import type { MetadataRoute } from "next";
import { getPublicEnv } from "@/lib/config/public-env";
import { routes } from "@/lib/constants/routes";
import { isTranslatedPath, localizeHref } from "@/lib/i18n/locale";
import { isIndexingDisabled } from "@/lib/seo/indexing";
import { fetchBlogPage } from "@/modules/blog";

// Blog posts come from the API, so build the list per request (the API client
// caches each response for a few minutes).
export const dynamic = "force-dynamic";

const BLOG_SITEMAP_PAGE_SIZE = 50;
const BLOG_SITEMAP_MAX_PAGES = 20;

type SitemapEntry = MetadataRoute.Sitemap[number];

async function blogPostEntries(absolute: (path: string) => string): Promise<SitemapEntry[]> {
  const entries: SitemapEntry[] = [];

  try {
    for (let page = 1; page <= BLOG_SITEMAP_MAX_PAGES; page += 1) {
      const result = await fetchBlogPage(page, BLOG_SITEMAP_PAGE_SIZE);

      for (const post of result.items) {
        const published = post.publishedAt ? new Date(post.publishedAt) : null;
        entries.push({
          url: absolute(`${routes.blog}/${post._id}`),
          ...(published && !Number.isNaN(published.getTime()) ? { lastModified: published } : {}),
          changeFrequency: "monthly",
          priority: 0.6,
        });
      }

      if (page >= result.pagination.totalPages) {
        break;
      }
    }
  } catch {
    // The API is down: serve the static pages rather than failing the sitemap.
  }

  return entries;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Test hosts must not advertise URLs to search engines.
  if (isIndexingDisabled()) {
    return [];
  }

  const { NEXT_PUBLIC_SITE_URL } = getPublicEnv();
  const absolute = (path: string) => new URL(path, NEXT_PUBLIC_SITE_URL).toString();

  // Legal pages stay out until counsel has approved their text.
  const pages: Array<{ path: string; priority: number; changeFrequency: SitemapEntry["changeFrequency"] }> = [
    { path: routes.home, priority: 1, changeFrequency: "weekly" },
    { path: routes.explore, priority: 0.9, changeFrequency: "weekly" },
    { path: "/faq", priority: 0.7, changeFrequency: "monthly" },
    { path: routes.blog, priority: 0.7, changeFrequency: "weekly" },
    { path: routes.contact, priority: 0.5, changeFrequency: "yearly" },
  ];

  const staticEntries = pages.flatMap(({ path, priority, changeFrequency }): SitemapEntry[] => {
    const english = absolute(path);

    if (!isTranslatedPath(path)) {
      return [{ url: english, changeFrequency, priority }];
    }

    const polish = absolute(localizeHref("pl", path));
    const alternates = { languages: { en: english, pl: polish } };

    return [
      { url: english, changeFrequency, priority, alternates },
      { url: polish, changeFrequency, priority, alternates },
    ];
  });

  return [...staticEntries, ...(await blogPostEntries(absolute))];
}
