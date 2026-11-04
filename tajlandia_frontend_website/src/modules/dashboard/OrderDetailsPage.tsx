"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { isAbortError } from "@/lib/api/browser-client";
import { isApiError } from "@/lib/api/errors";
import { isAllowedRemoteImage } from "@/lib/config/remote-images";
import { routes } from "@/lib/constants/routes";
import { useAuth } from "@/lib/hooks/useAuth";
import { logError } from "@/lib/logging/logger";
import { PageLoader } from "@/components/ui/PageLoader";
import { useDashboardLanguage } from "./DashboardLanguageContext";
import type { OrderDetail, OrderDetailItem } from "./schemas/orders.schema";
import { getOrderDetail } from "./services/orders.client";
import { BackLink } from "@/components/ui/BackLink";

type OrderState =
  | { status: "loading" }
  | { status: "error" }
  | { status: "not-found" }
  | { status: "ready"; order: OrderDetail };

const PLOT_PLACEHOLDER_IMAGE = "/images/explore/place-placeholder.svg";
// "Explore on Map" opens the map like My Land's View Map: the plot's dot first, then its outline.
const PLOT_MAP_ZOOM = 12.5;
const SQM_PER_RAI = 1600;

// Badge colour on the plot card and dot colour in the summary, per zone tier.
const ZONES = [
  { type: "ICON", label: "Icon Zone", badge: "#e11d2e", dot: "#e0aa2b" },
  { type: "POPULAR", label: "Popular Zone", badge: "#0f9f8f", dot: "#14b8a6" },
  { type: "STANDARD", label: "Standard Zone", badge: "#3b6fd8", dot: "#3b82f6" },
] as const;

// Payment box under the total, by order status. Anything unknown reads as pending.
const PAYMENT_STATES: Record<string, { label: string; className: string }> = {
  paid: { label: "Payment fully settled", className: "bg-[#eefbf4] text-[#16a34a]" },
  pending_payment: { label: "Payment pending", className: "bg-[#fff7e6] text-[#b7791f]" },
  failed: { label: "Payment failed", className: "bg-[#fff1f2] text-[#e11d2e]" },
  cancelled: { label: "Order cancelled", className: "bg-[#f2f4f7] text-[#6b7785]" },
  expired: { label: "Order expired", className: "bg-[#f2f4f7] text-[#6b7785]" },
};

const number = new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 });

const isQuietError = (error: unknown) =>
  isAbortError(error) || (isApiError(error) && error.code === "API_SESSION_EXPIRED");

function formatMoney(amount: number, currency: string) {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    // Unknown currency code from the API: show the code instead of a symbol.
    return `${currency} ${amount.toFixed(2)}`;
  }
}

function formatOrderDate(value?: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric" }).format(date);
}

const zoneOf = (item: OrderDetailItem) => item.zoneCategory?.type?.toUpperCase() ?? "";

