import { NextRequest, NextResponse } from "next/server";
import { isLocalizedPath, LOCALE_HEADER, splitLocalePath } from "@/lib/i18n/locale";
import { buildContentSecurityPolicy } from "@/lib/security/csp";

// `/blog/{id}` where the id can't be an article (ids are 24-hex Mongo ids, same as
// `isBlogId` in the blog module). The blog page streams behind a loading screen, so
// its own `notFound()` can only send a 200; checking here gives a real 404.
const INVALID_BLOG_PATH = /^\/blog\/(?![a-f\d]{24}\/?$)[^/]+\/?$/i;
// No route matches this, so Next renders `app/not-found.tsx` with a 404 status.
const NOT_FOUND_PATH = "/_not-found-page";

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

  // `/pl/*` only exists for public pages; `/pl/dashboard` etc. are real 404s.
  const unknownPolishPath = locale === "pl" && !isLocalizedPath(internalPath);

  let response: NextResponse;
  if (unknownPolishPath || INVALID_BLOG_PATH.test(internalPath)) {
    response = NextResponse.rewrite(new URL(NOT_FOUND_PATH, request.url), {
      request: { headers: requestHeaders },
    });
  } else if (locale === "pl") {
    const target = request.nextUrl.clone();
    target.pathname = internalPath;
    response = NextResponse.rewrite(target, { request: { headers: requestHeaders } });
  } else {
    response = NextResponse.next({ request: { headers: requestHeaders } });
  }
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
