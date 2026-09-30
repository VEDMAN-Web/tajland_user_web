"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AccountMenu } from "./AccountMenu";
import { DashboardNavbar } from "./DashboardNavbar";
import { useAuth } from "@/lib/hooks/useAuth";
import { routes } from "@/lib/constants/routes";
import { useDashboardLanguage } from "./DashboardLanguageContext";

const plots = [
  { badge: "ICON", color: "#e11d2e" },
  { badge: "ICON", color: "#e11d2e" },
  { badge: "POPULAR", color: "#0f9f8f" },
  { badge: "STANDARD", color: "#3b6fd8" },
];

export function OrderDetailsPage({ orderId }: { orderId: string }) {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();
  const { t } = useDashboardLanguage();
  const orderNumber = orderId.match(/\d{3,}/)?.[0] ?? "1234";

  if (isLoading) {
    return (
      <main className="flex min-h-[100svh] items-center justify-center bg-[#f7f9fc] text-sm text-muted">
        {t("Loading order...")}
      </main>
    );
  }
  if (!isAuthenticated) {
    router.replace(routes.login);
    return null;
  }

  return (
    <div className="min-h-[100svh] bg-[#f7f9fc] text-navy">
      <DashboardNavbar active="none" />
      <main className="mx-auto grid w-full max-w-[1180px] gap-6 px-5 pb-14 pt-8 sm:px-8 lg:grid-cols-[240px_minmax(0,1fr)] lg:items-start lg:gap-7">
        <AccountMenu active="purchases" />
        <section className="min-w-0">
          <Link href={routes.purchases} className="inline-flex items-center gap-1 font-manrope text-[13px] font-medium text-navy">
            ← {t("Back to Purchases")}
          </Link>
          <div className="mt-4 flex items-start justify-between gap-4">
            <div>
              <h1 className="font-manrope text-[28px] font-semibold leading-none tracking-[-0.03em] text-navy sm:text-[32px]">
                {orderNumber === "1234" ? t("Order #1234") : `Order #${orderNumber}`}
              </h1>
              <p className="mt-2 font-manrope text-[14px] leading-5 text-[#8b939e]">
                {t("Track your purchases and view your order details.")}
              </p>
            </div>
            <button type="button" aria-label={t("Share")} className="flex h-10 w-10 items-center justify-center rounded-[12px] border border-[#e8edf2] bg-white text-navy shadow-[0_4px_14px_rgba(11,31,77,0.05)]">
              <ShareIcon />
            </button>
          </div>
          <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <OrderStat icon={<PinIcon />} label={t("Order ID")} value="#TJ-2026-00124" />
            <OrderStat icon={<CalendarIcon />} label={t("Date")} value="03 Sept 2026" />
            <OrderStat icon={<PinIcon />} label={t("Acquired Deeds")} value={`03 ${t("Plots")}`} />
            <OrderStat icon={<LayersIcon />} label={t("Cumulative Surface")} value={`100 ${t("Rai")}`} />
          </div>
          <div className="mt-6 grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_300px]">
            <div className="space-y-3">
              {plots.map((plot, index) => (
                <PlotRow key={`${plot.badge}-${index}`} badge={plot.badge} color={plot.color} />
              ))}
            </div>
            <OrderSummary />
          </div>
        </section>
      </main>
    </div>
  );
}

