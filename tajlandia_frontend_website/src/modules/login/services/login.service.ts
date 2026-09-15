import { z } from "zod";
import { apiPost, isApiError } from "@/lib/api/client";
import { storeAuthTokens } from "@/lib/auth/token-storage";
import { loginSchema, type LoginFormValues } from "../schemas/login.schema";

const loginResponseSchema = z.object({
  success: z.literal(true),
  message: z.string(),
  data: z.object({
    accessToken: z.string().min(1),
    refreshToken: z.string().min(1),
    user: z.object({
      id: z.string(),
      name: z.string(),
      email: z.string().email(),
      role: z.string(),
      isActive: z.boolean(),
      isEmailVerified: z.boolean(),
      lastLoginAt: z.string().datetime().nullable(),
    }),
  }),
});

export type LoginActionResult =
  | { ok: true }
  | { ok: false; message: string };

export async function loginAction(values: LoginFormValues): Promise<LoginActionResult> {
  const parsed = loginSchema.safeParse(values);

  if (!parsed.success) {
    return { ok: false, message: "Please check your email and password." };
  }

  try {
    const response = await apiPost("/auth/login", parsed.data, loginResponseSchema);
    storeAuthTokens(response.data.accessToken, response.data.refreshToken);

    return { ok: true };
  } catch (error) {
    if (isApiError(error)) {
      if (error.status === 401 || error.status === 403) {
        return { ok: false, message: "Invalid email or password." };
      }

      if (error.status === 400) {
        return { ok: false, message: "Please check your email and password." };
      }

      if (error.status === 422) {
        return { ok: false, message: "Please check your email and password." };
      }

      if (error.status === 404 || error.status >= 500) {
        return { ok: false, message: "Unable to log in right now. Please try again." };
      }
    }

    return { ok: false, message: "Unable to log in right now. Please try again." };
  }
}
