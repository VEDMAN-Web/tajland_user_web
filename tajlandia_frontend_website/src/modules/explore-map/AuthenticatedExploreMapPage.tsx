"use client";

import Link from "next/link";
import { useRef } from "react";
import { BrandLogo } from "@/components/ui/BrandLogo";
import { routes } from "@/lib/constants/routes";
import { MapboxMap, type MapboxMapHandle } from "./MapboxMap";

function SearchIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4"><circle cx="10.8" cy="10.8" r="6.3" fill="none" stroke="currentColor" strokeWidth="1.7" /><path d="m15.6 15.6 4.1 4.1" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.7" /></svg>;
}

function BellIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4"><path d="M6.5 10.5a5.5 5.5 0 0 1 11 0c0 6 2.3 6.2 2.3 7.2H4.2c0-1 2.3-1.2 2.3-7.2ZM10 20h4" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" /></svg>;
}

function UserIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4"><circle cx="12" cy="8" r="3" fill="none" stroke="currentColor" strokeWidth="1.7" /><path d="M5.5 20c.7-3.4 2.8-5.1 6.5-5.1s5.8 1.7 6.5 5.1" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.7" /></svg>;
}

function LocateIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4"><circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" strokeWidth="1.7" /><path d="M12 3v3M12 18v3M3 12h3M18 12h3" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.7" /></svg>;
}

export function AuthenticatedExploreMapPage() {
  const mapRef = useRef<MapboxMapHandle>(null);

  return (
    <main className="relative min-h-[100svh] overflow-hidden bg-[#74d0e1] text-navy">
      <MapboxMap ref={mapRef} className="absolute inset-0" />

      <div className="absolute inset-x-0 top-0 flex items-center justify-between gap-4 px-5 py-4 sm:px-8 sm:py-5">
        <BrandLogo className="rounded-md bg-white/85 px-2 py-1" compact />
        <nav className="hidden items-center gap-1 rounded-full bg-white/95 p-1 text-[11px] font-medium shadow-[0_3px_12px_rgba(11,31,77,0.12)] sm:flex">
          <Link href={routes.home} className="rounded-full px-5 py-2.5 hover:bg-[#f4f7fa]">Home</Link>
          <Link href={routes.explore} aria-current="page" className="rounded-full bg-navy px-5 py-2.5 text-white">Explore Map</Link>
          <Link href={routes.login} className="rounded-full px-5 py-2.5 hover:bg-[#f4f7fa]">My Land</Link>
        </nav>
        <div className="flex items-center gap-2">
          <button type="button" aria-label="Select language" className="hidden h-9 items-center gap-2 rounded-full bg-white/95 px-3 text-[11px] shadow-[0_3px_12px_rgba(11,31,77,0.12)] sm:flex">🇬🇧 <span>EN</span><span aria-hidden="true">⌄</span></button>
          <button type="button" aria-label="Notifications" className="relative flex h-9 w-9 items-center justify-center rounded-full bg-white/95 shadow-[0_3px_12px_rgba(11,31,77,0.12)]"><BellIcon /><span className="absolute -right-0.5 -top-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-navy text-[8px] text-white">2</span></button>
          <button type="button" aria-label="Profile" className="flex h-9 w-9 items-center justify-center rounded-full bg-white/95 shadow-[0_3px_12px_rgba(11,31,77,0.12)]"><UserIcon /></button>
        </div>
      </div>

      <label className="absolute left-5 top-24 flex h-9 w-[150px] items-center gap-2 rounded-[10px] bg-white/95 px-3 text-[10px] text-[#aab2bd] shadow-[0_3px_12px_rgba(11,31,77,0.12)] sm:left-8 sm:top-28">
        <span className="sr-only">Search Maps</span>
        <input type="search" placeholder="Search Maps" className="min-w-0 flex-1 bg-transparent outline-none placeholder:text-[#aab2bd]" />
        <SearchIcon />
      </label>

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
