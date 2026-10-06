"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { isAbortError } from "@/lib/api/browser-client";
import { isApiError } from "@/lib/api/errors";
import { notifyCartChanged } from "@/lib/cart/cart-events";
import { isAllowedRemoteImage } from "@/lib/config/remote-images";
import { routes } from "@/lib/constants/routes";
import { useAuth } from "@/lib/hooks/useAuth";
import { logError } from "@/lib/logging/logger";
import { cn } from "@/lib/utils/cn";
import { DashboardNavbar } from "./DashboardNavbar";
import { useDashboardLanguage } from "./DashboardLanguageContext";
import type { CartItem, CartSummary } from "./schemas/cart.schema";
import {
  clearCart,
  getCart,
  getCartCoupons,
  getOrderSummary,
  removeCartItem,
} from "./services/cart.client";

type Translate = (source: string) => string;

const PLACEHOLDER_IMAGE = "/images/explore/place-placeholder.svg";
const bone = "animate-pulse rounded-[8px] bg-[#eef1f5] motion-reduce:animate-none";

// Order Summary dot / label colour per zone tier (Figma).
const ZONE_COLORS: Record<string, string> = {
  ICON: "#c9961a",
  POPULAR: "#16807f",
  STANDARD: "#6b7785",
};

// What the page shows: the items (`GET /cart`) with their totals (`GET /cart/order-summary`).
type CartView = CartSummary & { items: CartItem[] };

function money(amount: number) {
  return `$${amount.toFixed(2)}`;
}

/** Puts values into a translated "{name}" template. */
function fill(template: string, values: Record<string, string | number>) {
  return template.replace(/\{(\w+)\}/g, (match, key: string) =>
    key in values ? String(values[key]) : match,
  );
}

const titleCase = (value: string) => value.charAt(0) + value.slice(1).toLowerCase();

