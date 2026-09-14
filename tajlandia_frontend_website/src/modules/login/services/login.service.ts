"use server";

import { z } from "zod";
import { apiPost, isApiError } from "@/lib/api/client";
import { loginSchema, type LoginFormValues } from "../schemas/login.schema";

const loginResponseSchema = z.unknown();

export type LoginActionResult =
  | { ok: true }
  | { ok: false; message: string };

export async function loginAction(values: LoginFormValues): Promise<LoginActionResult> {
  const parsed = loginSchema.safeParse(values);

  if (!parsed.success) {
    return { ok: false, message: "Please check your email and password." };
  }

  try {
    await apiPost("/auth/login", parsed.data, loginResponseSchema);
    return { ok: true };
  } catch (error) {
    if (isApiError(error)) {
      if (error.status === 401 || error.status === 403) {
        return { ok: false, message: "Invalid email or password." };
      }

      if (error.status === 400) {
        return { ok: false, message: "Please check your email and password." };
      }
    }

    return { ok: false, message: "Unable to log in right now. Please try again." };
  }
}
