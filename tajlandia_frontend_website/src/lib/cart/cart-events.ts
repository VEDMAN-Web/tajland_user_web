// Modules can't import each other, so a change to the cart (e.g. Add to Cart on
// the Explore Map) is announced on `window` for the navbar badge to reload.
export const CART_CHANGED_EVENT = "tajlandia:cart-changed";

export function notifyCartChanged() {
  window.dispatchEvent(new Event(CART_CHANGED_EVENT));
}