export function CartPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();
  const { t } = useDashboardLanguage();
  // `GET /cart`; `reloadKey` refetches it (after a retry, remove or clear).
  const [cart, setCart] = useState<
    | { status: "loading" }
    | { status: "ready"; data: CartView }
    | { status: "empty" }
    | { status: "error" }
  >({ status: "loading" });
  const [reloadKey, setReloadKey] = useState(0);
  const [removingIds, setRemovingIds] = useState<string[]>([]);
  const [isClearing, setIsClearing] = useState(false);
  const [actionError, setActionError] = useState("");
  // Confirm dialogs (Figma "Remove this plot?" / "Clear your selection?").
  const [pendingRemove, setPendingRemove] = useState<CartItem | null>(null);
  const [isClearDialogOpen, setIsClearDialogOpen] = useState(false);
  // Discount code: what's typed, and the coupon applied to the summary (by id).
  const [couponInput, setCouponInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<{ id: string; code: string } | null>(
    null,
  );
  // Mirror for the cart reload, so totals keep the coupon after a remove.
  const appliedCouponRef = useRef<{ id: string; code: string } | null>(null);
  const [couponError, setCouponError] = useState("");
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.replace(routes.login);
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    if (!isAuthenticated) return;

    const controller = new AbortController();
    // Items first; an empty cart has no summary (the API answers 404), so it's skipped.
    getCart({ signal: controller.signal })
      .then(async ({ items }) => {
        if (!items.length) {
          setCart({ status: "empty" });
          return;
        }
        const couponId = appliedCouponRef.current?.id;
        let summary: CartSummary;
        try {
          summary = await getOrderSummary({ couponId, signal: controller.signal });
        } catch (error) {
          // The cart changed and the coupon no longer fits: drop it, show plain totals.
          if (
            !couponId ||
            !isApiError(error) ||
            (error.status !== 400 && error.status !== 404)
          )
            throw error;
          setCoupon(null);
          setCouponError("Your discount code no longer applies to this cart.");
          summary = await getOrderSummary({ signal: controller.signal });
        }
        setCart({ status: "ready", data: { ...summary, items } });
      })
      .catch((error: unknown) => {
        // A cancelled request is not an error, and 401 already redirects to login.
        if (isAbortError(error)) return;
        if (isApiError(error) && error.code === "API_SESSION_EXPIRED") return;
        logError(error, "Failed to load cart");
        // A failed refresh keeps the cart on screen; only a first load shows the error.
        setCart((current) =>
          current.status === "ready" ? current : { status: "error" },
        );
      });

    return () => controller.abort();
  }, [isAuthenticated, reloadKey]);

  function retry() {
    setCart({ status: "loading" });
    setReloadKey((key) => key + 1);
  }

  function setCoupon(next: { id: string; code: string } | null) {
    appliedCouponRef.current = next;
    setAppliedCoupon(next);
  }

  // The typed code is matched against `GET /coupons` (never listed to the user),
  // then its id goes to `GET /cart/order-summary?couponId=` for the new totals.
  async function applyCoupon() {
    const code = couponInput.trim().toUpperCase();
    if (isApplyingCoupon || cart.status !== "ready") return;
    if (!code) {
      setCouponError("Enter a discount code.");
      return;
    }
    setCouponError("");
    setIsApplyingCoupon(true);
    try {
      const coupons = await getCartCoupons();
      const match = coupons.find((item) => item.code.toUpperCase() === code);
      if (!match) {
        setCouponError("Invalid discount code.");
        return;
      }
      let summary: CartSummary;
      try {
        summary = await getOrderSummary({ couponId: match.id });
      } catch (error) {
        // 400 / 404 here: the coupon doesn't fit this cart's Rai.
        if (isApiError(error) && (error.status === 400 || error.status === 404)) {
          setCouponError("This code doesn't apply to your cart.");
          return;
        }
        throw error;
      }
      setCoupon({ id: match.id, code: match.code });
      setCouponInput(match.code);
      setCart((current) =>
        current.status === "ready"
          ? { status: "ready", data: { ...summary, items: current.data.items } }
          : current,
      );
    } catch (error) {
      if (isApiError(error) && error.code === "API_SESSION_EXPIRED") return;
      logError(error, "Failed to apply coupon");
      setCouponError("Couldn't apply the code. Please try again.");
    } finally {
      setIsApplyingCoupon(false);
    }
  }

  // Coupons only shape the summary request, so removing one is a plain reload.
  function removeCoupon() {
    setCoupon(null);
    setCouponInput("");
    setCouponError("");
    setReloadKey((key) => key + 1);
  }

  // After a change: reload the cart (totals come from the API) and the navbar badge.
  function cartChanged() {
    setReloadKey((key) => key + 1);
    notifyCartChanged();
  }

  function handleActionError(error: unknown, message: string) {
    if (isApiError(error) && error.code === "API_SESSION_EXPIRED") return;
    logError(error, message);
    setActionError("Couldn't update your cart. Please try again.");
    setReloadKey((key) => key + 1);
  }

  // Confirmed in the dialog, which stays open (busy) until the API answers.
  async function removeItem(plotId: string) {
    if (removingIds.includes(plotId)) return;
    setActionError("");
    setRemovingIds((ids) => [...ids, plotId]);
    try {
      await removeCartItem(plotId);
      cartChanged();
    } catch (error) {
      handleActionError(error, "Failed to remove cart item");
    } finally {
      setRemovingIds((ids) => ids.filter((id) => id !== plotId));
      setPendingRemove(null);
    }
  }

  async function clearAll() {
    if (isClearing) return;
    setActionError("");
    setIsClearing(true);
    try {
      await clearCart();
      cartChanged();
    } catch (error) {
      handleActionError(error, "Failed to clear cart");
    } finally {
      setIsClearing(false);
      setIsClearDialogOpen(false);
    }
  }

  if (isLoading)
    return (
      <main className="flex min-h-[100svh] items-center justify-center bg-[#f7fafc] text-sm text-muted">
        {t("Loading cart...")}
      </main>
    );
  if (!isAuthenticated) return null;

  return (
    <div className="min-h-[100svh] bg-[#f7f9fc] text-navy">
      <DashboardNavbar active="none" />
      <main className="mx-auto w-full max-w-[1240px] px-4 pb-16 pt-6 sm:px-8 sm:pt-8">
        <section>
          <h1 className="font-manrope text-[26px] font-semibold leading-none tracking-[-0.03em] text-navy sm:text-[32px]">
            {t("Your Cart")}
          </h1>
          <p className="mt-2 font-manrope font-medium text-[13px] leading-5 text-[#8b939e] sm:text-[14px]">
            {t("Review your selected plots before checkout.")}
          </p>
          {cart.status === "loading" ? (
            <CartSkeleton t={t} />
          ) : cart.status === "error" ? (
            <div
              role="alert"
              className="mt-6 flex flex-col items-center gap-3 rounded-[16px] border border-[#eef1f4] bg-white px-4 py-12 text-center"
            >
              <p className="font-manrope font-medium text-[14px] text-[#8b939e]">
                {t("Couldn't load your cart.")}
              </p>
              <button
                type="button"
                onClick={retry}
                className="h-9 cursor-pointer rounded-[8px] border border-navy px-4 font-manrope text-[13px] font-semibold text-navy hover:bg-[#f5f7fa]"
              >
                {t("Try Again")}
              </button>
            </div>
          ) : cart.status === "ready" ? (
            <FilledCart
              cart={cart.data}
              coupon={{
                input: couponInput,
                applied: appliedCoupon,
                error: couponError,
                isApplying: isApplyingCoupon,
                onInput: (value) => {
                  setCouponInput(value);
                  setCouponError("");
                },
                onApply: () => void applyCoupon(),
                onRemove: removeCoupon,
              }}
              removingIds={removingIds}
              isClearing={isClearing}
              actionError={actionError}
              onClearAll={() => setIsClearDialogOpen(true)}
              onRemove={setPendingRemove}
              t={t}
            />
          ) : (
            <EmptyCart t={t} />
          )}
        </section>
      </main>

      {pendingRemove ? (
        <RemovePlotDialog
          item={pendingRemove}
          isRemoving={removingIds.includes(pendingRemove.plotId)}
          onConfirm={() => void removeItem(pendingRemove.plotId)}
          onClose={() => setPendingRemove(null)}
          t={t}
        />
      ) : null}
      {isClearDialogOpen && cart.status === "ready" ? (
        <ClearCartDialog
          cart={cart.data}
          isClearing={isClearing}
          onConfirm={() => void clearAll()}
          onClose={() => setIsClearDialogOpen(false)}
          t={t}
        />
      ) : null}
    </div>
  );
}

