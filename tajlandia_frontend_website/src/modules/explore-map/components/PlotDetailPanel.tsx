"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, type ReactNode } from "react";
import { isAllowedRemoteImage } from "@/lib/config/remote-images";
import { routes } from "@/lib/constants/routes";
import { cn } from "@/lib/utils/cn";
import { plotCardStatus } from "../constants/plot-status";
import type { Translate } from "../types/explore-filters.types";
import type { ExplorePlotDetail } from "../types/explore-map.types";

type PlotDetailPanelProps = {
  plot: ExplorePlotDetail;
  onFocusPlot: () => void;
  /** True while this plot's Add to Cart request runs. */
  isAddingToCart: boolean;
  onAddToCart: () => void;
  t: Translate;
};

const PLACEHOLDER_SRC = "/images/explore/place-placeholder.svg";
const SQM_PER_SQFT = 0.09290304;

// Cart progress is static until the cart flow is wired up.
const CART_DEMO = { cartRai: 25, minimumRai: 100, total: 2.5 };

const STATUS_STYLE = {
  available: { label: "Available", text: "text-[#18a957]", dot: "bg-[#18a957]" },
  inCart: { label: "In Cart", text: "text-[#001f54]", dot: "bg-[#001f54]" },
  locked: { label: "Locked", text: "text-[#c8941a]", dot: "bg-[#c8941a]" },
  taken: { label: "Taken", text: "text-[#d64242]", dot: "bg-[#d64242]" },
  owned: { label: "Your plot", text: "text-[#001f54]", dot: "bg-[#001f54]" },
} as const;

function money(amount: number, currency: string) {
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

function toDms(value: number, positive: string, negative: string) {
  const abs = Math.abs(value);
  const degrees = Math.floor(abs);
  const minutesFull = (abs - degrees) * 60;
  const minutes = Math.floor(minutesFull);
  const seconds = ((minutesFull - minutes) * 60).toFixed(1);
  return `${degrees}°${minutes}'${seconds}"${value < 0 ? negative : positive}`;
}

/** `{lat: 13.73, lng: 100.569}` -> `13°43'48.0"N 100°34'8.4"E` (Google Maps style). */
export function formatCoordinates({ lat, lng }: { lat: number; lng: number }) {
  return `${toDms(lat, "N", "S")} ${toDms(lng, "E", "W")}`;
}

/** Square metres from the API's square feet, rounded; null when not sent. */
export function plotSizeSqm(sizeSquareFeet: number | null | undefined) {
  return sizeSquareFeet == null ? null : Math.round(sizeSquareFeet * SQM_PER_SQFT);
}

const titleCase = (value: string) => value.charAt(0) + value.slice(1).toLowerCase();

function ShareIcon() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true" className="h-3.5 w-3.5">
      <circle
        cx="12"
        cy="3.5"
        r="1.8"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.3"
      />
      <circle cx="4" cy="8" r="1.8" fill="none" stroke="currentColor" strokeWidth="1.3" />
      <circle
        cx="12"
        cy="12.5"
        r="1.8"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.3"
      />
      <path
        d="m5.6 7.1 4.8-2.7M5.6 8.9l4.8 2.7"
        stroke="currentColor"
        strokeWidth="1.3"
      />
    </svg>
  );
}

function Chevron({ direction }: { direction: "left" | "right" }) {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true" className="h-3 w-3">
      <path
        d={direction === "left" ? "M10 3 5 8l5 5" : "m6 3 5 5-5 5"}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function DetailRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-[minmax(0,40%)_1fr] border-b border-[#eef1f5] last:border-b-0">
      <dt className="border-r border-[#eef1f5] px-3.5 py-3 text-[11px] text-[#6b7785]">
        {label}
      </dt>
      <dd className="min-w-0 px-3.5 py-3 text-[13px] text-[#0b1f33]">{children}</dd>
    </div>
  );
}

// Actions (share, gallery) aren't wired up yet.
const decorative = "cursor-pointer";

