"use client";

import Link from "next/link";
import { routes } from "@/lib/constants/routes";
import { cn } from "@/lib/utils/cn";
import { plotCardStatus, type PlotCardStatus } from "../constants/plot-status";
import type { Translate } from "../types/explore-filters.types";
import type { ExplorePlot } from "../types/explore-map.types";
import { PlaceThumbnail } from "./PlaceThumbnail";

type PlotCardProps = {
  plot: ExplorePlot;
  selected: boolean;
  onSelect: (plot: ExplorePlot) => void;
  /** True while this plot's Add to Cart request runs. */
  isAddingToCart: boolean;
  onAddToCart: (plot: ExplorePlot) => void;
  t: Translate;
};

const STATUS_BADGE: Record<PlotCardStatus, { label: string; className: string }> = {
  available: { label: "Available", className: "border-[#bbf0d0] text-[#18a957]" },
  inCart: { label: "In Cart", className: "border-[#c9d3e6] text-[#001f54]" },
  locked: { label: "Locked", className: "border-[#f6df9c] text-[#c8941a]" },
  taken: { label: "Taken", className: "border-[#f6c4c4] text-[#d64242]" },
  owned: { label: "Your plot", className: "border-[#c9d3e6] text-[#001f54]" },
};

function formatMoney(amount: number, currency: string) {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
    }).format(amount);
  } catch {
    // Unknown currency code from the API: show the number without a symbol.
    return amount.toFixed(2);
  }
}

function CartIcon() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true" className="h-3.5 w-3.5">
      <path
        d="M1.5 2h2l1.6 7.2a1 1 0 0 0 1 .8h5.6a1 1 0 0 0 1-.76L13.9 5H4.3"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="6.5" cy="13" r="1.1" fill="currentColor" />
      <circle cx="11.5" cy="13" r="1.1" fill="currentColor" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true" className="h-3.5 w-3.5">
      <rect x="3" y="7" width="10" height="7" rx="1.5" fill="currentColor" />
      <path
        d="M5.5 7V5a2.5 2.5 0 0 1 5 0v2"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      />
    </svg>
  );
}

function GiftIcon() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true" className="h-3 w-3 shrink-0">
      <path
        d="M2.5 7h11v7h-11zM1.5 4.5h13V7h-13zM8 4.5V14M8 4.5C6.5 2 4 2.3 4.5 4.5M8 4.5C9.5 2 12 2.3 11.5 4.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Plot in the area list (Figma "list of plots" card). Actions aren't wired up yet. */
