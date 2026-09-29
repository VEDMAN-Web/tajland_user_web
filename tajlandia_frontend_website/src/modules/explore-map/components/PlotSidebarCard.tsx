/**
 * PlotSidebarCard - Desktop sidebar matching Figma design exactly
 */

"use client";

import { useEffect, useState } from "react";
import type { PlotDetail, PlotEligibilityData } from "@/lib/api/explore.schemas";
import { checkPlotEligibility, fetchPlotDetail } from "../services/explore.service";
import { isBrowserApiError } from "@/lib/api/client.browser";

type PlotSidebarCardProps = {
  plotId: string | null;
  onClose: () => void;
  onAddToCart?: (plotId: string) => void;
  cartRai?: number;
  minimumRai?: number;
  isInCart?: boolean;
};

export function PlotSidebarCard({ 
  plotId, 
  onClose, 
  onAddToCart,
  cartRai = 0,
  minimumRai = 100,
  isInCart = false,
}: PlotSidebarCardProps) {
  const [plot, setPlot] = useState<PlotDetail | null>(null);
  const [eligibility, setEligibility] = useState<PlotEligibilityData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!plotId) {
      setPlot(null);
      setEligibility(null);
      setError(null);
      return;
    }

    let mounted = true;
    setIsLoading(true);
    setError(null);

    Promise.all([fetchPlotDetail(plotId), checkPlotEligibility(plotId)])
      .then(([plotData, eligibilityData]) => {
        if (!mounted) return;
        setPlot(plotData);
        setEligibility(eligibilityData);
      })
      .catch((err) => {
        if (!mounted) return;
        setError(isBrowserApiError(err) ? err.message : "Failed to load plot details");
      })
      .finally(() => {
        if (mounted) setIsLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [plotId]);

  if (!plotId) return null;

  const minimumReached = cartRai >= minimumRai;
  const progressPercent = Math.min(100, (cartRai / minimumRai) * 100);
  
  const pricePerRaiUSD = plot?.pricePerRai 
    ? (plot.currency === "THB" ? plot.pricePerRai / 35 : plot.pricePerRai)
    : 0;
  const totalPriceUSD = plot?.totalPrice 
    ? (plot.currency === "THB" ? plot.totalPrice / 35 : plot.totalPrice)
    : 0;

  // Determine actual cart status from plot data (backend source of truth)
  const actualIsInCart = plot?.isInCart || isInCart;
  const canAddToCart = !actualIsInCart && plot?.status === "AVAILABLE" && eligibility?.eligible;
  const isLocked = plot?.status === "LOCKED";
  const isReserved = plot?.status === "CLAIMED" || plot?.status === "SOLD";
  const isOwned = plot?.isOwned;

  return (
    <div className="w-[334px] overflow-hidden rounded-[18px] bg-white shadow-[0_5px_24px_rgba(11,31,77,0.08)]">
      {isLoading ? (
        <div className="p-8 text-center text-[11px] text-gray-500">Loading...</div>
      ) : error ? (
        <div className="p-8 text-center">
          <p className="text-[11px] text-red-600">{error}</p>
          <button onClick={onClose} className="mt-3 text-[11px] font-medium text-navy underline">
            Close
          </button>
        </div>
      ) : plot ? (
        <>
          {/* Image with status badge */}
          {plot.imageUrl && (
            <div className="relative h-[170px]">
              <img 
                src={plot.imageUrl} 
                alt={plot.name || "Plot"} 
                className="h-full w-full object-cover"
                onError={(e) => {
                  // Prevent infinite loop - only replace once
                  if (e.currentTarget.src !== plot.imageUrl) return;
                  e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"%3E%3Crect fill="%23f3f4f6" width="400" height="300"/%3E%3Ctext x="50%25" y="50%25" font-family="Arial" font-size="14" fill="%239ca3af" text-anchor="middle" dominant-baseline="middle"%3ENo Image Available%3C/text%3E%3C/svg%3E';
                }}
              />
              
              {/* Previous/Next buttons */}
              <button className="absolute left-3 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full bg-black/30 text-white hover:bg-black/50">
                ‹
              </button>
              <button className="absolute right-3 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full bg-black/30 text-white hover:bg-black/50">
                ›
              </button>

              {/* Status badge */}
              <div className="absolute right-3 top-3">
                {plot.status === "AVAILABLE" && (
                  <span className="rounded bg-[#d4f4e6] px-2.5 py-1 text-[9px] font-medium uppercase tracking-wide text-[#107042]">
                    AVAILABLE
                  </span>
                )}
                {plot.status === "LOCKED" && (
                  <span className="rounded bg-[#fef3e6] px-2.5 py-1 text-[9px] font-medium uppercase tracking-wide text-[#d4a418]">
                    LOCKED
                  </span>
                )}
                {(plot.status === "CLAIMED" || plot.status === "SOLD") && (
                  <span className="rounded bg-[#fee6e6] px-2.5 py-1 text-[9px] font-medium uppercase tracking-wide text-[#d42418]">
                    RESERVED
                  </span>
                )}
              </div>
            </div>
          )}

          <div className="p-5">
            {/* Header */}
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-medium text-[#8f99a4]">{plot.plotNumber || plot.id}</span>
              <span className="rounded bg-[#fef7e6] px-2 py-0.5 text-[9px] font-medium uppercase tracking-wide text-[#d4a418]">
                ICON
              </span>
              <button onClick={onClose} className="ml-auto text-gray-400 hover:text-gray-600" aria-label="Share">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="18" cy="5" r="3" />
                  <circle cx="6" cy="12" r="3" />
                  <circle cx="18" cy="19" r="3" />
                  <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                  <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                </svg>
              </button>
            </div>

            <h2 className="mt-1.5 text-[19px] font-semibold leading-tight text-[#171717]">
              {plot.name || "Unnamed Plot"}
            </h2>

            <p className="mt-1 flex items-center gap-1.5 text-[11px] text-[#8f99a4]">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
              </svg>
              {plot.location?.name || "Unknown"}, {plot.region?.name || "Thailand"} · Icon Zone 03
            </p>

            <p className="mt-0.5 text-[9px] text-[#b0b7be]">7°53&apos;17.4&quot;N 98°23&apos;51.2&quot;E</p>

            <button className="mt-2 flex items-center gap-1 text-[11px] font-medium text-navy hover:underline">
              Focus Plot
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </button>

            {/* Owner info (if reserved) */}
            {isReserved && (
              <>
                <div className="mt-4 flex items-center gap-2.5 rounded-lg bg-[#f7fafc] p-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#7c3aed] text-[12px] font-medium text-white">
                    RC
                  </div>
                  <div>
                    <p className="text-[9px] text-[#8f99a4]">OWNED BY</p>
                    <p className="text-[12px] font-semibold text-navy">Rachel C.</p>
                  </div>
                </div>
                <p className="mt-2 text-[9px] text-[#8f99a4]">Deed 17, 2026 · #854</p>
                <button className="mt-2 flex items-center gap-1 text-[11px] font-medium text-navy hover:underline">
                  View Public Certificate
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M5 12h14M12 5l7 7-7 7"/>
                  </svg>
                </button>
              </>
            )}

            {/* Details table */}
            <div className="mt-4 space-y-3 border-t border-[#edf0f3] pt-4">
              <div className="flex justify-between text-[11px]">
                <span className="text-[#8f99a4]">Size</span>
                <span className="font-semibold text-brand-red">
                  {plot.sizeRai} Rai <span className="text-[9px] font-normal text-[#8f99a4]">(40,000 Sqm)</span>
                </span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span className="text-[#8f99a4]">Rate</span>
                <span className="font-semibold text-brand-red">
                  ${pricePerRaiUSD.toFixed(2)} <span className="text-[9px] font-normal text-[#8f99a4]">/ Per Rai</span>
                </span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span className="text-[#8f99a4]">Zone Type</span>
                <span className="font-semibold text-navy">Standard</span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span className="text-[#8f99a4]">Near By</span>
                <span className="font-semibold text-navy">Kathu</span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span className="text-[#8f99a4]">Cadastre status</span>
                <span className="flex items-center gap-1.5 font-semibold text-[#2cbf65]">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#2cbf65]" />
                  Available
                </span>
              </div>
            </div>

            {/* Total investment */}
            <div className="mt-5 border-t border-[#edf0f3] pt-5">
              <p className="text-[13px] text-[#8f99a4]">Total Investment</p>
              <p className="mt-1 text-[36px] font-bold leading-none text-[#171717]">
                ${totalPriceUSD.toFixed(2)}
              </p>
            </div>

            {/* Cart progress (if in cart) */}
            {actualIsInCart && (
              <div className="mt-4">
                {minimumReached ? (
                  <div className="flex items-center gap-2 text-[11px]">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2cbf65" strokeWidth="2.5">
                      <path d="M20 6L9 17l-5-5"/>
                    </svg>
                    <span className="text-[#2cbf65]">Minimum rai reached</span>
                    <span className="ml-auto font-semibold text-navy">Total: ${totalPriceUSD.toFixed(2)}</span>
                  </div>
                ) : (
                  <>
                    <div className="flex justify-between text-[11px]">
                      <span className="text-[#8f99a4]">{cartRai} Rai / {minimumRai} Rai</span>
                      <span className="font-semibold text-navy">Total: ${totalPriceUSD.toFixed(2)}</span>
                    </div>
                    <div className="mt-2 h-1 overflow-hidden rounded-full bg-[#edf0f3]">
                      <div className="h-full bg-brand-red transition-all" style={{ width: `${progressPercent}%` }} />
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Action button */}
            <div className="mt-5">
              {canAddToCart && onAddToCart ? (
                <button
                  onClick={() => onAddToCart(plot.id)}
                  className="flex w-full items-center justify-center gap-2 rounded-[9px] bg-[#0b1f4d] px-4 py-3.5 text-[13px] font-medium text-white hover:bg-[#0b1f4d]/90"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="9" cy="21" r="1"/>
                    <circle cx="20" cy="21" r="1"/>
                    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
                  </svg>
                  Add to Cart
                </button>
              ) : actualIsInCart ? (
                <>
                  <button className="w-full rounded-[9px] bg-[#0b1f4d] px-4 py-3.5 text-[13px] font-medium text-white hover:bg-[#0b1f4d]/90">
                    View Cart →
                  </button>
                  <button className="mt-2 w-full text-[11px] font-medium text-brand-red hover:underline">
                    Remove
                  </button>
                </>
              ) : isLocked ? (
                <button disabled className="w-full rounded-[9px] bg-[#edf0f3] px-4 py-3.5 text-[13px] font-medium text-[#8f99a4]">
                  🔒 Locked
                </button>
              ) : isReserved ? (
                <button disabled className="w-full rounded-[9px] bg-[#edf0f3] px-4 py-3.5 text-[13px] font-medium text-[#8f99a4]">
                  🔒 Already reserved
                </button>
              ) : isOwned ? (
                <button className="w-full rounded-[9px] bg-[#edf0f3] px-4 py-3.5 text-[13px] font-medium text-navy hover:bg-[#e5e9ed]">
                  View Certificate →
                </button>
              ) : null}
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
