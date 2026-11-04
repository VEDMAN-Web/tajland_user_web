import {
  clearAuth,
  getStoredToken,
  getStoredUser,
  isRememberedSession,
  setAuthUser,
} from "@/lib/api/auth.utils";
import { authedGet } from "@/lib/api/browser-client";
import { authProfileSchema, type AuthProfile, type ProfileField } from "@/lib/api/profile.schema";

const SESSION_EXPIRED_MESSAGE = "Your session has expired. Please log in again.";

/** The signed-in user's profile, fresh from the backend. */
export function getProfile(signal?: AbortSignal): Promise<AuthProfile> {
  return authedGet("/auth/me", authProfileSchema, { signal });
}

export function profileName(profile: Pick<AuthProfile, "firstName" | "lastName">) {
  return [profile.firstName, profile.lastName].filter(Boolean).join(" ").trim();
}

/**
 * Saves the profile as the stored session user. Other pages still read the
 * older `name` / `phone` / `avatarUrl` keys, so those are kept in step.
 */
export function storeProfile(profile: AuthProfile) {
  setAuthUser(
    {
      ...(getStoredUser() ?? {}),
      ...profile,
      name: profileName(profile),
      phone: profile.mobileNumber ?? undefined,
      avatarUrl: profile.profileImage ?? undefined,
    },
    isRememberedSession(),
  );
}

export type UpdateProfileInput = {
  firstName: string;
  lastName: string;
  mobileNumber: string;
  profileImage?: File;
};

export type UpdateProfileResult =
  | { ok: true; profile: AuthProfile }
  | {
      ok: false;
      message: string;
      fieldErrors?: Partial<Record<ProfileField, string>>;
      sessionExpired?: boolean;
    };

/** `PUT /auth/edit-profile` through `app/api/auth/edit-profile` (multipart). */
export async function updateProfile(input: UpdateProfileInput): Promise<UpdateProfileResult> {
  const token = getStoredToken();
  if (!token) return { ok: false, message: SESSION_EXPIRED_MESSAGE, sessionExpired: true };

  const form = new FormData();
  form.set("firstName", input.firstName);
  form.set("lastName", input.lastName);
  form.set("mobileNumber", input.mobileNumber);
  if (input.profileImage) form.set("profileImage", input.profileImage);

  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 35_000);

  try {
    const response = await fetch("/api/auth/edit-profile", {
      method: "PUT",
      headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
      body: form,
      cache: "no-store",
      signal: controller.signal,
    });
    const json: unknown = await response.json().catch(() => null);
    const body = (json && typeof json === "object" ? json : {}) as {
      success?: unknown;
      message?: unknown;
      errors?: Partial<Record<ProfileField, string>>;
      data?: unknown;
    };

    if (response.status === 401) {
      clearAuth();
      return { ok: false, message: SESSION_EXPIRED_MESSAGE, sessionExpired: true };
    }

    if (response.ok && body.success === true) {
      const profile = authProfileSchema.safeParse(body.data);
      if (profile.success) return { ok: true, profile: profile.data };
    }

    const message = typeof body.message === "string" ? body.message : "";
    return {
      ok: false,
      message:
        !message || message === "Validation failed" || message === "The request failed"
          ? "We couldn't save your profile. Please try again."
          : message,
      fieldErrors: body.errors,
    };
  } catch {
    return { ok: false, message: "We couldn't save your profile. Please try again." };
  } finally {
    window.clearTimeout(timeout);
  }
}
