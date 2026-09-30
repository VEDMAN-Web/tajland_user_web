"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { DashboardNavbar } from "./DashboardNavbar";
import { useAuth } from "@/lib/hooks/useAuth";
import { routes } from "@/lib/constants/routes";
import { useDashboardLanguage } from "./DashboardLanguageContext";

type CartItem = {
  id?: string;
  name?: string;
  region?: string;
  rai?: number;
  amount?: number;
  image?: string;
  badge?: string;
};

const initialCart: CartItem[] = [25, 25, 25, 25].map((rai) => ({
  id: "PH-1124",
  name: "Seaview Ridge Plot",
  region: "Phuket City",
  rai,
  amount: 2.5,
  image: "/images/explore/phuket.jpg",
  badge: "ICON",
}));

function readCart(): CartItem[] {
  try {
    const stored = localStorage.getItem("tajlandia_cart");
    if (stored === null) return initialCart;
    const parsed = JSON.parse(stored);
    if (
      Array.isArray(parsed) &&
      parsed.length === 0 &&
      localStorage.getItem("tajlandia_cart_admin_empty") !== "true"
    )
      return initialCart;
    if (
      Array.isArray(parsed) &&
      parsed.length === 4 &&
      parsed.every((item) => item?.id?.startsWith("PH-"))
    )
      return initialCart;
    return Array.isArray(parsed)
      ? parsed.filter((item): item is CartItem => item && typeof item === "object")
      : [];
  } catch {
    return [];
  }
}

export function CartPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();
  const { t } = useDashboardLanguage();
  const [cartItems, setCartItems] = useState<CartItem[]>(() => readCart());
  const [coupon, setCoupon] = useState("");
  const totalRai = cartItems.reduce(
    (total, item) => total + (typeof item.rai === "number" ? item.rai : 0),
    0,
  );
  const total = cartItems.reduce(
    (sum, item) => sum + (typeof item.amount === "number" ? item.amount : 0),
    0,
  );
  function clearAll() {
    setCartItems(initialCart);
    localStorage.setItem("tajlandia_cart", JSON.stringify(initialCart));
    localStorage.removeItem("tajlandia_cart_admin_empty");
  }

  function removeItem(index: number) {
    setCartItems((current) => {
      const next = current.filter((_, itemIndex) => itemIndex !== index);
      localStorage.setItem("tajlandia_cart", JSON.stringify(next));
      return next;
    });
  }

  if (isLoading)
    return (
      <main className="flex min-h-[100svh] items-center justify-center bg-[#f7fafc] text-sm text-muted">
        {t("Loading cart...")}
      </main>
    );
  if (!isAuthenticated) {
    router.replace(routes.login);
    return null;
  }

  return (
    <div className="min-h-[100svh] bg-[#f7f9fc] text-navy">
      <DashboardNavbar active="none" />
      <main className="mx-auto w-full max-w-[1120px] px-5 pb-16 pt-8 sm:px-8">
        <section>
          <h1 className="font-manrope text-[28px] font-semibold leading-none tracking-[-0.03em] text-navy sm:text-[32px]">
            {t("Your Cart")}
          </h1>
          <p className="mt-2 font-manrope text-[14px] leading-5 text-[#8b939e]">
            {t("Review your selected plots before checkout.")}
          </p>
          {cartItems.length ? (
            <FilledCart
              items={cartItems}
              totalRai={totalRai}
              total={total}
              coupon={coupon}
              setCoupon={setCoupon}
              onClearAll={clearAll}
              onRemove={removeItem}
            />
          ) : (
            <EmptyCart />
          )}
        </section>
      </main>
    </div>
  );
}

function EmptyCart() {
  return (
    <div className="flex min-h-[calc(100svh-210px)] flex-col items-center justify-center text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#f5f8fc]">
        <img
          src="/images/dashboard/navbar/cart-default.png"
          alt=""
          className="h-8 w-8 object-contain"
        />
      </div>
      <h2 className="mt-5 text-[21px] font-semibold text-[#171717]">
        Your cart is empty
      </h2>
      <p className="mt-1 max-w-[310px] text-[12px] leading-5 text-[#7b858f]">
        You haven&apos;t selected any plots yet. Explore Thailand and discover a place to
        add to your collection.
      </p>
      <div className="mt-6 flex w-full max-w-[365px] gap-2">
        <Link
          href={routes.purchases}
          className="flex flex-1 items-center justify-center rounded-[9px] border border-[#e1e7ec] bg-white px-4 py-3 text-[11px] text-navy"
        >
          My Purchase
        </Link>
        <Link
          href={routes.dashboardExplore}
          className="flex flex-1 items-center justify-center rounded-[9px] bg-navy px-4 py-3 text-[11px] text-white"
        >
          Explore Thailand →
        </Link>
      </div>
    </div>
  );
}

