"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { isAbortError } from "@/lib/api/browser-client";
import { isApiError } from "@/lib/api/errors";
import { isAllowedRemoteImage } from "@/lib/config/remote-images";
import { routes } from "@/lib/constants/routes";
import { logError } from "@/lib/logging/logger";
import { ScrollAnimatedElement } from "@/components/animations/ScrollAnimatedElement";
import { useAuth } from "@/lib/hooks/useAuth";
import { DashboardNavbar } from "./DashboardNavbar";
import { useDashboardLanguage } from "./DashboardLanguageContext";
import type { DashboardData, FeaturedRegion } from "./schemas/dashboard.schema";
import { getDashboard } from "./services/dashboard.client";

const PLACEHOLDER_IMAGE = "/images/explore/place-placeholder.svg";
const numberFormat = new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 });
const bone = "animate-pulse rounded-[8px] bg-[#eef1f5] motion-reduce:animate-none";

/** "$" and "48,500" apart, so the symbol can be drawn smaller (Figma). */
function splitMoney(amount: number, currency: string) {
  try {
    const parts = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).formatToParts(amount);
    return {
      symbol: parts.filter((part) => part.type === "currency").map((part) => part.value).join(""),
      value: parts
        .filter((part) => part.type !== "currency")
        .map((part) => part.value)
        .join("")
        .trim(),
    };
  } catch {
    // Unknown currency code from the API: show the code instead of a symbol.
    return { symbol: `${currency} `, value: numberFormat.format(amount) };
  }
}

/** Explore Map link that opens the region's plots. */
function regionExploreHref(region: FeaturedRegion) {
  const query = new URLSearchParams({ regionId: region.id, region: region.name });
  return `${routes.dashboardExplore}?${query.toString()}`;
}

function LoadingSpinner() {
  return (
    <div className="flex min-h-[100svh] items-center justify-center bg-white text-sm text-muted">
      Loading dashboard...
    </div>
  );
}

