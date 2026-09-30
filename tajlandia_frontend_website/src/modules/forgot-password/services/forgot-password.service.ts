"use server";

import { requestOtpAction } from "@/modules/otp/services/otp.service";
import { forgotPasswordSchema, type ForgotPasswordFormValues } from "../schemas/forgot-password.schema";

export type RequestPasswordResetOtpResult =
  | { ok: true; email?: string; redirectUrl?: string }
  | { ok: false; message: string };

export async function requestPasswordResetOtpAction(
  values: ForgotPasswordFormValues,
): Promise<RequestPasswordResetOtpResult> {
  const parsed = forgotPasswordSchema.safeParse(values);

  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Please check all required fields." };
  }

  const otpResult = await requestOtpAction(parsed.data.email);

  if (!otpResult.ok) {
    return otpResult;
  }

  return {
    ok: true,
    email: parsed.data.email,
    redirectUrl: `/otp?email=${encodeURIComponent(parsed.data.email)}&mode=reset-password`,
  };
}
