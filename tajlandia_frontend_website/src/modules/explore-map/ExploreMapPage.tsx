"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent, type MouseEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import type { MapboxMapHandle, MapRegion } from "@/components/maps/MapboxMap";
import { isAuthenticated } from "@/lib/api/auth.utils";
import { isAllowedRemoteImage } from "@/lib/config/remote-images";
import { exploreRegionPath, routes } from "@/lib/constants/routes";
import { useAuth } from "@/lib/hooks/useAuth";
import { PublicRegionMap, type PublicRegionMapControl } from "./components/PublicRegionMap";
import type { ExploreRegion } from "./schemas/explore-map.schema";
import { formatCount } from "@/lib/utils/format-count";

function exploreMapDestination(signedIn: boolean) {
  return signedIn
    ? routes.dashboardExplore
    : `${routes.login}?next=${encodeURIComponent(routes.dashboardExplore)}`;
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-[18px] w-[18px] text-[#9aa6b2]">
      <circle cx="10.5" cy="10.5" r="6.25" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <path d="m15.2 15.2 4.3 4.3" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.6" />
    </svg>
  );
}

function ArrowButton({ direction, onClick }: { direction: "prev" | "next"; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-label={direction === "prev" ? "Previous regions" : "Next regions"}
      onClick={onClick}
      className="group flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-[#e6e8ef] bg-white text-navy shadow-[0_1px_2px_rgba(11,31,77,0.06)] transition hover:border-navy hover:bg-navy hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy motion-reduce:transition-none"
    >
      <svg viewBox="0 0 16 16" aria-hidden="true" className={`h-4 w-4 ${direction === "prev" ? "rotate-180" : ""}`}>
        <path d="M3 8h10m-4-4 4 4-4 4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  );
}

function MapControlIcon({ type }: { type: "plus" | "minus" }) {
  return <span aria-hidden="true" className="text-lg leading-none">{type === "plus" ? "+" : "−"}</span>;
}

type ExploreMapPageProps = {
  /** Region pills from `GET /explore/public/map` (empty hides them). */
  regions?: MapRegion[];
  /** Cards from `GET /explore/regions` (empty hides the section). */
  destinations?: ExploreRegion[];
};

export function ExploreMapPage({ regions = [], destinations: allDestinations = [] }: ExploreMapPageProps) {
  // A region without a usable image is not shown at all, including when its image fails to load.
  const [brokenImageIds, setBrokenImageIds] = useState<string[]>([]);
  const regionCount = allDestinations.length || regions.length;
  const destinations = allDestinations.filter(
    (destination) => isAllowedRemoteImage(destination.imageUrl) && !brokenImageIds.includes(destination.id),
  );
  const router = useRouter();
  const { isAuthenticated: signedIn } = useAuth();
  const mapRef = useRef<MapboxMapHandle>(null);
  const mapSectionRef = useRef<HTMLElement>(null);
  const regionMapRef = useRef<PublicRegionMapControl>(null);
  const destinationRowRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");
  const [message, setMessage] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    const row = destinationRowRef.current;
    if (!row) return;

    let paused = false;
    const pause = () => {
      paused = true;
    };
    const resume = () => {
      paused = false;
    };
    row.addEventListener("mouseenter", pause);
    row.addEventListener("mouseleave", resume);
    row.addEventListener("focusin", pause);
    row.addEventListener("focusout", resume);

    const id = window.setInterval(() => {
      if (!paused) scrollDestinations(1);
    }, 3000);

    return () => {
      window.clearInterval(id);
      row.removeEventListener("mouseenter", pause);
      row.removeEventListener("mouseleave", resume);
      row.removeEventListener("focusin", pause);
      row.removeEventListener("focusout", resume);
    };
  }, []);

  // One card per step, wrapping around at both ends so the slider loops.
  function scrollDestinations(direction: 1 | -1) {
    const row = destinationRowRef.current;
    const card = row?.querySelector("a");
    if (!row || !card) return;
    const gap = parseFloat(getComputedStyle(row).columnGap) || 0;
    const max = row.scrollWidth - row.clientWidth;
    if (max < 8) return;
    const behavior = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth";
    let left = row.scrollLeft + direction * (card.getBoundingClientRect().width + gap);
    if (row.scrollLeft >= max - 8 && direction === 1) left = 0;
    else if (row.scrollLeft <= 8 && direction === -1) left = max;
    row.scrollTo({ left: Math.max(0, Math.min(left, max)), behavior });
  }

  async function searchDestination(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = query.trim();
    if (!trimmed || isSearching) return;

    setIsSearching(true);
    setMessage("");
    const result = await mapRef.current?.searchAndFlyTo(trimmed);
    setIsSearching(false);

    if (result === "success") {
      mapSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    setMessage(
      result === "error"
        ? "Unable to search right now. Please try again."
        : "Please search for a city, region, or destination in Thailand.",
    );
  }

  function openExploreMap(event: MouseEvent<HTMLAnchorElement>) {
    const destination = exploreMapDestination(isAuthenticated());
    if (event.currentTarget.getAttribute("href") === destination) return;
    event.preventDefault();
    router.push(destination);
  }

  // A destination card shows that region's plots on the map above (no login needed to browse).
  function handleDestinationClick(destination: ExploreRegion) {
    mapSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    regionMapRef.current?.openRegion({
      id: destination.id,
      name: destination.name,
      center: [destination.longitude, destination.latitude],
    });
  }

  return (
    <div className="bg-white pb-16 md:pb-24">
      <section className="bg-white px-4 pb-10 pt-12 sm:px-8 md:pb-14 md:pt-16">
        <Container>
          <div className="mx-auto max-w-[720px] text-center">
            <h1 className="font-[family-name:var(--font-playfair-display)] text-[42px] font-semibold leading-[1.05] tracking-[-0.03em] text-navy sm:text-[52px]">
              Discover <span className="italic text-brand-red">Thailand</span>
            </h1>
            <p className="mx-auto mt-4 max-w-[38rem] font-[family-name:var(--font-manrope)] text-[16px] font-normal leading-[1.55] text-[#64748b] sm:mt-5 sm:text-[17px]">
              Explore remarkable destinations across Thailand, discover beautiful{" "}
              <br className="hidden sm:block" />
              locations, and find a place that feels like yours.
            </p>
            <form onSubmit={searchDestination} className="mx-auto mt-7 w-full max-w-[540px] sm:mt-8">
              <label className="flex h-[52px] items-center gap-2 rounded-[16px] border border-[#e6ebf2] bg-white px-4 text-left sm:gap-3 sm:px-5 shadow-[0_8px_24px_rgba(11,31,77,0.06)]">
                <input
                  type="search"
                  value={query}
                  onChange={(event) => {
                    setQuery(event.target.value);
                    setMessage("");
                  }}
                  placeholder="Search city or destination..."
                  className="min-w-0 flex-1 bg-transparent font-[family-name:var(--font-manrope)] text-[14px] text-navy outline-none placeholder:text-[#a0aab6] sm:text-[15px]"
                />
                <button type="submit" aria-label="Search Thailand" disabled={isSearching} className="text-[#9aa6b2]">
                  <SearchIcon />
                </button>
              </label>
              {message ? (
                <p role="status" className="mt-3 text-center font-[family-name:var(--font-manrope)] text-[13px] text-brand-red">
                  {message}
                </p>
              ) : null}
            </form>
          </div>
        </Container>
      </section>

      <section ref={mapSectionRef} className="bg-white px-4 sm:px-8">
        <Container>
          <div className="relative overflow-hidden rounded-[1.75rem] border border-[#dbe8ed] bg-white p-2 shadow-[0_15px_40px_rgba(11,31,77,0.1)] sm:p-3">
            <PublicRegionMap mapRef={mapRef} controlRef={regionMapRef} regions={regions} />
            <div className="absolute bottom-7 right-7 flex flex-col overflow-hidden rounded-full border border-[#dfe7ef] bg-white text-navy shadow-[0_4px_12px_rgba(11,31,77,0.12)] sm:bottom-8 sm:right-8">
              <button type="button" aria-label="Zoom in" onClick={() => mapRef.current?.zoomIn()} className="flex h-8 w-8 items-center justify-center hover:bg-[#f4f7fa]"><MapControlIcon type="plus" /></button>
              <span className="mx-auto h-px w-4 bg-line" />
              <button type="button" aria-label="Zoom out" onClick={() => mapRef.current?.zoomOut()} className="flex h-8 w-8 items-center justify-center hover:bg-[#f4f7fa]"><MapControlIcon type="minus" /></button>
            </div>
          </div>
        </Container>
      </section>

      {destinations.length > 0 ? (
      <section className="bg-white px-4 pt-14 sm:px-8 md:pt-20">
        <Container>
          <div className="mb-8 flex items-end justify-between gap-6">
            <div>
              <p className="font-[family-name:var(--font-playfair-display)] text-[16px] font-semibold leading-none text-[#5c6b86] sm:text-[18px]">
                Curated <span className="italic text-brand-red">Regions</span>
              </p>
              <h2 className="mt-3 font-[family-name:var(--font-playfair-display)] text-[40px] font-semibold leading-[1.05] tracking-[-0.03em] text-navy sm:text-[52px]">
                Explore by <span className="italic text-brand-red">Destination</span>
              </h2>
            </div>
            <div className="mb-2 hidden shrink-0 gap-2 sm:flex">
              <ArrowButton direction="prev" onClick={() => scrollDestinations(-1)} />
              <ArrowButton direction="next" onClick={() => scrollDestinations(1)} />
            </div>
          </div>
          <div
            ref={destinationRowRef}
            className="flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-smooth pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {destinations.map((destination) => (
              <Link
                key={destination.id}
                href={exploreRegionPath(destination, signedIn)}
                onClick={(event) => {
                  event.preventDefault();
                  handleDestinationClick(destination);
                }}
                className="group relative block h-[418px] w-[calc((100%-1.5rem)/3)] shrink-0 snap-start overflow-hidden rounded-[22px] border border-[#e4eaf2] bg-navy shadow-[0_10px_28px_rgba(11,31,77,0.12)]"
              >
                {isAllowedRemoteImage(destination.imageUrl) ? (
                  <Image
                    src={destination.imageUrl}
                    alt={destination.name}
                    fill
                    sizes="(max-width: 1024px) 80vw, 33vw"
                    className="object-cover transition duration-500 group-hover:scale-105"
                    onError={() => setBrokenImageIds((ids) => [...ids, destination.id])}
                  />
                ) : null}
                <div className="absolute inset-0 bg-gradient-to-t from-[#071536] via-[#071536]/20 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-5 text-white sm:p-6">
                  <h3 className="text-[28px] font-semibold uppercase leading-none tracking-[0.04em] sm:text-[32px]">
                    {destination.name}
                  </h3>
                  <p title={destination.description} className="mt-2 truncate text-[13px] leading-5 text-white/85">{destination.description}</p>
                  <div className="mt-5 flex items-center justify-end border-t border-white/35 pt-3 text-[12px] text-white/90">
                    <span>Discover Plots →</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </Container>
      </section>
      ) : null}

      <section className="bg-white px-4 pt-14 sm:px-8 md:pt-20">
        <Container>
          <div className="grid items-stretch gap-8 rounded-[28px] border border-[#e6ebf2] bg-white p-3 shadow-[0_16px_40px_rgba(11,31,77,0.06)] sm:p-4 lg:grid-cols-[1.05fr_0.95fr] lg:gap-10 lg:p-5">
            <div className="relative min-h-[320px] overflow-hidden rounded-[22px] bg-navy sm:min-h-[420px] lg:min-h-[460px]">
              <Image
                src="/images/explore/featured-thailand.jpg"
                alt="Phang Nga and the Andaman littoral"
                fill
                sizes="(max-width: 1024px) 100vw, 46vw"
                className="object-cover"
              />
              <span className="absolute bottom-4 left-4 inline-flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-navy shadow-[0_6px_16px_rgba(11,31,77,0.12)]">
                <i className="h-1.5 w-1.5 rounded-full bg-brand-red" />
                Phang Nga &amp; Andaman Littoral
              </span>
            </div>
            <div className="flex flex-col justify-center px-3 py-4 sm:px-4 sm:py-6 lg:pr-8 lg:py-8">
              <p className="flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.16em] text-navy">
                <i className="h-1.5 w-1.5 rounded-full bg-brand-red" />
                Discover Thailand
              </p>
              <h2 className="mt-3 text-[32px] font-semibold leading-[1.15] tracking-[-0.03em] text-navy sm:text-[40px]">
                Thailand, One Place at a Time.
              </h2>
              <p className="mt-3 max-w-[34rem] font-[family-name:var(--font-manrope)] text-[15px] font-normal leading-[1.6] text-[#64748b] sm:text-[16px]">
                From island coastlines to mountain cities, discover the places, landscapes,
                and destinations that make Thailand unforgettable.
              </p>
              <div className="mt-7 grid max-w-[520px] grid-cols-2 gap-x-8 gap-y-6 border-t border-[#e6ebf2] pt-6">
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-[#64748b]">Destinations</p>
                  <p className="mt-1.5 text-[18px] font-semibold text-navy">{formatCount(regionCount)} {regionCount === 1 ? "Region" : "Regions"}</p>
                </div>
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-[#64748b]">Plots to explore</p>
                  <p className="mt-1.5 text-[18px] font-semibold leading-snug text-navy">Available across Thailand</p>
                </div>
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-[#64748b]">Minimum collection</p>
                  <p className="mt-1.5 text-[18px] font-semibold text-navy">100 Rai</p>
                </div>
              </div>
              <Button
                href={exploreMapDestination(signedIn)}
                className="mt-7 h-12 w-fit px-7 text-[15px]"
                size="md"
                onClick={openExploreMap}
              >
                Explore the Map →
              </Button>
            </div>
          </div>
        </Container>
      </section>
    </div>
  );
}