function EmptyCart({ t }: { t: Translate }) {
  return (
    <div className="flex min-h-[calc(100svh-210px)] flex-col items-center justify-center text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#f5f8fc]">
        <img
          src="/images/dashboard/navbar/cart-default.png"
          alt=""
          className="h-8 w-8 object-contain"
        />
      </div>
      <h2 className="mt-5 text-[21px] font-semibold text-[#171717]">
        {t("Your cart is empty")}
      </h2>
      <p className="mt-1 max-w-[310px] text-[12px] leading-5 text-[#7b858f]">
        {t(
          "You haven't selected any plots yet. Explore Thailand and discover a place to add to your collection.",
        )}
      </p>
      <div className="mt-6 flex w-full max-w-[365px] gap-2">
        <Link
          href={routes.purchases}
          className="flex flex-1 items-center justify-center rounded-[9px] border border-[#e1e7ec] bg-white px-4 py-3 text-[11px] text-navy"
        >
          {t("My Purchase")}
        </Link>
        <Link
          href={routes.dashboardExplore}
          className="flex flex-1 items-center justify-center rounded-[9px] bg-navy px-4 py-3 text-[11px] text-white"
        >
          {t("Explore Thailand →")}
        </Link>
      </div>
    </div>
  );
}

// Order Summary skeleton rows (label / value widths), split into the Figma's divided groups.
const SUMMARY_SKELETON_GROUPS = [
  [
    ["w-20", "w-14"],
    ["w-20", "w-16"],
  ],
  [
    ["w-24", "w-14"],
    ["w-16", "w-16"],
    ["w-32", "w-12"],
  ],
  [["w-24", "w-12"]],
];

function CartSkeleton({ t }: { t: Translate }) {
  return (
    <div
      aria-busy="true"
      className="mt-6 grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_360px]"
    >
      <section>
        <h2 className="font-manrope text-[18px] font-semibold text-navy sm:text-[20px]">
          {t("Selected Plots")}
        </h2>
        <div className="mt-3 space-y-3">
          {Array.from({ length: 4 }, (_, index) => (
            <div
              key={index}
              className="flex items-center gap-3 rounded-[16px] bg-white px-3 py-3 shadow-[0_2px_8px_rgba(0,0,0,0.08)] sm:px-4 sm:py-[14px]"
            >
              <span
                className={cn(
                  bone,
                  "h-20 w-20 shrink-0 rounded-[12px] sm:h-[100px] sm:w-[100px]",
                )}
              />
              <div className="min-w-0 flex-1 space-y-2">
                <div className="flex gap-2">
                  <span className={cn(bone, "block h-3 w-8")} />
                  <span className={cn(bone, "block h-3 w-16")} />
                </div>
                <span className={cn(bone, "block h-4 w-3/5 max-w-[160px]")} />
                <span className={cn(bone, "block h-3 w-1/2 max-w-[140px]")} />
                <span className={cn(bone, "block h-3 w-1/2 max-w-[140px]")} />
              </div>
              <div className="flex shrink-0 flex-col items-end gap-3">
                <span className={cn(bone, "block h-8 w-20 sm:w-[110px]")} />
                <span className={cn(bone, "block h-4 w-14 sm:w-[70px]")} />
              </div>
            </div>
          ))}
        </div>
      </section>
      <aside className="rounded-[16px] border border-[#eef1f4] bg-white px-5 py-5 shadow-[0_8px_24px_rgba(11,31,77,0.05)] sm:px-6">
        <h2 className="font-manrope text-[18px] font-semibold text-navy sm:text-[20px]">
          {t("Order Summary")}
        </h2>
        <div className="mt-4 divide-y divide-[#eef1f4]">
          {SUMMARY_SKELETON_GROUPS.map((rows, groupIndex) => (
            <div key={groupIndex} className="space-y-2.5 py-3 first:pt-0">
              {rows.map(([label, value], rowIndex) => (
                <div key={rowIndex} className="flex items-center justify-between">
                  <span className={cn(bone, "block h-3.5", label)} />
                  <span className={cn(bone, "block h-3.5", value)} />
                </div>
              ))}
            </div>
          ))}
        </div>
        <div className="mt-4 space-y-3 border-t border-[#eef1f4] pt-5">
          <span className={cn(bone, "block h-11 rounded-[12px]")} />
          <span className={cn(bone, "block h-11 rounded-[12px]")} />
        </div>
      </aside>
    </div>
  );
}

type FilledCartProps = {
  cart: CartView;
  coupon: CouponControls;
  removingIds: string[];
  isClearing: boolean;
  actionError: string;
  onClearAll: () => void;
  onRemove: (item: CartItem) => void;
  t: Translate;
};

