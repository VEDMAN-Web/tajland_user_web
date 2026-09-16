"use server";

import { apiPost, isApiError } from "@/lib/api/client";
import { authResponseBaseSchema } from "@/lib/api/auth.schemas";
import { resetPasswordSchema, type ResetPasswordFormValues } from "../schemas/reset-password.schema";

export type ResetPasswordActionResult =
  | { ok: true; message: string }
  | { ok: false; message: string };

export async function resetPasswordAction(
  email: string,
  otp: string,
  values: ResetPasswordFormValues,
): Promise<ResetPasswordActionResult> {
  const parsed = resetPasswordSchema.safeParse(values);

  if (!parsed.success) {
    return { ok: false, message: "Please check all required fields." };
  }

  // Validate OTP locally (OTP verification happens during the OTP page step)
  if (otp !== "123456") {
    return { ok: false, message: "Invalid OTP. For testing, use code 123456." };
  }

  try {
    // Backend endpoint: POST /api/v1/auth/reset-password
    // Payload: { email, newPassword, confirmPassword }
    // OTP is not passed here - it was verified on the OTP page before redirecting
    const resetPayload = {
      email,
      newPassword: parsed.data.newPassword,
      confirmPassword: parsed.data.confirmPassword,
    };

    console.log("[Reset Password] Calling /api/v1/auth/reset-password with email:", email);

    const response = await apiPost(
      "/api/v1/auth/reset-password",
      resetPayload,
      authResponseBaseSchema,
    );

    console.log("[Reset Password] Backend response:", response);

    if (!response.success) {
      return { ok: false, message: response.message || "Failed to reset password. Please try again." };
    }

    return { ok: true, message: "Password reset successfully! Redirecting to login..." };
  } catch (error) {
    console.error("[Reset Password] Error:", error);

    if (isApiError(error)) {
      console.log("[Reset Password] API Error Status:", error.status);

      if (error.status === 400) {
        return { ok: false, message: "Invalid email or password. Please check and try again." };
      }

      if (error.status === 404) {
        return { ok: false, message: "User not found. Please check your email." };
      }
    }

    return { ok: false, message: "Unable to reset password right now. Please try again." };
  }
}
