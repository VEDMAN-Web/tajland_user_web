"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { DashboardNavbar } from "./DashboardNavbar";
import { useAuth } from "@/lib/hooks/useAuth";
import { routes } from "@/lib/constants/routes";
import { useDashboardLanguage } from "./DashboardLanguageContext";
import { useCart } from "@/modules/cart/hooks/useCart";
import type { CartItem } from "@/lib/api/cart.schemas";

export function CartPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { t } = useDashboardLanguage();
  const cart = useCart();
  const [couponInput, setCouponInput] = useState("");
  const [showCouponError, setShowCouponError] = useState(false);

  const progress = Math.min(100, (cart.totalRai / cart.minimumRai) * 100);

  async function handleClearAll() {
    if (!confirm("Remove all items from cart?")) return;
    const success = await cart.clearAllItems();
    if (success) {
      // Cart cleared successfully
    }
  }

  async function handleRemoveItem(plotId: string) {
    await cart.removeItem(plotId);
  }

  async function handleApplyCoupon() {
    if (!couponInput.trim()) return;
    setShowCouponError(false);
    
    const success = await cart.applyCouponCode(couponInput.trim());
    if (success) {
      setCouponInput("");
    } else {
      setShowCouponError(true);
    }
  }

  async function handleRemoveCoupon() {
    await cart.removeCouponCode();
  }

  async function handleCheckout() {
    // Validate first
    const isValid = await cart.validateCartForCheckout();
    if (!isValid) {
      alert(cart.error || "Cart validation failed");
      return;
    }

    // Proceed to checkout
    const orderId = await cart.checkout();
    if (orderId) {
      router.push(`${routes.purchases}?orderId=${orderId}`);
    }
  }

  if (authLoading || cart.isLoading)
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
          
          {/* Show error if any */}
          {cart.error && (
            <div className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-600">
              {cart.error}
            </div>
          )}
          
          {/* Show warning if cart has rai but no items (backend issue) */}
          {!cart.error && cart.items.length === 0 && cart.totalRai > 0 && (
            <div className="mt-3 rounded-lg bg-yellow-50 p-3 text-sm text-yellow-800">
              ⚠️ Cart has {cart.totalRai} Rai (${cart.totalPrice.toFixed(2)}) but items are not loading. 
              This is a backend issue - the GET /cart endpoint is not returning the items array.
            </div>
          )}
          
          {cart.items.length > 0 ? (
            <FilledCart
              items={cart.items}
              totalRai={cart.totalRai}
              total={cart.totalPrice}
              coupon={couponInput}
              setCoupon={setCouponInput}
              onClearAll={handleClearAll}
              onRemoveItem={handleRemoveItem}
              onApplyCoupon={handleApplyCoupon}
              onRemoveCoupon={handleRemoveCoupon}
              onCheckout={handleCheckout}
            />
          ) : (
            <EmptyCart />
          )}
        </section>
      </main>
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
  onRemoveItem,
  onApplyCoupon,
  onRemoveCoupon,
  onCheckout,
}: {
  items: CartItem[];
  totalRai: number;
  total: number;
  coupon: string;
  setCoupon: (value: string) => void;
  onClearAll: () => void;
  onRemoveItem: (plotId: string) => void;
  onApplyCoupon: () => void;
  onRemoveCoupon: () => void;
  onCheckout: () => void;
}) {
  return (
    <div className="mt-8 grid gap-8 lg:grid-cols-[1fr,400px]">
      {/* Cart Items */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-[18px] font-semibold">Items ({items.length})</h2>
          <button
            onClick={onClearAll}
            className="text-[12px] text-red-600 hover:underline"
          >
            Clear All
          </button>
        </div>

        <div className="space-y-4">
          {items.map((item, index) => (
            <div
              key={item.plotId || index}
              className="flex gap-4 rounded-lg border border-[#e5e7eb] bg-white p-4"
            >
              <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg bg-gray-100">
                <div className="flex h-full w-full items-center justify-center text-xs text-gray-400">
                  Plot Image
                </div>
              </div>

              <div className="flex-1">
                <h3 className="text-[14px] font-semibold">{item.plotId}</h3>
                <p className="mt-1 text-[12px] text-[#7b858f]">
                  {item.region} · {item.city}
                </p>
                <p className="mt-2 text-[12px] font-semibold">
                  {item.sizeRai} Rai · ${item.subtotal.toFixed(2)}
                </p>
              </div>

              <button
                onClick={() => onRemoveItem(item.plotId)}
                className="text-red-600 hover:text-red-700"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
                </svg>
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Summary */}
      <div>
        <div className="rounded-lg border border-[#e5e7eb] bg-white p-6">
          <h2 className="text-[18px] font-semibold">Order Summary</h2>

          <div className="mt-4 space-y-3">
            <div className="flex justify-between text-[14px]">
              <span>Total Rai</span>
              <span className="font-semibold">{totalRai} Rai</span>
            </div>
            <div className="flex justify-between text-[14px]">
              <span>Subtotal</span>
              <span>${total.toFixed(2)}</span>
            </div>
          </div>

          {/* Coupon */}
          <div className="mt-4">
            <input
              type="text"
              value={coupon}
              onChange={(e) => setCoupon(e.target.value)}
              placeholder="Coupon code"
              className="w-full rounded-lg border border-[#e5e7eb] px-4 py-2 text-[14px]"
            />
            <button
              onClick={onApplyCoupon}
              className="mt-2 w-full rounded-lg bg-gray-100 py-2 text-[14px] font-medium hover:bg-gray-200"
            >
              Apply Coupon
            </button>
          </div>

          <div className="mt-6 border-t border-[#e5e7eb] pt-4">
            <div className="flex justify-between text-[16px] font-semibold">
              <span>Total</span>
              <span>${total.toFixed(2)}</span>
            </div>
          </div>

          <button
            onClick={onCheckout}
            className="mt-6 w-full rounded-lg bg-navy py-3 text-[14px] font-semibold text-white hover:bg-navy/90"
          >
            Proceed to Checkout
          </button>
        </div>
      </div>
    </div>
  );
}

function EmptyCart() {
  return (
    <div className="mx-auto mt-16 max-w-md text-center">
      <div className="mb-6 flex justify-center">
        <div className="flex h-24 w-24 items-center justify-center rounded-full bg-navy/10">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-navy">
            <circle cx="9" cy="21" r="1"/>
            <circle cx="20" cy="21" r="1"/>
            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
          </svg>
        </div>
      </div>

      <h2 className="text-[20px] font-semibold text-navy">Your cart is empty</h2>
      <p className="mt-2 text-[14px] text-[#7b858f]">
        You haven't selected any plots yet. Explore Thailand and discover a place to add to your collection.
      </p>

      <div className="mt-8 flex justify-center gap-4">
        <Link
          href={routes.purchases}
          className="rounded-lg border border-navy px-6 py-3 text-[14px] font-medium text-navy hover:bg-navy/5"
        >
          My Purchase
        </Link>
        <Link
          href={routes.dashboardExplore}
          className="rounded-lg bg-navy px-6 py-3 text-[14px] font-medium text-white hover:bg-navy/90"
        >
          Explore Thailand →
        </Link>
      </div>
    </div>
  );
}
