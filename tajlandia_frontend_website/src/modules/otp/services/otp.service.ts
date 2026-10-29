"use server";

import { apiPost, isApiError } from "@/lib/api/client";
import { RATE_LIMITED_MESSAGE } from "@/lib/api/errors";
import { verifyOtpResponseSchema, requestOtpResponseSchema, loginResponseSchema } from "@/lib/api/auth.schemas";
import type { SignupFormValues } from "@/modules/signup/schemas/signup.schema";

export type VerifyOtpActionResult =
  | { ok: true; token?: string; user?: Record<string, unknown> }
  | { ok: false; message: string };

export async function verifyOtpAction(email: string, otp: string): Promise<VerifyOtpActionResult> {
  if (!email || !otp || otp.length !== 6) {
    return { ok: false, message: "Please enter a valid email and 6-digit code." };
  }

  try {
    const response = await apiPost(
      "/auth/verify-otp",
      { email: email.trim(), otp: otp.trim() },
      verifyOtpResponseSchema,
      { timeoutMs: 20_000 },
    );

    if (!response.success) {
      return { ok: false, message: response.message || "OTP verification failed. Please try again." };
    }

    return {
      ok: true,
      token: response.data?.accessToken,
      user: response.data?.user,
    };
  } catch (error) {
    if (isApiError(error)) {
      if (error.status === 429) {
        return { ok: false, message: RATE_LIMITED_MESSAGE };
      }

      if (error.message !== "The request failed") {
        return { ok: false, message: error.message };
      }

      if (error.status === 400) {
        return { ok: false, message: "Invalid OTP. Please check and try again." };
      }

      if (error.status === 401 || error.status === 403) {
        return { ok: false, message: "OTP verification failed. Please request a new code." };
      }

      if (error.status === 404) {
        return { ok: false, message: "Email not found. Please check and try again." };
      }
    }

    return { ok: false, message: "Unable to verify OTP right now. Please try again." };
  }
}

export type RequestOtpActionResult =
  | { ok: true }
  | { ok: false; message: string };

export async function requestOtpAction(email: string): Promise<RequestOtpActionResult> {
  if (!email) {
    return { ok: false, message: "Please enter a valid email address." };
  }

  try {
    const response = await apiPost(
      "/auth/request-otp",
      { email: email.trim() },
      requestOtpResponseSchema,
      { timeoutMs: 20_000 },
    );

    if (!response.success) {
      return { ok: false, message: response.message || "Failed to request OTP. Please try again." };
    }

    return { ok: true };
  } catch (error) {
    if (isApiError(error)) {
      if (error.status === 429) {
        return { ok: false, message: RATE_LIMITED_MESSAGE };
      }

      if (error.message !== "The request failed") {
        return { ok: false, message: error.message };
      }

      if (error.status === 400) {
        return { ok: false, message: "Please enter a valid email address." };
      }

      if (error.status === 404) {
        return { ok: false, message: "User not found. Please check your email address." };
      }
    }

    return { ok: false, message: "Unable to request OTP right now. Please try again." };
  }
}

export type ResendOtpActionResult =
  | { ok: true }
  | { ok: false; message: string; rateLimited?: boolean };

export type CompleteSignupWithOtpResult =
  | { ok: true; token?: string; user?: Record<string, unknown> }
  | { ok: false; message: string };

export async function completeSignupWithOtpAction(
  email: string,
  otp: string,
  signupData: SignupFormValues,
): Promise<CompleteSignupWithOtpResult> {
  // Step 1: Verify the email (the account was created on the signup page).
  const verified = await verifyOtpAction(email, otp);

  if (!verified.ok) {
    return verified;
  }

  // Step 2: verify-otp returns no token, so log in with the signup credentials.
  // The email is verified either way; without a token the user logs in manually.
  try {
    const loginResponse = await apiPost(
      "/auth/login",
      { email: signupData.email, password: signupData.newPassword, role: "USER" },
      loginResponseSchema,
      { timeoutMs: 20_000 },
    );

    if (!loginResponse.success) {
      return { ok: true };
    }

    return {
      ok: true,
      token: loginResponse.data?.accessToken,
      user: loginResponse.data?.user,
    };
  } catch {
    return { ok: true };
  }
}

export async function resendOtpAction(email: string): Promise<ResendOtpActionResult> {
  if (!email) {
    return { ok: false, message: "Please enter a valid email address." };
  }

  try {
    const response = await apiPost(
      "/auth/resend-otp",
      { email: email.trim() },
      requestOtpResponseSchema,
      { timeoutMs: 20_000 },
    );

    if (!response.success) {
      return { ok: false, message: response.message || "Failed to resend OTP. Please try again." };
    }

    return { ok: true };
  } catch (error) {
    if (isApiError(error)) {
      if (error.status === 429) {
        return { ok: false, message: RATE_LIMITED_MESSAGE, rateLimited: true };
      }

      if (error.message !== "The request failed") {
        return { ok: false, message: error.message };
      }

      if (error.status === 400) {
        return { ok: false, message: "Please enter a valid email address." };
      }

      if (error.status === 404) {
        return { ok: false, message: "User not found. Please check your email address." };
      }
    }

    return { ok: false, message: "Unable to resend OTP right now. Please try again." };
  }
}