/** Plot image; the local placeholder when missing, from a host we don't allow, or broken. */
function PlotImage({ src, alt }: { src: string | null | undefined; alt: string }) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const usable = isAllowedRemoteImage(src) && failedSrc !== src;

  return (
    <Image
      src={usable ? src : PLACEHOLDER_SRC}
      alt={alt}
      fill
      sizes="(max-width: 640px) 100vw, 420px"
      unoptimized={!usable}
      onError={() => {
        if (usable) setFailedSrc(src);
      }}
      className="object-cover"
    />
  );
}

/** Plot detail (Figma "Added to cart / rei calc") from `GET /explore/plots/{plotId}`. */
export function PlotDetailPanel({
  plot,
  onFocusPlot,
  isAddingToCart,
  onAddToCart,
  t,
}: PlotDetailPanelProps) {
  const statusKey = plotCardStatus(plot.status, plot.isOwned, plot.isInCart);
  const status = STATUS_STYLE[statusKey];
  const progress = Math.min(100, (CART_DEMO.cartRai / CART_DEMO.minimumRai) * 100);
  const tier = plot.zone?.tier;
  const sizeSqm = plotSizeSqm(plot.sizeSquareFeet);
  const place = [plot.location?.name, plot.region.name].filter(Boolean).join(", ");

  return (
    <article className="flex flex-col" aria-label={t("Plot details")}>
      {/* Image header: edge to edge, 190px tall, dark gradient (60% -> 0% -> 20%). */}
      <div className="relative h-[190px] w-full shrink-0 overflow-hidden">
        <PlotImage src={plot.imageUrl} alt={plot.name} />
        <span
          aria-hidden="true"
          className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.6)_0%,rgba(0,0,0,0)_45%,rgba(0,0,0,0.2)_100%)]"
        />
        <span
          className={cn(
            // Figma: top-right of the image (sharing lives in the title row).
            "absolute right-3 top-3 rounded-full bg-white px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.06em]",
            status.text,
          )}
        >
          {t(status.label)}
        </span>
        <button
          type="button"
          aria-label={t("Previous image")}
          className={cn(
            decorative,
            "absolute left-3 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full bg-black/25 text-white",
          )}
        >
          <Chevron direction="left" />
        </button>
        <button
          type="button"
          aria-label={t("Next image")}
          className={cn(
            decorative,
            "absolute right-3 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full bg-black/25 text-white",
          )}
        >
          <Chevron direction="right" />
        </button>
      </div>

      <div className="px-4 pb-6 pt-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-[13px] font-semibold text-[#0b1f33]">
              {plot.plotNumber}
            </span>
            {tier ? (
              <span className="rounded-[4px] bg-[#fde68a] px-1.5 py-0.5 text-[10px] font-medium uppercase text-[#8a5a00]">
                {t(titleCase(tier))}
              </span>
            ) : null}
          </div>
          <button
            type="button"
            aria-label={t("Share")}
            className={cn(
              decorative,
              "flex h-7 w-7 items-center justify-center rounded-full bg-[#f1f4f9] text-[#0b1f33]",
            )}
          >
            <ShareIcon />
          </button>
        </div>
        <h2 className="mt-1 text-[19px] font-semibold leading-7 text-[#0b1f33]">
          {plot.name}
        </h2>
        <p className="mt-0.5 flex items-center gap-1 text-[11px] text-[#6b7785]">
          <svg viewBox="0 0 16 16" aria-hidden="true" className="h-3 w-3 shrink-0">
            <path
              d="M8 14.5s4.5-4.2 4.5-7.8a4.5 4.5 0 1 0-9 0c0 3.6 4.5 7.8 4.5 7.8Z"
              fill="currentColor"
            />
            <circle cx="8" cy="6.7" r="1.6" fill="white" />
          </svg>
          <span className="truncate">
            {plot.zone ? `${place} • ${plot.zone.name}` : place}
          </span>
        </p>

        <div className="mt-3 flex items-center justify-between gap-3 border-t border-[#eef1f5] pt-3">
          <span className="truncate text-[10px] text-[#0b1f33]">
            {formatCoordinates(plot.coordinates)}
          </span>
          <button
            type="button"
            onClick={onFocusPlot}
            className="flex shrink-0 cursor-pointer items-center gap-1 text-[11px] font-semibold text-[#001f54] hover:underline"
          >
            {t("Focus Plot")}
            <Chevron direction="right" />
          </button>
        </div>

        <dl className="mt-3 overflow-hidden rounded-[10px] border border-[#e9ecef]">
          <DetailRow label={t("Size")}>
            <span className="font-medium text-[#d64242]">{`${plot.sizeRai} ${t("Rai")}`}</span>
            {sizeSqm !== null ? (
              <span className="text-[#6b7785]">
                {` (${sizeSqm.toLocaleString("en-US")} ${t("Sqm")})`}
              </span>
            ) : null}
          </DetailRow>
          <DetailRow label={t("Rate")}>
            <span className="font-medium text-[#001f54]">
              {money(plot.pricePerRai, plot.currency)}
            </span>{" "}
            <span className="text-[#6b7785]">{`/ ${t("Per Rai")}`}</span>
          </DetailRow>
          <DetailRow label={t("Zone Type")}>
            {/* The tier ("Icon"), not the zone's numbered name ("Icon 01"). */}
            {tier ? t(titleCase(tier)) : "—"}
          </DetailRow>
          {/* "Near By" (Figma) is hidden until the API sends it. */}
          <DetailRow label={t("Cadastre status")}>
            <span className={cn("flex items-center gap-1.5 font-medium", status.text)}>
              <span
                aria-hidden="true"
                className={cn("h-1.5 w-1.5 rounded-full", status.dot)}
              />
              {t(status.label)}
            </span>
          </DetailRow>
        </dl>

        <div className="mt-3 flex items-center justify-between gap-3 rounded-[12px] border border-[#e9ecef] px-4 py-4">
          <span className="text-[14px] text-[#0b1f33]">{t("Total Investment")}</span>
          <span className="text-[24px] font-semibold leading-none text-[#001f54]">
            {money(plot.totalPrice, plot.currency)}
          </span>
        </div>

        {/* Cart progress: static until the cart flow is wired up. */}
        <div className="mt-4 flex items-center justify-between text-[11px] text-[#0b1f33]">
          <span>{`${CART_DEMO.cartRai} ${t("Rai")} / ${CART_DEMO.minimumRai} ${t("Rai")}`}</span>
          <span className="font-medium">
            {`${t("Total")}: ${money(CART_DEMO.total, "USD")}`}
          </span>
        </div>
        <div
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={CART_DEMO.minimumRai}
          aria-valuenow={CART_DEMO.cartRai}
          className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#eef1f5]"
        >
          <span
            className="block h-full rounded-full bg-[#d64242]"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* In the cart: View Cart. Available: Add to Cart. Otherwise its status. */}
        <div className="mt-4">
          {statusKey === "inCart" ? (
            <Link
              href={routes.cart}
              className="flex h-11 items-center justify-center rounded-[10px] bg-[#001f54] text-[13px] font-medium text-white hover:bg-[#0b2d6b]"
            >
              {`${t("View Cart")} →`}
            </Link>
          ) : statusKey === "available" ? (
            <button
              type="button"
              disabled={isAddingToCart}
              onClick={onAddToCart}
              className="flex h-11 w-full cursor-pointer items-center justify-center rounded-[10px] bg-[#001f54] text-[13px] font-medium text-white hover:bg-[#0b2d6b] disabled:cursor-wait disabled:opacity-70"
            >
              {t(isAddingToCart ? "Adding..." : "Add to Cart")}
            </button>
          ) : (
            <p className="flex h-11 items-center justify-center rounded-[10px] bg-[#eef1f5] text-[13px] font-medium text-[#8a94a3]">
              {t(status.label)}
            </p>
          )}
        </div>
      </div>
    </article>
  );
}

