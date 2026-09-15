"use server";

import { redirect } from "next/navigation";
import { apiPost, isApiError } from "@/lib/api/client";
import { setSession } from "@/lib/auth/session";
import { loginResponseSchema } from "@/modules/auth";
import { loginSchema, type LoginFormValues } from "../schemas/login.schema";

export type LoginActionResult =
  | { ok: true }
  | { ok: false; message: string };

export async function loginAction(
  values: LoginFormValues,
  returnTo?: string
): Promise<LoginActionResult> {
  const parsed = loginSchema.safeParse(values);

  if (!parsed.success) {
    return { ok: false, message: "Please check your email and password." };
  }

  try {
    const response = await apiPost("/auth/login", parsed.data, loginResponseSchema);

    // Store session in httpOnly cookies
    await setSession({
      accessToken: response.data.accessToken,
      refreshToken: response.data.refreshToken,
      user: response.data.user,
    });
  } catch (error) {
    // Next.js redirect() works by throwing a special internal error.
    // Re-throw anything that is not an ApiError so redirect propagates.
    if (!isApiError(error)) {
      throw error;
    }

    // Log the actual error for debugging
    console.error("Login API error:", {
      status: error.status,
      code: error.code,
      message: error.message,
    });

    if (error.status === 401 || error.status === 403) {
      return { ok: false, message: "Invalid email or password." };
    }

    if (error.status === 400) {
      return { ok: false, message: "Please check your email and password." };
    }

    return { ok: false, message: "Unable to log in right now. Please try again." };
  }

  // redirect() is called outside try/catch so it can throw freely
  // Redirect to return URL or home page
  const destination = returnTo || "/";
  redirect(destination);
}
