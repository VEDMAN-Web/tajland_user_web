"use server";

import { redirect } from "next/navigation";
import { authenticatedApiPost } from "@/lib/api/auth-client";
import { clearSession, getAccessToken } from "@/lib/auth/session";
import { logoutResponseSchema } from "@/modules/auth";

export async function logoutAction(): Promise<void> {
  const accessToken = await getAccessToken();

  // Best-effort server-side logout — clear session regardless of API result
  if (accessToken) {
    try {
      await authenticatedApiPost("/auth/logout", accessToken, {}, logoutResponseSchema);
    } catch {
      // Ignore — session will be cleared locally regardless
    }
  }

  await clearSession();
  redirect("/login");
}