function OrderStat({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-[16px] border border-[#eef1f4] bg-white px-4 py-4 shadow-[0_6px_18px_rgba(11,31,77,0.04)]">
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[12px] bg-[#edf3ff] text-navy">{icon}</span>
        <div className="min-w-0">
          <p className="font-manrope text-[11px] font-semibold uppercase tracking-[0.08em] text-[#8b939e]">{label}</p>
          <strong className="mt-1 block whitespace-nowrap font-manrope text-[13px] font-semibold leading-5 text-[#1a1a1a]">{value}</strong>
        </div>
      </div>
    </div>
  );
}

function PlotRow({ badge, color }: { badge: string; color: string }) {
  const { t } = useDashboardLanguage();
  return (
    <article className="flex items-center gap-3 rounded-[16px] border border-[#eef1f4] bg-white p-3 shadow-[0_8px_22px_rgba(11,31,77,0.05)]">
      <img src="/images/explore/phuket.jpg" alt="" className="h-[72px] w-[88px] shrink-0 rounded-[12px] object-cover" />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="font-manrope text-[10px] font-semibold uppercase tracking-[0.04em]" style={{ color }}>{badge}</span>
          <span className="font-manrope text-[11px] text-[#b0b7c0]">PH-1124</span>
        </div>
        <h2 className="mt-0.5 truncate font-manrope text-[14px] font-semibold leading-5 text-navy">{t("Seaview Ridge Plot")}</h2>
        <p className="mt-0.5 inline-flex items-center gap-1 font-manrope text-[12px] text-[#8b939e]">
          <PinIcon className="h-3.5 w-3.5" />
          Phuket City
        </p>
        <p className="mt-0.5 font-manrope text-[12px] leading-4 text-[#8b939e]">
          25 {t("Rai")} (40,000 sqm) · $0.10 / {t("Rai")}
        </p>
      </div>
      <div className="shrink-0 text-right">
        <strong className="block font-manrope text-[20px] font-semibold leading-6 text-navy">$2.50</strong>
        <Link href={routes.dashboardExplore} className="mt-1 inline-block font-manrope text-[12px] font-medium text-navy">
          {t("Explore on Map →")}
        </Link>
      </div>
    </article>
  );
}

function OrderSummary() {
  const { t } = useDashboardLanguage();
  const zones = [
    { label: "Icon Zone", amount: "$5.00", color: "#e0aa2b" },
    { label: "Popular Zone", amount: "$1.25", color: "#14b8a6" },
    { label: "Standard Zone", amount: "$0.25", color: "#3b82f6" },
  ];
  return (
    <aside className="rounded-[16px] border border-[#eef1f4] bg-white px-5 py-5 shadow-[0_8px_24px_rgba(11,31,77,0.05)]">
      <h2 className="font-manrope text-[18px] font-semibold text-navy">{t("Order Summary")}</h2>
      <div className="mt-4 space-y-2.5 font-manrope text-[13px] text-[#8b939e]">
        <p className="flex items-center justify-between">
          <span>{t("Plots")}</span>
          <strong className="font-semibold text-navy">4</strong>
        </p>
        <p className="flex items-center justify-between">
          <span>{t("Total Rai")}</span>
          <strong className="font-semibold text-[#e11d2e]">100</strong>
        </p>
      </div>
      <div className="my-4 border-t border-[#eef1f4]" />
      <div className="space-y-2.5 font-manrope text-[13px] text-[#5c6770]">
        {zones.map((zone) => (
          <p key={zone.label} className="flex items-center justify-between">
            <span className="inline-flex items-center gap-2">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: zone.color }} />
              {t(zone.label)}
            </span>
            <span>{zone.amount}</span>
          </p>
        ))}
      </div>
      <div className="my-4 border-t border-[#eef1f4]" />
      <p className="flex items-center justify-between font-manrope text-[13px] text-[#8b939e]">
        <span>{t("Subtotal")}</span>
        <span className="text-[#1a1a1a]">$6.50</span>
      </p>
      <p className="mt-2 flex items-center justify-between font-manrope text-[13px] text-[#16a34a]">
        <span>{t("Discount · TAJ10")}</span>
        <span>$0.25</span>
      </p>
      <p className="mt-4 flex items-center justify-between rounded-[12px] bg-[#f7f9fc] px-3 py-3 font-manrope text-[14px] text-[#8b939e]">
        <span>{t("Total")}</span>
        <strong className="text-[22px] font-semibold text-[#1a1a1a]">$6.25</strong>
      </p>
      <div className="mt-3 flex items-center gap-2 rounded-[12px] bg-[#eefbf4] px-3 py-3 font-manrope text-[12px] font-semibold uppercase tracking-[0.04em] text-[#16a34a]">
        <CheckIcon />
        {t("Payment fully settled")}
      </div>
    </aside>
  );
}

function PinIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className}>
      <path d="M12 21s6.2-5.2 6.2-10a6.2 6.2 0 1 0-12.4 0c0 4.8 6.2 10 6.2 10Z" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="12" cy="11" r="2" fill="none" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5">
      <rect x="4" y="5.5" width="16" height="14" rx="2" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <path d="M8 4v3M16 4v3M4 10h16" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.6" />
    </svg>
  );
}

function LayersIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5">
      <path d="M12 3.5 4.5 7.2 12 11l7.5-3.8L12 3.5Z" fill="none" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.6" />
      <path d="M4.5 12 12 15.8 19.5 12M4.5 16.4 12 20.2 19.5 16.4" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.6" />
    </svg>
  );
}

function ShareIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4">
      <circle cx="7" cy="12" r="2.2" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="16.5" cy="7" r="2.2" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="16.5" cy="17" r="2.2" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <path d="m9 11 5.2-3.2M9 13l5.2 3.2" fill="none" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4">
      <circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <path d="m8.5 12.2 2.3 2.3 4.7-5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.6" />
    </svg>
  );
}
