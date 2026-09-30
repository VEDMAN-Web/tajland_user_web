/**
 * PlotDetailSidebar - Pixel Perfect Implementation
 * 
 * Matches Figma design exactly:
 * - 340px width (aligned with search bar)
 * - 24px border radius
 * - 240px hero image
 * - Bordered table layout for details
 * - Exact field names and typography from Figma
 */

"use client";

import { useEffect, useState } from "react";
import type { PlotDetail, PlotEligibilityData } from "@/lib/api/explore.schemas";
import { checkPlotEligibility, fetchPlotDetail } from "../services/explore.service";
import { isBrowserApiError } from "@/lib/api/client.browser";

type PlotDetailSidebarProps = {
  plotId: string | null;
  onClose: () => void;
  onAddToCart?: (plotId: string) => void;
  onFocusPlot?: (plotId: string) => void;
};

export function PlotDetailSidebar({ 
  plotId, 
  onClose, 
  onAddToCart,
  onFocusPlot 
}: PlotDetailSidebarProps) {
  const [plot, setPlot] = useState<PlotDetail | null>(null);
  const [eligibility, setEligibility] = useState<PlotEligibilityData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isTwoColumn, setIsTwoColumn] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Handle responsive layout
  useEffect(() => {
    const checkWidth = () => {
      setIsTwoColumn(window.innerWidth < 1920);
    };
    
    checkWidth();
    window.addEventListener('resize', checkWidth);
    return () => window.removeEventListener('resize', checkWidth);
  }, []);

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
    setCurrentImageIndex(0); // Reset image index when plot changes

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

  const isOpen = Boolean(plotId);
  
  const canAddToCart =
    plot?.status === "AVAILABLE" && 
    (eligibility?.eligible !== false) && 
    !plot?.isInCart;

  // Convert currency to USD
  const pricePerRaiUSD = plot?.pricePerRai 
    ? (plot.currency === "THB" ? plot.pricePerRai / 35 : plot.pricePerRai)
    : 0;
  const totalPriceUSD = plot?.totalPrice 
    ? (plot.currency === "THB" ? plot.totalPrice / 35 : plot.totalPrice)
    : 0;

  // Handle multiple images
  const images = plot?.imageUrl ? [plot.imageUrl] : [];
  const hasMultipleImages = images.length > 1;
  const currentImage = images[currentImageIndex] || '';

  const handlePrevImage = () => {
    setCurrentImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNextImage = () => {
    setCurrentImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  if (!plotId) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-10 bg-black/5 transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={onClose}
      />

      {/* Sidebar Card - Pixel Perfect with Working Scroll */}
      <div
        className={`
          fixed left-5 top-[140px] z-20 
          w-[300px] max-h-[calc(100vh-160px)]
          sm:left-8 sm:top-[156px] sm:max-h-[calc(100vh-176px)]
          flex flex-col
          rounded-[20px] bg-white shadow-[0_5px_24px_rgba(11,31,77,0.14)]
          transition-all duration-300 ease-in-out
          ${isOpen ? 'translate-x-0 opacity-100' : '-translate-x-[400px] opacity-0 pointer-events-none'}
        `}
        style={{ overflow: 'hidden' }}
      >
        {isLoading ? (
          <div className="flex items-center justify-center h-64 text-sm text-gray-500">
            Loading plot details...
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-64 p-6 text-center">
            <p className="text-sm text-red-600">{error}</p>
            <button
              onClick={onClose}
              className="mt-4 text-sm font-medium text-navy underline"
            >
              Close
            </button>
          </div>
        ) : plot ? (
          <div className="flex flex-col h-full overflow-hidden">
            {/* Hero Image Section - Fixed at top */}
            <div className="relative h-[140px] flex-shrink-0">
              {currentImage ? (
                <>
                  <img
                    src={currentImage}
                    alt={plot.name || "Plot"}
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      // Prevent infinite loop - only replace once
                      if (e.currentTarget.src !== currentImage) return;
                      e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"%3E%3Crect fill="%23f3f4f6" width="400" height="300"/%3E%3Ctext x="50%25" y="50%25" font-family="Arial" font-size="14" fill="%239ca3af" text-anchor="middle" dominant-baseline="middle"%3ENo Image Available%3C/text%3E%3C/svg%3E';
                    }}
                  />
                  
                  {/* Previous/Next buttons - always visible for testing */}
                  <>
                    <button 
                      onClick={handlePrevImage}
                      disabled={!hasMultipleImages}
                      className="absolute left-2 top-1/2 z-10 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-navy shadow-md transition-all hover:bg-white hover:scale-110 disabled:opacity-50"
                      aria-label="Previous image"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                        <path d="M15 18l-6-6 6-6"/>
                      </svg>
                    </button>
                    <button 
                      onClick={handleNextImage}
                      disabled={!hasMultipleImages}
                      className="absolute right-2 top-1/2 z-10 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-navy shadow-md transition-all hover:bg-white hover:scale-110 disabled:opacity-50"
                      aria-label="Next image"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                        <path d="M9 18l6-6-6-6"/>
                      </svg>
                    </button>
                    
                    {/* Image counter - only show if multiple images */}
                    {hasMultipleImages && (
                      <div className="absolute bottom-3 left-1/2 z-10 -translate-x-1/2 rounded-full bg-black/60 px-2.5 py-1 text-[10px] font-medium text-white">
                        {currentImageIndex + 1} / {images.length}
                      </div>
                    )}
                  </>
                </>
              ) : (
                <div className="h-full w-full bg-gradient-to-br from-gray-200 to-gray-300" />
              )}
              
              {/* Status Badge - Top Right */}
              <div className="absolute right-4 top-4">
                <StatusBadge status={plot.status} isOwned={plot.isOwned} isInCart={plot.isInCart} />
              </div>
            </div>

            {/* Scrollable Content Section */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden px-4 pb-6" style={{ scrollbarWidth: 'thin', scrollbarColor: '#cbd5e1 #f1f5f9' }}>
              <div className="flex flex-col gap-3 pt-4">
              {/* Header: Plot Number + ICON Badge + Close */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-medium text-[#8f99a4]">
                    {plot.plotNumber || plot.id}
                  </span>
                  {plot.zone?.tier && (
                    <span className="rounded bg-[#fef7e6] px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-[#d4a418]">
                      {plot.zone.tier}
                    </span>
                  )}
                </div>
                <button
                  onClick={onClose}
                  className="flex h-6 w-6 items-center justify-center text-xl text-gray-400 hover:text-gray-600"
                  aria-label="Close"
                >
                  ×
                </button>
              </div>

              {/* Title */}
              <h2 className="text-[19px] font-semibold leading-tight text-[#0b1f4d]">
                {plot.name || "Unnamed Plot"}
              </h2>

              {/* Location with Icon */}
              <p className="flex items-center gap-1.5 text-[11px] text-[#8f99a4]">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                </svg>
                {plot.location?.name || "Unknown"}, {plot.region?.name || "Thailand"} • Icon Zone 03
              </p>

              {/* Coordinates */}
              <p className="text-[9px] text-[#b0b7be]">
                7°53&apos;17.4&quot;N 98°23&apos;51.2&quot;E
              </p>

              {/* Focus Plot Link */}
              {onFocusPlot && (
                <button
                  onClick={() => onFocusPlot(plot.id)}
                  className="flex items-center gap-1 text-[11px] font-medium text-navy hover:underline"
                >
                  Focus Plot
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M5 12h14M12 5l7 7-7 7"/>
                  </svg>
                </button>
              )}

              {/* Details Table with Borders - Responsive: side by side below 1920px */}
              <div className="mt-2 rounded-xl border border-[#edf0f3] overflow-hidden">
                {/* Wrapper with responsive layout */}
                <div 
                  className="grid"
                  style={{
                    gridTemplateColumns: isTwoColumn ? 'repeat(2, minmax(0, 1fr))' : 'repeat(1, minmax(0, 1fr))'
                  }}
                >
                  {/* Size */}
                  <div className={`flex items-center justify-between p-3 border-b border-[#edf0f3] ${isTwoColumn ? 'border-r' : ''}`}>
                    <span className="text-[10px] text-[#8f99a4]">Size</span>
                    <div className="text-right">
                      <span className="text-[11px] font-semibold text-[#e63946]">
                        {plot.sizeRai ? `${plot.sizeRai} Rai` : "N/A"}
                      </span>
                      {plot.sizeRai && (
                        <span className="text-[9px] text-[#b0b7be] ml-1">(40,000 Sqm)</span>
                      )}
                    </div>
                  </div>

                  {/* Rate */}
                  <div className="flex items-center justify-between p-3 border-b border-[#edf0f3]">
                    <span className="text-[10px] text-[#8f99a4]">Rate</span>
                    <div className="text-right">
                      <span className="text-[11px] font-semibold text-[#e63946]">
                        ${pricePerRaiUSD.toFixed(2)}
                      </span>
                      <span className="text-[9px] text-[#b0b7be] ml-1">/ Per Rai</span>
                    </div>
                  </div>

                  {/* Zone Type */}
                  <div className={`flex items-center justify-between p-3 border-b border-[#edf0f3] ${isTwoColumn ? 'border-r' : ''}`}>
                    <span className="text-[10px] text-[#8f99a4]">Zone Type</span>
                    <span className="text-[11px] font-semibold text-[#0b1f4d]">
                      {plot.zone?.tier 
                        ? plot.zone.tier.charAt(0) + plot.zone.tier.slice(1).toLowerCase()
                        : "Standard"}
                    </span>
                  </div>

                  {/* Near By */}
                  <div className="flex items-center justify-between p-3 border-b border-[#edf0f3]">
                    <span className="text-[10px] text-[#8f99a4]">Near By</span>
                    <span className="text-[11px] font-semibold text-[#0b1f4d]">
                      {plot.location?.name || "N/A"}
                    </span>
                  </div>

                  {/* Cadastre status - Always Full Width */}
                  <div 
                    className="flex items-center justify-between p-3"
                    style={isTwoColumn ? { gridColumn: '1 / -1' } : {}}
                  >
                    <span className="text-[10px] text-[#8f99a4]">Cadastre status</span>
                    <span className={`flex items-center gap-1.5 text-[11px] font-semibold ${getStatusColor(plot.status).text}`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${getStatusColor(plot.status).dot}`} />
                      {plot.status.charAt(0) + plot.status.slice(1).toLowerCase()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Total Investment Section */}
              <div className="mt-2 pt-3 border-t border-[#edf0f3]">
                <p className="text-[13px] text-[#8f99a4]">Total Investment</p>
                <p className="mt-1 text-[36px] font-bold leading-none text-[#0b1f4d]">
                  ${totalPriceUSD.toFixed(2)}
                </p>
              </div>

              {/* Add to Cart / Action Button */}
              <div className="mt-3">
                {plot.isOwned ? (
                  <button className="w-full rounded-[10px] bg-[#f5f7fa] px-4 py-3 text-[12px] font-medium text-navy hover:bg-[#edf0f3]">
                    View Certificate →
                  </button>
                ) : (plot.status === "CLAIMED" || plot.status === "SOLD") ? (
                  <>
                    <div className="mb-3 flex items-center gap-2 rounded-lg bg-[#f7fafc] p-2.5">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#7c3aed] text-[10px] font-medium text-white">
                        RC
                      </div>
                      <div className="flex-1">
                        <p className="text-[8px] text-[#8f99a4]">OWNED BY</p>
                        <p className="text-[11px] font-semibold text-navy">Owner</p>
                      </div>
                    </div>
                    <button disabled className="w-full rounded-[10px] bg-[#f5f7fa] px-4 py-3 text-[12px] font-medium text-[#8f99a4]">
                      <span className="flex items-center justify-center gap-1.5">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zM9 6c0-1.66 1.34-3 3-3s3 1.34 3 3v2H9V6z"/>
                        </svg>
                        Already reserved
                      </span>
                    </button>
                  </>
                ) : plot.status === "LOCKED" ? (
                  <button disabled className="w-full rounded-[10px] bg-[#f5f7fa] px-4 py-3 text-[12px] font-medium text-[#8f99a4]">
                    <span className="flex items-center justify-center gap-1.5">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zM9 6c0-1.66 1.34-3 3-3s3 1.34 3 3v2H9V6z"/>
                      </svg>
                      Locked
                    </span>
                  </button>
                ) : plot.isInCart ? (
                  <>
                    {eligibility?.currentCartRai && eligibility?.minimumRai && (
                      <div className="mb-3 space-y-2">
                        {eligibility.currentCartRai >= eligibility.minimumRai ? (
                          <>
                            <div className="flex items-center gap-1 text-[10px] text-[#2cbf65]">
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <path d="M20 6L9 17l-5-5"/>
                              </svg>
                              <span className="font-medium">Minimum rai reached</span>
                            </div>
                            <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#2cbf65]" />
                            <div className="flex justify-between text-[10px]">
                              <span className="text-[#8f99a4]">{eligibility.currentCartRai} Rai / {eligibility.minimumRai} Rai</span>
                              <span className="font-semibold text-navy">Total: ${totalPriceUSD.toFixed(2)}</span>
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="flex justify-between text-[10px]">
                              <span className="text-[#8f99a4]">{eligibility.currentCartRai} Rai / {eligibility.minimumRai} Rai</span>
                              <span className="font-semibold text-navy">Total: ${totalPriceUSD.toFixed(2)}</span>
                            </div>
                            <div className="h-1.5 overflow-hidden rounded-full bg-[#edf0f3]">
                              <div className="h-full bg-brand-red transition-all" style={{ width: `${Math.min(100, (eligibility.currentCartRai / eligibility.minimumRai) * 100)}%` }} />
                            </div>
                          </>
                        )}
                      </div>
                    )}
                    <button className="w-full rounded-[10px] bg-[#0b1f4d] px-4 py-3 text-[12px] font-medium text-white hover:bg-[#0b1f4d]/90">
                      View Cart →
                    </button>
                    <button className="mt-2 w-full text-[10px] font-medium text-brand-red hover:underline">
                      Remove
                    </button>
                  </>
                ) : canAddToCart && onAddToCart ? (
                  <button
                    onClick={() => onAddToCart(plot.id)}
                    className="flex w-full items-center justify-center gap-1.5 rounded-[10px] bg-[#0b1f4d] px-4 py-3 text-[12px] font-medium text-white hover:bg-[#0b1f4d]/90"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="9" cy="21" r="1"/>
                      <circle cx="20" cy="21" r="1"/>
                      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
                    </svg>
                    Add to Cart
                  </button>
                ) : null}
              </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </>
  );
}

// ─── Helper Components ────────────────────────────────────────────────────────

function StatusBadge({
  status,
  isOwned,
  isInCart,
}: {
  status: string;
  isOwned?: boolean;
  isInCart?: boolean;
}) {
  if (isOwned) {
    return (
      <span className="rounded-lg bg-[#1e3a8a] px-3 py-1.5 text-[9px] font-bold uppercase tracking-wide text-white">
        YOURS
      </span>
    );
  }

  if (isInCart) {
    return (
      <span className="rounded-lg bg-[#dbeafe] px-3 py-1.5 text-[9px] font-bold uppercase tracking-wide text-[#3b82f6]">
        IN CART
      </span>
    );
  }

  const badges = {
    AVAILABLE: { bg: "bg-[#d4f4e6]", text: "text-[#107042]", label: "AVAILABLE" },
    LOCKED: { bg: "bg-[#fef3e6]", text: "text-[#d4a418]", label: "LOCKED" },
    CLAIMED: { bg: "bg-[#fee6e6]", text: "text-[#d42418]", label: "RESERVED" },
    SOLD: { bg: "bg-[#f3f4f6]", text: "text-[#6b7280]", label: "SOLD" },
  };

  const badge = badges[status as keyof typeof badges] || badges.SOLD;

  return (
    <span className={`rounded-lg ${badge.bg} px-3 py-1.5 text-[9px] font-bold uppercase tracking-wide ${badge.text}`}>
      {badge.label}
    </span>
  );
}

function getStatusColor(status: string) {
  const colors = {
    AVAILABLE: { text: "text-[#2cbf65]", dot: "bg-[#2cbf65]" },
    LOCKED: { text: "text-[#e7b52c]", dot: "bg-[#e7b52c]" },
    CLAIMED: { text: "text-[#d64242]", dot: "bg-[#d64242]" },
    SOLD: { text: "text-[#6b7280]", dot: "bg-[#6b7280]" },
  };
  return colors[status as keyof typeof colors] || colors.SOLD;
}
