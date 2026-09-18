"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AccountMenu } from "./AccountMenu";
import { DashboardNavbar } from "./DashboardNavbar";
import { useAuth } from "@/lib/hooks/useAuth";
import { routes } from "@/lib/constants/routes";

type Purchase = { id?: string; name?: string; region?: string; rai?: number; amount?: number };

function getPurchases(): Purchase[] {
  try {
    const stored = localStorage.getItem("tajlandia_purchases");
    const parsed = stored ? JSON.parse(stored) : [];
    return Array.isArray(parsed) ? parsed.filter((item): item is Purchase => item && typeof item === "object") : [];
  } catch {
    return [];
  }
}

function SearchIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4"><circle cx="10.8" cy="10.8" r="6.3" fill="none" stroke="currentColor" strokeWidth="1.7" /><path d="m15.6 15.6 4.1 4.1" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.7" /></svg>;
}

function FilterIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true" className="h-3.5 w-3.5"><path d="M7 5v14M12 5v14M17 5v14M4.5 8h5M9.5 15h5M14.5 10h5" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.5" /></svg>;
}

function SortIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4"><path d="M8 5v14m0 0-3-3m3 3 3-3M16 19V5m0 0-3 3m3-3 3 3" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" /></svg>;
}

export function MyLandPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();
  const [query, setQuery] = useState("");
  const purchases = getPurchases();
  const filteredPurchases = purchases.filter((purchase) => `${purchase.name ?? ""} ${purchase.region ?? ""}`.toLowerCase().includes(query.toLowerCase()));
  const totalRai = purchases.reduce((total, purchase) => total + (typeof purchase.rai === "number" ? purchase.rai : 0), 0);
  const totalSpent = purchases.reduce((total, purchase) => total + (typeof purchase.amount === "number" ? purchase.amount : 0), 0);
  const regions = new Set(purchases.map((purchase) => purchase.region).filter(Boolean)).size;

  if (isLoading) return <main className="flex min-h-[100svh] items-center justify-center bg-[#f7fafc] text-sm text-muted">Loading land...</main>;
  if (!isAuthenticated) {
    router.replace(routes.login);
    return null;
  }

  return <div className="min-h-[100svh] bg-[#f7fafc] text-navy"><DashboardNavbar active="my-land" /><main className="mx-auto w-[87%] pb-16 pt-12 sm:pt-14"><section><h1 className="text-[27px] font-semibold tracking-[-0.04em] text-[#171717] sm:text-[30px]">My Land</h1><div className="mt-5 grid gap-3 md:grid-cols-3"><Stat icon="▰" label="Total Owned" value={`${totalRai} Rai`} /><Stat icon="●" label="Total Lands" value={`${regions} Location`} /><Stat icon="◉" label="Total Spent" value={`$${totalSpent.toFixed(2)}`} /></div><div className="mt-6 flex flex-col justify-between gap-3 sm:flex-row sm:items-center"><label className="flex h-9 w-full max-w-[295px] items-center gap-2 rounded-[9px] border border-[#e1e7ec] bg-white px-3 text-[10px] text-[#8d98a3] shadow-[0_3px_10px_rgba(11,31,77,0.02)]"><SearchIcon /><input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search your plots, provinces, deeds..." className="min-w-0 flex-1 bg-transparent outline-none placeholder:text-[#aab2bd]" /></label><div className="flex gap-2"><button type="button" className="inline-flex h-9 items-center gap-1.5 rounded-[9px] border border-[#e1e7ec] bg-white px-3 text-[10px] text-[#8d98a3]"><FilterIcon />Filter</button><button type="button" className="inline-flex h-9 items-center gap-1.5 rounded-[9px] border border-[#e1e7ec] bg-white px-3 text-[10px] text-[#8d98a3]"><SortIcon />Sort</button></div></div>{filteredPurchases.length ? <div className="mt-7 grid gap-3 md:grid-cols-2 lg:grid-cols-3">{filteredPurchases.map((purchase, index) => <div key={purchase.id ?? index} className="rounded-[14px] bg-white p-4 shadow-[0_5px_18px_rgba(11,31,77,0.08)]"><h2 className="text-[14px] font-semibold text-[#171717]">{purchase.name ?? "Tajlandia Plot"}</h2><p className="mt-1 text-[10px] text-[#8f99a4]">{purchase.region ?? "Thailand"} · {purchase.rai ?? 0} Rai</p><Link href={routes.explore} className="mt-4 inline-flex rounded-[8px] bg-navy px-4 py-2 text-[10px] text-white">View Map →</Link></div>)}</div> : <div className="flex min-h-[450px] flex-col items-center justify-center text-center"><div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#eaf3ff] text-[27px] text-[#7f8d9a]">◉</div><h2 className="mt-4 text-[19px] font-semibold text-[#171717]">No Land yet</h2><p className="mt-1 max-w-[290px] text-[11px] leading-4 text-[#7b858f]">You don&apos;t have any land in your collection yet. Explore Thailand and find a place you&apos;d love to own.</p><Link href={routes.explore} className="mt-5 inline-flex min-w-[294px] justify-center rounded-[9px] bg-navy px-6 py-3 text-[12px] text-white">Explore Thailand →</Link></div>}</section></main></div>;
}