function FilledCart({
  cart,
  coupon,
  removingIds,
  isClearing,
  actionError,
  onClearAll,
  onRemove,
  t,
}: FilledCartProps) {
  const remainingRai = Math.max(cart.remainingRai, 0);
  const minimumReached = remainingRai === 0;

  return (
    <>
      <ProgressBanner cart={cart} t={t} />
      <div className="mt-6 grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <section>
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-manrope text-[18px] font-semibold text-navy sm:text-[20px]">
              {t("Selected Plots")}
            </h2>
            <button
              type="button"
              onClick={onClearAll}
              disabled={isClearing}
              className="cursor-pointer font-manrope font-medium text-[13px] text-[#6b7785] underline underline-offset-2 hover:text-navy disabled:cursor-wait disabled:opacity-60"
            >
              {t(isClearing ? "Clearing..." : "Clear All")}
            </button>
          </div>
          {actionError ? (
            <p
              role="alert"
              className="mt-2 font-manrope font-medium text-[12px] text-[#e11d2e]"
            >
              {t(actionError)}
            </p>
          ) : null}
          <div className="mt-3 space-y-3">
            {cart.items.map((item) => (
              <CartItemCard
                key={item.plotId}
                item={item}
                isRemoving={removingIds.includes(item.plotId)}
                onRemove={() => onRemove(item)}
                t={t}
              />
            ))}
          </div>
          <div className="mt-3 flex flex-col items-start justify-between gap-4 rounded-[16px] border border-dashed border-[#d5deea] bg-white px-4 py-4 sm:flex-row sm:items-center sm:px-5">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-[#f1f4f9] text-navy">
                <PinPlusIcon />
              </span>
              <div>
                <h3 className="font-manrope text-[14px] font-semibold leading-5 text-navy">
                  {fill(t("Add more places to reach the {min} Rai threshold"), {
                    min: cart.minimumRai,
                  })}
                </h3>
                <p className="mt-1 max-w-[420px] font-manrope font-medium text-[12px] leading-5 text-[#8b939e]">
                  {minimumReached
                    ? t("Unlock deed certification and blockchain cadastral inscription.")
                    : fill(
                        t(
                          "Unlock deed certification and blockchain cadastral inscription by selecting {rai} additional Rai.",
                        ),
                        { rai: remainingRai },
                      )}
                </p>
              </div>
            </div>
            <Link
              href={routes.dashboardExplore}
              className="inline-flex h-11 w-full shrink-0 items-center justify-center rounded-[10px] bg-navy px-4 font-manrope text-[13px] font-medium text-white hover:bg-navy-deep sm:w-auto"
            >
              {t("Explore Thailand →")}
            </Link>
          </div>
        </section>

        <OrderSummary cart={cart} coupon={coupon} remainingRai={remainingRai} t={t} />
      </div>
    </>
  );
}

/** Figma "Section - Progress banner": below the minimum (red) or reached (green). */
function ProgressBanner({ cart, t }: { cart: CartView; t: Translate }) {
  const remainingRai = Math.max(cart.remainingRai, 0);
  const reached = remainingRai === 0;
  const progress =
    cart.minimumRai > 0 ? Math.min(100, (cart.totalRai / cart.minimumRai) * 100) : 100;
  const plotCount = cart.plots;

  return (
    <section
      aria-label={t("Minimum order progress")}
      className="mt-6 rounded-[20px] bg-white p-5 shadow-[0_2px_20px_rgba(0,0,0,0.08)] sm:rounded-[24px] sm:p-8"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h2 className="flex items-center gap-2 font-manrope text-[16px] font-semibold text-navy sm:text-[18px]">
            <CheckCircleIcon />
            {t(reached ? "Minimum order completed!" : "Complete your selection")}
          </h2>
          <p className="mt-1 max-w-[360px] font-manrope font-medium text-[11px] leading-4 text-[#8b939e]">
            {fill(
              t(
                reached
                  ? "You have successfully reached the required {min} Rai minimum to continue."
                  : "You need {min} Rai minimum to continue buying plots and payment.",
              ),
              { min: cart.minimumRai },
            )}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2 sm:flex-col sm:items-end sm:gap-1">
          <p className="font-manrope font-medium">
            <span className="text-[20px] font-semibold text-navy">{cart.totalRai}</span>
            <span className="text-[11px] text-[#8b939e]">{` / ${cart.minimumRai} ${t("Rai")}`}</span>
          </p>
          {reached ? (
            <span className="rounded-full bg-[#dcfce7] px-2 py-0.5 font-manrope text-[9px] font-semibold text-[#16a34a]">
              {t("Minimum Reached")}
            </span>
          ) : null}
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between gap-3 font-manrope font-medium text-[12px] text-navy">
        <span>
          {`${plotCount} ${t(plotCount === 1 ? "Plot" : "Plots")} · ${cart.totalRai} ${t("Rai")}`}
        </span>
        <span className="font-semibold">{`${t("Total")}: ${money(cart.total)}`}</span>
      </div>
      <div
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={cart.minimumRai}
        aria-valuenow={Math.min(cart.totalRai, cart.minimumRai)}
        className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#eef1f5]"
      >
        <span
          className={cn(
            "block h-full rounded-full transition-[width] duration-500",
            reached ? "bg-[#22c55e]" : "bg-[#e11d2e]",
          )}
          style={{ width: `${progress}%` }}
        />
      </div>
      <div className="mt-2 flex flex-col gap-1 font-manrope font-medium text-[11px] leading-4 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        {reached ? (
          <span />
        ) : (
          <span className="text-[#5c6770]">
            {fill(t("{rai} Rai more to reach minimum"), { rai: remainingRai })}
          </span>
        )}
        <span className="text-[#8b939e] sm:text-right">
          <strong className="font-semibold text-navy">{t("NEXT STEP:")}</strong>{" "}
          {t("Select parcels from any province zone to unlock settlement.")}
        </span>
      </div>
    </section>
  );
}

type CouponControls = {
  input: string;
  applied: { id: string; code: string } | null;
  error: string;
  isApplying: boolean;
  onInput: (value: string) => void;
  onApply: () => void;
  onRemove: () => void;
};

/**
 * Discount code (Figma "Coupon" / "Input"): a code field with Apply (pink and
 * red when the code is invalid), or the applied coupon's green card with Remove.
 */
