"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import { AccountMenu } from "./AccountMenu";
import { DashboardNavbar } from "./DashboardNavbar";
import { useAuth } from "@/lib/hooks/useAuth";
import { routes } from "@/lib/constants/routes";
import { useDashboardLanguage } from "./DashboardLanguageContext";

type Purchase = {
  id?: string;
  name?: string;
  region?: string;
  latitude?: number;
  longitude?: number;
  rai?: number;
  amount?: number;
  gifted?: boolean;
  zone?: "Icon" | "Popular" | "Standard";
  createdAt?: string;
};
type PurchaseSort =
  "recommended" | "price-low" | "price-high" | "area-small" | "area-large" | "newest";

const defaultPurchases: Purchase[] = [
  {
    id: "1234-1",
    name: "ORDER #1234",
    region: "Phuket Sector 4",
    rai: 120,
    amount: 7700,
    zone: "Icon",
    createdAt: "2026-08-26",
  },
  {
    id: "1234-2",
    name: "ORDER #1234",
    region: "Phuket Sector 4",
    rai: 120,
    amount: 7700,
    gifted: true,
    zone: "Icon",
    createdAt: "2026-08-26",
  },
];

function getPurchases(): Purchase[] {
  try {
    const stored = localStorage.getItem("tajlandia_purchases");
    const parsed = stored ? JSON.parse(stored) : [];
    return Array.isArray(parsed)
      ? parsed.filter((item): item is Purchase => item && typeof item === "object")
      : [];
  } catch {
    return [];
  }
}

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

function formatPurchaseDate(value?: string) {
  if (!value) return "";
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric" }).format(date);
}

