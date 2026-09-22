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

const initialCart: CartItem[] = [25, 25, 25, 25].map((rai, index) => ({
  id: `PH-${1024 + index}`,
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
  const [showSelectionProgress, setShowSelectionProgress] = useState(true);
  const totalRai = cartItems.reduce(
    (total, item) => total + (typeof item.rai === "number" ? item.rai : 0),
    0,
  );
  const total = cartItems.reduce(
    (sum, item) => sum + (typeof item.amount === "number" ? item.amount : 0),
    0,
  );
  const progress = Math.min(100, (totalRai / 100) * 100);

  function clearAll() {
    setCartItems(initialCart);
    setShowSelectionProgress(false);
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
    <div className="min-h-[100svh] bg-[#f7fafc] text-navy">
      <DashboardNavbar active="none" />
      <main className="mx-auto w-[92%] max-w-none px-5 pb-16 pt-12 sm:px-8 sm:pt-14">
        <section>
          <h1 className="text-[24px] font-semibold tracking-[-0.04em] text-[#171717] sm:text-[26px]">
            {t("Your Cart")}
          </h1>
          <p className="mt-1 text-[12px] text-[#7b858f]">
            {t("Review your selected plots before checkout.")}
          </p>
          {cartItems.length ? (
            <FilledCart
              items={cartItems}
              totalRai={totalRai}
              total={total}
              progress={progress}
              showSelectionProgress={showSelectionProgress}
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
  progress,
  showSelectionProgress,
  coupon,
  setCoupon,
  onClearAll,
  onRemove,
}: {
  items: CartItem[];
  totalRai: number;
  total: number;
  progress: number;
  showSelectionProgress: boolean;
  coupon: string;
  setCoupon: (value: string) => void;
  onClearAll: () => void;
  onRemove: (index: number) => void;
}) {
  return (
    <div className="mt-5">
      {showSelectionProgress ? (
        <section className="rounded-[15px] bg-white p-5 shadow-[0_5px_24px_rgba(11,31,77,0.08)]">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-[14px] font-semibold text-navy">
                ◉ Complete your selection
              </h2>
              <p className="mt-1 text-[10px] text-[#b0b7be]">
                You need 100 Rai minimum to continue buying plots and payment.
              </p>
            </div>
            <p className="text-[12px] text-[#8f99a4]">
              <strong className="text-[17px] text-navy">{totalRai}</strong> / 100 Rai
            </p>
          </div>
          <div className="mt-3 flex items-center justify-between text-[12px] text-[#242b32]">
            <span>
              {items.length} Plot{items.length === 1 ? "" : "s"}
            </span>
            <strong>Total: ${total.toFixed(2)}</strong>
          </div>
          <div className="mt-2 h-1 rounded-full bg-[#e5e9ed]">
            <div
              className="h-1 rounded-full bg-brand-red"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="mt-2 text-[10px] text-[#7b858f]">
            {Math.max(0, 100 - totalRai)} Rai more to reach minimum
          </p>
          <p className="mt-1 text-right text-[9px] text-[#8f99a4]">
            <strong className="text-navy">NEXT STEP:</strong> Select parcels from any
            province zone to unlock settlement.
          </p>
        </section>
      ) : null}
      <div
        className={`${showSelectionProgress ? "mt-6" : "mt-2"} grid gap-5 lg:grid-cols-[minmax(0,1fr)_280px]`}
      >
        <section>
          <h2 className="text-[17px] font-semibold text-[#171717]">Selected Plots</h2>
          <div className="mt-2 flex justify-end">
            <button
              type="button"
              onClick={onClearAll}
              className="text-[10px] text-[#8f99a4] underline underline-offset-2"
            >
              Clear All
            </button>
          </div>
          <div className="mt-2 space-y-2">
            {items.map((item, index) => (
              <CartItemCard
                key={item.id ?? index}
                item={item}
                onRemove={() => onRemove(index)}
              />
            ))}
          </div>
          <div className="mt-3 flex items-center justify-between gap-4 rounded-[12px] border border-dashed border-[#d7e0e7] bg-white p-4">
            <div>
              <h3 className="text-[12px] font-semibold text-navy">
                Add more places to reach the 100 Rai threshold
              </h3>
              <p className="mt-1 text-[9px] text-[#8f99a4]">
                Unlock deed recertification and transactional inscription by selecting 25
                additional Rai.
              </p>
            </div>
            <Link
              href={routes.dashboardExplore}
              className="shrink-0 rounded-[9px] bg-navy px-4 py-3 text-[10px] text-white"
            >
              Explore Thailand →
            </Link>
          </div>
        </section>
        <aside>
          <div className="flex gap-2">
            <input
              value={coupon}
              onChange={(event) => setCoupon(event.target.value)}
              placeholder="Enter Code"
              className="h-11 min-w-0 flex-1 rounded-[9px] border border-[#e3e8ed] bg-white px-3 text-[10px] outline-none"
            />
            <button
              type="button"
              className="h-11 rounded-[9px] bg-navy px-5 text-[11px] text-white"
            >
              Apply
            </button>
          </div>
          <div className="mt-3 rounded-[12px] bg-white p-4 shadow-[0_5px_18px_rgba(11,31,77,0.06)]">
            <h2 className="text-[17px] font-semibold text-[#242b32]">Order Summary</h2>
            <div className="mt-4 space-y-2 text-[11px] text-[#8f99a4]">
              <p className="flex justify-between">
                <span>Plots</span>
                <strong className="text-navy">{items.length}</strong>
              </p>
              <p className="flex justify-between">
                <span>Total Rai</span>
                <strong className="text-brand-red">{totalRai}</strong>
              </p>
            </div>
            <div className="my-4 border-t border-[#e8edf1]" />
            <p className="flex justify-between text-[11px] text-[#8f99a4]">
              <span>Subtotal</span>
              <strong>${total.toFixed(2)}</strong>
            </p>
            <p className="mt-3 flex justify-between border-t border-[#e8edf1] pt-3 text-[12px] text-[#8f99a4]">
              <span>Total</span>
              <strong className="text-[21px] text-[#171717]">${total.toFixed(2)}</strong>
            </p>
            <button
              type="button"
              disabled={totalRai < 100}
              className="mt-5 h-10 w-full rounded-[9px] bg-[#d3d3d3] text-[11px] text-white disabled:cursor-not-allowed"
            >
              Proceed to checkout →
            </button>
            <Link
              href={routes.dashboardExplore}
              className="mt-2 flex h-9 items-center justify-center rounded-[9px] border border-[#e3e8ed] text-[10px] text-[#242b32]"
            >
              Continue Exploring
            </Link>
            {totalRai < 100 ? (
              <p className="mt-4 text-center text-[9px] text-brand-red">
                △ Requires {100 - totalRai} more Rai to activate checkout
              </p>
            ) : null}
          </div>
        </aside>
      </div>
    </div>
  );
}

function CartItemCard({ item, onRemove }: { item: CartItem; onRemove: () => void }) {
  return (
    <article className="flex items-center gap-3 rounded-[12px] bg-white p-3 shadow-[0_5px_18px_rgba(11,31,77,0.06)]">
      <div className="h-16 w-16 shrink-0 overflow-hidden rounded-[9px] bg-[#edf3f8]">
        {item.image ? (
          <img src={item.image} alt="" className="h-full w-full object-cover" />
        ) : null}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="rounded bg-[#fff4c6] px-1.5 py-0.5 text-[8px] text-[#c19a16]">
            {item.badge ?? "PLOT"}
          </span>
          <span className="text-[8px] text-[#aab2bd]">{item.id ?? "TJ-0000"}</span>
        </div>
        <h3 className="truncate text-[12px] font-semibold text-navy">
          {item.name ?? "Selected Plot"}
        </h3>
        <p className="text-[9px] text-[#8f99a4]">◉ {item.region ?? "Thailand"}</p>
        <p className="mt-1 text-[9px] text-brand-red">
          {item.rai ?? 0} Rai{" "}
          <span className="text-[#8f99a4]">· ${(item.amount ?? 0).toFixed(2)} / Rai</span>
        </p>
      </div>
      <div className="text-right">
        <strong className="text-[21px] text-[#171717]">
          ${(item.amount ?? 0).toFixed(2)}
        </strong>
        <button
          type="button"
          onClick={onRemove}
          className="mt-2 block w-full text-[9px] text-[#7b858f]"
        >
          ▥ Remove
        </button>
      </div>
    </article>
  );
}
