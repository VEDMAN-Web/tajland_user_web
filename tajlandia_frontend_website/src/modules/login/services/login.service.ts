"use server";

import { apiPost, isApiError } from "@/lib/api/client";
import { loginResponseSchema } from "@/lib/api/auth.schemas";
import { loginSchema, type LoginFormValues } from "../schemas/login.schema";

export type LoginActionResult =
  | { ok: true; token?: string; user?: Record<string, unknown> }
  | { ok: false; message: string };

export async function loginAction(values: LoginFormValues): Promise<LoginActionResult> {
  const parsed = loginSchema.safeParse(values);

  if (!parsed.success) {
    return { ok: false, message: "Please check your email and password." };
  }

  try {
    const response = await apiPost(
      "/auth/login",
      { ...parsed.data, role: "USER" },
      loginResponseSchema,
    );

    if (!response.success) {
      return { ok: false, message: response.message || "Login failed. Please try again." };
    }

    return {
      ok: true,
      token: response.data?.accessToken,
      user: response.data?.user,
    };
  } catch (error) {
    if (isApiError(error)) {
      if (error.status === 401 || error.status === 403) {
        return { ok: false, message: "Invalid email or password." };
      }

      if (error.status === 400) {
        return { ok: false, message: "Please check your email and password." };
      }

      if (error.status === 404) {
        return { ok: false, message: "User not found. Please check your email." };
      }
    }

    return { ok: false, message: "Unable to log in right now. Please try again." };
  }
}

export async function googleLoginAction(credential: string): Promise<LoginActionResult> {
  if (typeof credential !== "string" || !credential || credential.length > 4096) {
    return { ok: false, message: "Google sign-in failed. Please try again." };
  }

  try {
    // The backend verifies the Google ID token and issues our own JWTs (same response as /auth/login)
    const response = await apiPost("/auth/google", { credential }, loginResponseSchema);

    if (!response.success) {
      return { ok: false, message: response.message || "Google sign-in failed. Please try again." };
    }

    return {
      ok: true,
      token: response.data?.accessToken,
      user: response.data?.user,
    };
  } catch (error) {
    if (isApiError(error)) {
      if (error.status === 409) {
        return {
          ok: false,
          message: "An account with this email already exists. Please log in with your email and password.",
        };
      }

      // 401 covers expired tokens, unverified Google emails and inactive accounts; the message is already sanitized
      if (error.status === 401 && error.message !== "The request failed") {
        return { ok: false, message: error.message };
      }

      if (error.status === 400 || error.status === 401) {
        return { ok: false, message: "Google sign-in failed or expired. Please try again." };
      }
    }

    return { ok: false, message: "Unable to sign in with Google right now. Please try again." };
  }
}
