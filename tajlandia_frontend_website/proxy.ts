import { NextRequest, NextResponse } from "next/server";
import { LOCALE_HEADER, splitLocalePath } from "@/lib/i18n/locale";
import { buildContentSecurityPolicy } from "@/lib/security/csp";

export function proxy(request: NextRequest) {
  const { locale, path: internalPath } = splitLocalePath(request.nextUrl.pathname);

  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const contentSecurityPolicy = buildContentSecurityPolicy({
    nonce,
    isDev: process.env.NODE_ENV === "development",
  });

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  // Always overwrite: the locale comes from the URL, never from the client.
  requestHeaders.set(LOCALE_HEADER, locale);
  requestHeaders.set("Content-Security-Policy", contentSecurityPolicy);

  // `/pl/*` is mapped onto the same routes, and bad blog ids are sent to a 404, by
  // `rewrites()` in next.config.ts. Rewrites built here would carry this
  // function's idea of the origin (https via x-forwarded-proto) while the server
  // itself is http, which makes Next try to proxy them and answer 500.
  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set("Content-Security-Policy", contentSecurityPolicy);

  return response;
}

export const config = {
  matcher: [
    {
      source: "/((?!api|_next/static|_next/image|favicon.ico|icon.png|apple-icon.png|apple-touch-icon.png).*)",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
};
