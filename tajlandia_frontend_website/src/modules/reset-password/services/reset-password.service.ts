"use server";

import { cookies } from "next/headers";
import { z } from "zod";
import { apiPost, isApiError } from "@/lib/api/client";
import { resetPasswordResponseSchema } from "@/lib/api/auth.schemas";
import { resetPasswordSchema, type ResetPasswordFormValues } from "../schemas/reset-password.schema";

const RESET_VERIFIED_COOKIE = "tajlandia_password_reset";
const RESET_VERIFIED_MAX_AGE_SECONDS = 10 * 60;
const emailSchema = z.string().trim().email();

export type ResetPasswordActionResult =
  | { ok: true; message: string }
  | { ok: false; message: string };

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function apiMessage(error: unknown, fallback: string) {
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
      z.object({ success: z.boolean(), message: z.string().optional() }),
      { timeoutMs: 20_000 },
    );

    if (!response.success) {
      return { ok: false, message: response.message || "Invalid OTP. Please check and try again." };
    }

    const cookieStore = await cookies();
    cookieStore.set(RESET_VERIFIED_COOKIE, normalizedEmail, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: RESET_VERIFIED_MAX_AGE_SECONDS,
    });

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

  if (!verifiedEmail || verifiedEmail !== normalizedEmail) {
    return {
      ok: false,
      message: "Verify the code sent to your email before choosing a new password.",
    };
  }

  try {
    const response = await apiPost(
      "/auth/reset-password",
      {
        email: email.trim(),
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
      message: apiMessage(error, "Unable to reset password right now. Please try again."),
    };
  }
}