export function OrderDetailsPage({ orderId }: { orderId: string }) {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();
  const { t } = useDashboardLanguage();
  const [state, setState] = useState<OrderState>({ status: "loading" });
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.replace(routes.login);
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    if (!isAuthenticated) return;
    const controller = new AbortController();
    getOrderDetail(orderId, controller.signal)
      .then((order) => setState({ status: "ready", order }))
      .catch((error: unknown) => {
        if (isQuietError(error)) return;
        // 400 malformed id, 404 not found or not this user's order.
        if (isApiError(error) && (error.status === 400 || error.status === 404)) {
          setState({ status: "not-found" });
          return;
        }
        logError(error, "Failed to load order");
        setState({ status: "error" });
      });
    return () => controller.abort();
  }, [isAuthenticated, orderId, reloadKey]);

  if (isLoading || !isAuthenticated) return <PageLoader label={t("Loading order...")} />;

  const order = state.status === "ready" ? state.order : null;
  const title = order?.orderNo ? `${t("Order")} #${order.orderNo}` : t("Order");

  return (
    <div className="min-h-[100svh] bg-[#f7f9fc] text-navy">
      <main className="w-full px-5 pb-14 pt-6 sm:px-8 lg:p-0 lg:[&>section]:mx-auto lg:[&>section]:w-full lg:[&>section]:px-10 lg:[&>section]:py-8">
        <section className="min-w-0">
          <BackLink href={routes.purchases}>{t("Back to Purchases")}</BackLink>
          <div className="mt-4 flex items-start justify-between gap-4">
            <div className="min-w-0">
              {order ? (
                <h1 className="break-words font-manrope text-[28px] font-semibold leading-none tracking-[-0.03em] text-navy sm:text-[32px]">
                  {title}
                </h1>
              ) : (
                <span aria-hidden="true" className="block h-8 w-56 max-w-full animate-pulse rounded-[8px] bg-[#e8edf3] motion-reduce:animate-none" />
              )}
              <p className="mt-2 font-manrope text-[14px] leading-5 text-[#8b939e]">
                {t("Track your purchases and view your order details.")}
              </p>
            </div>
            {order ? (
              <Link
                href={`${routes.certificates}/${encodeURIComponent(order.id)}`}
                className="inline-flex h-10 shrink-0 cursor-pointer items-center gap-2 rounded-[12px] bg-navy px-4 font-manrope text-[13px] font-medium text-white shadow-[0_4px_14px_rgba(11,31,77,0.12)] hover:bg-[#0b2d6b]"
              >
                <CertificateIcon />
                {t("View Certificate")}
              </Link>
            ) : null}
          </div>

          {state.status === "loading" ? (
            <OrderSkeleton label={t("Loading order...")} />
          ) : state.status === "ready" ? (
            <OrderBody order={state.order} />
          ) : (
            <div role="alert" className="mt-6 rounded-[16px] bg-white px-6 py-12 text-center shadow-[0_8px_22px_rgba(11,31,77,0.05)]">
              <p className="font-manrope text-[15px] font-semibold text-[#1a1a1a]">
                {state.status === "not-found" ? t("Order not found") : t("We couldn't load this order.")}
              </p>
              <p className="mt-1 font-manrope text-[13px] text-[#8b939e]">
                {state.status === "not-found"
                  ? t("This order doesn't exist or isn't on your account.")
                  : t("Please check your connection and try again.")}
              </p>
              {state.status === "error" ? (
                <button
                  type="button"
                  onClick={() => {
                    setState({ status: "loading" });
                    setReloadKey((key) => key + 1);
                  }}
                  className="mt-4 inline-flex h-11 cursor-pointer items-center rounded-[12px] bg-navy px-5 font-manrope text-[13px] font-medium text-white"
                >
                  {t("Try again")}
                </button>
              ) : (
                <Link
                  href={routes.purchases}
                  className="mt-4 inline-flex h-11 cursor-pointer items-center rounded-[12px] bg-navy px-5 font-manrope text-[13px] font-medium text-white"
                >
                  {t("Back to Purchases")}
                </Link>
              )}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

function OrderSkeleton({ label }: { label: string }) {
  return (
    <div aria-busy="true" className="mt-6">
      <span className="sr-only" role="status">
        {label}
      </span>
      <div aria-hidden="true" className="grid gap-3 motion-safe:animate-pulse sm:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((key) => (
          <span key={key} className="h-[78px] rounded-[16px] bg-white" />
        ))}
      </div>
      <div aria-hidden="true" className="mt-6 grid items-start gap-5 motion-safe:animate-pulse xl:grid-cols-[minmax(0,1fr)_300px]">
        <div className="space-y-3">
          {[0, 1, 2].map((key) => (
            <span key={key} className="block h-[98px] rounded-[16px] bg-white" />
          ))}
        </div>
        <span className="block h-[360px] rounded-[16px] bg-white" />
      </div>
    </div>
  );
}

function OrderBody({ order }: { order: OrderDetail }) {
  const { t } = useDashboardLanguage();
  return (
    <>
      <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <OrderStat icon={<PinIcon />} label={t("Certificate No")} value={order.certificateNo ?? "—"} />
        <OrderStat icon={<CalendarIcon />} label={t("Date")} value={formatOrderDate(order.paidAt ?? order.createdAt)} />
        <OrderStat
          icon={<PinIcon />}
          label={t("Acquired Deeds")}
          value={`${String(order.totalPlots).padStart(2, "0")} ${t(order.totalPlots === 1 ? "Plot" : "Plots")}`}
        />
        <OrderStat icon={<LayersIcon />} label={t("Cumulative Surface")} value={`${number.format(order.totalRai)} ${t("Rai")}`} />
      </div>
      <div className="mt-6 grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_300px]">
        <PlotList items={order.items} currency={order.currency} />
        <OrderSummary order={order} />
      </div>
    </>
  );
}

const PLOTS_PER_PAGE = 5;

