import type { NextConfig } from "next";
import {
  BACKEND_UPLOADS_PATH,
  REMOTE_IMAGE_HOSTS,
  backendImageHost,
} from "./src/lib/config/remote-images";
import { getStaticSecurityHeaders } from "./src/lib/security/headers";

const backendHost = backendImageHost();
const isDev = process.env.NODE_ENV === "development";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // Dev only: lets the app be opened through a dev tunnel (VS Code "Forwarded Ports" / Dev Tunnels).
  allowedDevOrigins: ["127.0.0.1", "*.devtunnels.ms"],
  experimental: {
    // A Server Action (login, signup...) is rejected when its `Origin` differs from the host the
    // request was forwarded for, which is what a tunnel does. Allow the local and tunnel origins in
    // development only; production keeps the default same-origin check.
    serverActions: isDev ? { allowedOrigins: ["localhost:3000", "localhost:3001", "*.devtunnels.ms"] } : undefined,
  },
  logging: {
    // Dev logs print server action arguments, including signup passwords
    serverFunctions: false,
  },
  images: {
    remotePatterns: [
      ...REMOTE_IMAGE_HOSTS.map((hostname) => ({
        protocol: "https" as const,
        hostname,
        pathname: "/**",
      })),
      ...(backendHost
        ? [{ protocol: "https" as const, hostname: backendHost, pathname: `${BACKEND_UPLOADS_PATH}**` }]
        : []),
    ],
  },
  async rewrites() {
    // Polish pages live under /pl but are served by the same routes. proxy.ts
    // tags those requests with x-locale: pl. Only public pages are listed, so
    // /pl/dashboard and the like stay 404.
    return {
      beforeFiles: [
        // `/blog/{id}` where the id can't be an article (ids are 24-hex Mongo ids,
        // same as `isBlogId` in the blog module). The blog page streams behind a
        // loading screen, so its own `notFound()` can only send a 200; no route
        // matches this destination, so Next renders app/not-found.tsx with a 404.
        { source: "/blog/:blogId((?![a-fA-F0-9]{24}$)[^/]+)", destination: "/_not-found-page" },
        { source: "/pl/blog/:blogId((?![a-fA-F0-9]{24}$)[^/]+)", destination: "/_not-found-page" },
        { source: "/pl", destination: "/" },
        { source: "/pl/:page(explore|blog|contact|faq|terms|privacy)", destination: "/:page" },
        { source: "/pl/blog/:blogId", destination: "/blog/:blogId" },
      ],
      afterFiles: [],
      fallback: [],
    };
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: getStaticSecurityHeaders(process.env.NODE_ENV === "production"),
      },
      {
        // Sign in with Google opens a popup that must message back to this page.
        source: "/login",
        headers: [{ key: "Cross-Origin-Opener-Policy", value: "same-origin-allow-popups" }],
      },
    ];
  },
};

export default nextConfig;