function formatPurchaseAmount(amount?: number) {
  const value = amount ?? 0;
  const hasCents = Math.round(value * 100) % 100 !== 0;
  return `$${value.toLocaleString("en-US", { minimumFractionDigits: hasCents ? 2 : 0, maximumFractionDigits: 2 })}`;
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

export function MyLandPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();
  const { t } = useDashboardLanguage();
  const [query, setQuery] = useState("");
  const storedPurchases = getPurchases();
  const purchases = storedPurchases.length
    ? storedPurchases
    : Array.from({ length: 6 }, (_, index) => ({
        id: "PH-01234",
        name: "Seaview Ridge Plot",
        region: "Phuket City, Phuket · Icon Zone 03",
        latitude: 7.8804 + index * 0.002,
        longitude: 98.3923 + index * 0.002,
        rai: 25,
        amount: 25.1,
        zone: "Icon" as const,
      }));
  const [dialog, setDialog] = useState<"sort" | "filter" | null>(null);
  const [sort, setSort] = useState<PurchaseSort>("recommended");
  const [draftSort, setDraftSort] = useState<PurchaseSort>("recommended");
  const [showMyPlots, setShowMyPlots] = useState(false);
  const [showGifted, setShowGifted] = useState(true);
  const [draftMyPlots, setDraftMyPlots] = useState(false);
  const [draftGifted, setDraftGifted] = useState(true);
  const [zoneFilters, setZoneFilters] = useState<string[]>(["Icon"]);
  const [draftZones, setDraftZones] = useState<string[]>(["Icon"]);
  const [minRai, setMinRai] = useState("1");
  const [maxRai, setMaxRai] = useState("25");
  const [draftMinRai, setDraftMinRai] = useState("1");
  const [draftMaxRai, setDraftMaxRai] = useState("25");
  const [minPrice, setMinPrice] = useState("200");
  const [maxPrice, setMaxPrice] = useState("1000");
  const [draftMinPrice, setDraftMinPrice] = useState("200");
  const [draftMaxPrice, setDraftMaxPrice] = useState("1000");
  const [filtersApplied, setFiltersApplied] = useState(false);
  const filteredPurchases = purchases
    .filter((purchase) =>
      `${purchase.name ?? ""} ${purchase.region ?? ""}`
        .toLowerCase()
        .includes(query.toLowerCase()),
    )
    .filter((purchase) => {
      if (!filtersApplied) return true;
      const typeAllowed = purchase.gifted ? showGifted : showMyPlots;
      const zoneAllowed = zoneFilters.length === 0 || zoneFilters.includes(purchase.zone ?? "Standard");
      return (
        typeAllowed &&
        zoneAllowed &&
        (purchase.rai ?? 0) >= Number(minRai) &&
        (purchase.rai ?? 0) <= Number(maxRai) &&
        (purchase.amount ?? 0) >= Number(minPrice) &&
        (purchase.amount ?? 0) <= Number(maxPrice)
      );
    })
    .sort((a, b) =>
      sort === "price-low"
        ? (a.amount ?? 0) - (b.amount ?? 0)
        : sort === "price-high"
          ? (b.amount ?? 0) - (a.amount ?? 0)
          : sort === "area-small"
            ? (a.rai ?? 0) - (b.rai ?? 0)
            : sort === "area-large"
              ? (b.rai ?? 0) - (a.rai ?? 0)
              : sort === "newest"
                ? Date.parse(b.createdAt ?? "") - Date.parse(a.createdAt ?? "")
                : 0,
    );
  const totalRai = 250;
  const totalSpent = 15200;
  const regions = 12;

  if (isLoading)
    return (
      <main className="flex min-h-[100svh] items-center justify-center bg-[#f7fafc] text-sm text-muted">
        {t("Loading land...")}
      </main>
    );
  if (!isAuthenticated) {
    router.replace(routes.login);
    return null;
  }

  function openSort() {
    setDraftSort(sort);
    setDialog("sort");
  }
  function openFilter() {
    setDraftMyPlots(showMyPlots);
    setDraftGifted(showGifted);
    setDraftZones(zoneFilters);
    setDraftMinRai(minRai);
    setDraftMaxRai(maxRai);
    setDraftMinPrice(minPrice);
    setDraftMaxPrice(maxPrice);
    setDialog("filter");
  }

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
            <PurchaseStat icon={<LayersIcon />} label={t("Total Owned")} value={`${totalRai} ${t("Rai")}`} />
            <PurchaseStat icon={<PinIcon />} label={t("Total Lands")} value={`${regions} ${t("Location")}`} />
            <PurchaseStat icon={<CoinsIcon />} label={t("Total Spent")} value={`$${totalSpent.toLocaleString("de-DE")}`} />
          </div>
          <div className="mt-6 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <label className="flex h-11 w-full max-w-[420px] items-center gap-2 rounded-[12px] border border-[#e4e9ef] bg-white px-3 font-manrope text-[13px] text-[#8b939e]">
              <SearchIcon />
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={t("Search your plots, provinces, deeds...")}
                className="min-w-0 flex-1 bg-transparent font-manrope text-[13px] outline-none placeholder:text-[#b0b7c0]"
              />
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={openFilter}
                className="inline-flex h-11 items-center gap-1.5 rounded-[12px] border border-[#e4e9ef] bg-white px-3 font-manrope text-[13px] font-medium text-[#8b939e]"
              >
                <FilterIcon />
                {t("Filter")}
              </button>
              <button
                type="button"
                onClick={openSort}
                className="inline-flex h-11 items-center gap-1.5 rounded-[12px] border border-[#e4e9ef] bg-white px-3 font-manrope text-[13px] font-medium text-[#8b939e]"
              >
                <SortIcon />
                {t("Sort")}
              </button>
            </div>
          </div>
          {filteredPurchases.length ? (
            <div className="mt-5 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {filteredPurchases.map((purchase, index) => (
                <LandCard key={`${purchase.id ?? "plot"}-${index}`} purchase={purchase} />
              ))}
            </div>
          ) : (
            <div className="flex min-h-[450px] flex-col items-center justify-center text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#eaf3ff] text-[27px] text-[#7f8d9a]">
                ◉
              </div>
              <h2 className="mt-4 text-[19px] font-semibold text-[#171717]">
                No Land yet
              </h2>
              <p className="mt-1 max-w-[290px] text-[11px] leading-4 text-[#7b858f]">
                You don&apos;t have any land in your collection yet. Explore Thailand and
                find a place you&apos;d love to own.
              </p>
              <Link
                href={routes.explore}
                className="mt-5 inline-flex min-w-[294px] justify-center rounded-[9px] bg-navy px-6 py-3 text-[12px] text-white"
              >
                Explore Thailand →
              </Link>
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
          myPlots={draftMyPlots}
          gifted={draftGifted}
          zones={draftZones}
          minRai={draftMinRai}
          maxRai={draftMaxRai}
          minPrice={draftMinPrice}
          maxPrice={draftMaxPrice}
          onMyPlotsChange={setDraftMyPlots}
          onGiftedChange={setDraftGifted}
          onZoneToggle={(zone) =>
            setDraftZones((current) =>
              zone === "all" ? [] : current.includes(zone) ? current.filter((item) => item !== zone) : [...current, zone],
            )
          }
          setMinRai={setDraftMinRai}
          setMaxRai={setDraftMaxRai}
          setMinPrice={setDraftMinPrice}
          setMaxPrice={setDraftMaxPrice}
          onClose={() => setDialog(null)}
          onReset={() => {
            setDraftMyPlots(false);
            setDraftGifted(true);
            setDraftZones(["Icon"]);
            setDraftMinRai("1");
            setDraftMaxRai("25");
            setDraftMinPrice("200");
            setDraftMaxPrice("1000");
          }}
          onApply={() => {
            setShowMyPlots(draftMyPlots);
            setShowGifted(draftGifted);
            setZoneFilters(draftZones);
            setMinRai(draftMinRai);
            setMaxRai(draftMaxRai);
            setMinPrice(draftMinPrice);
            setMaxPrice(draftMaxPrice);
            setFiltersApplied(true);
            setDialog(null);
          }}
        />
      ) : null}
    </div>
  );
}