export function DashboardPage() {
  const router = useRouter();
  const { isAuthenticated, user, isLoading } = useAuth();
  const { t } = useDashboardLanguage();
  // `GET /dashboard`; `reloadKey` refetches after an error.
  const [dashboard, setDashboard] = useState<
    { status: "loading" } | { status: "ready"; data: DashboardData } | { status: "error" }
  >({ status: "loading" });
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.replace(routes.login);
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    if (!isAuthenticated) return;

    const controller = new AbortController();
    getDashboard(controller.signal)
      .then((data) => setDashboard({ status: "ready", data }))
      .catch((error: unknown) => {
        // A cancelled request is not an error, and 401 already redirects to login.
        if (isAbortError(error)) return;
        if (isApiError(error) && error.code === "API_SESSION_EXPIRED") return;
        logError(error, "Failed to load dashboard");
        setDashboard({ status: "error" });
      });

    return () => controller.abort();
  }, [isAuthenticated, reloadKey]);

  if (!isLoading && !isAuthenticated) return null;
  if (isLoading) return <LoadingSpinner />;

  const data = dashboard.status === "ready" ? dashboard.data : null;
  // The signed-in name shows until the dashboard answers.
  const firstName = (data?.user.name ?? user?.name)?.trim().split(/\s+/)[0] || "User";
  const collection = data?.collection;
  const spent = collection ? splitMoney(collection.totalSpent, collection.currency) : null;
  const regions = data
    ? [...data.featuredRegions].sort(
        (a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0),
      )
    : [];

  function retry() {
    setDashboard({ status: "loading" });
    setReloadKey((key) => key + 1);
  }

  return (
    <div className="min-h-[100svh] bg-[#f7f9fc] text-navy">
      <DashboardNavbar active="home" />

      <main className="mx-auto w-full max-w-[1180px] px-5 pb-14 pt-6 sm:px-8 sm:pt-8">
        <ScrollAnimatedElement animation="fade-in" duration={600}>
          <section className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-manrope text-[11px] font-bold uppercase tracking-[0.16em] text-navy">
                {t("Your Tajlandia Home")}
              </p>
              <h1 className="font-manrope mt-2 text-[28px] font-semibold leading-[1.15] tracking-[-0.03em] text-[#1a1a1a] sm:text-[32px]">
                {t("Welcome back,")} {firstName}
                <span aria-hidden="true" className="ml-1.5 inline-block translate-y-[-1px] text-[0.62em] text-brand-red">◆</span>
              </h1>
            </div>
            <Button
              href="/dashboard/explore"
              className="font-manrope h-11 shrink-0 cursor-pointer self-start bg-navy px-5 text-[14px] font-medium shadow-[0_8px_24px_rgba(11,31,77,0.12)] hover:bg-navy-deep sm:self-auto"
            >
              {t("Explore Thailand →")}
            </Button>
          </section>
        </ScrollAnimatedElement>

        <ScrollAnimatedElement animation="fade-in-scale" duration={600} className="mt-8">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="font-manrope text-[11px] font-bold uppercase tracking-[0.16em] text-navy">
                {t("Ownership Overview")}
              </p>
              <h2 className="font-manrope mt-1.5 text-[22px] font-semibold tracking-[-0.02em] text-[#1a1a1a] sm:text-[24px]">
                {t("Your Collection")}
              </h2>
            </div>
            <p className="font-manrope flex items-center gap-2 text-[13px] font-medium text-navy">
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-navy text-[9px] text-white">✓</span>
              {t("All holdings verified across Thailand")}
            </p>
          </div>
          {dashboard.status === "error" ? (
            <div
              role="alert"
              className="mt-4 flex flex-col items-center gap-3 rounded-[16px] border border-[#e7edf3] bg-white px-4 py-10 text-center"
            >
              <p className="font-manrope text-[14px] text-[#8b939e]">
                {t("Couldn't load your dashboard.")}
              </p>
              <button
                type="button"
                onClick={retry}
                className="font-manrope h-9 cursor-pointer rounded-[8px] border border-navy px-4 text-[13px] font-semibold text-navy hover:bg-[#f5f7fa]"
              >
                {t("Try Again")}
              </button>
            </div>
          ) : (
            <div
              className="mt-4 grid grid-cols-1 gap-3 min-[520px]:grid-cols-2 xl:grid-cols-4"
              aria-busy={!collection}
            >
              {collection && spent ? (
                <>
                  <Stat
                    icon="/images/dashboard/cards/ic_land.svg"
                    background="/images/dashboard/stat-land-bg.png"
                    value={numberFormat.format(Math.round(collection.totalLandSqFt))}
                    suffix="sq ft"
                    label={`${t("Total Land")} (${numberFormat.format(collection.totalLandRai)} ${t("Rai")})`}
                  />
                  <Stat
                    icon="/images/dashboard/cards/ic_plot.svg"
                    background="/images/dashboard/stat-plots-bg.png"
                    value={numberFormat.format(collection.plotsClaimed)}
                    label={t("Plots Claimed")}
                  />
                  <Stat
                    icon="/images/dashboard/cards/ic_region.svg"
                    background="/images/dashboard/regions-bg.png"
                    // Two digits, as in Figma ("05").
                    value={String(collection.regionsCount).padStart(2, "0")}
                    label={t("Regions")}
                  />
                  <Stat
                    icon="/images/dashboard/cards/ic_total-spent.svg"
                    background="/images/dashboard/stat-spent-bg.png"
                    value={spent.value}
                    prefix={spent.symbol}
                    label={t("Total Spent")}
                  />
                </>
              ) : (
                Array.from({ length: 4 }, (_, index) => <StatSkeleton key={index} />)
              )}
            </div>
          )}
        </ScrollAnimatedElement>

        <section className="mt-5">
          {/* Hidden only when the API turns gifting off. */}
          {data?.gift?.enabled === false ? null : (
          <div className="relative overflow-hidden rounded-[22px] border border-[#f3c3c3] bg-[#fff8f8] px-5 py-6 sm:px-8 sm:py-7 lg:px-10">
            <Image
              src="/images/dashboard/gift-ribbon.png"
              alt=""
              width={168}
              height={120}
              className="pointer-events-none absolute -left-1 -top-1 h-[88px] w-[130px] object-contain object-left-top sm:h-[104px] sm:w-[150px]"
            />
            <div className="relative z-10 flex flex-col gap-5 pl-2 pt-8 sm:pl-6 sm:pt-6 lg:flex-row lg:items-center lg:justify-between lg:pl-16 lg:pt-4">
              <div className="max-w-[560px]">
                <p className="font-manrope text-[11px] font-bold uppercase tracking-[0.16em] text-brand-red">
                  {t("Give a Little Piece")}
                </p>
                <h2 className="font-manrope mt-2 text-[22px] font-semibold leading-tight tracking-[-0.02em] text-[#1a1a1a] sm:text-[26px]">
                  {t("Give a Little Piece of Thailand")}
                </h2>
                <p className="font-manrope mt-2 text-[13px] font-normal leading-5 text-[#8b939e] sm:text-[14px] sm:leading-6">
                  <span className="block">{t("Share a place worth remembering. Gift a Tajlandia plot to someone")}</span>
                  <span className="block">{t("special and let them build their own collection.")}</span>
                </p>
              </div>
              <div className="flex flex-col items-start gap-4 lg:items-end lg:self-stretch lg:justify-between lg:py-1">
                <Button
                  href="/dashboard/explore"
                  className="font-manrope h-11 cursor-pointer bg-brand-red px-5 text-[14px] font-medium shadow-[0_8px_24px_rgba(11,31,77,0.12)] hover:bg-[#a81818]"
                >
                  {t("Gift a plot")} →
                </Button>
                <div className="font-manrope flex w-full flex-col gap-1.5 border-t-[0.8px] border-solid border-[#E8344533] pt-3 text-[12px] text-[#11111199] sm:flex-row sm:justify-end sm:gap-4">
                  <span>✓ {t("Instant Digital Certificate")}</span>
                  <span>✓ {t("Official Cadastre Deed")}</span>
                </div>
              </div>
            </div>
          </div>

          )}

          {/* Featured regions; the section hides when there are none (or on error). */}
          {dashboard.status === "loading" || regions.length ? (
            <>
              <div className="mt-8">
                <p className="font-manrope text-[11px] font-bold uppercase tracking-[0.16em] text-brand-red">
                  {t("Your Land Archive")}
                </p>
                <h2 className="font-manrope mt-1.5 text-[22px] font-semibold tracking-[-0.02em] text-navy sm:text-[24px]">
                  {t("Explore Thailand")}
                </h2>
              </div>
              {regions.length ? (
                <ExploreCarousel regions={regions} />
              ) : (
                <div className="mt-4 flex gap-4 overflow-hidden pb-2" aria-busy="true">
                  {Array.from({ length: 3 }, (_, index) => (
                    <ExploreCardSkeleton key={index} />
                  ))}
                </div>
              )}
            </>
          ) : null}
        </section>
      </main>
    </div>
  );
}

