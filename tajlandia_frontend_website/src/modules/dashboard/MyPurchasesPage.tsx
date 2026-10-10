"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { AccountMenu } from "./AccountMenu";
import { DashboardNavbar } from "./DashboardNavbar";
import { isAbortError } from "@/lib/api/browser-client";
import { isApiError } from "@/lib/api/errors";
import { isAllowedRemoteImage } from "@/lib/config/remote-images";
import { useAuth } from "@/lib/hooks/useAuth";
import { routes } from "@/lib/constants/routes";
import { logError } from "@/lib/logging/logger";
import { useDashboardLanguage } from "./DashboardLanguageContext";
import { PageLoader } from "@/components/ui/PageLoader";
import type { LandOverview, LandPlot } from "./schemas/lands.schema";
import type { OrderListEntry } from "./schemas/orders.schema";
import { getLandOverview, getLandPlots, type LandPlotsQuery } from "./services/lands.client";
import { getOrders } from "./services/orders.client";

type PurchaseSort =
  "recommended" | "price-low" | "price-high" | "area-small" | "area-large" | "newest";

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4">
      <circle
        cx="10.8"
        cy="10.8"
        r="6.3"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
      />
      <path
        d="m15.6 15.6 4.1 4.1"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.7"
      />
    </svg>
  );
}

function FilterIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-3.5 w-3.5">
      <path
        d="M7 5v14M12 5v14M17 5v14M4.5 8h5M9.5 15h5M14.5 10h5"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.5"
      />
    </svg>
  );
}

function SortIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4">
      <path
        d="M8 5v14m0 0-3-3m3 3 3-3M16 19V5m0 0-3 3m3-3 3 3"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
      />
    </svg>
  );
}

function formatPurchaseDate(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric" }).format(date);
}

function formatPurchaseAmount(amount: number, currency: string) {
  const hasCents = Math.round(amount * 100) % 100 !== 0;
  const digits = { minimumFractionDigits: hasCents ? 2 : 0, maximumFractionDigits: 2 };
  try {
    return new Intl.NumberFormat("en-US", { style: "currency", currency, ...digits }).format(amount);
  } catch {
    // Unknown currency code from the API: show the code instead of a symbol.
    return `${currency} ${amount.toLocaleString("en-US", digits)}`;
  }
}

// Plot names in an order: "PH-0013, PH-0015 +1" past two.
function orderPlotNames(order: OrderListEntry) {
  const names = order.items
    .map((item) => item.name?.trim() || item.plotNumber?.trim() || "")
    .filter(Boolean);
  const shown = names.slice(0, 2).join(", ");
  return names.length > 2 ? `${shown} +${names.length - 2}` : shown;
}

const purchaseDate = (order: OrderListEntry) => Date.parse(order.paidAt ?? order.createdAt) || 0;

/**
 * My Purchases filters, done here because `GET /orders` takes no params.
 * Zone matches when any plot in the order is in a ticked zone.
 */
function filterOrders(orders: OrderListEntry[], filters: LandFilters) {
  const minRai = toBound(filters.minRai);
  const maxRai = toBound(filters.maxRai);
  const minPrice = toBound(filters.minPrice);
  const maxPrice = toBound(filters.maxPrice);
  const zones = filters.zones.map((zone) => zone.toUpperCase());
  return orders.filter(
    (order) =>
      (order.purchaseType === "gift" ? filters.gifted : filters.myPlots) &&
      (!zones.length || order.items.some((item) => zones.includes(item.zone?.type?.toUpperCase() ?? ""))) &&
      (minRai === undefined || order.totalRai >= minRai) &&
      (maxRai === undefined || order.totalRai <= maxRai) &&
      (minPrice === undefined || order.total >= minPrice) &&
      (maxPrice === undefined || order.total <= maxPrice),
  );
}

// "recommended" keeps the API order (newest first).
function sortOrders(orders: OrderListEntry[], sort: PurchaseSort) {
  const compare: Record<PurchaseSort, ((a: OrderListEntry, b: OrderListEntry) => number) | null> = {
    recommended: null,
    "price-low": (a, b) => a.total - b.total,
    "price-high": (a, b) => b.total - a.total,
    "area-small": (a, b) => a.totalRai - b.totalRai,
    "area-large": (a, b) => b.totalRai - a.totalRai,
    newest: (a, b) => purchaseDate(b) - purchaseDate(a),
  };
  const by = compare[sort];
  return by ? [...orders].sort(by) : orders;
}

function LayersIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5">
      <path d="M12 3.2 4.2 7.1 12 11l7.8-3.9L12 3.2Z" fill="none" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.6" />
      <path d="M4.2 12 12 15.9 19.8 12" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.6" />
      <path d="M4.2 16.4 12 20.3 19.8 16.4" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.6" />
    </svg>
  );
}

function PinIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className}>
      <path d="M12 21s6.2-5.2 6.2-10a6.2 6.2 0 1 0-12.4 0c0 4.8 6.2 10 6.2 10Z" fill="none" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.6" />
      <circle cx="12" cy="11" r="2" fill="none" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

function CoinsIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5">
      <ellipse cx="12" cy="7" rx="6.2" ry="2.5" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <path d="M5.8 7v4.4c0 1.4 2.8 2.5 6.2 2.5s6.2-1.1 6.2-2.5V7" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <path d="M5.8 11.4v4.2c0 1.4 2.8 2.5 6.2 2.5s6.2-1.1 6.2-2.5v-4.2" fill="none" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

function PersonIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5">
      <circle cx="12" cy="8" r="3" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <path d="M5.8 19.2c1-3.1 3.3-4.6 6.2-4.6s5.2 1.5 6.2 4.6" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.6" />
    </svg>
  );
}

function GiftIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5">
      <rect x="4" y="10" width="16" height="9.2" rx="1.6" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <path d="M4 14.2h16M12 10v9.2" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.6" />
      <path d="M12 10c-1.8 0-3.2-1.8-2.1-3.2C11 5.4 12 8.2 12 10c0-1.8 1-4.6 2.1-3.2C15.2 8.2 13.8 10 12 10Z" fill="none" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.6" />
    </svg>
  );
}

function PlotIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-3.5 w-3.5">
      <rect x="4" y="4" width="7" height="7" rx="1.2" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <rect x="13" y="4" width="7" height="7" rx="1.2" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <rect x="4" y="13" width="7" height="7" rx="1.2" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <rect x="13" y="13" width="7" height="7" rx="1.2" fill="none" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

type LandFilters = {
  myPlots: boolean;
  gifted: boolean;
  zones: string[];
  minRai: string;
  maxRai: string;
  minPrice: string;
  maxPrice: string;
};
type LandOverviewState =
  | { status: "loading" }
  | { status: "ready"; data: LandOverview }
  | { status: "error" };
type LandPlotsState =
  | { status: "loading" }
  | { status: "ready"; plots: LandPlot[]; page: number; totalPages: number; total: number }
  | { status: "error" };

