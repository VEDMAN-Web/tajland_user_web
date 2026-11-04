import { getStoredToken } from "@/lib/api/auth.utils";

export type ChangePasswordField = "currentPassword" | "newPassword";

export type ChangePasswordResult =
  | { ok: true; message: string }
  | { ok: false; status: number; message: string; field?: ChangePasswordField; sessionExpired?: boolean };

function isAccessTokenExpired(token: string) {
  const payload = token.split(".")[1];

  if (!payload) {
    return false;
  }

  try {
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const json = JSON.parse(atob(normalized)) as { exp?: number };
    return typeof json.exp === "number" && json.exp * 1000 <= Date.now();
  } catch {
    return false;
  }
}

function mapFailure(status: number, message: string, token: string): ChangePasswordResult {
  if (status === 401) {
    if (isAccessTokenExpired(token)) {
      return {
        ok: false,
        status,
        message: "Your session has expired. Please log in again.",
        sessionExpired: true,
      };
    }

    return {
      ok: false,
      status,
      message: "Current password is incorrect",
      field: "currentPassword",
    };
  }

  if (status === 400 && /differ/i.test(message)) {
    return {
      ok: false,
      status,
      message: "New password must differ from current password",
      field: "newPassword",
    };
  }

  if (status === 429) {
    return { ok: false, status, message: "Too many attempts. Please try again later." };
  }

  if (message === "Validation failed" || message === "The request failed") {
    return {
      ok: false,
      status,
      message: "We couldn't update your password. Your credentials remain unchanged.",
    };
  }

  return { ok: false, status, message };
}

export async function changePassword(values: {
  currentPassword: string;
  newPassword: string;
}): Promise<ChangePasswordResult> {
  const token = getStoredToken();

  if (!token) {
    return {
      ok: false,
      status: 401,
      message: "Your session has expired. Please log in again.",
      sessionExpired: true,
    };
  }

  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 20_000);

  try {
    const response = await fetch("/api/auth/change-password", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(values),
      cache: "no-store",
      signal: controller.signal,
    });
    const json: unknown = await response.json().catch(() => null);
    const message = json && typeof json === "object" && "message" in json && typeof json.message === "string"
      ? json.message
      : "The request failed";
    const success = json && typeof json === "object" && "success" in json ? json.success === true : response.ok;

    if (response.ok && success) {
      return { ok: true, message: message || "Password changed successfully" };
    }

    return mapFailure(response.status, message, token);
  } catch {
    return {
      ok: false,
      status: 503,
      message: "Unable to update your password right now. Please try again.",
    };
  } finally {
    window.clearTimeout(timeout);
  }
}
