"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { AUTH_SIGNED_IN_EVENT, getStoredUser } from "@/lib/api/auth.utils";
import { startPush } from "@/lib/push/onesignal";
import { registerPushToken } from "./services/notifications.client";

/**
 * Web Push for the signed-in user (OneSignal), on any page: links this browser to their id, asks for
 * permission, saves the device token on the backend, and opens the right page when a push is clicked. Renders nothing; mounted once
 * in the root layout.
 */
export function PushNotifications() {
  const router = useRouter();

  useEffect(() => {
    // On load for a saved session, and again the moment a login in this tab succeeds.
    function start() {
      const id = getStoredUser()?.id;
      if (typeof id === "string" && id) startPush(id, (path) => router.push(path), registerPushToken);
    }
    start();
    window.addEventListener(AUTH_SIGNED_IN_EVENT, start);
    return () => window.removeEventListener(AUTH_SIGNED_IN_EVENT, start);
  }, [router]);

  return null;
}