const bone = "animate-pulse rounded-[6px] bg-[#eef1f5] motion-reduce:animate-none";

/** Detail layout in grey blocks while `GET /explore/plots/{plotId}` loads. */
export function PlotDetailSkeleton({ t }: { t: Translate }) {
  return (
    <div
      className="flex flex-col"
      role="status"
      aria-label={t("Loading plot details...")}
    >
      <span className={cn(bone, "h-[190px] w-full shrink-0 rounded-none")} />
      <div className="px-4 pb-6 pt-4">
        <span className={cn(bone, "block h-4 w-28")} />
        <span className={cn(bone, "mt-3 block h-6 w-3/4")} />
        <span className={cn(bone, "mt-2 block h-3 w-1/2")} />
        <div className="mt-4 flex justify-between border-t border-[#eef1f5] pt-3">
          <span className={cn(bone, "h-3 w-36")} />
          <span className={cn(bone, "h-3 w-16")} />
        </div>
        <div className="mt-3 overflow-hidden rounded-[10px] border border-[#e9ecef]">
          {Array.from({ length: 4 }, (_, row) => (
            <div
              key={row}
              className="grid grid-cols-[minmax(0,40%)_1fr] border-b border-[#eef1f5] last:border-b-0"
            >
              <span className="border-r border-[#eef1f5] px-3.5 py-3.5">
                <span className={cn(bone, "block h-3 w-14")} />
              </span>
              <span className="px-3.5 py-3.5">
                <span className={cn(bone, "block h-3 w-24")} />
              </span>
            </div>
          ))}
        </div>
        <span className={cn(bone, "mt-3 block h-[58px] w-full rounded-[12px]")} />
        <span className={cn(bone, "mt-4 block h-11 w-full rounded-[10px]")} />
      </div>
    </div>
  );
}

