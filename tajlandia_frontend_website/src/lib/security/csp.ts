export type CspOptions = {
  nonce: string;
  isDev: boolean;
};

export function buildContentSecurityPolicy({ nonce, isDev }: CspOptions): string {
  // Next.js emits external chunks and inline hydration scripts without a stable nonce.
  // Allow same-origin scripts so production pages can hydrate reliably.
  const styleSource = "style-src 'self' 'unsafe-inline' https://accounts.google.com/gsi/style";
  // Google Identity Services (Sign in with Google on the login page).
  const googleGsi = "https://accounts.google.com/gsi/";

  return [
    "default-src 'self'",
    `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""} https://accounts.google.com/gsi/client`,
    styleSource,
    "img-src 'self' blob: data: https://api.mapbox.com https://*.tiles.mapbox.com https://*.mapbox.com",
    "media-src 'self'",
    "font-src 'self' data:",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    `connect-src 'self' https://api.mapbox.com https://events.mapbox.com https://*.tiles.mapbox.com https://*.mapbox.com ${googleGsi}`,
    "worker-src 'self' blob:",
    `frame-src ${googleGsi}`,
    "frame-ancestors 'none'",
    "upgrade-insecure-requests",
  ].join("; ");
}
