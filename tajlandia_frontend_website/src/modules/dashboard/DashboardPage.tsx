"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { routes } from "@/lib/constants/routes";
import { useAuth } from "@/lib/hooks/useAuth";
import { DashboardNavbar } from "./DashboardNavbar";

function LoadingSpinner() {
  return <div className="flex min-h-[100svh] items-center justify-center bg-white text-sm text-muted">Loading dashboard...</div>;
}

export function DashboardPage() {
  const router = useRouter();
  const { isAuthenticated, user, isLoading } = useAuth();

  if (!isLoading && !isAuthenticated) {
    router.replace(routes.login);
    return null;
  }
  if (isLoading) return <LoadingSpinner />;

  const firstName = user?.name?.trim().split(/\s+/)[0] || "User";

  return (
    <div className="min-h-[100svh] bg-white text-navy">
      <DashboardNavbar active="home" />

      <main className="mx-auto w-[92%] max-w-none px-5 py-8 sm:px-8 sm:py-10">
        <section className="flex items-end justify-between gap-6">
          <div><p className="font-manrope text-[14px] font-bold uppercase tracking-[0.08em] text-navy">Your Tajlandia Home</p><h1 className="font-manrope mt-2 text-[36px] font-semibold leading-none tracking-[-0.04em] text-[#171717] sm:text-[48px]">Welcome back, {firstName} <span className="text-brand-red">✦</span></h1><p className="font-manrope mt-2 text-[16px] font-normal text-[#9aa3ad]">Here’s everything you own in Thailand.</p></div>
          <Link href="/dashboard/explore" className="font-manrope hidden rounded-full bg-navy px-5 py-3 text-[16px] font-medium text-white sm:inline-flex">Explore Thailand →</Link>
        </section>

        <section className="mt-7 rounded-[18px] border border-[#e6eaf0] px-4 py-5 sm:px-6">
          <div className="flex items-center justify-between gap-4"><div><p className="font-manrope text-[12px] font-bold uppercase tracking-[0.08em] text-navy">Ownership Overview</p><h2 className="font-manrope mt-1 text-[24px] font-semibold text-[#171717]">Your Collection</h2></div><p className="font-manrope hidden text-[14px] font-bold text-navy sm:block">● All holdings verified across Thailand</p></div>
          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3"><Stat icon="⌖" value="8000" label="Total Land (Sq Rai)" tone="blue" /><Stat icon="◉" value="12" label="Plots Claimed" tone="green" /><Stat icon="▥" value="05" label="Regions" tone="purple" /><Stat icon="◉" value="48,500" label="Total Spent" tone="gold" /></div>
        </section>

        <section className="mt-5 grid gap-4 lg:grid-cols-[0.92fr_1.08fr]">
          <div className="rounded-[18px] border border-brand-red bg-[#fff8f8] p-5 sm:p-6"><div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-red text-sm text-white">♔</div><p className="mt-5 text-[8px] font-semibold uppercase tracking-[0.08em] text-brand-red">Give a Little Piece</p><h2 className="mt-2 max-w-[320px] text-[20px] font-medium leading-tight text-[#171717]">Give a Little Piece of Thailand</h2><p className="mt-2 max-w-[330px] text-[10px] leading-4 text-[#9aa3ad]">Share a place worth remembering. Gift a Tajlandia plot to someone special and let them build their own collection.</p><button type="button" className="mt-5 rounded-full bg-brand-red px-5 py-2.5 text-[10px] text-white">Gift a plot →</button><div className="mt-5 border-t border-brand-red/15 pt-3 text-[8px] text-[#9aa3ad]">✓ Instant Digital Certificate &nbsp;&nbsp; ✓ Official Cadastre Deed</div></div>
          <div className="relative min-h-[225px] overflow-hidden rounded-[18px]"><Image src="/images/explore/featured-thailand.jpg" alt="Thailand coastline" fill sizes="(max-width: 1024px) 100vw, 55vw" className="object-cover" /><div className="absolute inset-0 bg-gradient-to-t from-[#063f4b]/90 via-transparent to-transparent" /><div className="absolute inset-x-0 bottom-0 p-6 text-white"><h2 className="text-[23px] font-medium">Thailand Awaits</h2><p className="mt-1 max-w-[240px] text-[9px] leading-3 text-white/80">Discover beautiful locations and available plots across Thailand.</p><Link href="/dashboard/explore" className="mt-3 inline-block text-[9px]">Explore Thailand →</Link></div></div>
        </section>

        <section className="mt-6"><div className="flex items-end justify-between"><div><p className="text-[8px] font-semibold uppercase tracking-[0.08em] text-brand-red">Your Land Archive</p><h2 className="mt-1 text-[16px] font-medium">Recent Purchase</h2></div><Link href="/dashboard/my-land" className="text-[9px] font-medium">View All →</Link></div><div className="mt-3 grid gap-3 lg:grid-cols-2"><PurchaseCard /><PurchaseCard /></div></section>
      </main>
    </div>
  );
}

function Stat({ icon, value, label, tone }: { icon: string; value: string; label: string; tone: "blue" | "green" | "purple" | "gold" }) {
  const tones = { blue: "bg-[#f1f6ff] text-[#1156b5]", green: "bg-[#effaf3] text-[#198b55]", purple: "bg-[#fbf2ff] text-[#8b21b7]", gold: "bg-[#fff9e9] text-[#bd8a00]" };
  return <div className={`min-h-[70px] rounded-[10px] p-3 ${tones[tone]}`}><span className="text-[13px]">{icon}</span><strong className="font-manrope mt-2 block text-[20px] font-black">{value}{tone === "blue" ? " sq ft" : ""}</strong><span className="font-manrope block text-[14px] font-semibold text-[#697586]">{label}</span></div>;
}

function PurchaseCard() {
  return <div className="flex items-center gap-3 rounded-[16px] bg-white p-3 shadow-[0_5px_18px_rgba(11,31,77,0.08)]"><Image src="/images/explore/phuket.jpg" alt="Seaview Ridge Plot" width={58} height={58} className="h-[58px] w-[58px] rounded-[10px] object-cover" /><div className="min-w-0 flex-1"><p className="text-[8px] text-[#c19a16]">ICON</p><h3 className="truncate text-[11px] font-medium">Seaview Ridge Plot</h3><p className="text-[8px] text-[#9aa3ad]">◉ Phuket City</p><p className="mt-1 text-[8px] text-brand-red">25 Rai <span className="text-[#9aa3ad]">· $0.10 / Rai</span></p></div><div className="text-right"><strong className="block text-[20px] font-semibold">$2.50</strong><Link href="/dashboard/explore" className="mt-2 block text-[8px]">View Map →</Link></div></div>;
}