// Page buttons to show: first, last, and the current page with one neighbour each side; "…" for gaps.
function pageButtons(page: number, pages: number): Array<number | "gap-left" | "gap-right"> {
  const shown = new Set([1, pages, page - 1, page, page + 1].filter((value) => value >= 1 && value <= pages));
  const sorted = [...shown].sort((a, b) => a - b);
  const result: Array<number | "gap-left" | "gap-right"> = [];
  sorted.forEach((value, index) => {
    const previous = sorted[index - 1];
    if (previous !== undefined && value - previous > 1) result.push(index < sorted.length / 2 ? "gap-left" : "gap-right");
    result.push(value);
  });
  return result;
}

/** The order's plots, five to a page (the order already holds them all, so paging is done here). */
function PlotList({ items, currency }: { items: OrderDetailItem[]; currency: string }) {
  const { t } = useDashboardLanguage();
  const [page, setPage] = useState(1);
  const listRef = useRef<HTMLDivElement>(null);
  const pages = Math.max(1, Math.ceil(items.length / PLOTS_PER_PAGE));
  const current = Math.min(page, pages);
  const start = (current - 1) * PLOTS_PER_PAGE;
  const visible = items.slice(start, start + PLOTS_PER_PAGE);

  function goTo(next: number) {
    setPage(next);
    // A new page starts at its first plot, not wherever the old one was scrolled to.
    listRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  const pageButton =
    "inline-flex h-10 min-w-10 cursor-pointer items-center justify-center rounded-[10px] border px-3 font-manrope text-[13px] font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40";
  const stepButton = `${pageButton} gap-1.5 border-navy/25 bg-white px-4 text-navy hover:border-navy hover:bg-navy hover:text-white disabled:hover:border-navy/25 disabled:hover:bg-white disabled:hover:text-navy`;
  const arrow = (direction: "left" | "right") => (
    <svg viewBox="0 0 16 16" aria-hidden="true" className="h-3.5 w-3.5">
      <path d={direction === "left" ? "M10 3 5 8l5 5" : "m6 3 5 5-5 5"} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );

  return (
    <div ref={listRef} className="min-w-0 scroll-mt-6">
      <div className="space-y-3">
        {visible.map((item, index) => (
          <PlotRow key={`${item.plotId}-${start + index}`} item={item} currency={currency} />
        ))}
      </div>
      {pages > 1 ? (
        <nav aria-label={t("Pagination")} className="mt-5 flex flex-wrap items-center justify-between gap-3">
          <p aria-live="polite" className="font-manrope text-[12px] text-[#8b939e]">
            {`${t("Showing")} ${start + 1}–${start + visible.length} ${t("of")} ${items.length}`}
          </p>
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => goTo(current - 1)}
              disabled={current === 1}
              className={stepButton}
            >
              {arrow("left")}
              {t("Previous")}
            </button>
            {pageButtons(current, pages).map((entry) =>
              typeof entry === "number" ? (
                <button
                  key={entry}
                  type="button"
                  onClick={() => goTo(entry)}
                  aria-label={`${t("Page")} ${entry}`}
                  aria-current={entry === current ? "page" : undefined}
                  className={`${pageButton} ${
                    entry === current
                      ? "border-navy bg-navy text-white"
                      : "border-transparent bg-transparent text-[#8b939e] hover:bg-white hover:text-navy"
                  }`}
                >
                  {entry}
                </button>
              ) : (
                <span key={entry} aria-hidden="true" className="px-1 font-manrope text-[13px] text-[#9aa3ad]">
                  …
                </span>
              ),
            )}
            <button
              type="button"
              onClick={() => goTo(current + 1)}
              disabled={current === pages}
              className={stepButton}
            >
              {t("Next")}
              {arrow("right")}
            </button>
          </div>
        </nav>
      ) : null}
    </div>
  );
}

