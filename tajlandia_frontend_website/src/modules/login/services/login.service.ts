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
