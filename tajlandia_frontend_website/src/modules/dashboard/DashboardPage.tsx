"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { routes } from "@/lib/constants/routes";
import { ScrollAnimatedElement } from "@/components/animations/ScrollAnimatedElement";
import { useAuth } from "@/lib/hooks/useAuth";
import { DashboardNavbar } from "./DashboardNavbar";
import { useDashboardLanguage } from "./DashboardLanguageContext";
import { useDashboard } from "./hooks/useDashboard";
import { formatCurrency } from "@/lib/api/dashboard.service";
import type { FeaturedRegion } from "@/lib/api/dashboard.schemas";

function LoadingSpinner() {
  return (
    <div className="flex min-h-[100svh] items-center justify-center bg-white text-sm text-muted">
      Loading dashboard...
    </div>
  );
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="flex min-h-[100svh] flex-col items-center justify-center bg-white px-6 text-center">
      <div className="mb-4 text-4xl">⚠️</div>
      <h2 className="mb-2 text-xl font-semibold text-navy">Unable to Load Dashboard</h2>
      <p className="mb-6 max-w-md text-sm text-muted">{message}</p>
      <button
        onClick={onRetry}
        className="rounded-full bg-navy px-6 py-2.5 text-sm font-medium text-white hover:bg-navy/90"
      >
        Try Again
      </button>
    </div>
  );
}

export function DashboardPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { t } = useDashboardLanguage();
  
  // Fetch dashboard data
  const {
    user,
    collection,
    verification,
    featuredRegions,
    giftEnabled,
    isLoading: dashboardLoading,
    error,
    refresh,
  } = useDashboard({
    fetchOnMount: isAuthenticated,
  });

  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.replace(routes.login);
  }, [isAuthenticated, authLoading, router]);

  // Redirect if not authenticated
  if (!authLoading && !isAuthenticated) return null;
  
  // Show loading during auth check or initial dashboard load
  if (authLoading || (isAuthenticated && dashboardLoading && !user)) {
    return <LoadingSpinner />;
  }
  
  // Show error state with retry
  if (error && !user) {
    return <ErrorState message={error} onRetry={refresh} />;
  }

  const firstName = user?.name?.trim().split(/\s+/)[0] || "User";

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
          <div className="mt-4 grid grid-cols-1 gap-3 min-[520px]:grid-cols-2 xl:grid-cols-4">
            <Stat
              icon="/images/dashboard/cards/ic_land.svg"
              background="/images/dashboard/stat-land-bg.png"
              value="8000"
              suffix="sq ft"
              label={t("Total Land (5 Rai)")}
            />
            <Stat
              icon="/images/dashboard/cards/ic_plot.svg"
              background="/images/dashboard/stat-plots-bg.png"
              value={collection?.plotsClaimed.toString() || "0"}
              label={t("Plots Claimed")}
            />
            <Stat
              icon="/images/dashboard/cards/ic_region.svg"
              background="/images/dashboard/regions-bg.png"
              value={collection?.regionsCount.toString().padStart(2, "0") || "00"}
              label={t("Regions")}
            />
            <Stat
              icon="/images/dashboard/cards/ic_total-spent.svg"
              background="/images/dashboard/stat-spent-bg.png"
              value="48,500"
              prefix="$"
              label={t("Total Spent")}
            />
          </div>
        </ScrollAnimatedElement>

        <section className="mt-5">
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

          <div className="mt-8">
            <p className="font-manrope text-[11px] font-bold uppercase tracking-[0.16em] text-brand-red">
              {t("Your Land Archive")}
            </p>
            <h2 className="font-manrope mt-1.5 text-[22px] font-semibold tracking-[-0.02em] text-navy sm:text-[24px]">
              {t("Explore Thailand")}
            </h2>
          </div>
          <ExploreCarousel regions={featuredRegions} />
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

function ExploreCard({
  image,
  badge,
  name,
  description,
  locations,
}: {
  image: string;
  badge: string;
  name: string;
  description: string;
  locations: string;
}) {
  const { t } = useDashboardLanguage();
  return (
    <article className="min-w-0 snap-start flex-[0_0_86%] rounded-[18px] border border-[#eef1f4] bg-white p-3 shadow-[0_10px_28px_rgba(11,31,77,0.06)] sm:flex-[0_0_48%] lg:flex-[0_0_calc((100%-2rem)/3)]">
      <div className="relative">
        <Image
          src={image}
          alt={name}
          width={360}
          height={220}
          className="aspect-[1.55] w-full rounded-[14px] object-cover"
        />
        <span className={`absolute left-3 top-3 rounded-full px-2 py-0.5 font-manrope text-[10px] font-semibold uppercase tracking-[0.06em] ${badge === "POPULAR" ? "bg-[#f6d56a] text-[#6b5310]" : "bg-white/92 text-[#5c6570]"}`}>
          {t(badge)}
        </span>
      </div>
      <div className="px-1.5 pt-3">
        <h3 className="font-manrope text-[18px] font-semibold leading-6 text-navy">{name}</h3>
        <p className="font-manrope mt-1 text-[13px] leading-5 text-[#8b939e]">{t(description)}</p>
      </div>
      <div className="font-manrope mt-3 flex items-center justify-between border-t border-[#eef1f4] px-1.5 pt-3 text-[12px]">
        <span className="text-[#8b939e]">{t(locations)}</span>
        <Link href="/dashboard/explore" className="font-semibold text-navy hover:underline">
          {t("Discover Plots →")}
        </Link>
      </div>
    </article>
  );
}

function ExploreCarousel({ regions }: { regions: FeaturedRegion[] }) {
  const carouselRef = useRef<HTMLDivElement>(null);
  const [activePage, setActivePage] = useState(0);
  
  // Fallback destinations if API returns empty
  const fallbackDestinations = [
    {
      image: "/images/explore/phuket.jpg",
      badge: "POPULAR",
      name: "Phuket",
      description: "Island life, reimagined.",
      locations: "24 locations",
    },
    {
      image: "/images/explore/krabi.jpg",
      badge: "POPULAR",
      name: "Krabi",
      description: "Where limestone meets the sea.",
      locations: "16 locations",
    },
    {
      image: "/images/explore/chiang-mai.jpg",
      badge: "STANDARD",
      name: "Chiang Mai",
      description: "Mountains, culture and quiet.",
      locations: "12 locations",
    },
    {
      image: "/images/explore/bangkok.jpg",
      badge: "STANDARD",
      name: "Bangkok",
      description: "Energy, culture and endless discovery.",
      locations: "20 locations",
    },
    {
      image: "/images/explore/pattaya.jpg",
      badge: "STANDARD",
      name: "Pattaya",
      description: "Coastal escapes, just beyond the city.",
      locations: "14 locations",
    },
    {
      image: "/images/explore/koh-samui.jpg",
      badge: "STANDARD",
      name: "Koh Samui",
      description: "Island serenity, beautifully preserved.",
      locations: "18 locations",
    },
  ];
  
  // Convert API regions to card format
  const apiRegions = regions.map((region) => ({
    image: region.imageUrl || "/images/explore/placeholder.jpg", // Fallback for null/empty
    badge: region.badge,
    name: region.name,
    description: region.description,
    locations: `${region.locationCount} locations`,
  }));
  
  // Use API regions if available, otherwise fallback
  const destinations = apiRegions.length > 0 ? apiRegions : fallbackDestinations;

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
        {destinations.map((destination) => (
          <ExploreCard key={destination.name} {...destination} />
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
