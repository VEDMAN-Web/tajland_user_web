// Hosts that backend image URLs may come from. `next.config.ts` turns these into
// `images.remotePatterns`; `next/image` throws for any other host, so UI code
// checks `isAllowedRemoteImage` first and shows a placeholder otherwise.
// TODO: replace once the backend moves images to its final CDN.
export const REMOTE_IMAGE_HOSTS = ["i.postimg.cc"] as const;

export function isAllowedRemoteImage(url: string | null | undefined): url is string {
  if (!url) return false;

  try {
    const { protocol, hostname } = new URL(url);
    return (
      protocol === "https:" &&
      (REMOTE_IMAGE_HOSTS as readonly string[]).includes(hostname)
    );
  } catch {
    return false;
  }
}