function LandCard({ purchase }: { purchase: Purchase }) {
  const { t } = useDashboardLanguage();
  const plotId = purchase.id ?? "PH-01234";
  const latitude = purchase.latitude ?? 7.8804;
  const longitude = purchase.longitude ?? 98.3923;
  const mapHref = `${routes.dashboardExplore}?plotId=${encodeURIComponent(plotId)}&lat=${latitude}&lng=${longitude}&zoom=16`;
  const paid = (purchase.amount ?? 25.1).toFixed(2);

  return (
    <article className="overflow-hidden rounded-[16px] border border-[#eef1f4] bg-white shadow-[0_8px_22px_rgba(11,31,77,0.05)]">
      <img src="/images/explore/chiang-mai.jpg" alt="" className="h-[168px] w-full object-cover" />
      <div className="px-4 pb-4 pt-3">
        <div className="flex items-center justify-between gap-2">
          <span className="font-manrope text-[11px] font-semibold uppercase tracking-[0.06em] text-[#8b939e]">
            Phuket · {plotId}
          </span>
          <span className="rounded-full bg-[#fff6d6] px-2 py-0.5 font-manrope text-[10px] font-semibold uppercase tracking-[0.04em] text-[#c4a035]">
            {purchase.zone ?? "Icon"}
          </span>
        </div>
        <h2 className="mt-2 font-manrope text-[16px] font-semibold leading-5 text-[#1a1a1a]">{t(purchase.name ?? "Seaview Ridge Plot")}</h2>
        <p className="mt-1 flex items-center gap-1 font-manrope text-[12px] leading-4 text-[#8b939e]">
          <PinIcon className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">{purchase.region ?? "Phuket City, Phuket · Icon Zone 03"}</span>
        </p>
        <div className="mt-3 grid grid-cols-3 divide-x divide-[#e8edf2] rounded-[12px] border border-[#e8edf2] py-2.5 text-center">
          <div>
            <p className="font-manrope text-[10px] font-semibold uppercase tracking-[0.06em] text-[#8b939e]">{t("Area")}</p>
            <strong className="mt-1 block font-manrope text-[13px] font-semibold text-[#1a1a1a]">{purchase.rai ?? 25} {t("Rai")}</strong>
          </div>
          <div>
            <p className="font-manrope text-[10px] font-semibold uppercase tracking-[0.06em] text-[#8b939e]">{t("Rate")}</p>
            <strong className="mt-1 block font-manrope text-[13px] font-semibold text-[#1a1a1a]">$0.10</strong>
          </div>
          <div>
            <p className="font-manrope text-[10px] font-semibold uppercase tracking-[0.06em] text-[#8b939e]">{t("Amt Paid")}</p>
            <strong className="mt-1 block font-manrope text-[13px] font-semibold text-[#1a1a1a]">${paid}</strong>
          </div>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <Link href={mapHref} className="flex h-11 items-center justify-center rounded-[12px] bg-navy font-manrope text-[13px] font-medium text-white">
            {t("View Map")} →
          </Link>
          <Link href={routes.certificates} className="flex h-11 items-center justify-center rounded-[12px] border border-[#e4e9ef] bg-white font-manrope text-[13px] font-medium text-navy">
            {t("View Certificate")}
          </Link>
        </div>
      </div>
    </article>
  );
}