export function MyPurchasesPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();
  const purchases = getPurchases();
  const totalRai = purchases.reduce((total, purchase) => total + (typeof purchase.rai === "number" ? purchase.rai : 0), 0);
  const totalSpent = purchases.reduce((total, purchase) => total + (typeof purchase.amount === "number" ? purchase.amount : 0), 0);
  const regions = new Set(purchases.map((purchase) => purchase.region).filter(Boolean)).size;

  if (isLoading) return <main className="flex min-h-[100svh] items-center justify-center bg-[#f7fafc] text-sm text-muted">Loading purchases...</main>;
  if (!isAuthenticated) {
    router.replace(routes.login);
    return null;
  }

  return <div className="min-h-[100svh] bg-[#f7fafc] text-navy"><DashboardNavbar active="none" /><main className="mx-auto grid w-[92%] max-w-none gap-8 px-5 pb-12 pt-10 sm:px-8 lg:grid-cols-[256px_minmax(0,1fr)] lg:gap-7 lg:pt-14"><AccountMenu active="purchases" /><section className="min-w-0"><div className="border-b border-[#e1e8ed] pb-4"><h1 className="text-[30px] font-semibold tracking-[-0.04em] text-[#171717] sm:text-[32px]">My Purchases</h1><p className="mt-1 text-[12px] text-[#7b858f]">View your plots and purchase details in one place.</p></div><div className="mt-5 grid gap-3 sm:grid-cols-3"><Stat icon="▰" label="Total Owned" value={`${totalRai} Rai`} /><Stat icon="●" label="Regions" value={`${regions} Location`} /><Stat icon="◉" label="Total Spent" value={`$${totalSpent.toFixed(2)}`} /></div>{purchases.length ? <div className="mt-8 grid gap-3 md:grid-cols-2">{purchases.map((purchase, index) => <div key={purchase.id ?? index} className="rounded-[14px] bg-white p-4 shadow-[0_5px_18px_rgba(11,31,77,0.08)]"><h2 className="text-[14px] font-semibold text-[#171717]">{purchase.name ?? "Tajlandia Plot"}</h2><p className="mt-1 text-[10px] text-[#8f99a4]">{purchase.region ?? "Thailand"} · {purchase.rai ?? 0} Rai</p><Link href={routes.explore} className="mt-4 inline-flex rounded-[8px] bg-navy px-4 py-2 text-[10px] text-white">View Map →</Link></div>)}</div> : <div className="flex min-h-[360px] flex-col items-center justify-center text-center"><div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#edf4ff] text-[28px] text-[#81909d]">◉</div><h2 className="mt-4 text-[20px] font-semibold text-[#171717]">No Purchase yet</h2><p className="mt-1 max-w-[280px] text-[11px] leading-4 text-[#7b858f]">You don&apos;t have any land in your collection yet. Explore Thailand and find a place you&apos;d love to own.</p><Link href={routes.explore} className="mt-5 inline-flex min-w-[250px] justify-center rounded-[9px] bg-navy px-6 py-3 text-[12px] text-white">Explore Thailand →</Link></div>}</section></main></div>;
}

function Stat({ icon, label, value }: { icon: string; label: string; value: string }) {
  return <div className="rounded-[13px] bg-white p-4 shadow-[0_5px_18px_rgba(11,31,77,0.08)]"><div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-[12px] bg-[#eaf3ff] text-[18px] text-navy">{icon}</span><div><p className="text-[10px] uppercase tracking-[0.06em] text-[#a8b0b9]">{label}</p><strong className="mt-1 block text-[17px] font-medium text-[#171717]">{value}</strong></div></div></div>;
}
