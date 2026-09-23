"use server";

import { apiPost, isApiError } from "@/lib/api/client";
import { verifyOtpResponseSchema, registerResponseSchema, loginResponseSchema } from "@/lib/api/auth.schemas";
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
      { email, otp },
      verifyOtpResponseSchema,
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
      { email },
      verifyOtpResponseSchema,
    );

    if (!response.success) {
      return { ok: false, message: response.message || "Failed to request OTP. Please try again." };
    }

    return { ok: true };
  } catch (error) {
    if (isApiError(error)) {
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
  | { ok: false; message: string };

export type CompleteSignupWithOtpResult =
  | { ok: true; token?: string; user?: Record<string, unknown> }
  | { ok: false; message: string };

export async function completeSignupWithOtpAction(
  email: string,
  otp: string,
  signupData: SignupFormValues,
): Promise<CompleteSignupWithOtpResult> {
  if (!email || !otp || otp.length !== 6) {
    return { ok: false, message: "Please enter a valid email and 6-digit OTP code." };
  }

  try {
    // For testing: Accept OTP 123456 to bypass verification
    if (otp !== "123456") {
      return { ok: false, message: "Invalid OTP. For testing, use code 123456." };
    }

    // Step 1: Create the user account via register endpoint
    const registerPayload = {
      email: signupData.email,
      password: signupData.newPassword,
      name: `${signupData.firstName} ${signupData.lastName}`,
      role: "USER",
    };

    const registerResponse = await apiPost(
      "/auth/register",
      registerPayload,
      registerResponseSchema,
    );

    if (!registerResponse.success) {
      return { ok: false, message: registerResponse.message || "Failed to create account. Please check your details and try again." };
    }

    // Step 2: Login with the newly created credentials to get authentication token
    const loginPayload = {
      email: signupData.email,
      password: signupData.newPassword,
      role: "USER",
    };

    const loginResponse = await apiPost(
      "/auth/login",
      loginPayload,
      loginResponseSchema,
    );

    if (!loginResponse.success) {
      // If login fails, still consider signup successful since account was created
      return {
        ok: true,
        token: undefined,
        user: {
          name: registerResponse.data?.name,
          email: registerResponse.data?.email,
          id: registerResponse.data?.id,
        },
      };
    }

    return {
      ok: true,
      token: loginResponse.data?.accessToken,
      user: loginResponse.data?.user,
    };
  } catch (error) {
    if (isApiError(error)) {
      if (error.status === 400) {
        return { ok: false, message: "Invalid signup information. Please check your details and try again." };
      }

      if (error.status === 409) {
        return { ok: false, message: "An account with this email already exists." };
      }
    }

    return { ok: false, message: "Unable to complete signup right now. Please try again." };
  }
}

export async function resendOtpAction(email: string): Promise<ResendOtpActionResult> {
  if (!email) {
    return { ok: false, message: "Please enter a valid email address." };
  }

  try {
    const response = await apiPost(
      "/auth/resend-otp",
      { email },
      verifyOtpResponseSchema,
    );

    if (!response.success) {
      return { ok: false, message: response.message || "Failed to resend OTP. Please try again." };
    }

    return { ok: true };
  } catch (error) {
    if (isApiError(error)) {
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
