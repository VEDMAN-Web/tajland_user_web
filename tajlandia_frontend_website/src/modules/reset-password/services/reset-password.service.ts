"use server";

import { cookies } from "next/headers";
import { z } from "zod";
import { apiPost, isApiError } from "@/lib/api/client";
import { RATE_LIMITED_MESSAGE } from "@/lib/api/errors";
import { resetPasswordResponseSchema, verifyOtpResponseSchema } from "@/lib/api/auth.schemas";
import { resetPasswordSchema, type ResetPasswordFormValues } from "../schemas/reset-password.schema";

const RESET_VERIFIED_COOKIE = "tajlandia_password_reset";
const RESET_TOKEN_COOKIE = "tajlandia_password_reset_token";
const RESET_VERIFIED_MAX_AGE_SECONDS = 10 * 60;
const emailSchema = z.string().trim().email();

export type ResetPasswordActionResult =
  | { ok: true; message: string }
  // `needsNewCode`: the verified session is gone, so the user must request a new OTP.
  | { ok: false; message: string; needsNewCode?: boolean };

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function apiMessage(error: unknown, fallback: string) {
  if (isApiError(error) && error.status === 429) {
    return RATE_LIMITED_MESSAGE;
  }

  if (isApiError(error) && error.message !== "The request failed" && error.message !== "Validation failed") {
    return error.message;
  }

  if (isApiError(error) && error.status === 404) {
    return "User not found. Please check your email.";
  }

  if (isApiError(error) && error.status === 400) {
    return fallback;
  }

  return fallback;
}

export async function verifyPasswordResetOtpAction(
  email: string,
  otp: string,
): Promise<ResetPasswordActionResult> {
  const normalizedEmail = normalizeEmail(email);

  if (!emailSchema.safeParse(normalizedEmail).success || !/^\d{6}$/.test(otp.trim())) {
    return { ok: false, message: "Enter the 6-digit code sent to your email." };
  }

  try {
    const response = await apiPost(
      "/auth/verify-otp",
      { email: email.trim(), otp: otp.trim() },
      verifyOtpResponseSchema,
      { timeoutMs: 20_000 },
    );

    if (!response.success) {
      return { ok: false, message: response.message || "Invalid OTP. Please check and try again." };
    }

    // Without the one-time token the backend rejects the reset, so stop here.
    const resetToken = response.data?.resetToken;

    if (!resetToken) {
      return { ok: false, message: "Couldn't verify this code for a password reset. Please request a new code." };
    }

    const cookieStore = await cookies();
    const cookieOptions = {
      httpOnly: true,
      sameSite: "lax" as const,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: RESET_VERIFIED_MAX_AGE_SECONDS,
    };
    cookieStore.set(RESET_VERIFIED_COOKIE, normalizedEmail, cookieOptions);
    cookieStore.set(RESET_TOKEN_COOKIE, resetToken, cookieOptions);

    return { ok: true, message: response.message || "OTP verified successfully." };
  } catch (error) {
    return {
      ok: false,
      message: apiMessage(error, "Invalid OTP. Please check the code and try again."),
    };
  }
}

export async function resetPasswordAction(
  email: string,
  values: ResetPasswordFormValues,
): Promise<ResetPasswordActionResult> {
  const parsed = resetPasswordSchema.safeParse(values);

  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Please check all required fields." };
  }

  const normalizedEmail = normalizeEmail(email);

  if (!emailSchema.safeParse(normalizedEmail).success) {
    return { ok: false, message: "Email is required. Please start the password reset process again." };
  }

  const cookieStore = await cookies();
  const verifiedEmail = cookieStore.get(RESET_VERIFIED_COOKIE)?.value;
  const resetToken = cookieStore.get(RESET_TOKEN_COOKIE)?.value;

  if (!verifiedEmail || !resetToken || verifiedEmail !== normalizedEmail) {
    return {
      ok: false,
      message: "Your password reset session has expired. Please request a new code.",
      needsNewCode: true,
    };
  }

  try {
    const response = await apiPost(
      "/auth/reset-password",
      {
        email: email.trim(),
        resetToken,
        newPassword: parsed.data.newPassword,
        confirmPassword: parsed.data.confirmPassword,
      },
      resetPasswordResponseSchema,
      { timeoutMs: 20_000 },
    );

    if (!response.success) {
      return { ok: false, message: response.message || "Failed to reset password. Please try again." };
    }

    cookieStore.delete(RESET_VERIFIED_COOKIE);
    cookieStore.delete(RESET_TOKEN_COOKIE);

    return {
      ok: true,
      message: response.message || "Password reset successfully. You can now log in with your new password.",
    };
  } catch (error) {
    if (isApiError(error) && error.status === 502 && error.code === "API_INVALID_RESPONSE") {
      return { ok: false, message: "Invalid response from server. Please try again." };
    }

    return {
      ok: false,
      message: apiMessage(
        error,
        isApiError(error) && error.status === 400
          ? "This reset session expired or was already used. Please request a new code."
          : "Unable to reset password right now. Please try again.",
      ),
    };
  }
}
