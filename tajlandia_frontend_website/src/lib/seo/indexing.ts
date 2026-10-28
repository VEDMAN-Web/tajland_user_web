/**
 * Test and staging hosts set `NEXT_PUBLIC_NOINDEX=true` so they never compete
 * with the real domain in search results. Production leaves it unset.
 */
export function isIndexingDisabled(): boolean {
  return process.env.NEXT_PUBLIC_NOINDEX === "true";
}

export const defaultOgImage = {
  url: "/images/brand/og-default.jpg",
  width: 1200,
  height: 630,
  alt: "Tajlandia",
} as const;