function FilledCart({
  items,
  totalRai,
  total,
  coupon,
  setCoupon,
  onClearAll,
  onRemove,
}: {
  items: CartItem[];
  totalRai: number;
  total: number;
  coupon: string;
  setCoupon: (value: string) => void;
  onClearAll: () => void;
  onRemove: (index: number) => void;
}) {
  const { t } = useDashboardLanguage();
  const minimumReached = totalRai >= 100;
  const referenceCart = items.length === 4 && items.every((item) => item.id === "PH-1124" && item.rai === 25);
  const subtotal = referenceCart ? 6.5 : total;
  const grandTotal = referenceCart ? 6.25 : total;
  const zones = referenceCart
    ? [
        { label: "Icon Zone", amount: 6, color: "#e0aa2b" },
        { label: "Popular Zone", amount: 1.25, color: "#14b8a6" },
        { label: "Standard Zone", amount: 0.25, color: "#3b82f6" },
      ]
    : [
        { label: "Icon Zone", amount: total, color: "#e0aa2b" },
        { label: "Popular Zone", amount: 0, color: "#14b8a6" },
        { label: "Standard Zone", amount: 0, color: "#3b82f6" },
      ];

  return (
    <div className="mt-6 grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
      <section>
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-manrope text-[16px] font-semibold text-navy">{t("Selected Plots")}</h2>
          <button type="button" onClick={onClearAll} className="font-manrope text-[13px] text-[#8b939e]">
            {t("Clear All")}
          </button>
        </div>
        <div className="mt-3 space-y-3">
          {items.map((item, index) => (
            <CartItemCard key={`${item.id ?? "plot"}-${index}`} item={item} onRemove={() => onRemove(index)} />
          ))}
        </div>
        <div className="mt-3 flex flex-col items-start justify-between gap-4 rounded-[16px] border border-dashed border-[#d5deea] bg-white px-4 py-4 sm:flex-row sm:items-center">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#edf3ff] text-navy">
              <ShieldIcon />
            </span>
            <div>
              <h3 className="font-manrope text-[14px] font-semibold leading-5 text-navy">{t("Add more plots and make them yours.")}</h3>
              <p className="mt-1 max-w-[420px] font-manrope text-[12px] leading-5 text-[#8b939e]">
                {t("Unlock deed certification and blockchain cadastral inscription by selecting 25 additional Rai.")}
              </p>
            </div>
          </div>
          <Link href={routes.dashboardExplore} className="inline-flex h-11 shrink-0 items-center rounded-[12px] bg-navy px-4 font-manrope text-[13px] font-medium text-white">
            {t("Explore Thailand →")}
          </Link>
        </div>
      </section>
      <aside>
        <div className="flex gap-2">
          <input
            value={coupon}
            onChange={(event) => setCoupon(event.target.value)}
            placeholder={t("Enter Code")}
            className="h-11 min-w-0 flex-1 rounded-[12px] border border-[#e4e9ef] bg-white px-3 font-manrope text-[13px] text-navy outline-none placeholder:text-[#b0b7c0]"
          />
          <button type="button" className="h-11 shrink-0 rounded-[12px] bg-navy px-5 font-manrope text-[13px] font-medium text-white">
            {t("Apply")}
          </button>
        </div>
        <div className="mt-3 rounded-[16px] border border-[#eef1f4] bg-white px-5 py-5 shadow-[0_8px_24px_rgba(11,31,77,0.05)]">
          <h2 className="font-manrope text-[18px] font-semibold text-navy">{t("Order Summary")}</h2>
          <div className="mt-4 space-y-2.5 font-manrope text-[13px] text-[#8b939e]">
            <p className="flex items-center justify-between">
              <span>{t("Plots")}</span>
              <strong className="font-semibold text-navy">{items.length}</strong>
            </p>
            <p className="flex items-center justify-between">
              <span>{t("Total Rai")}</span>
              <strong className="font-semibold text-[#e11d2e]">{totalRai}</strong>
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
                <span>${zone.amount.toFixed(2)}</span>
              </p>
            ))}
          </div>
          <div className="my-4 border-t border-[#eef1f4]" />
          <p className="flex items-center justify-between font-manrope text-[13px] text-[#8b939e]">
            <span>{t("Subtotal")}</span>
            <span className="font-medium text-[#1a1a1a]">${subtotal.toFixed(2)}</span>
          </p>
          <p className="mt-3 flex items-center justify-between font-manrope text-[14px] text-[#8b939e]">
            <span>{t("Total")}</span>
            <strong className="text-[22px] font-semibold text-[#1a1a1a]">${grandTotal.toFixed(2)}</strong>
          </p>
          {minimumReached ? (
            <div className="mt-4 flex items-start gap-2 rounded-[12px] bg-[#eefbf4] px-3 py-3">
              <span className="mt-0.5 text-[#16a34a]">
                <CheckIcon />
              </span>
              <div>
                <p className="font-manrope text-[13px] font-semibold leading-5 text-[#15803d]">{t("Minimum purchase reached")}</p>
                <p className="font-manrope text-[12px] leading-4 text-[#3f9d62]">{t("Your selection meets the 100 Rai minimum.")}</p>
              </div>
            </div>
          ) : (
            <p className="mt-4 text-center font-manrope text-[12px] text-[#e11d2e]">
              {t("Requires")} {100 - totalRai} {t("Rai")}
            </p>
          )}
          <button
            type="button"
            disabled={!minimumReached}
            className="mt-4 h-11 w-full rounded-[12px] bg-[#e8edf2] font-manrope text-[13px] font-medium text-[#9aa3ad] disabled:cursor-not-allowed"
          >
            {t("Proceed to checkout →")}
          </button>
          <Link href={routes.dashboardExplore} className="mt-2 flex h-11 items-center justify-center rounded-[12px] border border-[#e4e9ef] bg-white font-manrope text-[13px] font-medium text-[#3d4654]">
            {t("Continue Exploring")}
          </Link>
        </div>
      </aside>
    </div>
  );
}

