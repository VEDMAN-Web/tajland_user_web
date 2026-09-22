"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { AccountMenu } from "./AccountMenu";
import { DashboardNavbar } from "./DashboardNavbar";
import { useAuth } from "@/lib/hooks/useAuth";
import { routes } from "@/lib/constants/routes";
import { useDashboardLanguage } from "./DashboardLanguageContext";

const plots = ["ICON", "ICON", "POPULAR", "STANDARD"];

export function OrderDetailsPage({ orderId }: { orderId: string }) {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();
  const { t } = useDashboardLanguage();
  if (isLoading)
    return (
      <main className="flex min-h-[100svh] items-center justify-center bg-[#f7fafc] text-sm text-muted">
        {t("Loading order...")}
      </main>
    );
  if (!isAuthenticated) {
    router.replace(routes.login);
    return null;
  }
  return (
    <div className="min-h-[100svh] bg-[#f5f9fc] text-navy">
      <DashboardNavbar active="none" />
      <main className="mx-auto grid w-[92%] max-w-none gap-8 px-5 pb-12 pt-10 sm:px-8 lg:grid-cols-[256px_minmax(0,1fr)] lg:gap-7 lg:pt-14">
        <AccountMenu active="purchases" />
        <section className="min-w-0">
          <Link href={routes.cart} className="text-[11px] font-medium text-navy">
            ← Back to Cart
          </Link>
          <div className="mt-4 flex items-start justify-between gap-4">
            <div>
              <h1 className="text-[28px] font-semibold tracking-[-0.04em] text-[#171717] sm:text-[32px]">
                Order #1234
              </h1>
              <p className="mt-1 text-[12px] text-[#7b858f]">
                Track your purchases and view your order details.
              </p>
            </div>
            <button
              type="button"
              aria-label="Share order"
              className="flex h-10 w-10 items-center justify-center rounded-[9px] bg-white text-navy shadow-[0_4px_14px_rgba(11,31,77,0.08)]"
            >
              ↗
            </button>
          </div>
          <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <OrderStat icon="●" label="Order ID" value="#TJ-2026-00124" />
            <OrderStat icon="▣" label="Date" value="03 Sept 2026" />
            <OrderStat icon="●" label="Acquired Deeds" value="03 Plots" />
            <OrderStat icon="▰" label="Cumulative Surface" value="100 Rai" />
          </div>
          <div className="mt-6 grid gap-5 xl:grid-cols-[minmax(0,1fr)_280px]">
            <div className="space-y-2">
              {plots.map((badge, index) => (
                <PlotRow key={`${badge}-${index}`} badge={badge} />
              ))}
            </div>
            <OrderSummary />
          </div>
        </section>
      </main>
    </div>
  );
}

function OrderStat({
  icon,
  label,
  value,
}: {
  icon: string;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-[14px] bg-white p-4 shadow-[0_5px_18px_rgba(11,31,77,0.07)]">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-[12px] bg-[#eaf3ff] text-navy">
          {icon}
        </span>
        <div>
          <p className="text-[8px] uppercase tracking-[0.05em] text-[#a8b0b9]">{label}</p>
          <strong className="mt-1 block text-[15px] text-[#171717]">{value}</strong>
        </div>
      </div>
    </div>
  );
}
function PlotRow({ badge }: { badge: string }) {
  return (
    <article className="flex items-center gap-3 rounded-[13px] bg-white p-3 shadow-[0_5px_18px_rgba(11,31,77,0.06)]">
      <img
        src="/images/explore/phuket.jpg"
        alt="Seaview Ridge Plot"
        className="h-16 w-16 shrink-0 rounded-[9px] object-cover"
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="rounded bg-[#fff4c6] px-1.5 py-0.5 text-[8px] text-[#c19a16]">
            {badge}
          </span>
          <span className="text-[8px] text-[#aab2bd]">PH-1024</span>
        </div>
        <h2 className="truncate text-[12px] font-semibold text-navy">
          Seaview Ridge Plot
        </h2>
        <p className="text-[9px] text-[#8f99a4]">◉ Phuket City</p>
        <p className="mt-1 text-[9px] text-[#b0b7be]">
          25 Rai (40,000 sqm) · $0.10 / Rai
        </p>
      </div>
      <div className="text-right">
        <strong className="text-[24px] text-navy">$2.50</strong>
        <Link
          href={routes.dashboardExplore}
          className="mt-1 block text-[9px] text-navy underline"
        >
          Explore on Map ↗
        </Link>
      </div>
    </article>
  );
}
function OrderSummary() {
  return (
    <aside className="rounded-[14px] bg-white p-4 shadow-[0_5px_18px_rgba(11,31,77,0.07)]">
      <div className="flex items-center justify-between">
        <h2 className="text-[17px] font-semibold text-[#242b32]">Order Summary</h2>
        <span className="rounded bg-[#e7faef] px-2 py-1 text-[8px] font-semibold text-[#16a05a]">
          PAID
        </span>
      </div>
      <div className="mt-4 space-y-2 text-[11px] text-[#8f99a4]">
        <p className="flex justify-between">
          <span>Plots</span>
          <strong className="text-navy">4</strong>
        </p>
        <p className="flex justify-between">
          <span>Total Rai</span>
          <strong className="text-[#242b32]">100</strong>
        </p>
      </div>
      <div className="my-4 border-t border-[#e8edf1]" />
      <div className="space-y-2 text-[10px] text-[#8f99a4]">
        <p className="flex justify-between">
          <span>Icon Zone</span>
          <span>$5.00</span>
        </p>
        <p className="flex justify-between">
          <span>Popular Zone</span>
          <span>$1.25</span>
        </p>
        <p className="flex justify-between">
          <span>Standard Zone</span>
          <span>$0.25</span>
        </p>
      </div>
      <div className="my-4 border-t border-[#e8edf1]" />
      <p className="flex justify-between text-[10px] text-[#8f99a4]">
        <span>Subtotal</span>
        <span>$6.50</span>
      </p>
      <p className="mt-2 flex justify-between text-[10px] text-[#8f99a4]">
        <span>Discount · TAJ10</span>
        <span>$0.25</span>
      </p>
      <p className="mt-4 flex justify-between rounded-[9px] bg-[#f7f9fc] px-3 py-3 text-[11px] text-[#8f99a4]">
        <span>Total</span>
        <strong className="text-[22px] text-[#171717]">$6.25</strong>
      </p>
      <p className="mt-3 rounded-[8px] bg-[#e7faef] px-3 py-3 text-[9px] font-semibold uppercase tracking-[0.05em] text-[#16a05a]">
        ✓ Payment fully settled
      </p>
    </aside>
  );
}
