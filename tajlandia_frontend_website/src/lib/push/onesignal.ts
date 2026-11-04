import { logError } from "@/lib/logging/logger";
import { pushPath } from "./notification-path";

// OneSignal Web Push (v16). The page SDK is loaded from OneSignal's CDN the first time a
// signed-in user is known; the service worker file lives at `public/OneSignalSDKWorker.js`.
// Only the public App ID is used here, the REST API key stays on the backend.

const SDK_URL = "https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js";
const WORKER_PATH = "/OneSignalSDKWorker.js";

/** Fired on `window` when a push arrives while the tab is open, so the bell can reload. */
export const PUSH_RECEIVED_EVENT = "tajlandia:push-received";

type PushEvent = { notification?: { additionalData?: unknown } };

type SubscriptionChange = { current?: { id?: string | null; optedIn?: boolean } };

type OneSignalSdk = {
  init(options: { appId: string; serviceWorkerPath: string; allowLocalhostAsSecureOrigin: boolean }): Promise<void>;
  login(externalId: string): Promise<void>;
  logout(): Promise<void>;
  User: {
    PushSubscription: {
      id?: string | null;
      optedIn?: boolean;
      addEventListener(event: "change", listener: (event: SubscriptionChange) => void): void;
    };
  };
  Notifications: {
    permissionNative?: string;
    requestPermission(): Promise<void>;
    addEventListener(event: "click" | "foregroundWillDisplay", listener: (event: PushEvent) => void): void;
  };
};

declare global {
  interface Window {
    OneSignalDeferred?: Array<(sdk: OneSignalSdk) => void | Promise<void>>;
  }
}

let initQueued = false;
let loggedInUser: string | null = null;
// Where a clicked push should go; set by the latest `startPush`.
let openPath: ((path: string) => void) | null = null;
// Tells the backend about this device; set by the latest `startPush`.
let saveToken: ((token: string) => Promise<unknown>) | null = null;
let savedToken: string | null = null;

/** Sends the subscription id to the backend once per sign-in; a failure is retried next time. */
function registerToken(token: string | null | undefined) {
  if (!token || !loggedInUser || !saveToken || token === savedToken) return;
  savedToken = token;
  saveToken(token).catch((error: unknown) => {
    savedToken = null;
    logError(error, "Failed to register push token");
  });
}

function run(task: (sdk: OneSignalSdk) => Promise<void>, what: string) {
  window.OneSignalDeferred ??= [];
  window.OneSignalDeferred.push(async (sdk) => {
    try {
      await task(sdk);
    } catch (error) {
      logError(error, what);
    }
  });
}

/**
 * Starts Web Push for this user: loads the SDK once, links the browser to the user's id (the
 * id the backend sends pushes to) and asks for notification permission. A click on a push
 * calls `open` with the page it leads to; `register` stores the device's subscription id on the
 * backend. Does nothing without an App ID.
 */
export function startPush(
  userId: string,
  open: (path: string) => void,
  register: (token: string) => Promise<unknown>,
) {
  const appId = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID;
  if (!appId || typeof window === "undefined") return;
  openPath = open;
  saveToken = register;

  if (!initQueued) {
    initQueued = true;
    run(async (sdk) => {
      await sdk.init({
        appId,
        serviceWorkerPath: WORKER_PATH,
        allowLocalhostAsSecureOrigin: window.location.hostname === "localhost",
      });
      sdk.Notifications.addEventListener("click", (event) => {
        const path = pushPath(event.notification?.additionalData);
        if (path) openPath?.(path);
      });
      sdk.Notifications.addEventListener("foregroundWillDisplay", () => {
        window.dispatchEvent(new Event(PUSH_RECEIVED_EVENT));
      });
      // The id appears once permission is granted, and changes if the browser re-subscribes.
      sdk.User.PushSubscription.addEventListener("change", (event) => {
        if (event.current?.optedIn) registerToken(event.current.id);
      });
    }, "Failed to start push notifications");

    const script = document.createElement("script");
    script.src = SDK_URL;
    script.defer = true;
    document.head.appendChild(script);
  }

  if (loggedInUser === userId) return;
  loggedInUser = userId;
  run(async (sdk) => {
    await sdk.login(userId);
    // Ask only the first time; a granted or blocked choice is left alone.
    if (sdk.Notifications.permissionNative === "default") await sdk.Notifications.requestPermission();
    // The subscription id appears a moment after login or permission, and a "change" fired
    // while the SDK was still starting is missed, so look for it for up to 20 seconds.
    for (let attempt = 0; attempt < 20 && loggedInUser === userId; attempt += 1) {
      const subscription = sdk.User.PushSubscription;
      if (subscription.optedIn && subscription.id) {
        registerToken(subscription.id);
        return;
      }
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }, "Failed to link push notifications");
}

/** Signing out: this browser stops receiving the user's pushes. */
export function stopPush() {
  if (typeof window === "undefined" || !window.OneSignalDeferred) return;
  loggedInUser = null;
  savedToken = null;
  run((sdk) => sdk.logout(), "Failed to unlink push notifications");
}