// Both plot types and every zone, no Rai or price bounds.
const NO_LAND_FILTERS: LandFilters = {
  myPlots: true,
  gifted: true,
  zones: [],
  minRai: "",
  maxRai: "",
  minPrice: "",
  maxPrice: "",
};
const LAND_PAGE_SIZE = 12;
// "View Map" opens the map here (the plot's dot and number with streets around),
// then Explore zooms in to the plot's outline.
const LAND_MAP_ZOOM = 12.5;
const LAND_PLACEHOLDER_IMAGE = "/images/explore/place-placeholder.svg";
// Sort panel option -> `GET /lands/plots` sortBy/sortOrder (none: plotNumber asc).
const LAND_SORTS: Record<PurchaseSort, Pick<LandPlotsQuery, "sortBy" | "sortOrder">> = {
  recommended: {},
  "price-low": { sortBy: "totalPrice", sortOrder: "asc" },
  "price-high": { sortBy: "totalPrice", sortOrder: "desc" },
  "area-small": { sortBy: "raiSize", sortOrder: "asc" },
  "area-large": { sortBy: "raiSize", sortOrder: "desc" },
  newest: { sortBy: "createdAt", sortOrder: "desc" },
};
const ZONE_BADGES: Record<string, string> = {
  ICON: "bg-[#fff6d6] text-[#c4a035]",
  POPULAR: "bg-[#e3f4f3] text-[#16807f]",
  STANDARD: "bg-[#eef1f4] text-[#6b7785]",
};
const landNumber = new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 });

