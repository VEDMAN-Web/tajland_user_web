import { useSyncExternalStore } from "react";
import { z } from "zod";
import { getStoredToken } from "@/lib/api/auth.utils";
import { authedGet, isAbortError } from "@/lib/api/browser-client";
import { logError } from "@/lib/logging/logger";
import { CART_CHANGED_EVENT } from "./cart-events";

// Modules can't import each other, so the cart's headline numbers live here: the
// navbar badge and the Explore Map's cart progress read the same snapshot and
// update together, instead of each fetching `GET /cart` on its own.

/** The cart in numbers: plots, Rai, and the money total (`GET /cart`). */
export type CartSnapshot = {
  count: number;
  totalRai: number;
  minimumRai: number;
  total: number;
};

/** What a plot added to (or removed from) the cart changes. */
export type CartChange = { rai: number; total: number };

// Used when the API doesn't send `minimumRai`.
const DEFAULT_MINIMUM_RAI = 100;

// `GET /cart` `data`; the totals fall back to summing the items if an older backend omits them.
const cartSnapshotSchema = z.object({
  items: z.array(
    z.object({ sizeRai: z.number().nullish(), subtotal: z.number().nullish() }),
  ),
  totalRai: z.number().nullish(),
  minimumRai: z.number().nullish(),
  total: z.number().nullish(),
});

const round = (value: number) => Math.max(0, Math.round(value * 10_000) / 10_000);

let snapshot: CartSnapshot | null = null;
let inFlight: AbortController | null = null;
const listeners = new Set<() => void>();

function publish(next: CartSnapshot | null) {
  snapshot = next;
  listeners.forEach((listener) => listener());
}

/** Loads the cart's numbers; a newer call cancels the one still running. */
export function refreshCartSnapshot() {
  if (typeof window === "undefined") return;
  if (!getStoredToken()) {
    // Logged out: don't show the last user's cart.
    if (snapshot) publish(null);
    return;
  }
  inFlight?.abort();
  const controller = new AbortController();
  inFlight = controller;
  // Secondary data: a failure keeps the last numbers and never logs the user out.
  authedGet("/cart", cartSnapshotSchema, {
    signal: controller.signal,
    redirectOnUnauthorized: false,
  })
    .then((cart) => {
      if (inFlight !== controller) return;
      publish({
        count: cart.items.length,
        totalRai: cart.totalRai ?? cart.items.reduce((sum, item) => sum + (item.sizeRai ?? 0), 0),
        minimumRai: cart.minimumRai ?? DEFAULT_MINIMUM_RAI,
        total: cart.total ?? cart.items.reduce((sum, item) => sum + (item.subtotal ?? 0), 0),
      });
    })
    .catch((error: unknown) => {
      if (!isAbortError(error)) logError(error, "Failed to load cart snapshot");
    });
}

/**
 * Shows an add / remove straight away (`direction` +1 / -1) instead of waiting for
 * the next `GET /cart`, then reloads the real numbers so the two always agree.
 */
export function applyCartChange(direction: 1 | -1, change: CartChange) {
  if (snapshot) {
    // Drop any older, now stale, request so it can't overwrite this.
    inFlight?.abort();
    publish({
      ...snapshot,
      count: Math.max(0, snapshot.count + direction),
      totalRai: round(snapshot.totalRai + direction * change.rai),
      total: round(snapshot.total + direction * change.total),
    });
  }
  refreshCartSnapshot();
}

/** The cart was emptied: show it at once, then confirm with the API. */
export function clearCartSnapshot() {
  if (snapshot) {
    inFlight?.abort();
    publish({ ...snapshot, count: 0, totalRai: 0, total: 0 });
  }
  refreshCartSnapshot();
}

function subscribe(listener: () => void) {
  if (listeners.size === 0) {
    // Another page changed the cart, or reservations may have expired while the tab was away.
    window.addEventListener(CART_CHANGED_EVENT, refreshCartSnapshot);
    window.addEventListener("focus", refreshCartSnapshot);
    refreshCartSnapshot();
  }
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) {
      inFlight?.abort();
      inFlight = null;
      window.removeEventListener(CART_CHANGED_EVENT, refreshCartSnapshot);
      window.removeEventListener("focus", refreshCartSnapshot);
    }
  };
}

/** The cart's numbers, or null until the first load (and while logged out). */
export function useCartSnapshot() {
  return useSyncExternalStore(
    subscribe,
    () => snapshot,
    () => null,
  );
}