function Stat({
  icon,
  background,
  value,
  label,
  prefix,
  suffix,
}: {
  icon: string;
  background: string;
  value: string;
  label: string;
  prefix?: string;
  suffix?: string;
}) {
  return (
    <article className="relative h-[132px] overflow-hidden rounded-[16px] border border-[#e7edf3] bg-white px-4 py-4 shadow-[0_8px_24px_rgba(11,31,77,0.05)]">
      <Image
        src={background}
        alt=""
        width={150}
        height={120}
        className="pointer-events-none absolute bottom-1 right-1 h-[72%] w-auto object-contain object-right-bottom opacity-80"
      />
      <div className="relative z-10">
        <Image src={icon} alt="" width={38} height={38} className="h-[38px] w-[38px]" />
        <p className="font-manrope mt-3 text-[26px] font-bold leading-none tracking-[-0.03em] text-[#1a1a1a]">
          {prefix ? <span className="text-[0.72em]">{prefix}</span> : null}
          {value}
          {suffix ? <span className="ml-1 text-[13px] font-semibold tracking-normal">{suffix}</span> : null}
        </p>
        <p className="font-manrope mt-2 text-[13px] font-medium text-[#8b939e]">{label}</p>
      </div>
    </article>
  );
}

function StatSkeleton() {
  return (
    <div
      aria-hidden="true"
      className="h-[132px] rounded-[16px] border border-[#e7edf3] bg-white px-4 py-4 shadow-[0_8px_24px_rgba(11,31,77,0.05)]"
    >
      <span className={`${bone} block h-[38px] w-[38px] rounded-full`} />
      <span className={`${bone} mt-3 block h-[26px] w-24`} />
      <span className={`${bone} mt-2 block h-3.5 w-28`} />
    </div>
  );
}

const cardSize =
  "min-w-0 snap-start flex-[0_0_86%] rounded-[18px] border border-[#eef1f4] bg-white p-3 shadow-[0_10px_28px_rgba(11,31,77,0.06)] sm:flex-[0_0_48%] lg:flex-[0_0_calc((100%-2rem)/3)]";

