/**
 * CartSummaryBar - Fixed bottom cart summary bar
 * Shows rai progress, total price, and View Cart button
 * Matches Figma design exactly
 */

"use client";

import { useRouter } from "next/navigation";
import { routes } from "@/lib/constants/routes";

type CartSummaryBarProps = {
  totalRai: number;
  minimumRai: number;
  totalPrice: number;
  itemCount: number;
  isMinimumReached: boolean;
};

export function CartSummaryBar({ 
  totalRai, 
  minimumRai, 
  totalPrice,
  itemCount,
  isMinimumReached,
}: CartSummaryBarProps) {
  const router = useRouter();
  const progressPercent = Math.min(100, (totalRai / minimumRai) * 100);

  // Don't show if cart is empty
  if (itemCount === 0) {
    return null;
  }

  const handleViewCart = () => {
    router.push(routes.cart);
  };

  return (
    <div className="fixed bottom-6 left-1/2 z-30 flex -translate-x-1/2 items-center gap-4 rounded-[20px] bg-white px-6 py-4 shadow-[0_8px_32px_rgba(11,31,77,0.16)]">
      {/* Progress Section */}
      <div className="flex items-center gap-3">
        {isMinimumReached ? (
          <>
            <div className="flex items-center gap-1.5 text-[12px] text-[#2cbf65]">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M20 6L9 17l-5-5"/>
              </svg>
              <span className="font-semibold">Minimum reached</span>
            </div>
            <div className="h-2 w-32 overflow-hidden rounded-full bg-[#2cbf65]" />
          </>
        ) : (
          <>
            <div className="text-[12px]">
              <span className="font-semibold text-brand-red">{totalRai} Rai</span>
              <span className="text-[#8f99a4]"> / {minimumRai} Rai</span>
            </div>
            <div className="h-2 w-32 overflow-hidden rounded-full bg-[#edf0f3]">
              <div 
                className="h-full bg-brand-red transition-all duration-300" 
                style={{ width: `${progressPercent}%` }} 
              />
            </div>
          </>
        )}
      </div>

      {/* Divider */}
      <div className="h-8 w-px bg-[#edf0f3]" />

      {/* Total Section */}
      <div className="flex items-center gap-2">
        <div className="text-right">
          <p className="text-[9px] text-[#8f99a4]">Total</p>
          <p className="text-[18px] font-bold leading-none text-navy">
            ${totalPrice.toFixed(2)}
          </p>
        </div>

        {/* View Cart Button */}
        <button
          onClick={handleViewCart}
          className="flex items-center gap-2 rounded-[12px] bg-[#0b1f4d] px-5 py-3 text-[13px] font-medium text-white transition-colors hover:bg-[#0b1f4d]/90"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="9" cy="21" r="1"/>
            <circle cx="20" cy="21" r="1"/>
            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
          </svg>
          View Cart
          {itemCount > 0 && (
            <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-brand-red px-1.5 text-[10px] font-semibold">
              {itemCount}
            </span>
          )}
        </button>
      </div>
    </div>
  );
}