export function MyPurchasesPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();
  const { t } = useDashboardLanguage();
  const storedPurchases = getPurchases();
  const purchases = storedPurchases.length ? storedPurchases : defaultPurchases;
  const [dialog, setDialog] = useState<"sort" | "filter" | null>(null);
  const [sort, setSort] = useState<PurchaseSort>("recommended");
  const [draftSort, setDraftSort] = useState<PurchaseSort>("recommended");
  const [showMyPlots, setShowMyPlots] = useState(false);
  const [showGifted, setShowGifted] = useState(true);
  const [draftMyPlots, setDraftMyPlots] = useState(true);
  const [draftGifted, setDraftGifted] = useState(true);
  const [zoneFilters, setZoneFilters] = useState<string[]>(["Icon"]);
  const [draftZones, setDraftZones] = useState<string[]>(["Icon"]);
  const [minRai, setMinRai] = useState("1");
  const [maxRai, setMaxRai] = useState("25");
  const [draftMinRai, setDraftMinRai] = useState("1");
  const [draftMaxRai, setDraftMaxRai] = useState("25");
  const [minPrice, setMinPrice] = useState("200");
  const [maxPrice, setMaxPrice] = useState("1000");
  const [draftMinPrice, setDraftMinPrice] = useState("200");
  const [draftMaxPrice, setDraftMaxPrice] = useState("1000");
  const [filtersApplied, setFiltersApplied] = useState(false);
  const filteredPurchases = purchases
    .filter((purchase) => {
      if (!filtersApplied) return true;
      const typeAllowed = purchase.gifted ? showGifted : showMyPlots;
      const zoneAllowed =
        draftZones.length === 0 || draftZones.includes(purchase.zone ?? "Standard");
      return (
        typeAllowed &&
        zoneAllowed &&
        (purchase.rai ?? 0) >= Number(minRai) &&
        (purchase.rai ?? 0) <= Number(maxRai) &&
        (purchase.amount ?? 0) >= Number(minPrice) &&
        (purchase.amount ?? 0) <= Number(maxPrice)
      );
    })
    .sort((a, b) =>
      sort === "price-low"
        ? (a.amount ?? 0) - (b.amount ?? 0)
        : sort === "price-high"
          ? (b.amount ?? 0) - (a.amount ?? 0)
          : sort === "area-small"
            ? (a.rai ?? 0) - (b.rai ?? 0)
            : sort === "area-large"
              ? (b.rai ?? 0) - (a.rai ?? 0)
              : sort === "newest"
                ? Date.parse(b.createdAt ?? "") - Date.parse(a.createdAt ?? "")
                : 0,
    );
  const totalRai = 250;
  const totalSpent = 420.21;
  const regions = 3;

  if (isLoading)
    return (
      <main className="flex min-h-[100svh] items-center justify-center bg-[#f7f9fc] text-sm text-muted">
        {t("Loading purchases...")}
      </main>
    );
  if (!isAuthenticated) {
    router.replace(routes.login);
    return null;
  }

  function openSort() {
    setDraftSort(sort);
    setDialog("sort");
  }
  function openFilter() {
    setDraftMyPlots(showMyPlots);
    setDraftGifted(showGifted);
    setDraftZones(zoneFilters);
    setDraftMinRai(minRai);
    setDraftMaxRai(maxRai);
    setDraftMinPrice(minPrice);
    setDraftMaxPrice(maxPrice);
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
            <PurchaseStat icon={<LayersIcon />} label={t("Total Owned")} value={`${totalRai} ${t("Rai")}`} />
            <PurchaseStat icon={<PinIcon />} label={t("Regions")} value={`${String(regions).padStart(2, "0")} ${t("Location")}`} />
            <PurchaseStat icon={<CoinsIcon />} label={t("Total Spent")} value={`$${totalSpent.toFixed(2)}`} />
          </div>
          <div className="mt-7 flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-manrope text-[16px] font-semibold text-navy">{t("All Purchases")}</h2>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={openFilter}
                className="inline-flex h-9 items-center gap-1.5 rounded-[10px] border border-[#e4e9ef] bg-white px-3 font-manrope text-[12px] font-medium text-[#8b939e]"
              >
                <FilterIcon />
                {t("Filter")}
              </button>
              <button
                type="button"
                onClick={openSort}
                className="inline-flex h-9 items-center gap-1.5 rounded-[10px] border border-[#e4e9ef] bg-white px-3 font-manrope text-[12px] font-medium text-[#8b939e]"
              >
                <SortIcon />
                {t("Sort")}
              </button>
            </div>
          </div>
          {filteredPurchases.length ? (
            <div className="mt-3 space-y-3">
              {filteredPurchases.map((purchase, index) => (
                <PurchaseRow key={purchase.id ?? index} purchase={purchase} />
              ))}
            </div>
          ) : (
            <div className="mt-3 rounded-[16px] bg-white p-8 text-center font-manrope text-[13px] text-[#8b939e]">
              {t("No purchases match the selected filters.")}
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
          myPlots={draftMyPlots}
          gifted={draftGifted}
          zones={draftZones}
          minRai={draftMinRai}
          maxRai={draftMaxRai}
          minPrice={draftMinPrice}
          maxPrice={draftMaxPrice}
          onMyPlotsChange={setDraftMyPlots}
          onGiftedChange={setDraftGifted}
          onZoneToggle={(zone) =>
            setDraftZones((current) =>
              zone === "all"
                ? []
                : current.includes(zone)
                  ? current.filter((item) => item !== zone)
                  : [...current, zone],
            )
          }
          setMinRai={setDraftMinRai}
          setMaxRai={setDraftMaxRai}
          setMinPrice={setDraftMinPrice}
          setMaxPrice={setDraftMaxPrice}
          onClose={() => setDialog(null)}
          onReset={() => {
            setFiltersApplied(false);
            setDraftMyPlots(false);
            setDraftGifted(true);
            setDraftZones(["Icon"]);
            setDraftMinRai("1");
            setDraftMaxRai("25");
            setDraftMinPrice("200");
            setDraftMaxPrice("1000");
          }}
          onApply={() => {
            setShowMyPlots(draftMyPlots);
            setShowGifted(draftGifted);
            setZoneFilters(draftZones);
            setMinRai(draftMinRai);
            setMaxRai(draftMaxRai);
            setMinPrice(draftMinPrice);
            setMaxPrice(draftMaxPrice);
            setFiltersApplied(true);
            setDialog(null);
          }}
        />
      ) : null}
    </div>
  );
}

