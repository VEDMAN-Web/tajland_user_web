"use server";

import { resetPasswordSchema, type ResetPasswordFormValues } from "../schemas/reset-password.schema";

export type ResetPasswordActionResult =
  | { ok: true }
  | { ok: false; message: string };

/**
 * Reset password — no backend endpoint exists yet.
 * Returns structured error so the page shows proper feedback.
 */
export async function resetPasswordAction(
  values: ResetPasswordFormValues,
): Promise<ResetPasswordActionResult> {
  const parsed = resetPasswordSchema.safeParse(values);

  if (!parsed.success) {
    return { ok: false, message: "Please check your password requirements." };
  }

  // No /auth/reset-password endpoint — return structured message
  return {
    ok: false,
    message: "Password reset is not yet connected to the backend. Please contact support.",
  };
}