function CouponForm({
  coupon,
  discount,
  t,
}: {
  coupon: CouponControls;
  discount: number;
  t: Translate;
}) {
  const hasError = Boolean(coupon.error);
  const errorId = "coupon-error";

  if (coupon.applied) {
    return (
      <div className="flex min-h-[58px] items-center justify-between gap-3 rounded-[14px] border border-[#bfe3c9] bg-[#e6f4ea] px-4 py-2.5">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="shrink-0 text-[#15803d]">
            <CheckCircleIcon />
          </span>
          <div className="min-w-0">
            <p className="truncate font-manrope text-[14px] font-medium leading-5 text-[#14532d]">
              {`${t("Coupon applied")} ${coupon.applied.code}`}
            </p>
            <p className="font-manrope text-[12px] font-medium leading-4 text-[#3f7a52]">
              {`${t("Discount")} -${money(discount)}`}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={coupon.onRemove}
          className="shrink-0 cursor-pointer font-manrope text-[12px] font-medium text-[#15803d] underline underline-offset-2 hover:text-[#14532d]"
        >
          {t("Remove")}
        </button>
      </div>
    );
  }

  return (
    <div>
      <form
        className="flex gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          coupon.onApply();
        }}
      >
        <input
          value={coupon.input}
          onChange={(event) => coupon.onInput(event.target.value)}
          placeholder={t("Enter Code")}
          aria-label={t("Enter Code")}
          aria-invalid={hasError}
          aria-describedby={hasError ? errorId : undefined}
          disabled={coupon.isApplying}
          autoCapitalize="characters"
          className={cn(
            "h-14 min-w-0 flex-1 rounded-[12px] border px-4 py-3 font-manrope text-[16px] font-medium outline-none placeholder:text-[#b0b7c0] disabled:opacity-70",
            hasError
              ? "border-[#e11d2e] bg-[#ffdcdf] text-[#e11d2e]"
              : "border-[#e4e9ef] bg-white text-navy focus:border-navy",
          )}
        />
        <button
          type="submit"
          disabled={coupon.isApplying}
          className="h-14 shrink-0 cursor-pointer rounded-[12px] bg-navy px-7 font-manrope text-[16px] font-medium text-white hover:bg-navy-deep disabled:cursor-wait disabled:opacity-70 sm:text-[18px]"
        >
          {t(coupon.isApplying ? "Applying..." : "Apply")}
        </button>
      </form>
      {hasError ? (
        <p
          id={errorId}
          role="alert"
          className="mt-2 flex items-center gap-1.5 font-manrope text-[13px] font-medium text-[#e11d2e]"
        >
          <InfoCircleIcon />
          {t(coupon.error)}
        </p>
      ) : null}
    </div>
  );
}

function InfoCircleIcon() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true" className="h-4 w-4 shrink-0">
      <circle cx="8" cy="8" r="6.5" fill="none" stroke="currentColor" strokeWidth="1.3" />
      <path
        d="M8 4.8v3.6M8 10.8v.2"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.5"
      />
    </svg>
  );
}

function OrderSummary({
  cart,
  coupon,
  remainingRai,
  t,
}: {
  cart: CartView;
  coupon: CouponControls;
  remainingRai: number;
  t: Translate;
}) {
  return (
    <aside>
      <CouponForm coupon={coupon} discount={cart.discount} t={t} />
      <div className="mt-3 rounded-[16px] border border-[#eef1f4] bg-white px-5 py-6 shadow-[0_8px_24px_rgba(11,31,77,0.05)] sm:px-7 sm:py-7">
        <h2 className="font-manrope text-[22px] leading-none font-semibold text-[#111111] sm:text-[24px]">
          {t("Order Summary")}
        </h2>
        <div className="mt-5 space-y-3 font-manrope text-[16px] font-medium text-[#6b7280]">
          <p className="flex items-center justify-between">
            <span>{t("Plots")}</span>
            <strong className="font-bold text-navy">{cart.plots}</strong>
          </p>
          <p className="flex items-center justify-between">
            <span>{t("Total Rai")}</span>
            <strong className="font-bold text-[#e11d2e]">{cart.totalRai}</strong>
          </p>
        </div>
        {cart.zones.length ? <div className="my-5 border-t border-[#e5e7eb]" /> : null}
        {/* Zone split as the API sends it (every tier, including those at $0). */}
        <div className="space-y-3 font-manrope text-[16px] font-medium">
          {cart.zones.map((zone) => {
            const color = ZONE_COLORS[zone.tier.toUpperCase()] ?? "#6b7785";
            return (
              <p key={zone.tier} className="flex items-center justify-between">
                <span
                  className="inline-flex items-center gap-2 font-semibold"
                  style={{ color }}
                >
                  <span
                    aria-hidden="true"
                    className="h-1.5 w-1.5 rounded-full"
                    style={{ backgroundColor: color }}
                  />
                  {t(zone.name)}
                </span>
                <span className="text-[#6b7280]">{money(zone.amount)}</span>
              </p>
            );
          })}
        </div>
        <div className="my-5 border-t border-[#e5e7eb]" />
        <p className="flex items-center justify-between font-manrope text-[16px] font-medium text-[#6b7280]">
          <span>{t("Subtotal")}</span>
          <span>{money(cart.subtotal)}</span>
        </p>
        {cart.discount > 0 ? (
          <p className="mt-3 flex items-center justify-between font-manrope text-[16px] font-medium text-[#6b7280]">
            <span>
              {cart.coupon ? `${t("Discount")} · ${cart.coupon.code}` : t("Discount")}
            </span>
            <span className="text-[#16a34a]">{`−${money(cart.discount)}`}</span>
          </p>
        ) : null}
        <div className="my-5 border-t border-[#e5e7eb]" />
        <p className="flex items-center justify-between font-manrope font-medium text-[16px] text-[#6b7280]">
          <span>{t("Total")}</span>
          <strong className="text-[28px] font-bold leading-none text-[#111111] sm:text-[32px]">
            {money(cart.total)}
          </strong>
        </p>
        {/* Figma "Minimum purchase reached" note, once the cart can check out. */}
        {remainingRai === 0 ? (
          <div className="mt-5 flex items-start gap-2 rounded-[10px] border border-[#bbf7d0] bg-[#f0fdf4] px-3 py-2.5">
            <span className="mt-0.5 text-[#15803d]">
              <CheckCircleIcon />
            </span>
            <div>
              <p className="font-manrope text-[13px] font-semibold leading-5 text-[#15803d]">
                {t("Minimum purchase reached")}
              </p>
              <p className="font-manrope font-medium text-[11px] leading-4 text-[#16a34a]">
                {fill(t("Your selection meets the {min} Rai minimum."), {
                  min: cart.minimumRai,
                })}
              </p>
            </div>
          </div>
        ) : null}
        {/* TODO: `POST /cart/validate` and `POST /cart/checkout`. */}
        <button
          type="button"
          disabled={!cart.checkoutEligible}
          className="mt-6 h-12 w-full cursor-pointer rounded-[12px] bg-navy font-manrope text-[15px] font-medium text-white hover:bg-navy-deep disabled:cursor-not-allowed disabled:bg-[#d9dde3] disabled:text-[#9aa3ad]"
        >
          {t("Proceed to checkout →")}
        </button>
        <Link
          href={routes.dashboardExplore}
          className="mt-3 flex h-12 items-center justify-center rounded-[12px] border border-[#e4e9ef] bg-white font-manrope text-[15px] font-medium text-[#111111] hover:border-[#cfd8e3]"
        >
          {t("Continue Exploring")}
        </Link>
        {remainingRai > 0 ? (
          <p className="mt-3 flex items-center justify-center gap-1.5 text-center font-manrope font-medium text-[11px] text-[#e11d2e]">
            <WarningIcon />
            {fill(t("Requires {rai} more Rai to activate checkout"), {
              rai: remainingRai,
            })}
          </p>
        ) : null}
      </div>
    </aside>
  );
}

