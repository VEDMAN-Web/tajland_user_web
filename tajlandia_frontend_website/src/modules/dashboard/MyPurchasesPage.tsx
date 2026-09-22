"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
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

export function MyLandPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();
  const { t } = useDashboardLanguage();
  const [query, setQuery] = useState("");
  const storedPurchases = getPurchases();
  const purchases = storedPurchases.length
    ? storedPurchases
    : Array.from({ length: 6 }, (_, index) => ({
        id: `PH-01234-${index}`,
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
  const [filterZone, setFilterZone] = useState("Icon");
  const [draftFilterZone, setDraftFilterZone] = useState("Icon");
  const [filtersApplied, setFiltersApplied] = useState(false);
  const filteredPurchases = purchases
    .filter((purchase) =>
      `${purchase.name ?? ""} ${purchase.region ?? ""}`
        .toLowerCase()
        .includes(query.toLowerCase()),
    )
    .filter(
      (purchase) =>
        !filtersApplied ||
        filterZone === "All Zones" ||
        (purchase.zone ?? "Icon") === filterZone,
    )
    .sort((a, b) =>
      sort === "price-low"
        ? (a.amount ?? 0) - (b.amount ?? 0)
        : sort === "price-high"
          ? (b.amount ?? 0) - (a.amount ?? 0)
          : sort === "area-small"
            ? (a.rai ?? 0) - (b.rai ?? 0)
            : sort === "area-large"
              ? (b.rai ?? 0) - (a.rai ?? 0)
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
    setDraftFilterZone(filterZone);
    setDialog("filter");
  }

  return (
    <div className="min-h-[100svh] bg-[#f7fafc] text-navy">
      <DashboardNavbar active="my-land" />
      <main className="mx-auto w-[92%] max-w-none px-5 pb-16 pt-10 sm:px-8 sm:pt-14">
        <section>
          <h1 className="text-[27px] font-semibold tracking-[-0.04em] text-[#171717] sm:text-[30px]">
            {t("My Land")}
          </h1>
          <p className="mt-1 text-[12px] text-[#7b858f]">
            {t("Your collection of places across Thailand., all in one place.")}
          </p>
          <div className="mt-5 grid gap-3 md:grid-cols-3">
            <Stat
              icon="/images/dashboard/purchase-map.png"
              label={t("Total Owned")}
              value={`${totalRai} Rai`}
            />
            <Stat
              icon="/images/dashboard/purchase-location.png"
              label={t("Total Lands")}
              value={`${regions} Location`}
            />
            <Stat
              icon="/images/dashboard/purchase-spent.png"
              label={t("Total Spent")}
              value={`$${totalSpent.toLocaleString()}`}
            />
          </div>
          <div className="mt-6 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <label className="flex h-9 w-full max-w-[295px] items-center gap-2 rounded-[9px] border border-[#e1e7ec] bg-white px-3 text-[10px] text-[#8d98a3] shadow-[0_3px_10px_rgba(11,31,77,0.02)]">
              <SearchIcon />
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={t("Search your plots, provinces, deeds...")}
                className="min-w-0 flex-1 bg-transparent outline-none placeholder:text-[#aab2bd]"
              />
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={openFilter}
                className="inline-flex h-9 items-center gap-1.5 rounded-[9px] border border-[#e1e7ec] bg-white px-3 text-[10px] text-[#8d98a3]"
              >
                <FilterIcon />
                {t("Filter")}
              </button>
              <button
                type="button"
                onClick={openSort}
                className="inline-flex h-9 items-center gap-1.5 rounded-[9px] border border-[#e1e7ec] bg-white px-3 text-[10px] text-[#8d98a3]"
              >
                <SortIcon />
                {t("Sort")}
              </button>
            </div>
          </div>
          {filteredPurchases.length ? (
            <div className="mt-5 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {filteredPurchases.map((purchase, index) => (
                <LandCard key={purchase.id ?? index} purchase={purchase} />
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
        <LandSortPanel
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
        <LandFilterPanel
          value={draftFilterZone}
          onChange={setDraftFilterZone}
          onClose={() => setDialog(null)}
          onReset={() => {
            setDraftFilterZone("All Zones");
            setFiltersApplied(false);
          }}
          onApply={() => {
            setFilterZone(draftFilterZone);
            setFiltersApplied(true);
            setDialog(null);
          }}
        />
      ) : null}
    </div>
  );
}

function LandCard({ purchase }: { purchase: Purchase }) {
  const plotId = purchase.id ?? "PH-01234";
  const latitude = purchase.latitude ?? 7.8804;
  const longitude = purchase.longitude ?? 98.3923;
  const mapHref = `${routes.dashboardExplore}?plotId=${encodeURIComponent(plotId)}&lat=${latitude}&lng=${longitude}&zoom=16`;

  return (
    <article className="overflow-hidden rounded-[14px] bg-white shadow-[0_5px_18px_rgba(11,31,77,0.08)]">
      <img
        src="/images/explore/chiang-mai.jpg"
        alt={purchase.name ?? "Seaview Ridge Plot"}
        className="h-[170px] w-full object-cover"
      />
      <div className="p-4">
        <div className="flex items-center justify-between text-[8px] uppercase tracking-[0.05em] text-[#8f99a4]">
          <span>PHUKET · {purchase.id ?? "PH-01234"}</span>
          <span className="rounded bg-[#fff4c6] px-1.5 py-1 text-[#c19a16]">ICON</span>
        </div>
        <h2 className="mt-2 text-[17px] font-semibold text-[#171717]">
          {purchase.name ?? "Seaview Ridge Plot"}
        </h2>
        <p className="mt-1 truncate text-[9px] text-[#b0b7be]">
          ◉ {purchase.region ?? "Phuket City, Phuket · Icon Zone 03"}
        </p>
        <div className="mt-3 grid grid-cols-3 divide-x rounded-[9px] border border-[#e8edf1] py-2 text-center">
          <div>
            <p className="text-[8px] uppercase text-[#a8b0b9]">Area</p>
            <strong className="text-[12px] text-[#242b32]">
              {purchase.rai ?? 25} Rai
            </strong>
          </div>
          <div>
            <p className="text-[8px] uppercase text-[#a8b0b9]">Rate</p>
            <strong className="text-[12px] text-[#242b32]">$0.10</strong>
          </div>
          <div>
            <p className="text-[8px] uppercase text-[#a8b0b9]">Amt Paid</p>
            <strong className="text-[12px] text-[#242b32]">$25.10</strong>
          </div>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <Link
            href={mapHref}
            className="flex h-9 items-center justify-center rounded-[8px] bg-navy text-[10px] text-white"
          >
            View Map →
          </Link>
          <Link
            href={routes.certificates}
            className="flex h-9 items-center justify-center rounded-[8px] border border-[#e1e7ec] text-[10px] text-navy"
          >
            View Certificate
          </Link>
        </div>
      </div>
    </article>
  );
}

function LandSortPanel({
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
  const options: Array<[PurchaseSort, string, string]> = [
    ["recommended", "Recommended", "Curated by premier parcel score"],
    ["price-low", "Price: Low to High", "$ → $$$"],
    ["price-high", "Price: High to Low", "$$$ → $"],
    ["area-small", "Land Area: Small to Large", "1 → 50 Rai"],
    ["area-large", "Land Area: Large to Small", "50 → 1 Rai"],
    ["newest", "Newest Added", "Recent"],
  ];
  return (
    <SidePanel>
      <PanelHeading
        icon="⇅"
        title="Sort by"
        subtitle="Reorder active parcel markers"
        onClose={onClose}
      />
      <div className="space-y-1 px-4 py-3">
        {options.map(([option, label, detail]) => (
          <label
            key={option}
            className={`flex cursor-pointer items-center gap-3 rounded-[10px] px-3 py-3 ${value === option ? "bg-[#f3f7ff]" : ""}`}
          >
            <input
              type="radio"
              name="land-sort"
              checked={value === option}
              onChange={() => onChange(option)}
              className="h-5 w-5 accent-[#06245f]"
            />
            <span
              className={`flex-1 text-[13px] ${value === option ? "font-semibold text-navy" : "text-[#8b949e]"}`}
            >
              {label}
            </span>
            <span
              className={
                option === "newest"
                  ? "rounded bg-[#e7faef] px-2 py-1 text-[10px] text-[#16a05a]"
                  : "text-[12px] text-[#8b949e]"
              }
            >
              {option === "recommended" ? "DEFAULT" : detail}
            </span>
          </label>
        ))}
      </div>
      <PanelActions onReset={onClose} onApply={onApply} />
    </SidePanel>
  );
}

function LandFilterPanel({
  value,
  onChange,
  onClose,
  onReset,
  onApply,
}: {
  value: string;
  onChange: (value: string) => void;
  onClose: () => void;
  onReset: () => void;
  onApply: () => void;
}) {
  return (
    <SidePanel>
      <PanelHeading
        icon="☷"
        title="Filter Plots"
        subtitle="Narrow 1,168 parcels across Thailand"
        onClose={onClose}
      />
      <div className="space-y-5 px-4 py-4">
        <div>
          <p className="mb-3 text-[12px] font-semibold uppercase tracking-[0.05em] text-[#8b949e]">
            Plots
          </p>
          <div className="grid grid-cols-2 gap-2">
            <CheckBox label="My Plots" checked={false} onChange={() => undefined} />
            <CheckBox label="Gifted Plots" checked={true} onChange={() => undefined} />
          </div>
        </div>
        <div>
          <p className="mb-3 text-[12px] font-semibold uppercase tracking-[0.05em] text-[#8b949e]">
            Zone Category
          </p>
          <div className="grid grid-cols-2 gap-2">
            <CheckBox
              label="All Zones"
              checked={value === "All Zones"}
              onChange={() => onChange("All Zones")}
            />
            <CheckBox
              label="Icon"
              checked={value === "Icon"}
              onChange={() => onChange("Icon")}
            />
            <CheckBox
              label="Popular"
              checked={value === "Popular"}
              onChange={() => onChange("Popular")}
            />
            <CheckBox
              label="Standard"
              checked={value === "Standard"}
              onChange={() => onChange("Standard")}
            />
          </div>
        </div>
        <div className="border-t border-[#edf0f3] pt-4">
          <div className="flex justify-between text-[12px] font-semibold uppercase text-[#8b949e]">
            <span>Land Area (Rai)</span>
            <span className="font-normal normal-case">1 Rai = 1,600 m²</span>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <FieldBox value="1" />
            <FieldBox value="25" />
          </div>
        </div>
        <div className="border-t border-[#edf0f3] pt-4">
          <div className="flex justify-between text-[12px] font-semibold uppercase text-[#8b949e]">
            <span>Price Range (USD)</span>
            <span className="font-normal normal-case">$100 – $2,500</span>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <FieldBox value="200" prefix="$" />
            <FieldBox value="1000" prefix="$" />
          </div>
        </div>
      </div>
      <div className="flex items-center justify-between bg-[#f7f9fc] px-5 py-4">
        <button type="button" onClick={onReset} className="text-[13px] text-[#8b949e]">
          Clear All
        </button>
        <div className="flex items-center gap-4">
          <span className="text-[10px] text-[#8b949e]">77 plots found</span>
          <button
            type="button"
            onClick={onApply}
            className="rounded-[9px] bg-navy px-4 py-2.5 text-[12px] font-medium text-white"
          >
            Apply Filters
          </button>
        </div>
      </div>
    </SidePanel>
  );
}

function SidePanel({ children }: { children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-end bg-transparent p-3 pt-20 sm:p-6 sm:pt-24">
      <section
        role="dialog"
        aria-modal="true"
        className="w-full max-w-[465px] overflow-hidden rounded-[16px] bg-white shadow-[0_20px_60px_rgba(11,31,77,0.22)]"
      >
        {children}
      </section>
    </div>
  );
}
function PanelHeading({
  icon,
  title,
  subtitle,
  onClose,
}: {
  icon: string;
  title: string;
  subtitle: string;
  onClose: () => void;
}) {
  return (
    <div className="flex items-start gap-3 border-b border-[#edf0f3] px-5 py-5">
      <span className="flex h-9 w-9 items-center justify-center rounded-[9px] bg-[#eef2f5] text-xl text-navy">
        {icon}
      </span>
      <div className="flex-1">
        <h2 className="text-[20px] font-semibold text-navy">{title}</h2>
        <p className="text-[12px] text-[#8b949e]">{subtitle}</p>
      </div>
      <button
        type="button"
        onClick={onClose}
        aria-label="Close"
        className="text-2xl leading-none text-[#9aa3ad]"
      >
        ×
      </button>
    </div>
  );
}
function PanelActions({
  onReset,
  onApply,
}: {
  onReset: () => void;
  onApply: () => void;
}) {
  return (
    <div className="flex items-center justify-between bg-[#f7f9fc] px-5 py-4">
      <button type="button" onClick={onReset} className="text-[13px] text-[#8b949e]">
        Reset
      </button>
      <button
        type="button"
        onClick={onApply}
        className="rounded-[10px] bg-navy px-6 py-3 text-[13px] font-medium text-white"
      >
        Apply
      </button>
    </div>
  );
}
function CheckBox({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2 rounded-[10px] border border-[#e1e7ec] px-3 py-2.5 text-[13px] text-[#8b949e]">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="h-5 w-5 accent-[#06245f]"
      />
      {label}
    </label>
  );
}
function FieldBox({ value, prefix }: { value: string; prefix?: string }) {
  return (
    <div className="flex h-11 items-center gap-2 rounded-[10px] border border-[#e1e7ec] px-3 text-[13px] text-navy">
      {prefix ? <span className="text-[#8b949e]">{prefix}</span> : null}
      <span>{value}</span>
      <span className="ml-auto text-[11px] font-semibold text-[#8b949e]">
        {prefix ? "" : "RAI"}
      </span>
    </div>
  );
}

export function MyPurchasesPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();
  const storedPurchases = getPurchases();
  const purchases = storedPurchases.length ? storedPurchases : defaultPurchases;
  const [dialog, setDialog] = useState<"sort" | "filter" | null>(null);
  const [sort, setSort] = useState<PurchaseSort>("recommended");
  const [draftSort, setDraftSort] = useState<PurchaseSort>("recommended");
  const [showMyPlots, setShowMyPlots] = useState(true);
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
      <main className="flex min-h-[100svh] items-center justify-center bg-[#f7fafc] text-sm text-muted">
        Loading purchases...
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
    <div className="min-h-[100svh] bg-[#f7fafc] text-navy">
      <DashboardNavbar active="none" />
      <main className="mx-auto grid w-[92%] max-w-none gap-8 px-5 pb-12 pt-10 sm:px-8 lg:grid-cols-[256px_minmax(0,1fr)] lg:gap-7 lg:pt-14">
        <AccountMenu active="purchases" />
        <section className="min-w-0">
          <div className="border-b border-[#e1e8ed] pb-4">
            <h1 className="text-[30px] font-semibold tracking-[-0.04em] text-[#171717] sm:text-[32px]">
              My Purchases
            </h1>
            <p className="mt-1 text-[12px] text-[#7b858f]">
              View your plots and purchase details in one place.
            </p>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <Stat
              icon="/images/dashboard/purchase-map.png"
              label="Total Owned"
              value={`${totalRai} Rai`}
            />
            <Stat
              icon="/images/dashboard/purchase-location.png"
              label="Regions"
              value={`${String(regions).padStart(2, "0")} Location`}
            />
            <Stat
              icon="/images/dashboard/purchase-spent.png"
              label="Total Spent"
              value={`$${totalSpent.toFixed(2)}`}
            />
          </div>
          <div className="mt-7 flex items-center justify-between">
            <h2 className="text-[17px] font-semibold text-navy">All Purchases</h2>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={openFilter}
                className="inline-flex h-9 items-center gap-1.5 rounded-[9px] border border-[#e1e7ec] bg-white px-3 text-[10px] text-[#8d98a3]"
              >
                <FilterIcon />
                Filter
              </button>
              <button
                type="button"
                onClick={openSort}
                className="inline-flex h-9 items-center gap-1.5 rounded-[9px] border border-[#e1e7ec] bg-white px-3 text-[10px] text-[#8d98a3]"
              >
                <SortIcon />
                Sort
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
            <div className="mt-5 rounded-[14px] bg-white p-8 text-center text-[12px] text-[#8f99a4]">
              No purchases match the selected filters.
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

function PurchaseRow({ purchase }: { purchase: Purchase }) {
  return (
    <article className="flex flex-col gap-3 rounded-[14px] bg-white p-4 shadow-[0_5px_18px_rgba(11,31,77,0.08)] sm:flex-row sm:items-center">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-[#eaf3ff] text-[18px] text-navy">
        {purchase.gifted ? "♔" : "♟"}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2 text-[12px] font-semibold text-[#242b32]">
          <span>{purchase.name}</span>
          <span className="rounded-full bg-[#e7faef] px-2 py-1 text-[9px] font-medium text-[#16a05a]">
            Completed
          </span>
          <span className="text-[10px] font-normal text-[#9aa3ad]">
            • Purchased 26 August 2026
          </span>
        </div>
        <p className="mt-1 text-[9px] text-[#697586]">
          <Image
            src="/images/dashboard/purchase-map.png"
            alt=""
            width={10}
            height={10}
            className="mr-1 inline-block h-2.5 w-2.5 object-contain align-[-1px]"
          />{" "}
          LAND SIZE: <strong>{purchase.rai} Rai</strong> &nbsp;{" "}
          <Image
            src="/images/dashboard/purchase-location.png"
            alt=""
            width={10}
            height={10}
            className="mr-1 inline-block h-2.5 w-2.5 object-contain align-[-1px]"
          />{" "}
          LOCATION: <strong>{purchase.region}</strong>
        </p>
      </div>
      <div className="flex items-center justify-between gap-4 sm:justify-end">
        <div className="text-right">
          <p className="text-[8px] uppercase text-[#9aa3ad]">Amount</p>
          <strong className="text-[16px] text-[#171717]">
            ${purchase.amount?.toLocaleString()}
          </strong>
        </div>
        <Link
          href={`/dashboard/purchases/${purchase.id ?? "1234"}`}
          className="inline-flex h-10 items-center rounded-[9px] bg-navy px-5 text-[10px] text-white"
        >
          View Details →
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
  const options: Array<[PurchaseSort, string, string]> = [
    ["recommended", "Recommended", "Curated by premier parcel score"],
    ["price-low", "Price: Low to High", "$ → $$$"],
    ["price-high", "Price: High to Low", "$$$ → $"],
    ["area-small", "Land Area: Small to Large", "1 → 50 Rai"],
    ["area-large", "Land Area: Large to Small", "50 → 1 Rai"],
    ["newest", "Newest Added", "Recent"],
  ];
  return (
    <PurchasePanel>
      <PanelHeader
        icon="⇅"
        title="Sort by"
        subtitle="Reorder active parcel markers"
        onClose={onClose}
      />
      <div className="space-y-1 px-4 py-3">
        {options.map(([option, label, detail]) => (
          <label
            key={option}
            className={`flex cursor-pointer items-center gap-3 rounded-[10px] px-3 py-3 ${value === option ? "bg-[#f3f7ff]" : ""}`}
          >
            <input
              type="radio"
              name="purchase-sort"
              checked={value === option}
              onChange={() => onChange(option)}
              className="h-5 w-5 accent-[#06245f]"
            />
            <span
              className={`flex-1 text-[13px] ${value === option ? "font-semibold text-navy" : "text-[#8b949e]"}`}
            >
              {label}
            </span>
            <span
              className={
                option === "newest"
                  ? "rounded bg-[#e7faef] px-2 py-1 text-[10px] text-[#16a05a]"
                  : "text-[12px] text-[#8b949e]"
              }
            >
              {option === "recommended" ? "DEFAULT" : detail}
            </span>
          </label>
        ))}
      </div>
      <PanelFooter onReset={onClose} onApply={onApply} />
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
  return (
    <PurchasePanel>
      <PanelHeader
        icon="☷"
        title="Filter Plots"
        subtitle="Narrow 1,168 parcels across Thailand"
        onClose={onClose}
      />
      <div className="space-y-5 px-4 py-4">
        <FilterGroup title="Plots">
          <div className="grid grid-cols-2 gap-2">
            <Check label="My Plots" checked={myPlots} onChange={onMyPlotsChange} />
            <Check label="Gifted Plots" checked={gifted} onChange={onGiftedChange} />
          </div>
        </FilterGroup>
        <FilterGroup title="Zone Category">
          <div className="grid grid-cols-2 gap-2">
            <Check
              label="All Zones"
              checked={zones.length === 0}
              onChange={() => onZoneToggle("all")}
            />
            <Check
              label="Icon"
              checked={zones.includes("Icon")}
              onChange={() => onZoneToggle("Icon")}
            />
            <Check
              label="Popular"
              checked={zones.includes("Popular")}
              onChange={() => onZoneToggle("Popular")}
            />
            <Check
              label="Standard"
              checked={zones.includes("Standard")}
              onChange={() => onZoneToggle("Standard")}
            />
          </div>
        </FilterGroup>
        <FilterGroup title="Land Area (Rai)" detail="1 Rai = 1,600 m²">
          <div className="grid grid-cols-2 gap-2">
            <Field value={minRai} onChange={setMinRai} suffix="RAI" />
            <Field value={maxRai} onChange={setMaxRai} suffix="RAI" />
          </div>
        </FilterGroup>
        <FilterGroup title="Price Range (USD)" detail="$100 – $2,500">
          <div className="grid grid-cols-2 gap-2">
            <Field value={minPrice} onChange={setMinPrice} prefix="$" />
            <Field value={maxPrice} onChange={setMaxPrice} prefix="$" />
          </div>
        </FilterGroup>
      </div>
      <div className="flex items-center justify-between bg-[#f7f9fc] px-5 py-4">
        <button type="button" onClick={onReset} className="text-[12px] text-[#8b949e]">
          Clear All
        </button>
        <div className="flex items-center gap-4">
          <span className="text-[10px] text-[#8b949e]">
            {filteredCount(zones)} plots found
          </span>
          <button
            type="button"
            onClick={onApply}
            className="rounded-[9px] bg-navy px-4 py-2.5 text-[12px] font-medium text-white"
          >
            Apply Filters
          </button>
        </div>
      </div>
    </PurchasePanel>
  );
}

function filteredCount(zones: string[]) {
  return zones.length ? 77 : 1168;
}
function PurchasePanel({ children }: { children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-end bg-transparent p-3 pt-20 sm:p-6 sm:pt-24">
      <section
        role="dialog"
        aria-modal="true"
        className="w-full max-w-[465px] overflow-hidden rounded-[16px] bg-white shadow-[0_20px_60px_rgba(11,31,77,0.22)]"
      >
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
  icon: string;
  title: string;
  subtitle: string;
  onClose: () => void;
}) {
  return (
    <div className="flex items-start gap-3 border-b border-[#edf0f3] px-5 py-5">
      <span className="flex h-9 w-9 items-center justify-center rounded-[9px] bg-[#eef2f5] text-xl text-navy">
        {icon}
      </span>
      <div className="flex-1">
        <h2 className="text-[20px] font-semibold text-navy">{title}</h2>
        <p className="text-[12px] text-[#8b949e]">{subtitle}</p>
      </div>
      <button
        type="button"
        onClick={onClose}
        aria-label="Close"
        className="text-2xl leading-none text-[#9aa3ad]"
      >
        ×
      </button>
    </div>
  );
}
function PanelFooter({ onReset, onApply }: { onReset: () => void; onApply: () => void }) {
  return (
    <div className="flex items-center justify-between bg-[#f7f9fc] px-5 py-4">
      <button type="button" onClick={onReset} className="text-[13px] text-[#8b949e]">
        Reset
      </button>
      <button
        type="button"
        onClick={onApply}
        className="rounded-[10px] bg-navy px-6 py-3 text-[13px] font-medium text-white"
      >
        Apply
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
  children: React.ReactNode;
}) {
  return (
    <div className="border-b border-[#edf0f3] pb-5 last:border-b-0">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-[12px] font-semibold uppercase tracking-[0.05em] text-[#8b949e]">
          {title}
        </p>
        {detail ? <span className="text-[11px] text-[#8b949e]">{detail}</span> : null}
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
    <label className="flex cursor-pointer items-center gap-2 rounded-[10px] border border-[#e1e7ec] px-3 py-2.5 text-[13px] text-[#8b949e]">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="h-5 w-5 accent-[#06245f]"
      />
      {label}
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
    <label className="flex h-11 items-center gap-2 rounded-[10px] border border-[#e1e7ec] px-3 text-[13px] text-navy">
      {prefix ? <span className="text-[#8b949e]">{prefix}</span> : null}
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="min-w-0 flex-1 bg-transparent outline-none"
      />
      {suffix ? (
        <span className="text-[11px] font-semibold text-[#8b949e]">{suffix}</span>
      ) : null}
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