type PlotDetailErrorProps = {
  /** 404: the plot is gone, so retrying won't help. */
  notFound: boolean;
  onRetry: () => void;
  onBack: () => void;
  t: Translate;
};

/** Shown in place of the detail when it can't be loaded. */
export function PlotDetailError({ notFound, onRetry, onBack, t }: PlotDetailErrorProps) {
  return (
    <div
      role="alert"
      className="flex flex-1 flex-col items-center justify-center gap-2 px-6 py-16 text-center"
    >
      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#eef1f5] text-[#8a94a3]">
        <svg viewBox="0 0 16 16" aria-hidden="true" className="h-4 w-4">
          <path
            d="M8 14.5s4.5-4.2 4.5-7.8a4.5 4.5 0 1 0-9 0c0 3.6 4.5 7.8 4.5 7.8Z"
            fill="currentColor"
          />
          <circle cx="8" cy="6.7" r="1.6" fill="#eef1f5" />
        </svg>
      </span>
      <p className="mt-1 text-[13px] font-bold uppercase tracking-[0.06em] text-[#001f54]">
        {t(notFound ? "Plot not found" : "Plot details unavailable")}
      </p>
      <p className="text-[11px] leading-4 text-[#6b7785]">
        {t(
          notFound
            ? "This plot is no longer available."
            : "We couldn't load this plot right now.",
        )}
      </p>
      <div className="mt-2 flex items-center gap-2">
        <button
          type="button"
          onClick={onBack}
          className="flex h-7 cursor-pointer items-center rounded-[6px] border border-[#d9e1ea] px-3 text-[11px] font-semibold text-[#6b7785] hover:bg-[#f5f7fa]"
        >
          {t("Back to plots")}
        </button>
        {notFound ? null : (
          <button
            type="button"
            onClick={onRetry}
            className="flex h-7 cursor-pointer items-center rounded-[6px] border border-[#001f54] px-3 text-[11px] font-semibold text-[#001f54] hover:bg-[#f5f7fa]"
          >
            {t("Try Again")}
          </button>
        )}
      </div>
    </div>
  );
}
