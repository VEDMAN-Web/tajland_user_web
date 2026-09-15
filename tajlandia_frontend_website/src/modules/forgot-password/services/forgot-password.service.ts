"use server";

import { apiPost, isApiError } from "@/lib/api/client";
import { requestOtpResponseSchema } from "@/modules/auth";
import { forgotPasswordSchema, type ForgotPasswordFormValues } from "../schemas/forgot-password.schema";

export type ForgotPasswordActionResult =
  | { ok: true; email: string }
  | { ok: false; message: string };

/**
 * Request OTP for password reset.
 * On success, returns the email so the page can navigate to /otp?email=...
 */
export async function forgotPasswordAction(
  values: ForgotPasswordFormValues,
): Promise<ForgotPasswordActionResult> {
  const parsed = forgotPasswordSchema.safeParse(values);

  if (!parsed.success) {
    return { ok: false, message: "Please check your email and try again." };
  }

  try {
    await apiPost(
      "/auth/request-otp",
      { email: parsed.data.email },
      requestOtpResponseSchema
    );

    return { ok: true, email: parsed.data.email };
  } catch (error) {
    if (!isApiError(error)) {
      throw error;
    }

    if (error.status === 404) {
      return {
        ok: false,
        message: "This email is not registered. Please sign up first.",
      };
    }

    if (error.status === 400) {
      return {
        ok: false,
        message: "Invalid email format. Please check and try again.",
      };
    }

    return {
      ok: false,
      message: "Unable to send OTP right now. Please try again.",
    };
  }
}