function ExploreCardSkeleton() {
  return (
    <div aria-hidden="true" className={cardSize}>
      <span className={`${bone} block aspect-[1.55] w-full rounded-[14px]`} />
      <span className={`${bone} mx-1.5 mt-3 block h-5 w-1/3`} />
      <span className={`${bone} mx-1.5 mt-2 block h-3.5 w-3/4`} />
      <span className={`${bone} mx-1.5 mt-5 block h-3.5 w-1/2`} />
    </div>
  );
}

/** Region image; the local placeholder when missing, from a host we don't allow, or broken. */
function RegionImage({ src, alt }: { src: string | null | undefined; alt: string }) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const usable = isAllowedRemoteImage(src) && failedSrc !== src;

  return (
    <Image
      src={usable ? src : PLACEHOLDER_IMAGE}
      alt={alt}
      width={360}
      height={220}
      unoptimized={!usable}
      onError={() => {
        if (usable) setFailedSrc(src);
      }}
      className="aspect-[1.55] w-full rounded-[14px] object-cover"
    />
  );
}

function ExploreCard({ region }: { region: FeaturedRegion }) {
  const { t } = useDashboardLanguage();
  return (
    <article className={cardSize}>
      <div className="relative">
        <RegionImage src={region.imageUrl} alt={region.name} />
        {/* Shown as the API sends it, one style for every badge. */}
        {region.badge ? (
          <span className="absolute left-3 top-3 rounded-full bg-white/92 px-2 py-0.5 font-manrope text-[10px] font-semibold uppercase tracking-[0.06em] text-[#5c6570]">
            {t(region.badge)}
          </span>
        ) : null}
      </div>
      <div className="px-1.5 pt-3">
        <h3 className="font-manrope text-[18px] font-semibold leading-6 text-navy">{region.name}</h3>
        {region.description ? (
          <p className="font-manrope mt-1 text-[13px] leading-5 text-[#8b939e]">
            {t(region.description)}
          </p>
        ) : null}
      </div>
      <div className="font-manrope mt-3 flex items-center justify-between border-t border-[#eef1f4] px-1.5 pt-3 text-[12px]">
        <span className="text-[#8b939e]">
          {`${numberFormat.format(region.locationCount)} ${t(region.locationCount === 1 ? "location" : "locations")}`}
        </span>
        <Link
          href={regionExploreHref(region)}
          className="cursor-pointer font-semibold text-navy hover:underline"
        >
          {t("Discover Plots →")}
        </Link>
      </div>
    </article>
  );
}

function ExploreCarousel({ regions }: { regions: FeaturedRegion[] }) {
  const carouselRef = useRef<HTMLDivElement>(null);
  const [activePage, setActivePage] = useState(0);

  useEffect(() => {
    const carousel = carouselRef.current;
    if (!carousel) return;

    const updateActivePage = () => {
      setActivePage(carousel.scrollLeft > 24 ? 1 : 0);
    };

    carousel.addEventListener("scroll", updateActivePage, { passive: true });
    return () => carousel.removeEventListener("scroll", updateActivePage);
  }, []);

  function moveCarousel(event: React.WheelEvent<HTMLDivElement>) {
    const carousel = carouselRef.current;
    if (!carousel || Math.abs(event.deltaY) < Math.abs(event.deltaX)) return;
    event.preventDefault();
    carousel.scrollBy({
      left: event.deltaY > 0 ? carousel.clientWidth * 0.72 : -carousel.clientWidth * 0.72,
      behavior: "smooth",
    });
  }

  return (
    <>
      <div
        ref={carouselRef}
        onWheel={moveCarousel}
        className="mt-4 flex snap-x snap-mandatory gap-4 overflow-x-auto overscroll-contain pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {regions.map((region) => (
          <ExploreCard key={region.id} region={region} />
        ))}
      </div>
      <div
        className="mt-3 flex items-center justify-center gap-1.5"
        aria-label="Explore carousel position"
      >
        <span
          className={`rounded-full transition-all ${activePage === 0 ? "h-1.5 w-6 bg-navy" : "h-1.5 w-1.5 bg-[#c7cbd1]"}`}
        />
        <span
          className={`rounded-full transition-all ${activePage === 1 ? "h-1.5 w-6 bg-navy" : "h-1.5 w-1.5 bg-[#c7cbd1]"}`}
        />
      </div>
    </>
  );
}