/** Plot image; the local placeholder when missing, from a host we don't allow, or broken. */
function CartItemImage({ src }: { src: string | null | undefined }) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const usable = isAllowedRemoteImage(src) && failedSrc !== src;

  return (
    // next/image serves remote images through our own origin (the CSP blocks direct ones).
    <Image
      src={usable ? src : PLACEHOLDER_IMAGE}
      alt=""
      width={100}
      height={100}
      unoptimized={!usable}
      onError={() => {
        if (usable) setFailedSrc(src);
      }}
      className="h-20 w-20 shrink-0 rounded-[12px] bg-[#edf3f8] object-cover sm:h-[100px] sm:w-[100px]"
    />
  );
}

/** One cart row (Figma "Selected Plots" card); optional fields hide when not sent. */
function CartItemCard({
  item,
  isRemoving,
  onRemove,
  t,
}: {
  item: CartItem;
  isRemoving: boolean;
  onRemove: () => void;
  t: Translate;
}) {
  const location = item.city ?? item.region?.name;
  const title = item.name ?? item.plotNumber ?? item.zone?.name;
  const tier = item.zone?.tier;

  return (
    <article
      className={cn(
        // Figma "Card: In cart": 14px / 16px padding, 12px gap, radius 16.
        "flex items-center gap-3 rounded-[16px] bg-white px-3 py-3 shadow-[0_2px_8px_rgba(0,0,0,0.08)] transition-opacity sm:px-4 sm:py-[14px]",
        isRemoving && "opacity-60",
      )}
    >
      <CartItemImage src={item.imageUrl} />
      <div className="min-w-0 flex-1">
        {tier || item.plotNumber ? (
          <div className="flex flex-wrap items-center gap-2">
            {tier ? (
              <span className="rounded-[4px] bg-[#fdf0c4] px-2 py-[2px] font-manrope text-[10px] font-semibold uppercase leading-4 text-[#c9961a]">
                {t(titleCase(tier))}
              </span>
            ) : null}
            {item.plotNumber ? (
              <span className="rounded-[4px] border border-[#9ca3af] bg-[#f3f4f6] px-1.5 py-px font-manrope font-medium text-[10px] leading-4 text-[#6b7280]">
                {item.plotNumber}
              </span>
            ) : null}
          </div>
        ) : null}
        {title ? (
          <h3 className="mt-1 truncate font-manrope text-[15px] font-semibold leading-6 text-navy sm:text-[16px]">
            {title}
          </h3>
        ) : null}
        {location ? (
          <p className="mt-0.5 inline-flex max-w-full items-center gap-1 rounded-[4px] border border-[#9ca3af] bg-[#f3f4f6] px-1.5 py-px font-manrope font-medium text-[10px] leading-4 text-[#6b7280]">
            <PinIcon />
            <span className="truncate">{location}</span>
          </p>
        ) : null}
        <p className="mt-1.5 font-manrope font-medium text-[12px] leading-4">
          <span className="font-bold text-[#e11d2e]">{`${item.sizeRai} ${t("Rai")}`}</span>
          <span className="text-[#8b939e]">{` · ${money(item.pricePerRai)} / ${t("Rai")}`}</span>
        </p>
      </div>
      <div className="flex shrink-0 flex-col items-end justify-center gap-3 self-stretch sm:gap-4">
        <strong className="font-manrope text-[22px] font-semibold leading-7 text-[#111111] sm:text-[30px] sm:leading-9">
          {money(item.subtotal)}
        </strong>
        <button
          type="button"
          onClick={onRemove}
          disabled={isRemoving}
          className="inline-flex cursor-pointer items-center gap-1.5 font-manrope font-medium text-[12px] text-[#636363] hover:text-[#e11d2e] disabled:cursor-wait"
        >
          <TrashIcon />
          {t(isRemoving ? "Removing..." : "Remove")}
        </button>
      </div>
    </article>
  );
}

