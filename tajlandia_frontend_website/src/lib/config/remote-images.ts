// Hosts that backend image URLs may come from. `next.config.ts` turns these into
// `images.remotePatterns`; `next/image` throws for any other host, so UI code
// checks `isAllowedRemoteImage` first and shows a placeholder otherwise.
// TODO: replace once the backend moves images to its final CDN.
export const REMOTE_IMAGE_HOSTS = ["i.postimg.cc"] as const;

// Uploaded files (e.g. profile photos) are served by the backend itself, under
// this path on the `NEXT_PUBLIC_API_URL` host.
export const BACKEND_UPLOADS_PATH = "/uploads/";

/** The backend's hostname, or null when the API URL is missing or invalid. */
export function backendImageHost(apiUrl = process.env.NEXT_PUBLIC_API_URL): string | null {
  if (!apiUrl) return null;

  try {
    return new URL(apiUrl).hostname;
  } catch {
    return null;
  }
}

export function isAllowedRemoteImage(
  url: string | null | undefined,
  apiUrl = process.env.NEXT_PUBLIC_API_URL,
): url is string {
  if (!url) return false;

  try {
    const { protocol, hostname, pathname } = new URL(url);
    if (protocol !== "https:") return false;
    if ((REMOTE_IMAGE_HOSTS as readonly string[]).includes(hostname)) return true;
    return hostname === backendImageHost(apiUrl) && pathname.startsWith(BACKEND_UPLOADS_PATH);
  } catch {
    return false;
  }
}
