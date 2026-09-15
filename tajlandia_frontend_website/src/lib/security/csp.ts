export type CspOptions = {
  nonce: string;
  isDev: boolean;
  apiOrigin?: string;
};

export function buildContentSecurityPolicy({ nonce, isDev, apiOrigin }: CspOptions): string {
  let apiConnectOrigin = "";

  if (apiOrigin) {
    try {
      apiConnectOrigin = ` ${new URL(apiOrigin).origin}`;
    } catch {
      apiConnectOrigin = "";
    }
  }

  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${isDev ? " 'unsafe-eval'" : ""}`,
    `style-src 'self' 'nonce-${nonce}'`,
    "img-src 'self' blob: data:",
    "media-src 'self'",
    "font-src 'self' data:",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    `connect-src 'self'${apiConnectOrigin}`,
    "frame-src 'none'",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests",
  ].join("; ");
}
