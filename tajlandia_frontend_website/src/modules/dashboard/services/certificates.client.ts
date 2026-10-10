import { clearAuth, getStoredToken } from "@/lib/api/auth.utils";

export type CertificateDownloadResult =
  | { ok: true }
  | { ok: false; message: string; sessionExpired?: boolean };

/**
 * Saves an order's certificate image through `app/api/certificates/[id]`,
 * which checks the order with the user's token first.
 */
export async function downloadCertificate(orderId: string): Promise<CertificateDownloadResult> {
  const token = getStoredToken();
  if (!token) return { ok: false, message: "Your session has expired. Please log in again.", sessionExpired: true };

  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 45_000);

  try {
    const response = await fetch(`/api/certificates/${encodeURIComponent(orderId)}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
      signal: controller.signal,
    });

    if (response.status === 401) {
      clearAuth();
      return { ok: false, message: "Your session has expired. Please log in again.", sessionExpired: true };
    }
    if (!response.ok) return { ok: false, message: "We couldn't download your certificate. Please try again." };

    const disposition = response.headers.get("content-disposition") ?? "";
    const fileName = /filename="([^"]+)"/.exec(disposition)?.[1] ?? "certificate";
    const url = URL.createObjectURL(await response.blob());
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    return { ok: true };
  } catch {
    return { ok: false, message: "We couldn't download your certificate. Please try again." };
  } finally {
    window.clearTimeout(timeout);
  }
}
