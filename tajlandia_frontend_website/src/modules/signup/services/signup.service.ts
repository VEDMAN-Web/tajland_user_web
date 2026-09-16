"use server";

import { apiPost, isApiError } from "@/lib/api/client";
import { registerResponseSchema } from "@/lib/api/auth.schemas";
import { signupSchema, type SignupFormValues } from "../schemas/signup.schema";

export type SignupActionResult =
  | { ok: true; email?: string; redirectUrl?: string }
  | { ok: false; message: string };

export type CompleteSignupActionResult =
  | { ok: true; token?: string; user?: Record<string, unknown> }
  | { ok: false; message: string };

// Step 1: Validate signup and prepare for OTP verification
// (Skip requesting OTP, go directly to OTP page with default 123456 for testing)
export async function requestSignupOtpAction(signupData: SignupFormValues): Promise<SignupActionResult> {
  const parsed = signupSchema.safeParse(signupData);

  if (!parsed.success) {
    return { ok: false, message: "Please check all required fields." };
  }

  // Store signup data in sessionStorage for OTP verification
  try {
    // For testing: redirect directly to OTP page with default 123456
    // In production, this would call request-otp endpoint
    return {
      ok: true,
      email: parsed.data.email,
      redirectUrl: `/otp?email=${encodeURIComponent(parsed.data.email)}&mode=signup`,
    };
  } catch (error) {
    return { ok: false, message: "Unable to process signup right now. Please try again." };
  }
}
