import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { readSafeApiMessage } from "@/lib/api/errors";
import { getServerEnv } from "@/lib/config/server-env";
import {
  authProfileSchema,
  PROFILE_IMAGE_MAX_BYTES,
  PROFILE_IMAGE_TYPES,
  PROFILE_MOBILE_PATTERN,
  PROFILE_NAME_PATTERN,
  type ProfileField,
} from "@/lib/api/profile.schema";

// The photo plus a few short text fields.
const MAX_REQUEST_BYTES = PROFILE_IMAGE_MAX_BYTES + 64 * 1024;
const PROFILE_FIELDS: readonly ProfileField[] = ["firstName", "lastName", "mobileNumber", "profileImage"];

const nameSchema = z.string().trim().min(2).max(50).regex(PROFILE_NAME_PATTERN);
const textFieldsSchema = z.object({
  firstName: nameSchema.optional(),
  lastName: nameSchema.optional(),
  mobileNumber: z.string().trim().regex(PROFILE_MOBILE_PATTERN).optional(),
});

function jsonResponse(body: Record<string, unknown>, status: number) {
  return NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });
}

function textField(form: FormData, name: string) {
  const value = form.get(name);
  return typeof value === "string" && value.trim() ? value : undefined;
}

// `errors: { firstName: ["..."] }` from the backend, reduced to safe messages.
function readFieldErrors(json: unknown) {
  if (!json || typeof json !== "object" || !("errors" in json)) return undefined;
  const errors = json.errors;
  if (!errors || typeof errors !== "object") return undefined;

  const result: Partial<Record<ProfileField, string>> = {};
  for (const field of PROFILE_FIELDS) {
    const raw = (errors as Record<string, unknown>)[field];
    const first = Array.isArray(raw) ? raw[0] : raw;
    const message = readSafeApiMessage({ message: first }, "");
    if (message) result[field] = message;
  }
  return Object.keys(result).length ? result : undefined;
}

/**
 * Forwards the Edit Profile form (multipart, with an optional photo) to
 * `PUT /auth/edit-profile`. The generic `/api/backend` proxy only carries JSON.
 */
export async function PUT(request: NextRequest) {
  const authorization = request.headers.get("authorization");
  const apiUrl = getServerEnv().NEXT_PUBLIC_API_URL;

  if (!authorization?.startsWith("Bearer ") || !apiUrl) {
    return jsonResponse({ success: false, message: "Authentication is required." }, 401);
  }

  if (Number(request.headers.get("content-length")) > MAX_REQUEST_BYTES) {
    return jsonResponse(
      { success: false, message: "Profile photo must be 2 MB or smaller.", errors: { profileImage: "Profile photo must be 2 MB or smaller." } },
      413,
    );
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return jsonResponse({ success: false, message: "Validation failed" }, 400);
  }

  const parsed = textFieldsSchema.safeParse({
    firstName: textField(form, "firstName"),
    lastName: textField(form, "lastName"),
    mobileNumber: textField(form, "mobileNumber"),
  });
  if (!parsed.success) {
    return jsonResponse({ success: false, message: "Validation failed" }, 400);
  }

  const image = form.get("profileImage");
  if (image !== null && !(image instanceof File)) {
    return jsonResponse({ success: false, message: "Validation failed" }, 400);
  }
  if (image && !(PROFILE_IMAGE_TYPES as readonly string[]).includes(image.type)) {
    const message = "Please choose a JPG, PNG or WebP image.";
    return jsonResponse({ success: false, message, errors: { profileImage: message } }, 400);
  }
  if (image && image.size > PROFILE_IMAGE_MAX_BYTES) {
    const message = "Profile photo must be 2 MB or smaller.";
    return jsonResponse({ success: false, message, errors: { profileImage: message } }, 400);
  }

  const outgoing = new FormData();
  for (const [key, value] of Object.entries(parsed.data)) {
    if (value) outgoing.set(key, value);
  }
  if (image && image.size > 0) outgoing.set("profileImage", image, image.name || "profile");

  let response: Response;
  try {
    response = await fetch(`${apiUrl.replace(/\/$/, "")}/auth/edit-profile`, {
      method: "PUT",
      headers: { Accept: "application/json", Authorization: authorization },
      body: outgoing,
      cache: "no-store",
      signal: AbortSignal.timeout(30_000),
    });
  } catch (error) {
    const timedOut = error instanceof Error && error.name === "TimeoutError";
    return jsonResponse(
      { success: false, message: timedOut ? "The request timed out" : "Unable to reach the API" },
      timedOut ? 504 : 503,
    );
  }

  const json: unknown = await response.json().catch(() => null);
  const ok = response.ok && json !== null && typeof json === "object" && "success" in json && json.success === true;

  if (!ok) {
    return jsonResponse(
      {
        success: false,
        message: readSafeApiMessage(json, "The request failed"),
        errors: readFieldErrors(json),
      },
      response.ok ? 502 : response.status,
    );
  }

  const profile = authProfileSchema.safeParse((json as { data?: unknown }).data);
  if (!profile.success) {
    return jsonResponse({ success: false, message: "Unexpected API response" }, 502);
  }

  // `edit-profile` sends "/uploads/..." where `/auth/me` sends a full URL.
  const { profileImage } = profile.data;
  const data =
    profileImage?.startsWith("/") && !profileImage.startsWith("//")
      ? { ...profile.data, profileImage: new URL(profileImage, apiUrl).toString() }
      : profile.data;

  return jsonResponse({ success: true, message: readSafeApiMessage(json, "Profile updated successfully"), data }, 200);
}
