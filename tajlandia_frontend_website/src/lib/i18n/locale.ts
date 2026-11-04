/**
 * Public-site locales. English lives at the root (`/blog`), Polish under `/pl`
 * (`/pl/blog`). `proxy.ts` rewrites `/pl/*` onto the same routes and sends the
 * locale in the `x-locale` request header, so no route files move.
 */
export const locales = ["en", "pl"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "en";

export const LOCALE_HEADER = "x-locale";

const POLISH_PREFIX = "/pl";

/** Public pages that exist in Polish. Everything else (auth, dashboard) stays unprefixed. */
const LOCALIZED_PATHS = /^\/(?:(?:explore|blog|contact|faq|terms|privacy)(?:\/[^/]+)?)?\/?$/;

/**
 * Pages whose body copy is fully translated. Other `/pl/*` pages render Polish
 * chrome around English content, so they stay `noindex` and out of the sitemap
 * and `hreflang` set until their copy is translated. Add a path here when it is.
 */
const TRANSLATED_PATHS = new Set<string>(["/"]);

export function isTranslatedPath(path: string): boolean {
  const clean = path.split(/[?#]/)[0] ?? path;
  return TRANSLATED_PATHS.has(clean.length > 1 ? clean.replace(/\/$/, "") : clean);
}

export function isLocale(value: unknown): value is Locale {
  return value === "en" || value === "pl";
}

export function isLocalizedPath(path: string): boolean {
  return LOCALIZED_PATHS.test(path);
}

/** `/pl/blog?x=1` -> `{ locale: "pl", path: "/blog?x=1" }` */
export function splitLocalePath(pathWithQuery: string): { locale: Locale; path: string } {
  if (pathWithQuery === POLISH_PREFIX || /^\/pl(?=[/?#])/.test(pathWithQuery)) {
    const rest = pathWithQuery.slice(POLISH_PREFIX.length);
    return { locale: "pl", path: rest === "" || /^[?#]/.test(rest) ? `/${rest}` : rest };
  }
  return { locale: "en", path: pathWithQuery };
}

/** Adds the locale prefix to a public path; leaves auth/dashboard/external links alone. */
export function localizeHref(locale: Locale, href: string): string {
  if (locale === "en" || !href.startsWith("/") || href.startsWith("//")) {
    return href;
  }

  const [pathAndQuery, hash] = href.split("#", 2) as [string, string | undefined];
  const [pathname, query] = pathAndQuery.split("?", 2) as [string, string | undefined];

  if (!isLocalizedPath(pathname)) {
    return href;
  }

  const localized = pathname === "/" ? POLISH_PREFIX : `${POLISH_PREFIX}${pathname}`;
  return `${localized}${query === undefined ? "" : `?${query}`}${hash === undefined ? "" : `#${hash}`}`;
}

export function htmlLang(locale: Locale): string {
  return locale;
}

export function openGraphLocale(locale: Locale): string {
  return locale === "pl" ? "pl_PL" : "en_US";
}
