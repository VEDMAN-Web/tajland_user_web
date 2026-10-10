import type { NextConfig } from "next";
import {
  BACKEND_UPLOADS_PATH,
  REMOTE_IMAGE_HOSTS,
  backendImageHost,
} from "./src/lib/config/remote-images";
import { getStaticSecurityHeaders } from "./src/lib/security/headers";

const backendHost = backendImageHost();

const nextConfig: NextConfig = {
  poweredByHeader: false,
  allowedDevOrigins: ["127.0.0.1"],
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
  async headers() {
    return [
      {
        source: "/:path*",
        headers: getStaticSecurityHeaders(process.env.NODE_ENV === "production"),
      },
    ];
  },
};

export default nextConfig;
