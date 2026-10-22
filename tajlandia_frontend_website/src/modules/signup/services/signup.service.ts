"use server";

import { apiPost, isApiError } from "@/lib/api/client";
import { registerResponseSchema, requestOtpResponseSchema } from "@/lib/api/auth.schemas";
import { signupSchema, type SignupFormValues } from "../schemas/signup.schema";

export type SignupActionResult =
  | { ok: true; email?: string; redirectUrl?: string }
  | { ok: false; message: string };

// Step 1: Create the (unverified) account, then request the OTP email.
// The OTP page verifies it and logs the user in.
export async function requestSignupOtpAction(signupData: SignupFormValues): Promise<SignupActionResult> {
  const parsed = signupSchema.safeParse(signupData);

  if (!parsed.success) {
    return { ok: false, message: "Please check all required fields." };
  }

  const { firstName, lastName, email, newPassword } = parsed.data;

  try {
    const response = await apiPost(
      "/auth/register",
      { firstName, lastName, email, password: newPassword, role: "USER" },
      registerResponseSchema,
      { timeoutMs: 20_000 },
    );

    if (!response.success) {
      return { ok: false, message: response.message || "Failed to create account. Please check your details and try again." };
    }
  } catch (error) {
    if (isApiError(error)) {
      if (error.status === 409) {
        return { ok: false, message: "An account with this email already exists. Please log in." };
      }

      if (error.message !== "The request failed") {
        return { ok: false, message: error.message };
      }

      if (error.status === 400) {
        return { ok: false, message: "Invalid signup information. Please check your details and try again." };
      }
    }

    return { ok: false, message: "Unable to process signup right now. Please try again." };
  }

  // Step 2: register does not send the OTP, so request it explicitly.
  // The account already exists, so a failure here still goes to the OTP page,
  // where the user can use "Resend code".
  try {
    await apiPost("/auth/request-otp", { email: email.trim() }, requestOtpResponseSchema, { timeoutMs: 20_000 });
  } catch {
    // Ignore: handled by resend on the OTP page.
  }

  return {
    ok: true,
    email,
    redirectUrl: `/otp?email=${encodeURIComponent(email)}&mode=signup`,
  };
}
