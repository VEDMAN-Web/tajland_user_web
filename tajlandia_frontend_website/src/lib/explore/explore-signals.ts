// Shared by Explore Map, the dashboard sidebar and sign-out, so it lives in lib.

/** `sessionStorage` key for where the user left Explore Map (see explore-session). */
export const EXPLORE_STATE_KEY = "tajlandia_explore_state";

/** Fired on `window` when Explore Map is chosen again while it is already open. */
export const EXPLORE_RESET_EVENT = "tajlandia:explore-reset";

/** Asks the open Explore Map to start over, as if it had just been opened. */
export function requestExploreReset() {
  window.dispatchEvent(new Event(EXPLORE_RESET_EVENT));
}