function formatLandMoney(amount: number, currency: string) {
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

/** A filter field as a bound: "" -> none, else the number (NaN when it isn't one). */
function toBound(value: string) {
  const trimmed = value.trim();
  return trimmed ? Number(trimmed) : undefined;
}

/** The checks `GET /lands/plots` answers 400 for, per min/max pair. */
function landFilterErrors(filters: LandFilters) {
  const check = (min: string, max: string) => {
    const low = toBound(min);
    const high = toBound(max);
    if ([low, high].some((bound) => bound !== undefined && !(bound >= 0)))
      return "Enter a number of 0 or more.";
    if (low !== undefined && high !== undefined && low > high)
      return "Min can't be more than max.";
    return undefined;
  };
  return {
    rai: check(filters.minRai, filters.maxRai),
    price: check(filters.minPrice, filters.maxPrice),
  };
}

/** Filters + sort as `GET /lands/plots` query (page and limit added by the caller). */
function landPlotsQuery(filters: LandFilters, sort: PurchaseSort): LandPlotsQuery {
  return {
    // Both or neither type ticked: every plot.
    purchaseType:
      filters.myPlots === filters.gifted ? undefined : filters.myPlots ? "self" : "gift",
    zone: filters.zones.length
      ? filters.zones.map((zone) => zone.toLowerCase()).join(",")
      : undefined,
    minRai: toBound(filters.minRai),
    maxRai: toBound(filters.maxRai),
    minPrice: toBound(filters.minPrice),
    maxPrice: toBound(filters.maxPrice),
    ...LAND_SORTS[sort],
  };
}

const landQueryKey = (filters: LandFilters, sort: PurchaseSort) =>
  JSON.stringify(landPlotsQuery(filters, sort));
const NO_FILTERS_KEY = landQueryKey(NO_LAND_FILTERS, "recommended");

// A cancelled request is not an error, and 401 already redirects to login.
const isQuietError = (error: unknown) =>
  isAbortError(error) || (isApiError(error) && error.code === "API_SESSION_EXPIRED");

export function MyLandPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();
  const { t } = useDashboardLanguage();
  const [search, setSearch] = useState("");
  const [dialog, setDialog] = useState<"sort" | "filter" | null>(null);
  const [sort, setSort] = useState<PurchaseSort>("recommended");
  const [draftSort, setDraftSort] = useState<PurchaseSort>("recommended");
  const [filters, setFilters] = useState<LandFilters>(NO_LAND_FILTERS);
  const [draftFilters, setDraftFilters] = useState<LandFilters>(NO_LAND_FILTERS);
  // `GET /lands/overview` and pages of `GET /lands/plots`; `reloadKey` refetches after an error.
  const [overview, setOverview] = useState<LandOverviewState>({ status: "loading" });
  const [plots, setPlots] = useState<LandPlotsState>({ status: "loading" });
  const [reloadKey, setReloadKey] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadMoreFailed, setLoadMoreFailed] = useState(false);
  // Bumped for every page-1 load, so a late "load more" for old filters is dropped.
  const listGeneration = useRef(0);
  // "N plots found" in the filter panel, with the draft filters it was counted for.
  const [draftCount, setDraftCount] = useState<{ key: string; count: number } | null>(null);

  const queryKey = landQueryKey(filters, sort);
  const filtersActive = landQueryKey(filters, "recommended") !== NO_FILTERS_KEY;
  const draftErrors = landFilterErrors(draftFilters);
  const draftValid = !draftErrors.rai && !draftErrors.price;
  const draftKey =
    dialog === "filter" && draftValid ? landQueryKey(draftFilters, "recommended") : null;

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.replace(routes.login);
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    if (!isAuthenticated) return;
    const controller = new AbortController();
    getLandOverview(controller.signal)
      .then((data) => setOverview({ status: "ready", data }))
      .catch((error: unknown) => {
        if (isQuietError(error)) return;
        logError(error, "Failed to load land overview");
        setOverview({ status: "error" });
      });
    return () => controller.abort();
  }, [isAuthenticated, reloadKey]);

  useEffect(() => {
    if (!isAuthenticated) return;
    const controller = new AbortController();
    listGeneration.current += 1;
    const query: LandPlotsQuery = JSON.parse(queryKey);
    getLandPlots({ ...query, page: 1, limit: LAND_PAGE_SIZE }, controller.signal)
      .then(({ plots: items, pagination }) =>
        setPlots({
          status: "ready",
          plots: items,
          page: pagination.page,
          totalPages: pagination.totalPages,
          total: pagination.total,
        }),
      )
      .catch((error: unknown) => {
        if (isQuietError(error)) return;
        logError(error, "Failed to load land plots");
        setPlots({ status: "error" });
      });
    return () => controller.abort();
  }, [isAuthenticated, queryKey, reloadKey]);

  // Live count while the filter panel is open (debounced while typing).
  useEffect(() => {
    if (!draftKey || !isAuthenticated) return;
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      const query: LandPlotsQuery = JSON.parse(draftKey);
      getLandPlots({ ...query, page: 1, limit: 1 }, controller.signal)
        .then(({ pagination }) => setDraftCount({ key: draftKey, count: pagination.total }))
        .catch((error: unknown) => {
          if (!isQuietError(error)) logError(error, "Failed to count land plots");
        });
    }, 300);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [draftKey, isAuthenticated]);

  if (!isLoading && !isAuthenticated) return null;
  if (isLoading) return <PageLoader label={t("Loading land...")} />;

  // Back to page 1: skeletons until the new list arrives.
  function restartList() {
    setPlots({ status: "loading" });
    setLoadingMore(false);
    setLoadMoreFailed(false);
  }

  function retry() {
    if (overview.status === "error") setOverview({ status: "loading" });
    restartList();
    setReloadKey((key) => key + 1);
  }

  async function loadMore() {
    if (plots.status !== "ready" || loadingMore) return;
    const generation = listGeneration.current;
    setLoadingMore(true);
    setLoadMoreFailed(false);
    try {
      const query: LandPlotsQuery = JSON.parse(queryKey);
      const { plots: items, pagination } = await getLandPlots({
        ...query,
        page: plots.page + 1,
        limit: LAND_PAGE_SIZE,
      });
      if (generation !== listGeneration.current) return;
      setPlots((current) =>
        current.status === "ready"
          ? {
              status: "ready",
              plots: [...current.plots, ...items],
              page: pagination.page,
              totalPages: pagination.totalPages,
              total: pagination.total,
            }
          : current,
      );
    } catch (error) {
      if (generation !== listGeneration.current || isQuietError(error)) return;
      logError(error, "Failed to load more land plots");
      setLoadMoreFailed(true);
    } finally {
      if (generation === listGeneration.current) setLoadingMore(false);
    }
  }

  function openSort() {
    setDraftSort(sort);
    setDialog("sort");
  }
  function openFilter() {
    setDraftFilters(filters);
    setDialog("filter");
  }
  function applyList(nextFilters: LandFilters, nextSort: PurchaseSort) {
    if (landQueryKey(nextFilters, nextSort) !== queryKey) restartList();
    setFilters(nextFilters);
    setSort(nextSort);
    setDialog(null);
  }

  const totals = overview.status === "ready" ? overview.data : null;
  // A value, a skeleton (null) while loading, or a dash when it failed.
  const statValue = (value: string) => (totals ? value : overview.status === "error" ? "—" : null);
  const needle = search.trim().toLowerCase();
  const loadedPlots = plots.status === "ready" ? plots.plots : [];
  // Search runs over the loaded cards (the API has no search parameter).
  const visiblePlots = needle
    ? loadedPlots.filter((plot) =>
        [plot.name, plot.plotNumber, plot.zoneName, plot.region, plot.city, plot.certificateNo, plot.orderNo]
          .some((value) => value?.toLowerCase().includes(needle)),
      )
    : loadedPlots;

  return (
    <div className="min-h-[100svh] bg-[#f7f9fc] text-navy">
      <DashboardNavbar active="my-land" />
      <main className="mx-auto w-full max-w-[1120px] px-5 pb-16 pt-8 sm:px-8">
        <section>
          <h1 className="font-manrope text-[28px] font-semibold leading-none tracking-[-0.03em] text-navy sm:text-[32px]">
            {t("My Land")}
          </h1>
          <p className="mt-2 font-manrope text-[14px] leading-5 text-[#8b939e]">
            {t("Your collection of places across Thailand., all in one place.")}
          </p>
          <div className="mt-6 grid gap-3 md:grid-cols-3">
            <PurchaseStat
              icon={<LayersIcon />}
              label={t("Total Owned")}
              value={statValue(`${landNumber.format(totals?.totalOwned ?? 0)} ${t("Rai")}`)}
            />
            <PurchaseStat
              icon={<PinIcon />}
              label={t("Total Lands")}
              value={statValue(`${landNumber.format(totals?.totalLands ?? 0)} ${t("Location")}`)}
            />
            <PurchaseStat
              icon={<CoinsIcon />}
              label={t("Total Spent")}
              value={statValue(formatLandMoney(totals?.totalSpent ?? 0, totals?.currency ?? "USD"))}
            />
          </div>
          <div className="mt-6 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <label className="flex h-11 w-full items-center gap-2 rounded-[12px] border border-[#e4e9ef] bg-white px-3 font-manrope text-[13px] text-[#8b939e] focus-within:border-navy sm:max-w-[420px]">
              <SearchIcon />
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder={t("Search your plots, provinces, deeds...")}
                aria-label={t("Search your plots, provinces, deeds...")}
                className="min-w-0 flex-1 bg-transparent font-manrope text-[13px] text-navy outline-none placeholder:text-[#b0b7c0]"
              />
            </label>
            <div className="flex gap-2 self-end sm:self-auto">
              <button
                type="button"
                onClick={openFilter}
                aria-pressed={filtersActive}
                className={`inline-flex h-11 cursor-pointer items-center gap-1.5 rounded-[12px] border bg-white px-3 font-manrope text-[13px] font-medium ${
                  filtersActive ? "border-navy text-navy" : "border-[#e4e9ef] text-[#8b939e]"
                }`}
              >
                <FilterIcon />
                {t("Filter")}
                {filtersActive ? (
                  <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-brand-red" />
                ) : null}
              </button>
              <button
                type="button"
                onClick={openSort}
                aria-pressed={sort !== "recommended"}
                className={`inline-flex h-11 cursor-pointer items-center gap-1.5 rounded-[12px] border bg-white px-3 font-manrope text-[13px] font-medium ${
                  sort !== "recommended" ? "border-navy text-navy" : "border-[#e4e9ef] text-[#8b939e]"
                }`}
              >
                <SortIcon />
                {t("Sort")}
              </button>
            </div>
          </div>
          {plots.status === "loading" ? (
            <div
              aria-busy="true"
              aria-label={t("Loading land...")}
              className="mt-5 grid gap-3 md:grid-cols-2 lg:grid-cols-3"
            >
              {Array.from({ length: 6 }, (_, index) => (
                <LandCardSkeleton key={index} />
              ))}
            </div>
          ) : plots.status === "error" ? (
            <div
              role="alert"
              className="mt-5 flex min-h-[280px] flex-col items-center justify-center rounded-[16px] border border-[#eef1f4] bg-white px-6 text-center"
            >
              <p className="font-manrope text-[15px] font-semibold text-[#1a1a1a]">
                {t("We couldn't load your land.")}
              </p>
              <p className="mt-1 font-manrope text-[13px] text-[#8b939e]">
                {t("Please check your connection and try again.")}
              </p>
              <button
                type="button"
                onClick={retry}
                className="mt-4 inline-flex h-11 cursor-pointer items-center rounded-[12px] bg-navy px-5 font-manrope text-[13px] font-medium text-white"
              >
                {t("Try again")}
              </button>
            </div>
          ) : plots.total === 0 && !filtersActive ? (
            <div className="flex min-h-[450px] flex-col items-center justify-center text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#eaf3ff] text-[#7f8d9a]">
                <PinIcon className="h-7 w-7" />
              </div>
              <h2 className="mt-4 font-manrope text-[19px] font-semibold text-[#171717]">
                {t("No Land yet")}
              </h2>
              <p className="mt-1 max-w-[290px] font-manrope text-[12px] leading-4 text-[#7b858f]">
                {t(
                  "You don't have any land in your collection yet. Explore Thailand and find a place you'd love to own.",
                )}
              </p>
              <Link
                href={routes.dashboardExplore}
                className="mt-5 inline-flex w-full max-w-[294px] cursor-pointer justify-center rounded-[10px] bg-navy px-6 py-3 font-manrope text-[13px] font-medium text-white"
              >
                {t("Explore Thailand →")}
              </Link>
            </div>
          ) : visiblePlots.length === 0 ? (
            <div className="mt-5 flex min-h-[240px] flex-col items-center justify-center rounded-[16px] border border-[#eef1f4] bg-white px-6 text-center">
              <p className="font-manrope text-[14px] font-medium text-[#1a1a1a]">
                {plots.total === 0
                  ? t("No plots match the selected filters.")
                  : t("No plots match your search.")}
              </p>
              <button
                type="button"
                onClick={() =>
                  plots.total === 0 ? applyList(NO_LAND_FILTERS, sort) : setSearch("")
                }
                className="mt-3 cursor-pointer font-manrope text-[13px] font-medium text-navy underline underline-offset-4"
              >
                {plots.total === 0 ? t("Clear filters") : t("Clear search")}
              </button>
            </div>
          ) : (
            <div className="mt-5 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {visiblePlots.map((plot) => (
                <LandCard key={`${plot.orderId}-${plot.plotId}`} plot={plot} />
              ))}
            </div>
          )}
          {plots.status === "ready" && plots.page < plots.totalPages ? (
            <div className="mt-6 flex flex-col items-center gap-2">
              {loadMoreFailed ? (
                <p role="alert" className="font-manrope text-[12px] text-[#e11d2e]">
                  {t("Couldn't load more plots. Please try again.")}
                </p>
              ) : null}
              <button
                type="button"
                onClick={loadMore}
                disabled={loadingMore}
                className="inline-flex h-11 cursor-pointer items-center justify-center gap-2 rounded-[12px] border border-[#e4e9ef] bg-white px-6 font-manrope text-[13px] font-medium text-navy disabled:cursor-wait disabled:opacity-70"
              >
                {loadingMore ? (
                  <span
                    aria-hidden="true"
                    className="h-4 w-4 animate-spin rounded-full border-2 border-navy/25 border-t-navy motion-reduce:animate-none"
                  />
                ) : null}
                {loadingMore ? t("Loading...") : t("Load more")}
              </button>
            </div>
          ) : null}
        </section>
      </main>
      {dialog === "sort" ? (
        <PurchaseSortPanel
          value={draftSort}
          onChange={setDraftSort}
          onClose={() => setDialog(null)}
          onApply={() => applyList(filters, draftSort)}
        />
      ) : null}
      {dialog === "filter" ? (
        <PurchaseFilterPanel
          subtitle={t("Narrow down the plots you own")}
          priceDetail={t("Amount paid")}
          resultCount={draftCount && draftCount.key === draftKey ? draftCount.count : null}
          raiError={draftErrors.rai ? t(draftErrors.rai) : undefined}
          priceError={draftErrors.price ? t(draftErrors.price) : undefined}
          myPlots={draftFilters.myPlots}
          gifted={draftFilters.gifted}
          zones={draftFilters.zones}
          minRai={draftFilters.minRai}
          maxRai={draftFilters.maxRai}
          minPrice={draftFilters.minPrice}
          maxPrice={draftFilters.maxPrice}
          onMyPlotsChange={(myPlots) => setDraftFilters((current) => ({ ...current, myPlots }))}
          onGiftedChange={(gifted) => setDraftFilters((current) => ({ ...current, gifted }))}
          onZoneToggle={(zone) =>
            setDraftFilters((current) => ({
              ...current,
              zones:
                zone === "all"
                  ? []
                  : current.zones.includes(zone)
                    ? current.zones.filter((item) => item !== zone)
                    : [...current.zones, zone],
            }))
          }
          setMinRai={(minRai) => setDraftFilters((current) => ({ ...current, minRai }))}
          setMaxRai={(maxRai) => setDraftFilters((current) => ({ ...current, maxRai }))}
          setMinPrice={(minPrice) => setDraftFilters((current) => ({ ...current, minPrice }))}
          setMaxPrice={(maxPrice) => setDraftFilters((current) => ({ ...current, maxPrice }))}
          onClose={() => setDialog(null)}
          onReset={() => setDraftFilters(NO_LAND_FILTERS)}
          onApply={() => {
            if (draftValid) applyList(draftFilters, sort);
          }}
        />
      ) : null}
    </div>
  );
}

