"use server";

import { redirect } from "next/navigation";
import { apiPost, isApiError } from "@/lib/api/client";
import { setSession } from "@/lib/auth/session";
import { registerResponseSchema, loginResponseSchema } from "@/modules/auth";
import { signupSchema, type SignupFormValues } from "../schemas/signup.schema";
import type { LoginFormValues } from "@/modules/login/schemas/login.schema";

export type SignupActionResult =
  | { ok: true }
  | { ok: false; message: string };

export async function signupAction(values: SignupFormValues): Promise<SignupActionResult> {
  const parsed = signupSchema.safeParse(values);

  if (!parsed.success) {
    return { ok: false, message: "Please check your information and try again." };
  }

  try {
    // Step 1: Register the user
    await apiPost(
      "/auth/register",
      {
        name: `${parsed.data.firstName} ${parsed.data.lastName}`,
        email: parsed.data.email,
        password: parsed.data.newPassword,
      },
      registerResponseSchema,
    );

    // Step 2: Auto-login after successful registration
    const loginPayload: LoginFormValues = {
      email: parsed.data.email,
      password: parsed.data.newPassword,
    };

    const loginResponse = await apiPost("/auth/login", loginPayload, loginResponseSchema);

    // Step 3: Store session
    await setSession({
      accessToken: loginResponse.data.accessToken,
      refreshToken: loginResponse.data.refreshToken,
      user: loginResponse.data.user,
    });
  } catch (error) {
    // Next.js redirect() works by throwing a special internal error.
    // We must re-throw anything that is not an ApiError so redirect propagates.
    if (!isApiError(error)) {
      throw error;
    }

    if (error.status === 400) {
      return { ok: false, message: "This email is already registered. Please log in." };
    }

    if (error.status === 409) {
      return { ok: false, message: "An account with this email already exists." };
    }

    return { ok: false, message: "Unable to create your account right now. Please try again." };
  }

  // redirect() is called outside try/catch so it can throw freely
  redirect("/");
}
