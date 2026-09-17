"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { routes } from "@/lib/constants/routes";
import { useAuth } from "@/lib/hooks/useAuth";
import { DashboardNavbar } from "@/modules/dashboard/DashboardNavbar";
import { MapboxMap, type MapboxMapHandle } from "./MapboxMap";
import { destinations } from "./ExploreMapPage";

function SearchIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4"><circle cx="10.8" cy="10.8" r="6.3" fill="none" stroke="currentColor" strokeWidth="1.7" /><path d="m15.6 15.6 4.1 4.1" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.7" /></svg>;
}

function LocateIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4"><circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" strokeWidth="1.7" /><path d="M12 3v3M12 18v3M3 12h3M18 12h3" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.7" /></svg>;
}

export function AuthenticatedExploreMapPage() {
  const router = useRouter();
  const mapRef = useRef<MapboxMapHandle>(null);
  const searchAreaRef = useRef<HTMLDivElement>(null);
  const { isAuthenticated, isLoading } = useAuth();
  const [search, setSearch] = useState("");
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [filter, setFilter] = useState<"all" | "ICON" | "POPULAR" | "STANDARD">("all");
  const [sort, setSort] = useState<"recent" | "name" | "locations">("recent");
  const [showAllHistory, setShowAllHistory] = useState(false);
  const [historyNames, setHistoryNames] = useState<string[]>(() => {
    if (typeof window === "undefined") return destinations.map((destination) => destination.name);
    try {
      const stored = JSON.parse(window.localStorage.getItem("tajlandia.explore-history") ?? "null");
      return Array.isArray(stored) ? stored.filter((name): name is string => typeof name === "string") : destinations.map((destination) => destination.name);
    } catch {
      return destinations.map((destination) => destination.name);
    }
  });
  const [searchMessage, setSearchMessage] = useState("");

  useEffect(() => {
    if (!isSearchExpanded) return;

    function handleOutsidePointer(event: PointerEvent) {
      if (!searchAreaRef.current?.contains(event.target as Node)) {
        setIsSearchExpanded(false);
        setIsFilterOpen(false);
        setIsSortOpen(false);
        setShowAllHistory(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsSearchExpanded(false);
        setIsFilterOpen(false);
        setIsSortOpen(false);
        setShowAllHistory(false);
      }
    }

    document.addEventListener("pointerdown", handleOutsidePointer);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("pointerdown", handleOutsidePointer);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isSearchExpanded]);

  const filteredDestinations = useMemo(() => {
    const query = search.trim().toLowerCase();
    return [...destinations]
      .filter((destination) => filter === "all" || destination.badge === filter)
      .filter((destination) => !query || `${destination.name} ${destination.detail}`.toLowerCase().includes(query))
      .sort((first, second) => {
        if (sort === "name") return first.name.localeCompare(second.name);
        if (sort === "locations") return Number.parseInt(second.locations, 10) - Number.parseInt(first.locations, 10);
        return 0;
      });
  }, [filter, search, sort]);
  const historyDestinations = useMemo(() => {
    const available = new Map<string, (typeof destinations)[number]>(filteredDestinations.map((destination) => [destination.name, destination]));
    return [
      ...historyNames.map((name) => available.get(name)).filter((destination): destination is (typeof destinations)[number] => Boolean(destination)),
      ...filteredDestinations.filter((destination) => !historyNames.includes(destination.name)),
    ];
  }, [filteredDestinations, historyNames]);
  const visibleHistory = showAllHistory ? historyDestinations : historyDestinations.slice(0, 6);

  function rememberLocation(name: string) {
    setHistoryNames((current) => {
      const next = [name, ...current.filter((item) => item !== name)];
      window.localStorage.setItem("tajlandia.explore-history", JSON.stringify(next));
      return next;
    });
  }

  async function selectLocation(destination: (typeof destinations)[number]) {
    setSearchMessage("");
    setIsSearchExpanded(false);
    setIsFilterOpen(false);
    setIsSortOpen(false);
    setShowAllHistory(false);
    const result = await mapRef.current?.searchAndFlyTo(destination.name);
    if (result === "success") {
      rememberLocation(destination.name);
      return;
    }
    mapRef.current?.flyToCoordinates(destination.coordinates);
    rememberLocation(destination.name);
  }

  async function searchLocation() {
    const result = await mapRef.current?.searchAndFlyTo(search);
    if (result === "success") {
      setSearchMessage("");
      setIsSearchExpanded(false);
    } else if (result === "not-found") {
      setSearchMessage("Please search for locations within Thailand.");
    } else {
      setSearchMessage("Unable to search right now. Please try again.");
    }
  }

  if (isLoading) return <main className="flex min-h-[100svh] items-center justify-center bg-white text-sm text-muted">Loading map...</main>;
  if (!isAuthenticated) {
    router.replace(routes.login);
    return null;
  }

  return (
    <main className="relative min-h-[100svh] overflow-hidden bg-[#74d0e1] text-navy">
      <MapboxMap ref={mapRef} className="absolute inset-0" />

      <DashboardNavbar active="explore" overlay />

      <div ref={searchAreaRef} className="absolute left-5 top-20 z-20 flex items-start gap-2 sm:left-8 sm:top-24" onMouseEnter={() => setIsSearchExpanded(true)}>
      <label className={`flex h-11 items-center gap-2 rounded-[10px] bg-white/95 px-4 text-[12px] text-[#aab2bd] shadow-[0_3px_12px_rgba(11,31,77,0.12)] transition-[width] duration-300 ${isSearchExpanded ? "w-[300px]" : "w-[150px]"}`}>
        <span className="sr-only">Search Maps</span>
        <input type="search" value={search} onFocus={() => setIsSearchExpanded(true)} onChange={(event) => { setSearchMessage(""); setSearch(event.target.value); }} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); void searchLocation(); } }} placeholder="Search Maps" className="min-w-0 flex-1 bg-transparent outline-none placeholder:text-[#aab2bd]" />
        <SearchIcon />
        {search ? <button type="button" aria-label="Clear search" onClick={() => setSearch("")} className="text-lg leading-none text-[#8c96a3]">×</button> : null}
      </label>
      {isSearchExpanded ? <>
        <div className="relative">
          <button type="button" aria-expanded={isFilterOpen} onClick={() => { setIsFilterOpen((open) => !open); setIsSortOpen(false); }} className="flex h-11 items-center gap-1 rounded-[10px] bg-white/95 px-3 text-[12px] text-[#6d7784] shadow-[0_3px_12px_rgba(11,31,77,0.12)]">☷ Filter</button>
          {isFilterOpen ? <div className="absolute left-0 top-12 w-36 rounded-[10px] bg-white p-2 text-[11px] shadow-[0_5px_18px_rgba(11,31,77,0.16)]">{(["all", "ICON", "POPULAR", "STANDARD"] as const).map((option) => <button key={option} type="button" onClick={() => { setFilter(option); setIsFilterOpen(false); }} className={`block w-full rounded-md px-2 py-1.5 text-left ${filter === option ? "bg-[#edf3ff] text-navy" : "text-[#6d7784] hover:bg-[#f5f7fa]"}`}>{option === "all" ? "All plots" : option[0] + option.slice(1).toLowerCase()}</button>)}</div> : null}
        </div>
        <div className="relative">
          <button type="button" aria-expanded={isSortOpen} onClick={() => { setIsSortOpen((open) => !open); setIsFilterOpen(false); }} className="flex h-11 items-center gap-1 rounded-[10px] bg-white/95 px-3 text-[12px] text-[#6d7784] shadow-[0_3px_12px_rgba(11,31,77,0.12)]">↕ Sort</button>
          {isSortOpen ? <div className="absolute left-0 top-12 w-36 rounded-[10px] bg-white p-2 text-[11px] shadow-[0_5px_18px_rgba(11,31,77,0.16)]">{(["recent", "name", "locations"] as const).map((option) => <button key={option} type="button" onClick={() => { setSort(option); setIsSortOpen(false); }} className={`block w-full rounded-md px-2 py-1.5 text-left ${sort === option ? "bg-[#edf3ff] text-navy" : "text-[#6d7784] hover:bg-[#f5f7fa]"}`}>{option === "recent" ? "Recently viewed" : option === "name" ? "Name" : "Most locations"}</button>)}</div> : null}
        </div>
      </> : null}
      </div>

      {isSearchExpanded ? <section className="absolute left-5 top-32 z-10 flex max-h-[calc(100svh-12rem)] w-[304px] flex-col overflow-hidden rounded-[18px] bg-white/95 p-4 shadow-[0_5px_20px_rgba(11,31,77,0.14)] sm:left-8 sm:top-36">
        <div className="min-h-0 overflow-y-auto pr-1">
          {searchMessage ? <p className="px-2 py-3 text-center text-[11px] text-[#b42318]">{searchMessage}</p> : null}
          {visibleHistory.length ? visibleHistory.map((destination) => <button key={destination.name} type="button" onClick={() => void selectLocation(destination)} className="flex w-full items-center gap-3 rounded-[10px] p-2 text-left hover:bg-[#f5f7fa]"><Image src={destination.image} alt="" width={34} height={34} className="h-[34px] w-[34px] rounded-[7px] object-cover" /><span className="min-w-0 flex-1"><strong className="block truncate text-[12px] font-medium text-navy">{destination.name}</strong><span className="block text-[10px] text-[#8d97a3]">{destination.locations}</span></span><span className="text-[#aab2bd]">›</span></button>) : <p className="px-2 py-8 text-center text-[11px] text-[#8d97a3]">No places match your search.</p>}
        </div>
        {visibleHistory.length < historyDestinations.length ? <button type="button" onClick={() => setShowAllHistory((show) => !show)} className="mt-3 shrink-0 border-t border-[#edf0f3] pt-3 text-center text-[11px] text-navy">{showAllHistory ? "Show less" : "More from recent history"}</button> : <p className="mt-3 shrink-0 border-t border-[#edf0f3] pt-3 text-center text-[11px] text-navy">More from recent history</p>}
      </section> : null}

      <div className="absolute bottom-9 left-5 flex max-w-[calc(100%-6rem)] flex-wrap items-center gap-3 rounded-md bg-white/95 px-3 py-2 text-[9px] text-[#273044] shadow-[0_3px_12px_rgba(11,31,77,0.12)] sm:bottom-10 sm:left-8 sm:max-w-none">
        <span className="font-medium uppercase tracking-wide">Plot Status</span>
        <span className="flex items-center gap-1"><i className="h-1.5 w-1.5 rounded-full bg-[#2cbf65]" />Available</span>
        <span className="flex items-center gap-1"><i className="h-1.5 w-1.5 rounded-full bg-[#e7b52c]" />Locked</span>
        <span className="flex items-center gap-1"><i className="h-1.5 w-1.5 rounded-full bg-[#d64242]" />Taken</span>
        <span className="hidden items-center gap-1 sm:flex"><i className="h-1.5 w-1.5 rounded-full bg-navy" />Your plots</span>
      </div>

      <div className="absolute bottom-9 right-5 flex flex-col items-center gap-3 sm:bottom-10 sm:right-8">
        <button type="button" aria-label="Current location" onClick={() => mapRef.current?.locate()} className="flex h-9 w-9 items-center justify-center rounded-full bg-white/95 shadow-[0_3px_12px_rgba(11,31,77,0.12)]"><LocateIcon /></button>
        <div className="flex flex-col overflow-hidden rounded-full bg-white/95 shadow-[0_3px_12px_rgba(11,31,77,0.12)]">
          <button type="button" aria-label="Zoom in" onClick={() => mapRef.current?.zoomIn()} className="flex h-9 w-9 items-center justify-center hover:bg-[#f4f7fa]">+</button>
          <span className="mx-auto h-px w-4 bg-line" />
          <button type="button" aria-label="Zoom out" onClick={() => mapRef.current?.zoomOut()} className="flex h-9 w-9 items-center justify-center hover:bg-[#f4f7fa]">−</button>
        </div>
      </div>
    </main>
  );
}