function LandCardSkeleton() {
  const bone = "animate-pulse rounded-[8px] bg-[#eef1f5] motion-reduce:animate-none";
  return (
    <div className="overflow-hidden rounded-[16px] border border-[#eef1f4] bg-white">
      <div className="h-[168px] w-full animate-pulse bg-[#eef1f5] motion-reduce:animate-none" />
      <div className="space-y-3 px-4 pb-4 pt-3">
        <div className={`h-3 w-1/2 ${bone}`} />
        <div className={`h-4 w-2/3 ${bone}`} />
        <div className={`h-3 w-3/4 ${bone}`} />
        <div className={`h-14 w-full ${bone}`} />
        <div className="grid grid-cols-2 gap-2">
          <div className={`h-11 ${bone}`} />
          <div className={`h-11 ${bone}`} />
        </div>
      </div>
    </div>
  );
}

function LandCard({ plot }: { plot: LandPlot }) {
  const { t } = useDashboardLanguage();
  const zone = plot.zone.toUpperCase();
  const zoneLabel = zone.charAt(0) + zone.slice(1).toLowerCase();
  const place = [plot.city, plot.region].filter(Boolean).join(", ");
  // The API sends no plot name yet, so the zone name is the title until it does.
  const name = plot.name?.trim();
  const title = name || plot.zoneName || plot.plotNumber;
  const location = name && plot.zoneName ? `${place} · ${plot.zoneName}` : place;
  const mapHref =
    plot.latitude != null && plot.longitude != null
      ? `${routes.dashboardExplore}?${new URLSearchParams({
          plotId: plot.plotId,
          // Drawn on the map right away, before Explore loads the plots in view.
          plotNumber: plot.plotNumber,
          lat: String(plot.latitude),
          lng: String(plot.longitude),
          zoom: String(LAND_MAP_ZOOM),
        }).toString()}`
      : null;
  const buttonBase =
    "flex h-11 items-center justify-center rounded-[12px] font-manrope text-[13px] font-medium";

  return (
    <article className="overflow-hidden rounded-[16px] border border-[#eef1f4] bg-white shadow-[0_8px_22px_rgba(11,31,77,0.05)]">
      <div className="relative h-[168px] w-full bg-[#eef1f5]">
        <Image
          src={isAllowedRemoteImage(plot.imageUrl) ? plot.imageUrl : LAND_PLACEHOLDER_IMAGE}
          alt={title}
          fill
          sizes="(min-width: 1024px) 360px, (min-width: 768px) 50vw, 100vw"
          className="object-cover"
        />
      </div>
      <div className="px-4 pb-4 pt-3">
        <div className="flex items-center justify-between gap-2">
          <span className="min-w-0 truncate font-manrope text-[11px] font-semibold uppercase tracking-[0.06em] text-[#8b939e]">
            {plot.region} · {plot.plotNumber}
          </span>
          <span
            className={`shrink-0 rounded-full px-2 py-0.5 font-manrope text-[10px] font-semibold uppercase tracking-[0.04em] ${
              ZONE_BADGES[zone] ?? ZONE_BADGES.STANDARD
            }`}
          >
            {t(zoneLabel)}
          </span>
        </div>
        <h2 className="mt-2 truncate font-manrope text-[16px] font-semibold leading-5 text-[#1a1a1a]">
          {title}
        </h2>
        <p className="mt-1 flex items-center gap-1 font-manrope text-[12px] leading-4 text-[#8b939e]">
          <PinIcon className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">{location}</span>
        </p>
        <div className="mt-3 grid grid-cols-3 divide-x divide-[#e8edf2] rounded-[12px] border border-[#e8edf2] py-2.5 text-center">
          <LandValue label={t("Area")} value={`${landNumber.format(plot.rai)} ${t("Rai")}`} />
          <LandValue label={t("Rate")} value={formatLandMoney(plot.pricePerRai, plot.currency)} />
          <LandValue label={t("Amt Paid")} value={formatLandMoney(plot.amountPaid, plot.currency)} />
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2">
          {mapHref ? (
            <Link href={mapHref} className={`${buttonBase} cursor-pointer bg-navy text-white`}>
              {t("View Map")} →
            </Link>
          ) : (
            <span aria-disabled="true" className={`${buttonBase} cursor-not-allowed bg-navy/40 text-white`}>
              {t("View Map")} →
            </span>
          )}
          {plot.certificateUrl ? (
            <a
              href={plot.certificateUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={`${buttonBase} cursor-pointer border border-[#e4e9ef] bg-white text-navy`}
            >
              {t("View Certificate")}
            </a>
          ) : (
            <span
              aria-disabled="true"
              title={t("Certificate not ready yet")}
              className={`${buttonBase} cursor-not-allowed border border-[#e4e9ef] bg-white text-[#b0b7c0]`}
            >
              {t("View Certificate")}
            </span>
          )}
        </div>
      </div>
    </article>
  );
}

function LandValue({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 px-1">
      <p className="font-manrope text-[10px] font-semibold uppercase tracking-[0.06em] text-[#8b939e]">
        {label}
      </p>
      <strong className="mt-1 block truncate font-manrope text-[13px] font-semibold text-[#1a1a1a]">
        {value}
      </strong>
    </div>
  );
}

type OrdersState =
  | { status: "loading" }
  | { status: "ready"; orders: OrderListEntry[] }
  | { status: "error" };

export function MyPurchasesPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();
  const { t } = useDashboardLanguage();
  const [dialog, setDialog] = useState<"sort" | "filter" | null>(null);
  const [sort, setSort] = useState<PurchaseSort>("recommended");
  const [draftSort, setDraftSort] = useState<PurchaseSort>("recommended");
  const [filters, setFilters] = useState<LandFilters>(NO_LAND_FILTERS);
  const [draftFilters, setDraftFilters] = useState<LandFilters>(NO_LAND_FILTERS);
  // `GET /lands/overview` for the totals (same as My Land), `GET /orders` for the list.
  const [overview, setOverview] = useState<LandOverviewState>({ status: "loading" });
  const [ordersState, setOrdersState] = useState<OrdersState>({ status: "loading" });
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.replace(routes.login);
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    if (!isAuthenticated) return;
    const controller = new AbortController();
    getLandOverview(controller.signal)
      .then((data) => setOverview({ status: "ready", data }))
      .catch((error: unknown) => {
        if (isQuietError(error)) return;
        logError(error, "Failed to load purchase totals");
        setOverview({ status: "error" });
      });
    getOrders(controller.signal)
      .then((orders) => setOrdersState({ status: "ready", orders }))
      .catch((error: unknown) => {
        if (isQuietError(error)) return;
        logError(error, "Failed to load orders");
        setOrdersState({ status: "error" });
      });
    return () => controller.abort();
  }, [isAuthenticated, reloadKey]);

  if (isLoading || !isAuthenticated) return <PageLoader label={t("Loading purchases...")} />;

  // Only completed purchases; pending, failed, cancelled and expired orders stay out.
  const paidOrders =
    ordersState.status === "ready" ? ordersState.orders.filter((order) => order.status === "paid") : [];
  const visibleOrders = sortOrders(filterOrders(paidOrders, filters), sort);
  const filtersActive = JSON.stringify(filters) !== JSON.stringify(NO_LAND_FILTERS);
  const draftErrors = landFilterErrors(draftFilters);
  const draftValid = !draftErrors.rai && !draftErrors.price;
  const totals = overview.status === "ready" ? overview.data : null;
  const statValue = (value: string) => (totals ? value : overview.status === "error" ? "—" : null);

  function retry() {
    setOverview({ status: "loading" });
    setOrdersState({ status: "loading" });
    setReloadKey((key) => key + 1);
  }

  function openSort() {
    setDraftSort(sort);
    setDialog("sort");
  }
  function openFilter() {
    setDraftFilters(filters);
    setDialog("filter");
  }

  return (
    <div className="min-h-[100svh] bg-[#f7f9fc] text-navy">
      <DashboardNavbar active="none" />
      <main className="mx-auto grid w-full max-w-[1180px] gap-6 px-5 pb-14 pt-8 sm:px-8 lg:grid-cols-[240px_minmax(0,1fr)] lg:items-start lg:gap-7">
        <AccountMenu active="purchases" />
        <section className="min-w-0">
          <h1 className="font-manrope text-[28px] font-semibold leading-none tracking-[-0.03em] text-navy sm:text-[32px]">
            {t("My Purchases")}
          </h1>
          <p className="mt-2 font-manrope text-[14px] leading-5 text-[#8b939e]">
            {t("View your plots and purchase details in one place.")}
          </p>
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <PurchaseStat
              icon={<LayersIcon />}
              label={t("Total Owned")}
              value={statValue(`${landNumber.format(totals?.totalOwned ?? 0)} ${t("Rai")}`)}
            />
            <PurchaseStat
              icon={<PinIcon />}
              label={t("Regions")}
              value={statValue(`${String(totals?.totalLands ?? 0).padStart(2, "0")} ${t("Location")}`)}
            />
            <PurchaseStat
              icon={<CoinsIcon />}
              label={t("Total Spent")}
              value={statValue(formatLandMoney(totals?.totalSpent ?? 0, totals?.currency ?? "USD"))}
            />
          </div>
          <div className="mt-7 flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-manrope text-[16px] font-semibold text-navy">{t("All Purchases")}</h2>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={openFilter}
                disabled={ordersState.status !== "ready"}
                className={`inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-[10px] border bg-white px-3 font-manrope text-[12px] font-medium disabled:cursor-not-allowed disabled:opacity-50 ${
                  filtersActive ? "border-navy text-navy" : "border-[#e4e9ef] text-[#8b939e]"
                }`}
              >
                <FilterIcon />
                {t("Filter")}
              </button>
              <button
                type="button"
                onClick={openSort}
                disabled={ordersState.status !== "ready"}
                className={`inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-[10px] border bg-white px-3 font-manrope text-[12px] font-medium disabled:cursor-not-allowed disabled:opacity-50 ${
                  sort !== "recommended" ? "border-navy text-navy" : "border-[#e4e9ef] text-[#8b939e]"
                }`}
              >
                <SortIcon />
                {t("Sort")}
              </button>
            </div>
          </div>
          {ordersState.status === "loading" ? (
            <div aria-busy="true" className="mt-3 space-y-3">
              <span className="sr-only" role="status">
                {t("Loading purchases...")}
              </span>
              {[0, 1, 2].map((key) => (
                <div
                  key={key}
                  aria-hidden="true"
                  className="h-[92px] animate-pulse rounded-[16px] border border-[#e8edf2] bg-white motion-reduce:animate-none"
                />
              ))}
            </div>
          ) : ordersState.status === "error" ? (
            <div role="alert" className="mt-3 rounded-[16px] bg-white px-6 py-10 text-center">
              <p className="font-manrope text-[15px] font-semibold text-[#1a1a1a]">{t("We couldn't load your purchases.")}</p>
              <p className="mt-1 font-manrope text-[13px] text-[#8b939e]">{t("Please check your connection and try again.")}</p>
              <button
                type="button"
                onClick={retry}
                className="mt-4 inline-flex h-11 cursor-pointer items-center rounded-[12px] bg-navy px-5 font-manrope text-[13px] font-medium text-white"
              >
                {t("Try again")}
              </button>
            </div>
          ) : !paidOrders.length ? (
            <div className="mt-3 flex flex-col items-center rounded-[16px] bg-white px-6 py-10 text-center">
              <p className="font-manrope text-[15px] font-semibold text-[#1a1a1a]">{t("No purchases yet")}</p>
              <p className="mt-1 max-w-[300px] font-manrope text-[13px] text-[#8b939e]">
                {t("Your completed purchases will appear here.")}
              </p>
              <Link
                href={routes.dashboardExplore}
                className="mt-4 inline-flex h-11 cursor-pointer items-center rounded-[12px] bg-navy px-5 font-manrope text-[13px] font-medium text-white"
              >
                {t("Explore Map")}
              </Link>
            </div>
          ) : visibleOrders.length ? (
            <div className="mt-3 space-y-3">
              {visibleOrders.map((order) => (
                <PurchaseRow key={order.id} order={order} />
              ))}
            </div>
          ) : (
            <div className="mt-3 rounded-[16px] bg-white p-8 text-center font-manrope text-[13px] text-[#8b939e]">
              {t("No purchases match the selected filters.")}
              <button
                type="button"
                onClick={() => setFilters(NO_LAND_FILTERS)}
                className="mt-3 block w-full cursor-pointer font-manrope text-[13px] font-medium text-navy underline underline-offset-4"
              >
                {t("Clear filters")}
              </button>
            </div>
          )}
        </section>
      </main>
      {dialog === "sort" ? (
        <PurchaseSortPanel
          value={draftSort}
          onChange={setDraftSort}
          onClose={() => setDialog(null)}
          onApply={() => {
            setSort(draftSort);
            setDialog(null);
          }}
        />
      ) : null}
      {dialog === "filter" ? (
        <PurchaseFilterPanel
          subtitle={t("Narrow down your purchases")}
          priceDetail={t("Amount paid")}
          resultCount={draftValid ? filterOrders(paidOrders, draftFilters).length : null}
          resultLabel={t("purchases found")}
          raiError={draftErrors.rai ? t(draftErrors.rai) : undefined}
          priceError={draftErrors.price ? t(draftErrors.price) : undefined}
          myPlots={draftFilters.myPlots}
          gifted={draftFilters.gifted}
          zones={draftFilters.zones}
          minRai={draftFilters.minRai}
          maxRai={draftFilters.maxRai}
          minPrice={draftFilters.minPrice}
          maxPrice={draftFilters.maxPrice}
          onMyPlotsChange={(myPlots) => setDraftFilters((current) => ({ ...current, myPlots }))}
          onGiftedChange={(gifted) => setDraftFilters((current) => ({ ...current, gifted }))}
          onZoneToggle={(zone) =>
            setDraftFilters((current) => ({
              ...current,
              zones:
                zone === "all"
                  ? []
                  : current.zones.includes(zone)
                    ? current.zones.filter((item) => item !== zone)
                    : [...current.zones, zone],
            }))
          }
          setMinRai={(minRai) => setDraftFilters((current) => ({ ...current, minRai }))}
          setMaxRai={(maxRai) => setDraftFilters((current) => ({ ...current, maxRai }))}
          setMinPrice={(minPrice) => setDraftFilters((current) => ({ ...current, minPrice }))}
          setMaxPrice={(maxPrice) => setDraftFilters((current) => ({ ...current, maxPrice }))}
          onClose={() => setDialog(null)}
          onReset={() => setDraftFilters(NO_LAND_FILTERS)}
          onApply={() => {
            if (!draftValid) return;
            setFilters(draftFilters);
            setDialog(null);
          }}
        />
      ) : null}
    </div>
  );
}

