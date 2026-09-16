"use server";

import { forgotPasswordSchema, type ForgotPasswordFormValues } from "../schemas/forgot-password.schema";

export type RequestPasswordResetOtpResult =
  | { ok: true; email?: string; redirectUrl?: string }
  | { ok: false; message: string };

export async function requestPasswordResetOtpAction(
  values: ForgotPasswordFormValues,
): Promise<RequestPasswordResetOtpResult> {
  const parsed = forgotPasswordSchema.safeParse(values);

  if (!parsed.success) {
    return { ok: false, message: "Please check all required fields." };
  }

  try {
    // For testing: Go directly to OTP page with reset-password mode
    // In production, this would call request-otp endpoint
    return {
      ok: true,
      email: parsed.data.email,
      redirectUrl: `/otp?email=${encodeURIComponent(parsed.data.email)}&mode=reset-password`,
    };
  } catch (error) {
    return { ok: false, message: "Unable to process password reset right now. Please try again." };
  }
}
