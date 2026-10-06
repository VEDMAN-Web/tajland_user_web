"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { isAllowedRemoteImage } from "@/lib/config/remote-images";
import { routes } from "@/lib/constants/routes";
import { CheckCircleIcon, money } from "./CartSummaryCard";
import type { Order } from "./schemas/cart.schema";

const PLACEHOLDER_IMAGE = "/images/explore/place-placeholder.svg";
const SQM_PER_SQFT = 0.09290304;
// Fixed card heights, so the list shows exactly two before it scrolls.
const CARD_HEIGHT = 106;
const GIFT_CARD_HEIGHT = 124;
const CARD_GAP = 12;
const titleCase = (value: string) => value.charAt(0) + value.slice(1).toLowerCase();
type OrderItem = Order["items"][number];

type Translate = (source: string) => string;

// How long Figma's "Purchase Confirmed" shows before the ownership pop up.
const CONFIRMED_STAGE_MS = 2500;

/**
 * Shown once `POST /payments` succeeded, with the order from `GET /orders/{id}`:
 * first Figma's "Purchase Confirmed" (no buttons; moves on by itself or on a
 * click), then the "Purchase complete" / "Gift purchase complete" pop up.
 */
export function OrderConfirmedDialog({
  order,
  onClose,
  t,
}: {
  order: Order;
  onClose: () => void;
  t: Translate;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [shareState, setShareState] = useState<"idle" | "copied" | "failed">("idle");
  const isGift = order.purchaseType === "gift";
  const titleId = "order-confirmed-title";
  const certificateUrl = order.certificateUrl ?? undefined;
  const [stage, setStage] = useState<"confirmed" | "details">("confirmed");

  useEffect(() => {
    if (stage !== "confirmed") return;
    const timer = window.setTimeout(() => setStage("details"), CONFIRMED_STAGE_MS);
    return () => window.clearTimeout(timer);
  }, [stage]);

  useEffect(() => {
    panelRef.current?.querySelector<HTMLElement>("[data-autofocus]")?.focus();
  }, [stage]);

  useEffect(() => {
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
      if (event.key !== "Escape") return;
      if (stage === "confirmed") setStage("details");
      else onClose();
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose, stage]);

  // The certificate link: the system share sheet where there is one, else copied.
  async function share() {
    if (!certificateUrl) return;
    try {
      if (navigator.share) {
        await navigator.share({ title: t("Tajlandia ownership"), url: certificateUrl });
        return;
      }
      await navigator.clipboard.writeText(certificateUrl);
      setShareState("copied");
    } catch (error) {
      // Closing the share sheet isn't a failure.
      if (error instanceof DOMException && error.name === "AbortError") return;
      setShareState("failed");
    }
  }

  if (stage === "confirmed") {
    return (
      <div
        className="fixed inset-0 z-[100] flex items-center justify-center bg-[#0b1f33]/40 px-4 py-6 backdrop-blur-[2px]"
        onClick={() => setStage("details")}
      >
        {/* Figma "Confirmation Modal": red top edge, 500 wide, radius 24, padding 64. */}
        <div
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="purchase-confirmed-title"
          tabIndex={-1}
          data-autofocus
          onClick={() => setStage("details")}
          className="relative w-full max-w-[500px] cursor-pointer overflow-hidden rounded-[24px] bg-white px-6 pb-10 pt-12 text-center shadow-[0_10px_30px_rgba(18,59,109,0.05)] outline-none sm:px-16 sm:pb-14 sm:pt-16"
        >
          <span
            aria-hidden="true"
            className="absolute inset-x-0 top-0 h-2 bg-[#e11d2e]"
          />
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#fdecee]">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#e11d2e] text-white">
              <svg viewBox="0 0 16 16" aria-hidden="true" className="h-3.5 w-3.5">
                <path
                  d="m4 8.4 2.6 2.6L12 5.4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
          </span>
          <h2
            id="purchase-confirmed-title"
            className="mt-5 font-manrope text-[24px] font-semibold leading-8 text-navy sm:text-[28px]"
          >
            {t("Purchase Confirmed")}
          </h2>
          <p className="mt-2 font-manrope text-[13px] font-medium leading-5 text-[#6b7280]">
            {t("Your little piece of Thailand is now yours.")}
            <br />
            {t("Your purchase has been successfully completed.")}
          </p>
          <dl className="mt-6 divide-y divide-[#eef1f4] rounded-[12px] border border-[#eef1f4] px-4 text-left font-manrope text-[13px]">
            <Row label={t("Order Number")} value={order.orderNo ?? "—"} />
            <Row
              label={t("Items")}
              value={`${order.totalPlots} ${t(order.totalPlots === 1 ? "Plot" : "Plots")} · ${order.totalRai} ${t("Rai")}`}
            />
            <Row label={t("Total Paid")} value={money(order.total)} strong />
          </dl>
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-[#0b1f33]/40 px-4 py-6 backdrop-blur-[2px]"
      onClick={onClose}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(event) => event.stopPropagation()}
        className="relative max-h-[calc(100svh-3rem)] w-full max-w-[500px] overflow-y-auto rounded-[24px] border border-[#e9ecef] bg-white p-6 shadow-[0_10px_30px_rgba(18,59,109,0.05)] sm:p-9"
      >
        <div className="flex items-start justify-between gap-3">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#eef2f7] px-2.5 py-1 font-manrope text-[10px] font-semibold uppercase tracking-[0.06em] text-navy">
            {isGift ? <GiftIcon /> : <CheckCircleIcon />}
            {t(isGift ? "Gift purchase complete" : "Purchase complete")}
          </span>
          <button
            type="button"
            aria-label={t("Close")}
            onClick={onClose}
            className="flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded-full text-[#9aa3ad] hover:bg-[#f3f4f6] hover:text-[#111111]"
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
        </div>

        <h2
          id={titleId}
          className="mt-4 font-manrope text-[22px] font-semibold leading-7 text-[#111111] sm:text-[24px]"
        >
          {t(
            isGift ? "Your gift is on its way." : "Your piece of Thailand is now yours.",
          )}
        </h2>
        <p className="mt-1.5 font-manrope text-[13px] font-medium leading-5 text-[#6b7280]">
          {t(
            isGift
              ? "You've gifted a verified piece of Thailand to someone special."
              : "Share your verified Tajlandia ownership record with colleagues, banks, or legal counsel.",
          )}
        </p>

        {/* Figma plot card, one per bought plot; scrolls when there are many. */}
        <ul
          className="mt-5 space-y-3 overflow-y-auto pr-1 [scrollbar-width:thin] [scrollbar-color:#d9e1ea_transparent]"
          // Two cards at a time (Figma), the rest scroll.
          style={{ maxHeight: 2 * (isGift ? GIFT_CARD_HEIGHT : CARD_HEIGHT) + CARD_GAP }}
        >
          {order.items.map((item) => (
            <li key={item.plotId}>
              <PurchasedPlotCard item={item} variant={isGift ? "gift" : "self"} t={t} />
            </li>
          ))}
        </ul>

        {isGift ? (
          <div className="mt-4 flex items-start gap-2 rounded-[10px] border border-[#bbf7d0] bg-[#f0fdf4] px-3 py-2.5">
            <span className="mt-0.5 text-[#15803d]">
              <CheckCircleIcon />
            </span>
            <div>
              <p className="font-manrope text-[13px] font-semibold leading-5 text-[#15803d]">
                {t("Gift sent successfully")}
              </p>
              <p className="font-manrope text-[11px] font-medium leading-4 text-[#16a34a]">
                {t(
                  "The gift certificate and claim link have been prepared for the recipient.",
                )}
              </p>
            </div>
          </div>
        ) : null}

        <div className="mt-6 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => void share()}
            disabled={!certificateUrl}
            className="flex h-11 cursor-pointer items-center justify-center gap-2 rounded-[10px] border border-[#e4e9ef] bg-white font-manrope text-[13px] font-medium text-[#111111] hover:border-[#cfd8e3] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <ShareIcon />
            {t(shareState === "copied" ? "Link copied" : "Share Link")}
          </button>
          {certificateUrl ? (
            <a
              data-autofocus
              href={certificateUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-11 items-center justify-center rounded-[10px] bg-navy font-manrope text-[13px] font-medium text-white hover:bg-navy-deep"
            >
              {t(isGift ? "View Details" : "View Ownership")}
            </a>
          ) : (
            <Link
              data-autofocus
              href={routes.land}
              className="flex h-11 items-center justify-center rounded-[10px] bg-navy font-manrope text-[13px] font-medium text-white hover:bg-navy-deep"
            >
              {t(isGift ? "View Details" : "View Ownership")}
            </Link>
          )}
        </div>
        {shareState === "failed" ? (
          <p
            role="alert"
            className="mt-2 font-manrope text-[11px] font-medium text-[#e11d2e]"
          >
            {t("Couldn't share the link. Please try again.")}
          </p>
        ) : null}
        <Link
          href={routes.land}
          className="mt-5 block text-center font-manrope text-[12px] font-medium text-[#6b7280] hover:text-navy"
        >
          {`${t("Go directly to My Land registry")} →`}
        </Link>
      </div>
    </div>
  );
}

function PurchasedPlotCard({
  item,
  variant,
  t,
}: {
  item: OrderItem;
  variant: "self" | "gift";
  t: Translate;
}) {
  const sqm =
    item.sizeSquareFeet != null ? Math.round(item.sizeSquareFeet * SQM_PER_SQFT) : null;
  const rate = item.pricePerRai ?? (item.rai > 0 ? item.price / item.rai : 0);
  const usable = isAllowedRemoteImage(item.imageUrl);
  const raiLine = `${item.rai} ${t("Rai")}`;
  const rateLine = `${money(rate)} / ${t("Rai")}`;

  return (
    // Figma plot card: 1px #E9ECEF border, radius 12, image left.
    <div
      className="flex items-center gap-3.5 rounded-[12px] border border-[#e9ecef] bg-white p-3 shadow-[0_1px_2px_rgba(0,0,0,0.05)]"
      style={{ height: variant === "gift" ? GIFT_CARD_HEIGHT : CARD_HEIGHT }}
    >
      <Image
        src={usable ? item.imageUrl! : PLACEHOLDER_IMAGE}
        alt=""
        width={80}
        height={80}
        unoptimized={!usable}
        className="h-[72px] w-[72px] shrink-0 rounded-[10px] bg-[#edf3f8] object-cover sm:h-20 sm:w-20"
      />
      <div className="min-w-0 flex-1 font-manrope">
        <div className="flex items-center gap-2">
          {item.zone ? (
            <span className="rounded-[4px] bg-[#eef1f4] px-1.5 py-px text-[9px] font-semibold uppercase leading-4 tracking-[0.04em] text-[#6b7280]">
              {t(titleCase(item.zone))}
            </span>
          ) : null}
          {item.plotNumber ? (
            <span className="text-[11px] font-medium tracking-[0.04em] text-[#8b939e]">
              {item.plotNumber}
            </span>
          ) : null}
        </div>
        <p className="mt-0.5 truncate text-[17px] font-medium leading-6 text-navy">
          {item.name ?? item.plotNumber ?? t("Plot")}
        </p>
        {item.location ? (
          <p className="flex items-center gap-1 text-[12px] font-medium leading-4 text-[#9aa3ad]">
            <PinIcon />
            <span className="truncate">{item.location}</span>
          </p>
        ) : null}
        {variant === "gift" ? (
          // Gift card: Rai / rate on the left, the plot's price on the right.
          <div className="mt-2 flex items-center justify-between gap-2 border-t border-[#eef1f4] pt-2 text-[12px] font-medium">
            <span className="truncate text-[#9aa3ad]">{`${raiLine} · ${rateLine}`}</span>
            <span className="shrink-0 font-semibold text-[#111111]">
              {money(item.price)}
            </span>
          </div>
        ) : (
          <p className="mt-0.5 truncate text-[12px] font-medium leading-4 text-[#9aa3ad]">
            {`${raiLine}${sqm !== null ? ` (${sqm.toLocaleString("en-US")} ${t("sqm")})` : ""} · ${rateLine}`}
          </p>
        )}
      </div>
    </div>
  );
}

function PinIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-3 w-3 shrink-0">
      <path d="M12 21s6-5.1 6-10a6 6 0 1 0-12 0c0 4.9 6 10 6 10Z" fill="currentColor" />
      <circle cx="12" cy="11" r="2.2" fill="white" />
    </svg>
  );
}

function Row({
  label,
  value,
  strong,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3 py-3">
      <dt className="text-[#6b7280]">{label}</dt>
      <dd className={strong ? "font-bold text-[#111111]" : "font-medium text-[#111111]"}>
        {value}
      </dd>
    </div>
  );
}

function ShareIcon() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true" className="h-3.5 w-3.5">
      <circle cx="12" cy="3.5" r="1.8" fill="currentColor" />
      <circle cx="4" cy="8" r="1.8" fill="currentColor" />
      <circle cx="12" cy="12.5" r="1.8" fill="currentColor" />
      <path
        d="m5.6 7.1 4.8-2.7M5.6 8.9l4.8 2.7"
        stroke="currentColor"
        strokeWidth="1.3"
      />
    </svg>
  );
}

function GiftIcon() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true" className="h-3.5 w-3.5">
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
