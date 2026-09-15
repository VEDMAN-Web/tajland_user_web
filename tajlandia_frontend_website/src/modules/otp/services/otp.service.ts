"use server";

import { redirect } from "next/navigation";
import { apiPost, isApiError } from "@/lib/api/client";
import { 
  verifyOtpResponseSchema, 
  resendOtpResponseSchema 
} from "@/modules/auth";
import { otpSchema } from "../schemas/otp.schema";

export type OtpActionResult =
  | { ok: true }
  | { ok: false; message: string };

/**
 * Verify OTP code sent to user's email.
 * On success, redirects to home page (email is now verified).
 */
export async function verifyOtpAction(
  email: string,
  code: string
): Promise<OtpActionResult> {
  const parsed = otpSchema.safeParse(code);

  if (!parsed.success) {
    return { 
      ok: false, 
      message: parsed.error.issues[0]?.message ?? "Invalid OTP format." 
    };
  }

  try {
    await apiPost(
      "/auth/verify-otp",
      { email, otp: parsed.data },
      verifyOtpResponseSchema
    );
  } catch (error) {
    if (!isApiError(error)) {
      throw error;
    }

    if (error.status === 400) {
      return { 
        ok: false, 
        message: "Invalid or expired OTP. Please request a new one." 
      };
    }

    if (error.status === 404) {
      return { 
        ok: false, 
        message: "Email not found. Please register first." 
      };
    }

    return {
      ok: false,
      message: "Unable to verify OTP right now. Please try again.",
    };
  }

  // OTP verified — redirect to home
  redirect("/");
}

export type ResendOtpActionResult =
  | { ok: true; message: string }
  | { ok: false; message: string };

/**
 * Resend OTP to user's email.
 * Has 60-second cooldown on backend to prevent spam.
 */
export async function resendOtpAction(email: string): Promise<ResendOtpActionResult> {
  try {
    const response = await apiPost(
      "/auth/resend-otp",
      { email },
      resendOtpResponseSchema
    );

    return {
      ok: true,
      message: `New OTP sent to ${response.data.email}. Valid for ${Math.floor(response.data.expiresIn / 60)} minutes.`,
    };
  } catch (error) {
    if (!isApiError(error)) {
      throw error;
    }

    if (error.status === 400) {
      return {
        ok: false,
        message: "Please wait before requesting another OTP.",
      };
    }

    if (error.status === 404) {
      return {
        ok: false,
        message: "Email not found. Please register first.",
      };
    }

    return {
      ok: false,
      message: "Unable to resend OTP right now. Please try again.",
    };
  }
}