export function PlotCard({
  plot,
  selected,
  onSelect,
  isAddingToCart,
  onAddToCart,
  t,
}: PlotCardProps) {
  const status = plotCardStatus(plot.status, plot.isOwned, plot.isInCart);
  const badge = STATUS_BADGE[status];
  const tier = plot.zone?.tier;

  const actionClass =
    "flex h-[38px] min-w-[120px] shrink-0 items-center justify-center gap-2 rounded-[8px] px-4 text-[12px] font-medium";

  return (
    <article
      className={cn(
        // Content height on phones; Figma's fixed 184px from sm up.
        "relative flex shrink-0 flex-col gap-3 rounded-[12px] border bg-white p-[14px] shadow-[0_1px_2px_rgba(0,0,0,0.05)] transition-colors sm:h-[184px]",
        selected ? "border-[#001f54]" : "border-[#e9ecef] hover:border-[#cfd8e3]",
      )}
    >
      {selected ? (
        <span className="absolute -top-2 right-3 flex items-center gap-1 rounded-full bg-[#001f54] px-2 py-[3px] text-[8px] font-bold uppercase leading-none tracking-[0.06em] text-white">
          <span aria-hidden="true" className="h-1 w-1 rounded-full bg-white" />
          {t("Selected")}
        </span>
      ) : null}

      {/* The whole top area selects the plot; the action button stays separate. */}
      <button
        type="button"
        onClick={() => onSelect(plot)}
        aria-pressed={selected}
        className="flex min-w-0 cursor-pointer gap-3 text-left"
      >
        <span className="relative shrink-0">
          <PlaceThumbnail
            src={plot.imageUrl}
            size={99}
            className="h-[84px] w-[84px] rounded-[12px] sm:h-[99px] sm:w-[99px]"
          />
          {tier ? (
            <span className="absolute left-1.5 top-1.5 rounded-[4px] bg-[#fde68a] px-1.5 py-0.5 text-[8px] font-semibold uppercase leading-none text-[#8a5a00]">
              {t(tier.charAt(0) + tier.slice(1).toLowerCase())}
            </span>
          ) : null}
        </span>

        <span className="flex min-w-0 flex-1 flex-col">
          <span className="flex items-start justify-between gap-2">
            <span className="min-w-0">
              <strong className="block truncate text-[13px] font-medium leading-5 text-[#0b1f33]">
                {plot.name ?? plot.plotNumber}
              </strong>
              <span className="mt-0.5 flex items-center gap-1 truncate text-[10px] leading-4 text-[#6b7785]">
                {plot.isGifted ? (
                  <span className="text-[#001f54]" title={t("Gifted plot")}>
                    <GiftIcon />
                  </span>
                ) : null}
                {plot.name ? plot.plotNumber : (plot.region?.name ?? "")}
              </span>
            </span>
            <span
              className={cn(
                "shrink-0 rounded-full border bg-white px-2 py-[3px] text-[8px] font-bold uppercase leading-none tracking-[0.06em]",
                badge.className,
              )}
            >
              {t(badge.label)}
            </span>
          </span>

          <span className="mt-auto grid grid-cols-2 border-t border-[#eef1f5] pt-2">
            <span className="min-w-0 pr-2">
              <span className="block text-[9px] leading-3 text-[#8a94a3]">
                {t("Total Rai")}
              </span>
              <span className="mt-1 block truncate text-[13px] font-medium leading-4 text-[#d64242]">
                {`${plot.sizeRai} ${t("Rai")}`}
              </span>
            </span>
            <span className="min-w-0 border-l border-[#eef1f5] pl-2">
              <span className="block text-[9px] leading-3 text-[#8a94a3]">
                {t("$ per Rai")}
              </span>
              <span className="mt-1 block truncate text-[13px] font-medium leading-4 text-[#0b1f33]">
                {formatMoney(plot.pricePerRai, plot.currency)}
              </span>
            </span>
          </span>
        </span>
      </button>

      <div className="mt-auto flex items-end justify-between gap-3">
        <div className="min-w-0">
          <span className="block text-[9px] uppercase leading-3 tracking-[0.04em] text-[#8a94a3]">
            {t("Total Price")}
          </span>
          <span className="mt-1 flex items-baseline gap-1">
            <span className="text-[18px] font-semibold leading-6 text-[#001f54]">
              {formatMoney(plot.totalPrice, plot.currency)}
            </span>
            <span className="text-[9px] uppercase text-[#8a94a3]">{plot.currency}</span>
          </span>
        </div>

        {/* TODO: wire "View Deed" to the deed API. */}
        {status === "available" ? (
          <button
            type="button"
            disabled={isAddingToCart}
            onClick={() => onAddToCart(plot)}
            className={cn(
              actionClass,
              "cursor-pointer bg-[#001f54] text-white hover:bg-[#0b2d6b] disabled:cursor-wait disabled:opacity-70",
            )}
          >
            <CartIcon />
            {t(isAddingToCart ? "Adding..." : "Add to Cart")}
          </button>
        ) : status === "inCart" ? (
          <Link
            href={routes.cart}
            className={cn(
              actionClass,
              "cursor-pointer bg-[#eef2f7] text-[#001f54] hover:bg-[#e2e8f1]",
            )}
          >
            {t("View Cart")}
          </Link>
        ) : status === "owned" ? (
          <button
            type="button"
            className={cn(
              actionClass,
              "cursor-pointer bg-[#eef2f7] text-[#001f54] hover:bg-[#e2e8f1]",
            )}
          >
            {`${t("View Deed")} →`}
          </button>
        ) : (
          <button
            type="button"
            disabled
            className={cn(actionClass, "cursor-not-allowed bg-[#eef1f5] text-[#a0aab6]")}
          >
            <LockIcon />
            {t(status === "locked" ? "Locked" : "Taken")}
          </button>
        )}
      </div>
    </article>
  );
}

const bone = "animate-pulse rounded-[6px] bg-[#eef1f5] motion-reduce:animate-none";

/** Card outline in grey blocks while the area's plots load (Figma loading state). */
export function PlotCardSkeleton() {
  return (
    <div
      aria-hidden="true"
      className="flex shrink-0 flex-col gap-3 rounded-[12px] border border-[#e9ecef] bg-white p-[14px] sm:h-[184px]"
    >
      <div className="flex gap-3">
        <span
          className={cn(
            bone,
            "h-[84px] w-[84px] shrink-0 rounded-[12px] sm:h-[99px] sm:w-[99px]",
          )}
        />
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex justify-between gap-2">
            <span className={cn(bone, "h-3.5 w-2/5")} />
            <span className={cn(bone, "h-3.5 w-14 rounded-full")} />
          </div>
          <span className={cn(bone, "mt-2 h-2.5 w-1/4")} />
          <div className="mt-auto grid grid-cols-2 gap-2 border-t border-[#eef1f5] pt-2">
            <span className={cn(bone, "h-6")} />
            <span className={cn(bone, "h-6")} />
          </div>
        </div>
      </div>
      <div className="mt-auto flex items-end justify-between gap-3">
        <span className={cn(bone, "h-7 w-24")} />
        <span className={cn(bone, "h-[38px] w-[120px] rounded-[8px]")} />
      </div>
    </div>
  );
}