function PurchaseStat({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-[16px] border border-[#e8edf2] bg-white px-4 py-4 shadow-[0_6px_18px_rgba(11,31,77,0.04)]">
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[12px] bg-[#edf3ff] text-navy">
          {icon}
        </span>
        <div className="min-w-0">
          <p className="font-manrope text-[11px] font-semibold uppercase tracking-[0.08em] text-[#8b939e]">{label}</p>
          <strong className="mt-1 block font-manrope text-[20px] font-semibold leading-6 text-[#1a1a1a]">{value}</strong>
        </div>
      </div>
    </div>
  );
}

function PurchaseRow({ purchase }: { purchase: Purchase }) {
  const { t } = useDashboardLanguage();
  const purchasedOn = formatPurchaseDate(purchase.createdAt);

  return (
    <article className="flex flex-col gap-4 rounded-[16px] border border-[#e8edf2] bg-white px-4 py-4 shadow-[0_8px_22px_rgba(11,31,77,0.05)] sm:flex-row sm:items-center">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[12px] bg-[#edf3ff] text-navy">
        {purchase.gifted ? <GiftIcon /> : <PersonIcon />}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <p className="font-manrope text-[14px] font-semibold leading-5 text-[#1a1a1a]">{purchase.name}</p>
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
            {t("LAND SIZE:")} <strong className="font-semibold text-[#1a1a1a]">{purchase.rai} {t("Rai")}</strong>
          </span>
          <span aria-hidden="true">•</span>
          <span className="inline-flex items-center gap-1.5">
            <PinIcon className="h-3.5 w-3.5" />
            {t("LOCATION:")} <strong className="font-semibold text-[#1a1a1a]">{purchase.region}</strong>
          </span>
        </p>
      </div>
      <div className="flex items-center justify-between gap-4 sm:justify-end">
        <div className="text-right">
          <p className="font-manrope text-[10px] font-semibold uppercase tracking-[0.08em] text-[#9aa3ad]">{t("Amount")}</p>
          <strong className="mt-0.5 block font-manrope text-[18px] font-semibold leading-6 text-[#1a1a1a]">
            {formatPurchaseAmount(purchase.amount)}
          </strong>
        </div>
        <Link
          href={`/dashboard/purchases/${purchase.id ?? "1234"}`}
          className="inline-flex h-10 items-center rounded-[10px] bg-navy px-4 font-manrope text-[13px] font-medium text-white"
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
      <PanelHeader icon={<FilterIcon />} title={t("Filter Plots")} subtitle={t("Narrow 1,168 parcels across Thailand")} onClose={onClose} />
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
            <Field value={minRai} onChange={setMinRai} suffix="RAI" />
            <Field value={maxRai} onChange={setMaxRai} suffix="RAI" />
          </div>
        </FilterGroup>
        <FilterGroup title={t("Price Range (USD)")} detail={t("$100 – $2,500")}>
          <div className="grid grid-cols-2 gap-2">
            <Field value={minPrice} onChange={setMinPrice} prefix="$" />
            <Field value={maxPrice} onChange={setMaxPrice} prefix="$" />
          </div>
        </FilterGroup>
      </div>
      <div className="flex items-center justify-between bg-[#f7f9fc] px-5 py-4">
        <button type="button" onClick={onReset} className="font-manrope text-[13px] text-[#8b939e]">
          {t("Clear All")}
        </button>
        <div className="flex items-center gap-3">
          <span className="font-manrope text-[12px] text-[#8b939e]">
            {filteredCount(zones)} {t("plots found")}
          </span>
          <button type="button" onClick={onApply} className="rounded-[10px] bg-navy px-4 py-2.5 font-manrope text-[13px] font-medium text-white">
            {t("Apply Filters")}
          </button>
        </div>
      </div>
    </PurchasePanel>
  );
}

function filteredCount(zones: string[]) {
  return zones.length ? 77 : 1168;
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
      <button type="button" onClick={onClose} aria-label={t("Close")} className="font-manrope text-[22px] leading-none text-[#9aa3ad]">
        ×
      </button>
    </div>
  );
}
function PanelFooter({ onReset, onApply }: { onReset: () => void; onApply: () => void }) {
  const { t } = useDashboardLanguage();
  return (
    <div className="mt-2 flex items-center justify-between bg-[#f7f9fc] px-5 py-4">
      <button type="button" onClick={onReset} className="font-manrope text-[13px] text-[#8b939e]">
        {t("Reset")}
      </button>
      <button type="button" onClick={onApply} className="rounded-[10px] bg-navy px-5 py-2.5 font-manrope text-[13px] font-medium text-white">
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
}: {
  value: string;
  onChange: (value: string) => void;
  prefix?: string;
  suffix?: string;
}) {
  return (
    <label className="flex h-11 items-center gap-2 rounded-[10px] border border-[#e4e9ef] px-3">
      {prefix ? <span className="font-manrope text-[13px] text-[#8b939e]">{prefix}</span> : null}
      <input value={value} onChange={(event) => onChange(event.target.value)} className="min-w-0 flex-1 bg-transparent font-manrope text-[14px] text-navy outline-none" />
      {suffix ? <span className="font-manrope text-[11px] font-semibold tracking-[0.04em] text-[#8b939e]">{suffix}</span> : null}
    </label>
  );
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
