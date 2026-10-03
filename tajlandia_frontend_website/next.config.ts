import type { NextConfig } from "next";
import { REMOTE_IMAGE_HOSTS } from "./src/lib/config/remote-images";
import { getStaticSecurityHeaders } from "./src/lib/security/headers";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  allowedDevOrigins: ["127.0.0.1"],
  images: {
    remotePatterns: REMOTE_IMAGE_HOSTS.map((hostname) => ({
      protocol: "https" as const,
      hostname,
      pathname: "/**",
    })),
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
