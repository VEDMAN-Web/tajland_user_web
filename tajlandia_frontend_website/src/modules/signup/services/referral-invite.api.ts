import "server-only";

import { z } from "zod";
import { apiGet } from "@/lib/api/client";
import { apiEnvelope } from "@/lib/api/envelope";

// Real `GET /referral/validate/{code}` `data` (public). Never exposes the referrer's email.
const referralInviteSchema = z.object({
  valid: z.boolean(),
  referrerName: z.string().nullish(),
});

// Codes are short and alphanumeric (e.g. "66NQQ4N"); anything else is dropped before it
// reaches the API or the form.
const REFERRAL_CODE = /^[A-Za-z0-9]{3,32}$/;

/** The `?ref=` value as a clean upper-case code, or "" when it isn't one. */
export function cleanReferralCode(value: string | string[] | undefined): string {
  const code = (Array.isArray(value) ? value[0] : value)?.trim() ?? "";
  return REFERRAL_CODE.test(code) ? code.toUpperCase() : "";
}

/** Who sent this code: their first name, or null when the code is unknown or the API is down. */
export async function fetchReferrerName(code: string): Promise<string | null> {
  if (!code) return null;

  try {
    const response = await apiGet(
      `/referral/validate/${encodeURIComponent(code)}`,
      apiEnvelope(referralInviteSchema),
      { revalidate: 60, timeoutMs: 8_000 },
    );
    return response.data.valid ? (response.data.referrerName?.trim() || null) : null;
  } catch {
    return null;
  }
}
