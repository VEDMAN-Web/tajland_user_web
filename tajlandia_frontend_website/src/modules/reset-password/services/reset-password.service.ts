"use server";

import { apiPost, isApiError } from "@/lib/api/client";
import { resetPasswordResponseSchema } from "@/lib/api/auth.schemas";
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

  // Validate email is present
  if (!email || email.trim() === "") {
    return { ok: false, message: "Email is required. Please start the password reset process again." };
  }

  // Validate OTP locally (OTP verification happens during the OTP page step)
  if (!otp || otp.trim() !== "123456") {
    return { ok: false, message: "Invalid OTP. For testing, use code 123456." };
  }

  try {
    const resetPayload = {
      email,
      newPassword: parsed.data.newPassword,
      confirmPassword: parsed.data.confirmPassword,
    };

    console.log("[Reset Password] Payload:", resetPayload);

    const response = await apiPost(
      "/api/v1/auth/reset-password",
      resetPayload,
      resetPasswordResponseSchema,
    );

    console.log("[Reset Password] Full response:", JSON.stringify(response, null, 2));
    console.log("[Reset Password] response.success:", response.success);
    console.log("[Reset Password] response.message:", response.message);

    if (response.success) {
      return { ok: true, message: response.message || "Password reset successfully! Redirecting to login..." };
    } else {
      return { ok: false, message: response.message || "Failed to reset password. Please try again." };
    }
  } catch (error) {
    console.error("[Reset Password] Error caught:", error);
    console.error("[Reset Password] Error type:", error instanceof Error ? error.constructor.name : typeof error);

    if (isApiError(error)) {
      console.error("[Reset Password] API Error - Status:", error.status, "Code:", error.code, "Message:", error.message);

      // Handle schema validation failure (invalid response format)
      if (error.status === 502 && error.code === "API_INVALID_RESPONSE") {
        console.error("[Reset Password] Response validation failed - backend response format unexpected");
        return { ok: false, message: "Invalid response from server. Please try again." };
      }

      if (error.status === 400) {
        return { ok: false, message: "Invalid email or password. Please check and try again." };
      }

      if (error.status === 404) {
        return { ok: false, message: "User not found. Please check your email." };
      }

      if (error.status === 500) {
        return { ok: false, message: error.message || "Server error. Please try again." };
      }

      // Generic API error
      return { ok: false, message: `API Error (${error.status}): ${error.message}` };
    }

    const errorMessage = error instanceof Error ? error.message : "Unable to reset password right now. Please try again.";
    return { ok: false, message: errorMessage };
  }
}
