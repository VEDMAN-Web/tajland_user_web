"use client";

import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { routes } from "@/lib/constants/routes";
import { cn } from "@/lib/utils/cn";
import { plotCardStatus } from "../constants/plot-status";
import type { PlotDetail } from "../data/plot-detail.mock";
import type { Translate } from "../types/explore-filters.types";

type PlotDetailPanelProps = {
  detail: PlotDetail;
  onFocusPlot: () => void;
  t: Translate;
};

const STATUS_STYLE = {
  available: { label: "Available", text: "text-[#18a957]", dot: "bg-[#18a957]" },
  locked: { label: "Locked", text: "text-[#c8941a]", dot: "bg-[#c8941a]" },
  taken: { label: "Taken", text: "text-[#d64242]", dot: "bg-[#d64242]" },
  owned: { label: "Your plot", text: "text-[#001f54]", dot: "bg-[#001f54]" },
} as const;

const money = (amount: number, currency: string) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(amount);

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

// Actions (share, gallery, Remove) aren't wired up yet.
const decorative = "cursor-pointer";

/** Plot detail (Figma "Added to cart / rei calc"). Demo data until the detail API is used. */
export function PlotDetailPanel({ detail, onFocusPlot, t }: PlotDetailPanelProps) {
  const status = STATUS_STYLE[plotCardStatus(detail.status, false)];
  const progress = Math.min(100, (detail.cartRai / detail.minimumRai) * 100);
  const tierLabel = detail.tier.charAt(0) + detail.tier.slice(1).toLowerCase();

  return (
    <article className="flex flex-col" aria-label={t("Plot details")}>
      {/* Image header: edge to edge, 190px tall, dark gradient (60% -> 0% -> 20%). */}
      <div className="relative h-[190px] w-full shrink-0 overflow-hidden">
        <Image
          src={detail.imageUrl}
          alt={detail.name}
          fill
          sizes="(max-width: 640px) 100vw, 420px"
          className="object-cover"
        />
        <span
          aria-hidden="true"
          className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.6)_0%,rgba(0,0,0,0)_45%,rgba(0,0,0,0.2)_100%)]"
        />
        <span
          className={cn(
            "absolute left-3 top-3 rounded-full bg-white px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.06em]",
            status.text,
          )}
        >
          {t(status.label)}
        </span>
        <button
          type="button"
          aria-label={t("Share")}
          className={cn(
            decorative,
            "absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full bg-white text-[#0b1f33]",
          )}
        >
          <ShareIcon />
        </button>
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
              {detail.plotNumber}
            </span>
            <span className="rounded-[4px] bg-[#fde68a] px-1.5 py-0.5 text-[10px] font-medium uppercase text-[#8a5a00]">
              {t(tierLabel)}
            </span>
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
          {detail.name}
        </h2>
        <p className="mt-0.5 flex items-center gap-1 text-[11px] text-[#6b7785]">
          <svg viewBox="0 0 16 16" aria-hidden="true" className="h-3 w-3 shrink-0">
            <path
              d="M8 14.5s4.5-4.2 4.5-7.8a4.5 4.5 0 1 0-9 0c0 3.6 4.5 7.8 4.5 7.8Z"
              fill="currentColor"
            />
            <circle cx="8" cy="6.7" r="1.6" fill="white" />
          </svg>
          <span className="truncate">{`${detail.location} • ${detail.zoneLabel}`}</span>
        </p>

        <div className="mt-3 flex items-center justify-between gap-3 border-t border-[#eef1f5] pt-3">
          <span className="truncate text-[10px] text-[#0b1f33]">
            {detail.coordinatesLabel}
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
            <span className="font-medium text-[#d64242]">{`${detail.sizeRai} ${t("Rai")}`}</span>{" "}
            <span className="text-[#6b7785]">
              {`(${detail.sizeSqm.toLocaleString("en-US")} ${t("Sqm")})`}
            </span>
          </DetailRow>
          <DetailRow label={t("Rate")}>
            <span className="font-medium text-[#001f54]">
              {money(detail.pricePerRai, detail.currency)}
            </span>{" "}
            <span className="text-[#6b7785]">{`/ ${t("Per Rai")}`}</span>
          </DetailRow>
          <DetailRow label={t("Zone Type")}>{t(detail.zoneType)}</DetailRow>
          <DetailRow label={t("Near By")}>{detail.nearBy}</DetailRow>
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
            {money(detail.totalInvestment, detail.currency)}
          </span>
        </div>

        <div className="mt-4 flex items-center justify-between text-[11px] text-[#0b1f33]">
          <span>{`${detail.cartRai} ${t("Rai")} / ${detail.minimumRai} ${t("Rai")}`}</span>
          <span className="font-medium">
            {`${t("Total")}: ${money(detail.totalInvestment, detail.currency)}`}
          </span>
        </div>
        <div
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={detail.minimumRai}
          aria-valuenow={detail.cartRai}
          className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#eef1f5]"
        >
          <span
            className="block h-full rounded-full bg-[#d64242]"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="mt-4 flex items-center gap-3">
          <Link
            href={routes.cart}
            className="flex h-11 flex-1 items-center justify-center rounded-[10px] bg-[#001f54] text-[13px] font-medium text-white hover:bg-[#0b2d6b]"
          >
            {`${t("View Cart")} →`}
          </Link>
          <button
            type="button"
            className={cn(
              decorative,
              "shrink-0 text-[11px] font-medium text-[#d64242] underline",
            )}
          >
            {t("Remove")}
          </button>
        </div>
      </div>
    </article>
  );
}