function OrderStat({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-[16px] border border-[#eef1f4] bg-white px-4 py-4 shadow-[0_6px_18px_rgba(11,31,77,0.04)]">
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[12px] bg-[#edf3ff] text-navy">{icon}</span>
        <div className="min-w-0">
          <p className="font-manrope text-[11px] font-semibold uppercase tracking-[0.08em] text-[#8b939e]">{label}</p>
          <strong className="mt-1 block break-all font-manrope text-[13px] font-semibold leading-5 text-[#1a1a1a]">{value}</strong>
        </div>
      </div>
    </div>
  );
}

function PlotThumbnail({ src, alt }: { src: string | null | undefined; alt: string }) {
  const [failed, setFailed] = useState(false);
  const usable = isAllowedRemoteImage(src) && !failed;

  return (
    <div className="relative h-[72px] w-[88px] shrink-0 overflow-hidden rounded-[12px] bg-[#eef1f5]">
      <Image
        src={usable ? src : PLOT_PLACEHOLDER_IMAGE}
        alt={alt}
        fill
        sizes="88px"
        unoptimized={!usable}
        onError={() => setFailed(true)}
        className="object-cover"
      />
    </div>
  );
}

function PlotRow({ item, currency }: { item: OrderDetailItem; currency: string }) {
  const router = useRouter();
  const { t } = useDashboardLanguage();
  const zone = ZONES.find((entry) => entry.type === zoneOf(item));
  const code = item.plotNumber?.trim() ?? "";
  const name = item.plotName?.trim() || item.name?.trim() || code || t("Plot");
  const image = item.images?.[0] ?? item.imageUrl;
  const location = item.location?.trim() || item.region?.name?.trim() || "";
  const mapHref =
    item.latitude != null && item.longitude != null
      ? `${routes.dashboardExplore}?${new URLSearchParams({
          plotId: item.plotId,
          // Drawn on the map right away, before Explore loads the plots in view.
          plotNumber: item.plotName?.trim() || code || name,
          lat: String(item.latitude),
          lng: String(item.longitude),
          zoom: String(PLOT_MAP_ZOOM),
        }).toString()}`
      : null;
  const details = [
    `${number.format(item.rai)} ${t("Rai")} (${number.format(item.rai * SQM_PER_RAI)} sqm)`,
    item.pricePerRai != null ? `${formatMoney(item.pricePerRai, currency)} / ${t("Rai")}` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <article
      onClick={() => {
        if (mapHref) router.push(mapHref);
      }}
      className={`group flex flex-col gap-3 rounded-[16px] border border-[#eef1f4] bg-white p-3 shadow-[0_8px_22px_rgba(11,31,77,0.05)] transition-all duration-200 sm:flex-row sm:items-center ${
        mapHref
          ? "cursor-pointer hover:border-navy/40 hover:shadow-[0_10px_28px_rgba(11,31,77,0.08)]"
          : ""
      }`}
    >
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <PlotThumbnail src={image} alt={name} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            {zone ? (
              <span className="font-manrope text-[10px] font-semibold uppercase tracking-[0.04em]" style={{ color: zone.badge }}>
                {t(zone.type.charAt(0) + zone.type.slice(1).toLowerCase())}
              </span>
            ) : null}
            {code && code !== name ? <span className="font-manrope text-[11px] text-[#b0b7c0]">{code}</span> : null}
          </div>
          <h2 className="mt-0.5 truncate font-manrope text-[14px] font-semibold leading-5 text-navy group-hover:text-navy-deep">
            {name}
          </h2>
          {location ? (
            <p className="mt-0.5 flex min-w-0 items-center gap-1 font-manrope text-[12px] text-[#8b939e]">
              <PinIcon className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{location}</span>
            </p>
          ) : null}
          <p className="mt-0.5 font-manrope text-[12px] leading-4 text-[#8b939e]">{details}</p>
        </div>
      </div>
      <div className="flex shrink-0 items-center justify-between gap-3 border-t border-[#eef1f4] pt-2 sm:block sm:border-0 sm:pt-0 sm:text-right">
        <strong className="block font-manrope text-[20px] font-semibold leading-6 text-navy">{formatMoney(item.price, currency)}</strong>
        {mapHref ? (
          <Link
            href={mapHref}
            onClick={(e) => {
              e.stopPropagation();
            }}
            className="mt-1.5 inline-flex items-center gap-1.5 rounded-[10px] border border-navy/20 bg-[#f0f4ff] px-3 py-1.5 font-manrope text-[12px] font-semibold text-navy shadow-xs transition-all hover:border-navy hover:bg-navy hover:text-white"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true" className="h-3.5 w-3.5 shrink-0">
              <path d="M12 21s6.2-5.2 6.2-10a6.2 6.2 0 1 0-12.4 0c0 4.8 6.2 10 6.2 10Z" fill="none" stroke="currentColor" strokeWidth="1.8" />
              <circle cx="12" cy="11" r="2" fill="none" stroke="currentColor" strokeWidth="1.8" />
            </svg>
            {t("Explore on Map")}
            <svg viewBox="0 0 16 16" aria-hidden="true" className="h-3 w-3 shrink-0">
              <path d="m6 3 5 5-5 5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
        ) : null}
      </div>
    </article>
  );
}

function OrderSummary({ order }: { order: OrderDetail }) {
  const { t } = useDashboardLanguage();
  // Price per zone tier; tiers with no plots in this order are left out.
  const zones = ZONES.map((zone) => ({
    ...zone,
    amount: order.items.filter((item) => zoneOf(item) === zone.type).reduce((sum, item) => sum + item.price, 0),
    count: order.items.filter((item) => zoneOf(item) === zone.type).length,
  })).filter((zone) => zone.count > 0);
  const discount = order.discountAmount ?? 0;
  const coupon = order.coupon?.code?.trim();
  const payment = PAYMENT_STATES[order.status] ?? PAYMENT_STATES.pending_payment!;

  return (
    <aside className="rounded-[16px] border border-[#eef1f4] bg-white px-5 py-5 shadow-[0_8px_24px_rgba(11,31,77,0.05)]">
      <h2 className="font-manrope text-[18px] font-semibold text-navy">{t("Order Summary")}</h2>
      <div className="mt-4 space-y-2.5 font-manrope text-[13px] text-[#8b939e]">
        <p className="flex items-center justify-between">
          <span>{t("Plots")}</span>
          <strong className="font-semibold text-navy">{number.format(order.totalPlots)}</strong>
        </p>
        <p className="flex items-center justify-between">
          <span>{t("Total Rai")}</span>
          <strong className="font-semibold text-[#e11d2e]">{number.format(order.totalRai)}</strong>
        </p>
      </div>
      {zones.length ? (
        <>
          <div className="my-4 border-t border-[#eef1f4]" />
          <div className="space-y-2.5 font-manrope text-[13px] text-[#5c6770]">
            {zones.map((zone) => (
              <p key={zone.type} className="flex items-center justify-between">
                <span className="inline-flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: zone.dot }} />
                  {t(zone.label)}
                </span>
                <span>{formatMoney(zone.amount, order.currency)}</span>
              </p>
            ))}
          </div>
        </>
      ) : null}
      <div className="my-4 border-t border-[#eef1f4]" />
      <p className="flex items-center justify-between font-manrope text-[13px] text-[#8b939e]">
        <span>{t("Subtotal")}</span>
        <span className="text-[#1a1a1a]">{formatMoney(order.subtotal, order.currency)}</span>
      </p>
      {discount > 0 ? (
        <p className="mt-2 flex items-center justify-between gap-3 font-manrope text-[13px] text-[#16a34a]">
          <span className="min-w-0 truncate">
            {t("Discount")}
            {coupon ? ` · ${coupon}` : ""}
          </span>
          <span>−{formatMoney(discount, order.currency)}</span>
        </p>
      ) : null}
      <p className="mt-4 flex items-center justify-between rounded-[12px] bg-[#f7f9fc] px-3 py-3 font-manrope text-[14px] text-[#8b939e]">
        <span>{t("Total")}</span>
        <strong className="text-[22px] font-semibold text-[#1a1a1a]">{formatMoney(order.total, order.currency)}</strong>
      </p>
      <div className={`mt-3 flex items-center gap-2 rounded-[12px] px-3 py-3 font-manrope text-[12px] font-semibold uppercase tracking-[0.04em] ${payment.className}`}>
        {order.status === "paid" ? <CheckIcon /> : <InfoIcon />}
        {t(payment.label)}
      </div>
    </aside>
  );
}

function InfoIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4">
      <circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <path d="M12 11v5" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.6" />
      <circle cx="12" cy="8.2" r="1" fill="currentColor" />
    </svg>
  );
}

function PinIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className}>
      <path d="M12 21s6.2-5.2 6.2-10a6.2 6.2 0 1 0-12.4 0c0 4.8 6.2 10 6.2 10Z" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="12" cy="11" r="2" fill="none" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5">
      <rect x="4" y="5.5" width="16" height="14" rx="2" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <path d="M8 4v3M16 4v3M4 10h16" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.6" />
    </svg>
  );
}

function LayersIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5">
      <path d="M12 3.5 4.5 7.2 12 11l7.5-3.8L12 3.5Z" fill="none" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.6" />
      <path d="M4.5 12 12 15.8 19.5 12M4.5 16.4 12 20.2 19.5 16.4" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.6" />
    </svg>
  );
}

function CertificateIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4">
      <path d="M6 3h9l4 4v14H6z" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
      <path d="M15 3v4h4M9 12h6M9 16h4" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4">
      <circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <path d="m8.5 12.2 2.3 2.3 4.7-5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.6" />
    </svg>
  );
}
