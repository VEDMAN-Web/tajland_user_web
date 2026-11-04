// The applied discount code, kept for this tab so it survives moving between
// the cart and checkout. The backend doesn't store it: it only shapes
// `GET /cart/order-summary?couponId=` and `POST /checkout`.
const STORAGE_KEY = "tajlandia_cart_coupon";

export type AppliedCoupon = { id: string; code: string };

export function readAppliedCoupon(): AppliedCoupon | null {
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const value: unknown = JSON.parse(raw);
    if (
      value &&
      typeof value === "object" &&
      typeof (value as AppliedCoupon).id === "string" &&
      typeof (value as AppliedCoupon).code === "string"
    ) {
      return value as AppliedCoupon;
    }
    return null;
  } catch {
    // Storage blocked or unreadable: just start without a coupon.
    return null;
  }
}

/** Saves the coupon, or forgets it when `null`. */
export function saveAppliedCoupon(coupon: AppliedCoupon | null) {
  try {
    if (coupon) window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(coupon));
    else window.sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // Storage blocked: the coupon then lasts only for this page.
  }
}