/** `value` null: still loading (a skeleton bar). */
function PurchaseStat({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string | null;
}) {
  return (
    <div className="rounded-[16px] border border-[#e8edf2] bg-white px-4 py-4 shadow-[0_6px_18px_rgba(11,31,77,0.04)]">
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[12px] bg-[#edf3ff] text-navy">
          {icon}
        </span>
        <div className="min-w-0">
          <p className="font-manrope text-[11px] font-semibold uppercase tracking-[0.08em] text-[#8b939e]">{label}</p>
          {value === null ? (
            <span className="mt-1.5 block h-5 w-24 animate-pulse rounded-[6px] bg-[#eef1f5] motion-reduce:animate-none" />
          ) : (
            <strong className="mt-1 block font-manrope text-[20px] font-semibold leading-6 text-[#1a1a1a]">{value}</strong>
          )}
        </div>
      </div>
    </div>
  );
}

function PurchaseRow({ order }: { order: OrderListEntry }) {
  const { t } = useDashboardLanguage();
  const purchasedOn = formatPurchaseDate(order.paidAt ?? order.createdAt);
  const gifted = order.purchaseType === "gift";
  const plots = orderPlotNames(order);

  return (
    <article className="flex flex-col gap-4 rounded-[16px] border border-[#e8edf2] bg-white px-4 py-4 shadow-[0_8px_22px_rgba(11,31,77,0.05)] sm:flex-row sm:items-center">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[12px] bg-[#edf3ff] text-navy">
        {gifted ? <GiftIcon /> : <PersonIcon />}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <p className="font-manrope text-[14px] font-semibold uppercase leading-5 text-[#1a1a1a]">
            {order.orderNo ? `${t("Order")} #${order.orderNo}` : t("Order")}
          </p>
          <span className="rounded-full bg-[#e7f8ee] px-2 py-0.5 font-manrope text-[11px] font-semibold leading-4 text-[#16a34a]">
            {t("Completed")}
          </span>
          {purchasedOn ? (
            <span className="font-manrope text-[12px] leading-4 text-[#9aa3ad]">
              • {t("Purchased")} {purchasedOn}
            </span>
          ) : null}
        </div>
        <p className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 font-manrope text-[12px] leading-4 text-[#8b939e]">
          <span className="inline-flex items-center gap-1.5">
            <PlotIcon />
            {t("LAND SIZE:")}{" "}
            <strong className="font-semibold text-[#1a1a1a]">
              {landNumber.format(order.totalRai)} {t("Rai")}
            </strong>
          </span>
          {plots ? (
            <>
              <span aria-hidden="true">•</span>
              <span className="inline-flex min-w-0 items-center gap-1.5">
                <PinIcon className="h-3.5 w-3.5 shrink-0" />
                {t("LOCATION:")} <strong className="truncate font-semibold text-[#1a1a1a]">{plots}</strong>
              </span>
            </>
          ) : null}
        </p>
      </div>
      <div className="flex items-center justify-between gap-4 sm:justify-end">
        <div className="text-right">
          <p className="font-manrope text-[10px] font-semibold uppercase tracking-[0.08em] text-[#9aa3ad]">{t("Amount")}</p>
          <strong className="mt-0.5 block font-manrope text-[18px] font-semibold leading-6 text-[#1a1a1a]">
            {formatPurchaseAmount(order.total, order.currency)}
          </strong>
        </div>
        <Link
          href={`/dashboard/purchases/${encodeURIComponent(order.id)}`}
          className="inline-flex h-10 cursor-pointer items-center rounded-[10px] bg-navy px-4 font-manrope text-[13px] font-medium text-white"
        >
          {t("View Details")} →
        </Link>
      </div>
    </article>
  );
}

function PurchaseSortPanel({
  value,
  onChange,
  onClose,
  onApply,
}: {
  value: PurchaseSort;
  onChange: (value: PurchaseSort) => void;
  onClose: () => void;
  onApply: () => void;
}) {
  const { t } = useDashboardLanguage();
  const options: Array<[PurchaseSort, string, string]> = [
    ["recommended", t("Recommended"), t("Curated by premier parcel score")],
    ["price-low", t("Price: Low to High"), "$ → $$$"],
    ["price-high", t("Price: High to Low"), "$$$ → $"],
    ["area-small", t("Land Area: Small to Large"), `1 → 50 ${t("Rai")}`],
    ["area-large", t("Land Area: Large to Small"), `50 → 1 ${t("Rai")}`],
    ["newest", t("Newest Added"), t("Recent")],
  ];
  return (
    <PurchasePanel>
      <PanelHeader icon={<SortIcon />} title={t("Sort by")} subtitle={t("Reorder active parcel markers")} onClose={onClose} />
      <div className="space-y-0.5 px-3 py-2">
        {options.map(([option, label, detail]) => {
          const selected = value === option;
          return (
            <label key={option} className={`flex cursor-pointer items-center gap-3 rounded-[12px] px-3 py-2.5 ${selected ? "bg-[#f3f7ff]" : ""}`}>
              <input type="radio" name="purchase-sort" checked={selected} onChange={() => onChange(option)} className="sr-only" />
              <ChoiceMark checked={selected} />
              <span className="min-w-0 flex-1">
                <span className={`block font-manrope text-[14px] leading-5 ${selected ? "font-semibold text-navy" : "font-medium text-[#8b939e]"}`}>{label}</span>
                {option === "recommended" ? <span className="mt-0.5 block font-manrope text-[12px] leading-4 font-normal text-[#8b939e]">{detail}</span> : null}
              </span>
              {option === "recommended" ? (
                <span className="rounded-full bg-[#e7eefc] px-2 py-1 font-manrope text-[10px] font-semibold tracking-[0.04em] text-[#3b5ccc]">{t("DEFAULT")}</span>
              ) : option === "newest" ? (
                <span className="rounded-full bg-[#e7f8ee] px-2 py-0.5 font-manrope text-[11px] font-semibold text-[#16a34a]">{detail}</span>
              ) : (
                <span className="font-manrope text-[12px] text-[#9aa3ad]">{detail}</span>
              )}
            </label>
          );
        })}
      </div>
      <PanelFooter onReset={() => onChange("recommended")} onApply={onApply} />
    </PurchasePanel>
  );
}

function PurchaseFilterPanel({
  subtitle,
  priceDetail,
  resultCount,
  raiError,
  priceError,
  resultLabel,
  myPlots,
  gifted,
  zones,
  minRai,
  maxRai,
  minPrice,
  maxPrice,
  onMyPlotsChange,
  onGiftedChange,
  onZoneToggle,
  setMinRai,
  setMaxRai,
  setMinPrice,
  setMaxPrice,
  onClose,
  onReset,
  onApply,
}: {
  subtitle?: string;
  priceDetail?: string;
  /** Plots the draft filters match; null while counting. */
  resultCount: number | null;
  raiError?: string;
  priceError?: string;
  /** Words after the count, "plots found" by default. */
  resultLabel?: string;
  myPlots: boolean;
  gifted: boolean;
  zones: string[];
  minRai: string;
  maxRai: string;
  minPrice: string;
  maxPrice: string;
  onMyPlotsChange: (value: boolean) => void;
  onGiftedChange: (value: boolean) => void;
  onZoneToggle: (zone: string) => void;
  setMinRai: (value: string) => void;
  setMaxRai: (value: string) => void;
  setMinPrice: (value: string) => void;
  setMaxPrice: (value: string) => void;
  onClose: () => void;
  onReset: () => void;
  onApply: () => void;
}) {
  const { t } = useDashboardLanguage();
  return (
    <PurchasePanel>
      <PanelHeader
        icon={<FilterIcon />}
        title={t("Filter Plots")}
        subtitle={subtitle ?? t("Narrow 1,168 parcels across Thailand")}
        onClose={onClose}
      />
      <div className="space-y-5 px-5 py-4">
        <FilterGroup title={t("Plots")}>
          <div className="grid grid-cols-2 gap-2">
            <Check label={t("My Plots")} checked={myPlots} onChange={onMyPlotsChange} />
            <Check label={t("Gifted Plots")} checked={gifted} onChange={onGiftedChange} />
          </div>
        </FilterGroup>
        <FilterGroup title={t("Zone Category")}>
          <div className="grid grid-cols-2 gap-2">
            <Check label={t("All Zones")} checked={zones.length === 0} onChange={() => onZoneToggle("all")} />
            <Check label="Icon" checked={zones.includes("Icon")} onChange={() => onZoneToggle("Icon")} />
            <Check label={t("Popular")} checked={zones.includes("Popular")} onChange={() => onZoneToggle("Popular")} />
            <Check label={t("Standard")} checked={zones.includes("Standard")} onChange={() => onZoneToggle("Standard")} />
          </div>
        </FilterGroup>
        <FilterGroup title={t("Land Area (Rai)")} detail={t("1 Rai = 1,600 m²")}>
          <div className="grid grid-cols-2 gap-2">
            <Field value={minRai} onChange={setMinRai} suffix="RAI" placeholder={t("Min")} invalid={Boolean(raiError)} />
            <Field value={maxRai} onChange={setMaxRai} suffix="RAI" placeholder={t("Max")} invalid={Boolean(raiError)} />
          </div>
          <FieldError message={raiError} />
        </FilterGroup>
        <FilterGroup title={t("Price Range (USD)")} detail={priceDetail ?? t("$100 – $2,500")}>
          <div className="grid grid-cols-2 gap-2">
            <Field value={minPrice} onChange={setMinPrice} prefix="$" placeholder={t("Min")} invalid={Boolean(priceError)} />
            <Field value={maxPrice} onChange={setMaxPrice} prefix="$" placeholder={t("Max")} invalid={Boolean(priceError)} />
          </div>
          <FieldError message={priceError} />
        </FilterGroup>
      </div>
      <div className="flex items-center justify-between bg-[#f7f9fc] px-5 py-4">
        <button type="button" onClick={onReset} className="cursor-pointer font-manrope text-[13px] text-[#8b939e]">
          {t("Clear All")}
        </button>
        <div className="flex items-center gap-3">
          <span aria-live="polite" className="font-manrope text-[12px] text-[#8b939e]">
            {resultCount === null ? "…" : resultCount.toLocaleString("en-US")} {resultLabel ?? t("plots found")}
          </span>
          <button
            type="button"
            onClick={onApply}
            disabled={Boolean(raiError || priceError)}
            className="cursor-pointer rounded-[10px] bg-navy px-4 py-2.5 font-manrope text-[13px] font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            {t("Apply Filters")}
          </button>
        </div>
      </div>
    </PurchasePanel>
  );
}

function ChoiceMark({ checked }: { checked: boolean }) {
  return (
    <span className={`flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full border-[1.5px] ${checked ? "border-navy" : "border-[#d5dbe3]"}`}>
      {checked ? <span className="h-2.5 w-2.5 rounded-full bg-navy" /> : null}
    </span>
  );
}

function PurchasePanel({ children }: { children: ReactNode }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#121417]/45 p-4">
      <section role="dialog" aria-modal="true" className="max-h-[92svh] w-full max-w-[400px] overflow-y-auto rounded-[18px] bg-white shadow-[0_24px_60px_rgba(11,31,77,0.28)]">
        {children}
      </section>
    </div>
  );
}
function PanelHeader({
  icon,
  title,
  subtitle,
  onClose,
}: {
  icon: ReactNode;
  title: string;
  subtitle: string;
  onClose: () => void;
}) {
  const { t } = useDashboardLanguage();
  return (
    <div className="flex items-start gap-3 px-5 pb-2 pt-5">
      <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-[#f2f4f7] text-navy">{icon}</span>
      <div className="min-w-0 flex-1">
        <h2 className="font-manrope text-[18px] font-semibold leading-6 text-navy">{title}</h2>
        <p className="font-manrope text-[12px] leading-4 text-[#8b939e]">{subtitle}</p>
      </div>
      <button type="button" onClick={onClose} aria-label={t("Close")} className="cursor-pointer font-manrope text-[22px] leading-none text-[#9aa3ad]">
        ×
      </button>
    </div>
  );
}
function PanelFooter({ onReset, onApply }: { onReset: () => void; onApply: () => void }) {
  const { t } = useDashboardLanguage();
  return (
    <div className="mt-2 flex items-center justify-between bg-[#f7f9fc] px-5 py-4">
      <button type="button" onClick={onReset} className="cursor-pointer font-manrope text-[13px] text-[#8b939e]">
        {t("Reset")}
      </button>
      <button type="button" onClick={onApply} className="cursor-pointer rounded-[10px] bg-navy px-5 py-2.5 font-manrope text-[13px] font-medium text-white">
        {t("Apply")}
      </button>
    </div>
  );
}
function FilterGroup({
  title,
  detail,
  children,
}: {
  title: string;
  detail?: string;
  children: ReactNode;
}) {
  return (
    <div className="border-b border-[#eef1f4] pb-4 last:border-b-0 last:pb-1">
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="font-manrope text-[11px] font-semibold uppercase tracking-[0.08em] text-[#8b939e]">{title}</p>
        {detail ? <span className="font-manrope text-[11px] text-[#9aa3ad]">{detail}</span> : null}
      </div>
      {children}
    </div>
  );
}
function Check({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className="flex h-11 cursor-pointer items-center gap-2.5 rounded-[10px] border border-[#e4e9ef] bg-white px-3">
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} className="sr-only" />
      <span className={`flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-[4px] border ${checked ? "border-navy bg-navy text-white" : "border-[#d5dbe3] bg-white"}`}>
        {checked ? (
          <svg viewBox="0 0 16 16" aria-hidden="true" className="h-3 w-3">
            <path d="M3.5 8.2 6.4 11l6.1-6.2" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
          </svg>
        ) : null}
      </span>
      <span className={`font-manrope text-[13px] ${checked ? "font-medium text-navy" : "text-[#8b939e]"}`}>{label}</span>
    </label>
  );
}
function Field({
  value,
  onChange,
  prefix,
  suffix,
  placeholder,
  invalid = false,
}: {
  value: string;
  onChange: (value: string) => void;
  prefix?: string;
  suffix?: string;
  placeholder?: string;
  invalid?: boolean;
}) {
  return (
    <label
      className={`flex h-11 items-center gap-2 rounded-[10px] border px-3 focus-within:border-navy ${
        invalid ? "border-[#e11d2e] bg-[#fff5f5]" : "border-[#e4e9ef]"
      }`}
    >
      {prefix ? <span className="font-manrope text-[13px] text-[#8b939e]">{prefix}</span> : null}
      <input
        value={value}
        inputMode="decimal"
        placeholder={placeholder}
        aria-label={placeholder}
        aria-invalid={invalid}
        // Digits and one decimal point only.
        onChange={(event) => onChange(event.target.value.replace(/[^\d.]/g, "").replace(/(\..*)\./g, "$1"))}
        className="min-w-0 flex-1 bg-transparent font-manrope text-[14px] text-navy outline-none placeholder:text-[#b0b7c0]"
      />
      {suffix ? <span className="font-manrope text-[11px] font-semibold tracking-[0.04em] text-[#8b939e]">{suffix}</span> : null}
    </label>
  );
}

function FieldError({ message }: { message?: string }) {
  return message ? (
    <p role="alert" className="mt-2 font-manrope text-[12px] text-[#e11d2e]">
      {message}
    </p>
  ) : null;
}

function Stat({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="rounded-[13px] bg-white p-4 shadow-[0_5px_18px_rgba(11,31,77,0.08)]">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-[12px] bg-[#eaf3ff] text-[18px] text-navy">
          {icon.startsWith("/") ? (
            <Image
              src={icon}
              alt=""
              width={24}
              height={24}
              className="h-6 w-6 object-contain"
            />
          ) : (
            icon
          )}
        </span>
        <div>
          <p className="text-[10px] uppercase tracking-[0.06em] text-[#a8b0b9]">
            {label}
          </p>
          <strong className="mt-1 block text-[17px] font-medium text-[#171717]">
            {value}
          </strong>
        </div>
      </div>
    </div>
  );
}