function CartItemCard({ item, onRemove }: { item: CartItem; onRemove: () => void }) {
  const { t } = useDashboardLanguage();
  const rai = item.rai ?? 0;
  const amount = item.amount ?? 0;
  const rate = rai > 0 ? amount / rai : 0;

  return (
    <article className="flex items-center gap-3 rounded-[16px] border border-[#eef1f4] bg-white p-3 shadow-[0_8px_22px_rgba(11,31,77,0.05)]">
      <div className="h-[72px] w-[88px] shrink-0 overflow-hidden rounded-[12px] bg-[#edf3f8]">
        {item.image ? <img src={item.image} alt="" className="h-full w-full object-cover" /> : null}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="font-manrope text-[10px] font-semibold uppercase tracking-[0.04em] text-[#e11d2e]">{item.badge ?? "ICON"}</span>
          <span className="font-manrope text-[11px] text-[#b0b7c0]">{item.id ?? "PH-1124"}</span>
        </div>
        <h3 className="mt-0.5 truncate font-manrope text-[14px] font-semibold leading-5 text-navy">{t(item.name ?? "Seaview Ridge Plot")}</h3>
        <p className="mt-0.5 inline-flex items-center gap-1 font-manrope text-[12px] text-[#8b939e]">
          <PinIcon />
          {item.region ?? "Phuket City"}
        </p>
        <p className="mt-0.5 font-manrope text-[12px] leading-4 text-[#e11d2e]">
          {rai} {t("Rai")} <span className="text-[#8b939e]">· ${rate.toFixed(2)} / {t("Rai")}</span>
        </p>
      </div>
      <div className="shrink-0 text-right">
        <strong className="block font-manrope text-[20px] font-semibold leading-6 text-[#1a1a1a]">${amount.toFixed(2)}</strong>
        <button type="button" onClick={onRemove} className="mt-1 font-manrope text-[12px] text-[#8b939e]">
          {t("Remove")}
        </button>
      </div>
    </article>
  );
}

function PinIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-3.5 w-3.5">
      <path d="M12 21s6-5.1 6-10a6 6 0 1 0-12 0c0 4.9 6 10 6 10Z" fill="none" stroke="currentColor" strokeWidth="1.7" />
      <circle cx="12" cy="11" r="1.8" fill="currentColor" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4">
      <path d="M12 3.5 19 6.2v5.3c0 4.2-2.8 7.2-7 8.9-4.2-1.7-7-4.7-7-8.9V6.2L12 3.5Z" fill="none" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.6" />
      <path d="m8.8 12.1 2.1 2.1 4.3-4.4" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.6" />
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
