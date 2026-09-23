"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { routes } from "@/lib/constants/routes";
import { ScrollAnimatedElement } from "@/components/animations/ScrollAnimatedElement";
import { useAuth } from "@/lib/hooks/useAuth";
import { DashboardNavbar } from "./DashboardNavbar";
import { useDashboardLanguage } from "./DashboardLanguageContext";

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

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.replace(routes.login);
  }, [isAuthenticated, isLoading, router]);

  if (!isLoading && !isAuthenticated) return null;
  if (isLoading) return <LoadingSpinner />;

  const firstName = user?.name?.trim().split(/\s+/)[0] || "User";

  return (
    <div className="min-h-[100svh] bg-white text-navy">
      <DashboardNavbar active="home" />

      <main className="mx-auto w-[92%] max-w-none px-5 py-8 sm:px-8 sm:py-10">
        <ScrollAnimatedElement animation="fade-in" duration={600}>
          <section className="flex items-end justify-between gap-6">
            <div>
      <p className="font-manrope text-[14px] font-bold uppercase tracking-[0.08em] text-navy">
                {t("Your Tajlandia Home")}
              </p>
              <h1 className="font-manrope mt-2 text-[36px] font-semibold leading-none tracking-[-0.04em] text-[#171717] sm:text-[48px]">
                {t("Welcome back,")} {firstName} <span className="text-brand-red">✦</span>
              </h1>
              <p className="font-manrope mt-2 text-[16px] font-normal text-[#9aa3ad]">
                {t("Here’s everything you own in Thailand.")}
              </p>
            </div>
            <Link
              href="/dashboard/explore"
              className="font-manrope hidden rounded-full bg-navy px-5 py-3 text-[16px] font-medium text-white sm:inline-flex"
            >
              {t("Explore Thailand →")}
            </Link>
          </section>
        </ScrollAnimatedElement>

        <ScrollAnimatedElement
          animation="fade-in-scale"
          duration={600}
          className="mt-7 rounded-[18px] border border-[#e6eaf0] px-4 py-5 sm:px-6"
        >
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="font-manrope text-[12px] font-bold uppercase tracking-[0.08em] text-navy">
                {t("Ownership Overview")}
              </p>
              <h2 className="font-manrope mt-1 text-[24px] font-semibold text-[#171717]">
                {t("Your Collection")}
              </h2>
            </div>
            <p className="font-manrope hidden text-[14px] font-bold text-navy sm:block">
              ● {t("All holdings verified across Thailand")}
            </p>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
            <Stat
              icon="/images/dashboard/stat-land.png"
              background="/images/dashboard/stat-land-bg.png"
              value="8000"
              label={t("Total Land (Sq Rai)")}
              tone="blue"
            />
            <Stat
              icon="/images/dashboard/stat-plots.png"
              background="/images/dashboard/stat-plots-bg.png"
              value="12"
              label={t("Plots Claimed")}
              tone="green"
            />
            <Stat
              icon="/images/dashboard/stat-regions.png"
              background="/images/dashboard/regions-bg.png"
              value="05"
              label={t("Regions")}
              tone="purple"
            />
            <Stat
              icon="/images/dashboard/stat-spent.png"
              background="/images/dashboard/stat-spent-bg.png"
              value="48,500"
              label={t("Total Spent")}
              tone="gold"
            />
          </div>
        </ScrollAnimatedElement>

        <section className="mt-5">
          <div className="relative min-h-[228px] overflow-hidden rounded-[22px] border border-brand-red bg-[#fff8f8] px-5 py-6 sm:px-8 lg:px-[86px] lg:py-0">
            <Image
              src="/images/dashboard/gift-ribbon.png"
              alt=""
              width={150}
              height={110}
              className="pointer-events-none absolute -left-3 -top-2 h-[120px] w-[150px] object-contain object-left-top"
            />
            <div className="relative z-10 lg:absolute lg:left-[86px] lg:top-[91px]">
              <p className="font-manrope text-[12px] font-bold uppercase tracking-[0.08em] text-brand-red">
                {t("Give a Little Piece")}
              </p>
              <h2 className="font-manrope mt-2 max-w-[520px] text-[30px] font-semibold leading-tight text-[#171717]">
                {t("Give a Little Piece of Thailand")}
              </h2>
              <p className="font-manrope mt-2 max-w-[430px] text-[14px] font-normal leading-5 text-[#9aa3ad]">
                {t("Share a place worth remembering. Gift a Tajlandia plot to someone special and let them build their own collection.")}
              </p>
            </div>
            <div className="mt-5 flex flex-col gap-5 lg:absolute lg:right-[37px] lg:top-[93px] lg:mt-0 lg:w-[282px] lg:gap-6">
              <button
                type="button"
                className="font-manrope self-start rounded-full bg-brand-red px-7 py-2.5 text-[16px] font-medium text-white lg:self-end"
              >
                {t("Gift a plot")} →
              </button>
              <div className="font-manrope border-t border-brand-red/15 pt-3 text-[11px] text-[#6f7780] lg:pt-4">
                ✓ {t("Instant Digital Certificate")} &nbsp;&nbsp; ✓ {t("Official Cadastre Deed")}
              </div>
            </div>
          </div>
          <div className="mt-6 flex items-end justify-between">
            <div>
              <p className="text-[8px] font-semibold uppercase tracking-[0.08em] text-brand-red">
                {t("Your Land Archive")}
              </p>
              <h2 className="mt-1 text-[16px] font-semibold text-navy">
                {t("Explore Thailand")}
              </h2>
            </div>
          </div>
          <ExploreCarousel />
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
  tone,
  iconSize = 32,
}: {
  icon: string;
  background: string;
  value: string;
  label: string;
  tone: "blue" | "green" | "purple" | "gold";
  iconSize?: number;
}) {
  const tones = {
    blue: "bg-[#f1f6ff] text-[#1156b5]",
    green: "bg-[#effaf3] text-[#198b55]",
    purple: "bg-[#fbf2ff] text-[#8b21b7]",
    gold: "bg-[#fff9e9] text-[#bd8a00]",
  };
  return (
    <div
      className={`relative min-h-[70px] overflow-hidden rounded-[10px] p-3 ${tones[tone]}`}
    >
      <Image
        src={background}
        alt=""
        fill
        sizes="180px"
        className="object-contain object-right-bottom opacity-70"
      />
      <div className="relative z-10">
        <Image
          src={icon}
          alt=""
          width={iconSize}
          height={iconSize}
          className="object-contain"
        />
        <strong className="font-manrope mt-2 block text-[20px] font-black">
          {value}
          {tone === "blue" ? " sq ft" : ""}
        </strong>
        <span className="font-manrope block text-[14px] font-semibold text-[#697586]">
          {label}
        </span>
      </div>
    </div>
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
    <article className="min-w-0 snap-start flex-[0_0_86%] rounded-[18px] bg-white p-3 shadow-[0_5px_18px_rgba(11,31,77,0.08)] sm:flex-[0_0_48%] lg:flex-[0_0_32%]">
      <Image
        src={image}
        alt={name}
        width={320}
        height={190}
        className="aspect-[1.7] w-full rounded-[10px] object-cover"
      />
      <div className="px-1 pt-2">
        <span className="rounded bg-[#fff4c6] px-1.5 py-0.5 text-[7px] text-[#c19a16]">
          {t(badge)}
        </span>
        <h3 className="mt-2 text-[16px] font-semibold text-navy">{name}</h3>
        <p className="mt-1 text-[10px] text-[#9aa3ad]">{t(description)}</p>
      </div>
      <div className="mt-3 flex items-center justify-between border-t border-[#edf0f2] px-1 pt-2 text-[8px] text-navy">
        <span>{t(locations)}</span>
        <Link href="/dashboard/explore" className="font-semibold">
          {t("Discover Plots →")}
        </Link>
      </div>
    </article>
  );
}

function ExploreCarousel() {
  const carouselRef = useRef<HTMLDivElement>(null);
  const [activePage, setActivePage] = useState(0);
  const destinations = [
    {
      image: "/images/explore/phuket.jpg",
      badge: "ICON",
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
        className="mt-3 flex snap-x snap-mandatory gap-3 overflow-x-auto overscroll-contain pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
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
          className={`h-1 rounded-full transition-all ${activePage === 0 ? "w-4 bg-navy" : "w-1 bg-[#c7cbd1]"}`}
        />
        <span
          className={`h-1 rounded-full transition-all ${activePage === 1 ? "w-4 bg-navy" : "w-1 bg-[#c7cbd1]"}`}
        />
      </div>
    </>
  );
}
