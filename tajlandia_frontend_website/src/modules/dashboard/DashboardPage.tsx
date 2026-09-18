"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { routes } from "@/lib/constants/routes";
import { useAuth } from "@/lib/hooks/useAuth";
import { DashboardNavbar } from "./DashboardNavbar";
import { OwnershipOverview } from "./components/OwnershipOverview";
import { GiftCard } from "./components/GiftCard";
import { PlotCard } from "./components/PlotCard";
import { cn } from "@/lib/utils/cn";

function LoadingSpinner() {
  return (
    <div className="flex min-h-[100svh] items-center justify-center bg-[#f7f9fc] text-sm text-muted">
      Loading dashboard...
    </div>
  );
}

/**
 * Dashboard Home — pixel-perfect from Figma (frame 2068:20915)
 * Sections: Welcome header, Ownership Overview, Gift Card + Thailand Awaits, Recent Purchases
 */
export function DashboardPage() {
  const router = useRouter();
  const { isAuthenticated, user, isLoading } = useAuth();

  // Auth guard — redirect to login if not authenticated
  if (!isLoading && !isAuthenticated) {
    router.replace(routes.login);
    return null;
  }
  if (isLoading) return <LoadingSpinner />;

  const firstName = user?.name?.trim().split(/\s+/)[0] || "User";

  // Hardcoded stats (replace with API call)
  const stats = {
    totalLandRai: "8000",
    plotsClaimed: 12,
    regions: 5,
    totalSpent: "48,500",
  };

  // Hardcoded recent purchases (replace with API call)
  const recentPurchases = [
    {
      id: "1",
      imageSrc: "/images/explore/phuket.jpg",
      regionLabel: "ICON",
      name: "Seaview Ridge Plot",
      location: "Phuket City",
      rai: 25,
      pricePerRai: 0.10,
      totalPrice: 2.50,
    },
    {
      id: "2",
      imageSrc: "/images/explore/featured-thailand.jpg",
      regionLabel: "ICON",
      name: "Mountain View Plot",
      location: "Chiang Mai",
      rai: 25,
      pricePerRai: 0.10,
      totalPrice: 2.50,
    },
  ];

  return (
    <div className="min-h-[100svh] bg-[#f7f9fc]">
      {/* Navbar — Figma: sticky, transparent bg, h-54 */}
      <DashboardNavbar active="home" />

      {/* Main content — Figma: max-w-1180, px-20/32, py-32/40 */}
      <main className="mx-auto w-full max-w-[1180px] px-5 py-8 sm:px-8 sm:py-10">
        
        {/* ── Welcome Section ── */}
        <section className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end sm:gap-6">
          <div>
            {/* Eyebrow — Figma: 14px/700 navy uppercase tracking-0.08em */}
            <p className="font-[family-name:var(--font-manrope)] text-[14px] font-bold uppercase tracking-[0.08em] text-[#001f54]">
              Your Tajlandia Home
            </p>

            {/* Heading — Figma: 44px/500 Manrope #111111 */}
            <h1 className="mt-2 font-[family-name:var(--font-manrope)] text-[36px] font-medium leading-[42px] tracking-[-0.02em] text-[#111111] sm:text-[44px] sm:leading-[48px]">
              Welcome back, {firstName}{" "}
              <span className="text-[#e00c1b]">✦</span>
            </h1>

            {/* Subtitle — Figma: 16px/500 muted */}
            <p className="mt-2 font-[family-name:var(--font-manrope)] text-[16px] font-normal leading-[21.86px] text-[#818d97]">
              Here's everything you own in Thailand.
            </p>
          </div>

          {/* CTA — Figma: bg navy, rounded-full, 16px/500 white */}
          <Link
            href={routes.dashboardExplore}
            className="hidden rounded-full bg-[#001f54] px-5 py-3 font-[family-name:var(--font-manrope)] text-[16px] font-medium leading-[18px] text-white transition-opacity hover:opacity-90 sm:inline-flex"
          >
            Explore Thailand →
          </Link>
        </section>

        {/* ── Ownership Overview Section ── */}
        <OwnershipOverview stats={stats} className="mt-7" />

        {/* ── Gift Card + Thailand Awaits (2-col on desktop) ── */}
        <section className="mt-5 grid gap-4 lg:grid-cols-[0.92fr_1.08fr]">
          
          {/* Gift Card */}
          <GiftCard />

          {/* Thailand Awaits Hero */}
          <div className="relative min-h-[240px] overflow-hidden rounded-[18px] sm:min-h-[280px]">
            <Image
              src="/images/explore/featured-thailand.jpg"
              alt="Thailand coastline"
              fill
              sizes="(max-width: 1024px) 100vw, 55vw"
              className="object-cover"
            />
            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#063f4b]/90 via-transparent to-transparent" />
            
            {/* Text overlay — Figma: bottom-left, p-24, white text */}
            <div className="absolute inset-x-0 bottom-0 p-5 text-white sm:p-6">
              <h2 className="font-[family-name:var(--font-manrope)] text-[24px] font-semibold leading-[28px] text-white">
                Thailand Awaits
              </h2>
              <p className="mt-2 max-w-[280px] font-[family-name:var(--font-manrope)] text-[14px] font-normal leading-[19px] text-white/90">
                Discover beautiful locations and available plots across Thailand.
              </p>
              <Link
                href={routes.dashboardExplore}
                className="mt-3 inline-block font-[family-name:var(--font-manrope)] text-[14px] font-medium text-white hover:underline"
              >
                Explore Thailand →
              </Link>
            </div>
          </div>
        </section>

        {/* ── Recent Purchases Section ── */}
        <section className="mt-6">
          {/* Header */}
          <div className="flex items-end justify-between">
            <div>
              <p className="font-[family-name:var(--font-manrope)] text-[12px] font-bold uppercase tracking-[0.08em] text-[#e00c1b]">
                Your Land Archive
              </p>
              <h2 className="mt-1 font-[family-name:var(--font-manrope)] text-[20px] font-semibold text-[#111111] sm:text-[24px]">
                Recent Purchase
              </h2>
            </div>
            <Link
              href={routes.dashboardMyLand}
              className="font-[family-name:var(--font-manrope)] text-[13px] font-medium text-[#001f54] hover:underline sm:text-[14px]"
            >
              View All →
            </Link>
          </div>

          {/* Plot cards grid — 2 cols on desktop */}
          <div className="mt-3 grid gap-3 lg:grid-cols-2">
            {recentPurchases.map((plot) => (
              <PlotCard
                key={plot.id}
                imageSrc={plot.imageSrc}
                regionLabel={plot.regionLabel}
                name={plot.name}
                location={plot.location}
                rai={plot.rai}
                pricePerRai={plot.pricePerRai}
                totalPrice={plot.totalPrice}
              />
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