type DialogShellProps = {
  titleId: string;
  /** While the action runs: no closing, Escape and the backdrop do nothing. */
  busy: boolean;
  onClose: () => void;
  className: string;
  children: ReactNode;
};

/** Centred modal over a dimmed page; Escape or a backdrop click closes it. */
function DialogShell({ titleId, busy, onClose, className, children }: DialogShellProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // The safe choice ("Keep …") takes focus, and the page behind can't scroll.
    panelRef.current?.querySelector<HTMLElement>("[data-autofocus]")?.focus();
    const { style } = document.body;
    const previous = { overflow: style.overflow, paddingRight: style.paddingRight };
    // Hiding the scrollbar widens the page; pad by its width so nothing shifts.
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    style.overflow = "hidden";
    if (scrollbarWidth > 0) style.paddingRight = `${scrollbarWidth}px`;
    return () => {
      style.overflow = previous.overflow;
      style.paddingRight = previous.paddingRight;
    };
  }, []);

  useEffect(() => {
    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape" && !busy) onClose();
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [busy, onClose]);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-[#0b1f33]/40 px-4 py-6 backdrop-blur-[2px]"
      onClick={() => {
        if (!busy) onClose();
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(event) => event.stopPropagation()}
        className={cn(
          "relative max-h-[calc(100svh-3rem)] w-full max-w-[460px] overflow-y-auto bg-white shadow-[0_24px_60px_rgba(11,31,51,0.22)]",
          className,
        )}
      >
        {children}
      </div>
    </div>
  );
}

function CloseButton({
  onClick,
  disabled,
  label,
}: {
  onClick: () => void;
  disabled: boolean;
  label: string;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
      className="flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded-full text-[#9aa3ad] hover:bg-[#f3f4f6] hover:text-[#111111] disabled:cursor-not-allowed"
    >
      <svg viewBox="0 0 16 16" aria-hidden="true" className="h-3.5 w-3.5">
        <path
          d="M4 4 12 12M12 4 4 12"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
      </svg>
    </button>
  );
}

const keepButton =
  "h-11 cursor-pointer rounded-[10px] border border-[#e4e9ef] bg-white px-3 font-manrope text-[13px] font-medium text-[#111111] hover:border-[#cfd8e3] disabled:cursor-not-allowed disabled:opacity-60";
const dangerButton =
  "h-11 cursor-pointer rounded-[10px] bg-[#e11d2e] px-3 font-manrope text-[13px] font-medium text-white hover:bg-[#c81726] disabled:cursor-wait disabled:opacity-70";

/** Figma "Remove this plot?": the plot's card, then Keep Plot / Remove Plot. */
function RemovePlotDialog({
  item,
  isRemoving,
  onConfirm,
  onClose,
  t,
}: {
  item: CartItem;
  isRemoving: boolean;
  onConfirm: () => void;
  onClose: () => void;
  t: Translate;
}) {
  const titleId = "remove-plot-title";
  const title = item.name ?? item.plotNumber ?? item.zone?.name ?? t("this plot");
  const location = item.city ?? item.region?.name;
  const tier = item.zone?.tier;

  return (
    <DialogShell
      titleId={titleId}
      busy={isRemoving}
      onClose={onClose}
      className="rounded-[24px] border border-[#e8e5df] p-5 sm:p-8"
    >
      <div className="flex items-start justify-between gap-3">
        {tier ? (
          <span className="rounded-[4px] bg-[#fdf0c4] px-2 py-[2px] font-manrope text-[10px] font-semibold uppercase leading-4 text-[#c9961a]">
            {t(titleCase(tier))}
          </span>
        ) : (
          <span />
        )}
        <CloseButton onClick={onClose} disabled={isRemoving} label={t("Close")} />
      </div>
      <h2
        id={titleId}
        className="mt-3 font-manrope text-[20px] font-semibold leading-7 text-[#111111] sm:text-[22px]"
      >
        {t("Remove this plot?")}
      </h2>
      <p className="mt-1.5 font-manrope text-[13px] font-medium leading-5 text-[#6b7280]">
        {fill(t("Are you sure you want to remove {name} from your selection?"), {
          name: title,
        })}
      </p>

      <div className="mt-5 flex items-center gap-3 rounded-[12px] border border-[#eef1f4] bg-white p-3 shadow-[0_2px_8px_rgba(0,0,0,0.06)]">
        <Image
          src={isAllowedRemoteImage(item.imageUrl) ? item.imageUrl : PLACEHOLDER_IMAGE}
          alt=""
          width={56}
          height={56}
          unoptimized={!isAllowedRemoteImage(item.imageUrl)}
          className="h-12 w-12 shrink-0 rounded-[10px] bg-[#edf3f8] object-cover sm:h-14 sm:w-14"
        />
        <div className="min-w-0 flex-1">
          <p className="truncate font-manrope text-[14px] font-semibold leading-5 text-navy sm:text-[15px]">
            {title}
          </p>
          {location ? (
            <p className="mt-0.5 inline-flex max-w-full items-center gap-1 rounded-[4px] border border-[#9ca3af] bg-[#f3f4f6] px-1.5 py-px font-manrope text-[9px] font-medium leading-4 text-[#6b7280]">
              <PinIcon />
              <span className="truncate">{location}</span>
            </p>
          ) : null}
          <p className="mt-0.5 font-manrope text-[11px] font-medium leading-4">
            <span className="font-bold text-[#e11d2e]">{`${item.sizeRai} ${t("Rai")}`}</span>
            <span className="text-[#8b939e]">{` · ${money(item.pricePerRai)} / ${t("Rai")}`}</span>
          </p>
        </div>
        <strong className="shrink-0 font-manrope text-[22px] font-semibold text-[#111111] sm:text-[26px]">
          {money(item.subtotal)}
        </strong>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3">
        <button
          type="button"
          data-autofocus
          onClick={onClose}
          disabled={isRemoving}
          className={keepButton}
        >
          {t("Keep Plot")}
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={isRemoving}
          className={dangerButton}
        >
          {t(isRemoving ? "Removing..." : "Remove Plot")}
        </button>
      </div>
    </DialogShell>
  );
}

/** Figma "Clear your selection?": what will be removed (zones, value), then confirm. */
function ClearCartDialog({
  cart,
  isClearing,
  onConfirm,
  onClose,
  t,
}: {
  cart: CartView;
  isClearing: boolean;
  onConfirm: () => void;
  onClose: () => void;
  t: Translate;
}) {
  const titleId = "clear-cart-title";

  return (
    <DialogShell
      titleId={titleId}
      busy={isClearing}
      onClose={onClose}
      className="rounded-[16px] border border-[#e9ecef] p-5 sm:p-8"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2
            id={titleId}
            className="font-manrope text-[18px] font-semibold leading-6 text-[#111111] sm:text-[20px]"
          >
            {t("Clear your selection?")}
          </h2>
          <p className="mt-1 font-manrope text-[12px] font-medium leading-5 text-[#6b7280]">
            {t("This will remove all selected plots from your cart.")}
          </p>
        </div>
        <CloseButton onClick={onClose} disabled={isClearing} label={t("Close")} />
      </div>

      <div className="mt-5 rounded-[12px] border border-[#eef1f4] bg-[#f9fafb] px-4 py-4">
        <div className="flex items-center justify-between gap-3 font-manrope">
          <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[#8b939e]">
            {t("Items to be removed")}
          </span>
          <span className="text-[11px] font-semibold text-navy">
            {`${cart.plots} ${t(cart.plots === 1 ? "Plot" : "Plots")} · ${cart.totalRai} ${t("Rai")}`}
          </span>
        </div>
        <div className="mt-3 space-y-2 font-manrope text-[13px] font-medium">
          {cart.zones.map((zone) => {
            const color = ZONE_COLORS[zone.tier.toUpperCase()] ?? "#6b7785";
            return (
              <p key={zone.tier} className="flex items-center justify-between">
                <span className="inline-flex items-center gap-2" style={{ color }}>
                  <span
                    aria-hidden="true"
                    className="h-1.5 w-1.5 rounded-full"
                    style={{ backgroundColor: color }}
                  />
                  {t(zone.name)}
                </span>
                <span className="text-[#6b7280]">{money(zone.amount)}</span>
              </p>
            );
          })}
        </div>
        <div className="mt-3 flex items-center justify-between border-t border-[#e5e7eb] pt-3 font-manrope">
          <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#111111]">
            {t("Total value")}
          </span>
          <strong className="text-[14px] font-bold text-[#111111]">
            {money(cart.subtotal)}
          </strong>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3">
        <button
          type="button"
          data-autofocus
          onClick={onClose}
          disabled={isClearing}
          className={keepButton}
        >
          {t("Keep My Selection")}
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={isClearing}
          className={dangerButton}
        >
          {t(isClearing ? "Clearing..." : "Clear All")}
        </button>
      </div>
    </DialogShell>
  );
}

function PinIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-3 w-3 shrink-0">
      <path d="M12 21s6-5.1 6-10a6 6 0 1 0-12 0c0 4.9 6 10 6 10Z" fill="#6b7280" />
      <circle cx="12" cy="11" r="2.2" fill="white" />
    </svg>
  );
}

function PinPlusIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5">
      <path
        d="M12 21s6-5.1 6-10a6 6 0 1 0-12 0c0 4.9 6 10 6 10Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <path
        d="M12 8.5v5M9.5 11h5"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.6"
      />
    </svg>
  );
}

function TrashIcon() {
  // Solid, 10 x 12 (Figma).
  return (
    <svg viewBox="0 0 10 12" aria-hidden="true" className="h-3 w-2.5 shrink-0">
      <path
        d="M3.5 0h3l.5 1H10v1.25H0V1h3L3.5 0ZM.75 3h8.5l-.6 8.1a1 1 0 0 1-1 .9H2.35a1 1 0 0 1-1-.9L.75 3Z"
        fill="currentColor"
      />
    </svg>
  );
}

function CheckCircleIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4 shrink-0">
      <circle
        cx="12"
        cy="12"
        r="8.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="m8.5 12.2 2.3 2.3 4.7-5"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function WarningIcon() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true" className="h-3.5 w-3.5 shrink-0">
      <path
        d="M8 2.5 14 13H2L8 2.5Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
      <path
        d="M8 6.5v3M8 11.3v.2"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.4"
      />
    </svg>
  );
}
