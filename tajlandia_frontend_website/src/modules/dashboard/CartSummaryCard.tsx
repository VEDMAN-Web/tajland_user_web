"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";
import type { CartSummary } from "./schemas/cart.schema";

type Translate = (source: string) => string;

// Order Summary dot / label colour per zone tier (Figma).
export const ZONE_COLORS: Record<string, string> = {
  ICON: "#c9961a",
  POPULAR: "#16807f",
  STANDARD: "#6b7785",
};

export function money(amount: number) {
  return `$${amount.toFixed(2)}`;
}

/** Puts values into a translated "{name}" template. */
export function fill(template: string, values: Record<string, string | number>) {
  return template.replace(/\{(\w+)\}/g, (match, key: string) =>
    key in values ? String(values[key]) : match,
  );
}

/**
 * Figma "Order Summary" card (cart and checkout): plots, Rai, zone split,
 * subtotal, discount and total, all from `GET /cart/order-summary`. The page
 * puts its own buttons below via `children`.
 */
export function OrderSummaryCard({
  summary,
  t,
  children,
}: {
  summary: CartSummary;
  t: Translate;
  children?: ReactNode;
}) {
  const minimumReached = Math.max(summary.remainingRai, 0) === 0;

  return (
    <div className="rounded-[16px] border border-[#eef1f4] bg-white px-5 py-6 shadow-[0_8px_24px_rgba(11,31,77,0.05)] sm:px-7 sm:py-7">
      <h2 className="font-manrope text-[22px] font-semibold leading-none text-[#111111] sm:text-[24px]">
        {t("Order Summary")}
      </h2>
      <div className="mt-5 space-y-3 font-manrope text-[16px] font-medium text-[#6b7280]">
        <p className="flex items-center justify-between">
          <span>{t("Plots")}</span>
          <strong className="font-bold text-navy">{summary.plots}</strong>
        </p>
        <p className="flex items-center justify-between">
          <span>{t("Total Rai")}</span>
          <strong className="font-bold text-[#e11d2e]">{summary.totalRai}</strong>
        </p>
      </div>
      {summary.zones.length ? <div className="my-5 border-t border-[#e5e7eb]" /> : null}
      {/* Zone split as the API sends it (every tier, including those at $0). */}
      <div className="space-y-3 font-manrope text-[16px] font-medium">
        {summary.zones.map((zone) => {
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
        <span>{money(summary.subtotal)}</span>
      </p>
      {summary.discount > 0 ? (
        <p className="mt-3 flex items-center justify-between font-manrope text-[16px] font-medium text-[#6b7280]">
          <span>
            {summary.coupon ? `${t("Discount")} · ${summary.coupon.code}` : t("Discount")}
          </span>
          <span className="text-[#16a34a]">{`−${money(summary.discount)}`}</span>
        </p>
      ) : null}
      <div className="my-5 border-t border-[#e5e7eb]" />
      <p className="flex items-center justify-between font-manrope text-[16px] font-medium text-[#6b7280]">
        <span>{t("Total")}</span>
        <strong className="text-[28px] font-bold leading-none text-[#111111] sm:text-[32px]">
          {money(summary.total)}
        </strong>
      </p>
      {/* Figma "Minimum purchase reached" note, once the cart can check out. */}
      {minimumReached ? (
        <div className="mt-5 flex items-start gap-2 rounded-[10px] border border-[#bbf7d0] bg-[#f0fdf4] px-3 py-2.5">
          <span className="mt-0.5 text-[#15803d]">
            <CheckCircleIcon />
          </span>
          <div>
            <p className="font-manrope text-[13px] font-semibold leading-5 text-[#15803d]">
              {t("Minimum purchase reached")}
            </p>
            <p className="font-manrope text-[11px] font-medium leading-4 text-[#16a34a]">
              {fill(t("Your selection meets the {min} Rai minimum."), {
                min: summary.minimumRai,
              })}
            </p>
          </div>
        </div>
      ) : null}
      {children}
    </div>
  );
}

/** Figma "Coupon" card: the applied code and its discount, with Remove. */
export function CouponAppliedCard({
  code,
  discount,
  onRemove,
  t,
}: {
  code: string;
  discount: number;
  /** Left out when the code can't be changed any more (e.g. the order exists). */
  onRemove?: () => void;
  t: Translate;
}) {
  return (
    <div className="flex min-h-[58px] items-center justify-between gap-3 rounded-[14px] border border-[#bfe3c9] bg-[#e6f4ea] px-4 py-2.5">
      <div className="flex min-w-0 items-center gap-2.5">
        <span className="shrink-0 text-[#15803d]">
          <CheckCircleIcon />
        </span>
        <div className="min-w-0">
          <p className="truncate font-manrope text-[14px] font-medium leading-5 text-[#14532d]">
            {`${t("Coupon applied")} ${code}`}
          </p>
          <p className="font-manrope text-[12px] font-medium leading-4 text-[#3f7a52]">
            {`${t("Discount")} -${money(discount)}`}
          </p>
        </div>
      </div>
      {onRemove ? (
        <button
          type="button"
          onClick={onRemove}
          className="shrink-0 cursor-pointer font-manrope text-[12px] font-medium text-[#15803d] underline underline-offset-2 hover:text-[#14532d]"
        >
          {t("Remove")}
        </button>
      ) : null}
    </div>
  );
}

export function CheckCircleIcon() {
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

export function WarningIcon() {
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

export type CouponControls = {
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
export function CouponForm({
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
      <CouponAppliedCard
        code={coupon.applied.code}
        discount={discount}
        onRemove={coupon.onRemove}
        t={t}
      />
    );
  }

  return (
    <div>
      {/* Not a <form>: on checkout this sits inside the order form, and nested
          forms aren't allowed. Enter in the field applies the code instead. */}
      <div className="flex gap-2">
        <input
          value={coupon.input}
          onChange={(event) => coupon.onInput(event.target.value)}
          placeholder={t("Enter Code")}
          aria-label={t("Enter Code")}
          aria-invalid={hasError}
          aria-describedby={hasError ? errorId : undefined}
          disabled={coupon.isApplying}
          autoCapitalize="characters"
          onKeyDown={(event) => {
            if (event.key !== "Enter") return;
            event.preventDefault();
            coupon.onApply();
          }}
          className={cn(
            "h-14 min-w-0 flex-1 rounded-[12px] border px-4 py-3 font-manrope text-[16px] font-medium outline-none placeholder:text-[#b0b7c0] disabled:opacity-70",
            hasError
              ? "border-[#e11d2e] bg-[#ffdcdf] text-[#e11d2e]"
              : "border-[#e4e9ef] bg-white text-navy focus:border-navy",
          )}
        />
        <button
          type="button"
          onClick={coupon.onApply}
          disabled={coupon.isApplying}
          className="h-14 shrink-0 cursor-pointer rounded-[12px] bg-navy px-7 font-manrope text-[16px] font-medium text-white hover:bg-navy-deep disabled:cursor-wait disabled:opacity-70 sm:text-[18px]"
        >
          {t(coupon.isApplying ? "Applying..." : "Apply")}
        </button>
      </div>
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
