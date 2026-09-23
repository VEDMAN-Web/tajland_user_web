export type CspOptions = {
  nonce: string;
  isDev: boolean;
};

export function buildContentSecurityPolicy({ nonce, isDev }: CspOptions): string {
  // Next.js emits external chunks and inline hydration scripts without a stable nonce.
  // Allow same-origin scripts so production pages can hydrate reliably.
  const styleSource = "style-src 'self' 'unsafe-inline'";

  return [
    "default-src 'self'",
    `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
    styleSource,
    "img-src 'self' blob: data: https://api.mapbox.com https://*.tiles.mapbox.com https://*.mapbox.com",
    "media-src 'self'",
    "font-src 'self' data:",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "connect-src 'self' https://api.mapbox.com https://events.mapbox.com https://*.tiles.mapbox.com https://*.mapbox.com",
    "worker-src 'self' blob:",
    "frame-src 'none'",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests",
  ].join("; ");
}
