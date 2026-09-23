import { getStoredToken } from "@/lib/api/auth.utils";

export async function logoutFromApi(): Promise<void> {
  const token = getStoredToken();
  if (!token) return;

  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 8_000);

  try {
    await fetch("/api/auth/logout", {
      method: "POST",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
      signal: controller.signal,
    });
  } catch {
    // Local cleanup still completes when the backend is unavailable.
  } finally {
    window.clearTimeout(timeout);
  }
}