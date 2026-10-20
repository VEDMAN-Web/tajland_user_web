import { NextRequest, NextResponse } from "next/server";
import { buildContentSecurityPolicy } from "@/lib/security/csp";

// `/blog/{id}` where the id can't be an article (ids are 24-hex Mongo ids, same as
// `isBlogId` in the blog module). The blog page streams behind a loading screen, so
// its own `notFound()` can only send a 200; checking here gives a real 404.
const INVALID_BLOG_PATH = /^\/blog\/(?![a-f\d]{24}\/?$)[^/]+\/?$/i;
// No route matches this, so Next renders `app/not-found.tsx` with a 404 status.
const NOT_FOUND_PATH = "/_not-found-page";

export function proxy(request: NextRequest) {
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const contentSecurityPolicy = buildContentSecurityPolicy({
    nonce,
    isDev: process.env.NODE_ENV === "development",
  });

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", contentSecurityPolicy);

  const response = INVALID_BLOG_PATH.test(request.nextUrl.pathname)
    ? NextResponse.rewrite(new URL(NOT_FOUND_PATH, request.url), {
        request: { headers: requestHeaders },
      })
    : NextResponse.next({
        request: { headers: requestHeaders },
      });
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
