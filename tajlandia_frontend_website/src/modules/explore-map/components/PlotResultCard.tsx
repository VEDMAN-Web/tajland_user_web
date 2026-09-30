/**
 * PlotResultCard - Plot card for search results dropdown
 * Matches Figma design exactly with status-based UI
 */

"use client";

import { useState } from "react";
import type { PlotListItem } from "@/lib/api/explore.schemas";

type PlotResultCardProps = {
  plot: PlotListItem;
  onAddToCart?: (plotId: string) => void;
  onViewDeed?: (plotId: string) => void;
  onPlotClick?: (plotId: string) => void;
};

export function PlotResultCard({ 
  plot, 
  onAddToCart,
  onViewDeed,
  onPlotClick,
}: PlotResultCardProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Handle multiple images (for now, single image, but structure ready for array)
  const images = plot.imageUrl ? [plot.imageUrl] : [];
  const hasMultipleImages = images.length > 1;
  const currentImage = images[currentImageIndex] || '';

  const handlePrevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  const pricePerRaiUSD = plot.pricePerRai 
    ? (plot.currency === "THB" ? plot.pricePerRai / 35 : plot.pricePerRai)
    : 0;
  const totalPriceUSD = plot.totalPrice 
    ? (plot.currency === "THB" ? plot.totalPrice / 35 : plot.totalPrice)
    : 0;

  // Determine button UI based on status
  const isAvailable = plot.status === "AVAILABLE";
  const isLocked = plot.status === "LOCKED" && !plot.isInCart; // Locked by another user
  const isReserved = plot.status === "CLAIMED" || plot.status === "SOLD";
  const isOwned = plot.isOwned;
  const isInCart = plot.isInCart;

  const handleCardClick = () => {
    if (onPlotClick) {
      onPlotClick(plot.id);
    }
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onAddToCart) {
      onAddToCart(plot.id);
    }
  };

  const handleViewDeed = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onViewDeed) {
      onViewDeed(plot.id);
    }
  };

  return (
    <button
      type="button"
      onClick={handleCardClick}
      className="flex w-full gap-3 rounded-[12px] border border-[#edf0f3] p-2.5 text-left transition-all hover:border-navy hover:bg-[#f5f7fa]"
    >
      {/* Image with status badge and navigation */}
      <div className="relative h-[72px] w-[72px] flex-shrink-0 overflow-hidden rounded-lg">
        {currentImage ? (
          <>
            <img 
              src={currentImage} 
              alt={plot.name || "Plot"} 
              className="h-full w-full object-cover"
              onError={(e) => {
                if (e.currentTarget.src !== currentImage) return;
                e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="72" height="72"%3E%3Crect fill="%23f3f4f6" width="72" height="72"/%3E%3Ctext x="50%25" y="50%25" font-family="Arial" font-size="9" fill="%239ca3af" text-anchor="middle" dominant-baseline="middle"%3ENo Image%3C/text%3E%3C/svg%3E';
              }}
            />
            
            {/* Image navigation buttons (only if multiple images) */}
            {hasMultipleImages && (
              <>
                <button 
                  onClick={handlePrevImage}
                  className="absolute left-1 top-1/2 z-10 flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-navy shadow-sm transition-all hover:bg-white hover:scale-110"
                  aria-label="Previous image"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <path d="M15 18l-6-6 6-6"/>
                  </svg>
                </button>
                <button 
                  onClick={handleNextImage}
                  className="absolute right-1 top-1/2 z-10 flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-navy shadow-sm transition-all hover:bg-white hover:scale-110"
                  aria-label="Next image"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <path d="M9 18l6-6-6-6"/>
                  </svg>
                </button>
                
                {/* Image counter */}
                <div className="absolute bottom-1 left-1/2 z-10 -translate-x-1/2 rounded-full bg-black/60 px-1.5 py-0.5 text-[8px] font-medium text-white">
                  {currentImageIndex + 1}/{images.length}
                </div>
              </>
            )}

            {/* Status badge */}
            <div className="absolute right-1 top-1">
              {plot.status === "AVAILABLE" && (
                <span className="rounded bg-[#d4f4e6] px-1.5 py-0.5 text-[7px] font-medium uppercase tracking-wide text-[#107042]">
                  AVAILABLE
                </span>
              )}
              {plot.status === "LOCKED" && (
                <span className="rounded bg-[#fef3e6] px-1.5 py-0.5 text-[7px] font-medium uppercase tracking-wide text-[#d4a418]">
                  LOCKED
                </span>
              )}
              {(plot.status === "CLAIMED" || plot.status === "SOLD") && (
                <span className="rounded bg-[#fee6e6] px-1.5 py-0.5 text-[7px] font-medium uppercase tracking-wide text-[#d42418]">
                  RESERVED
                </span>
              )}
            </div>
          </>
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gray-100 text-[8px] text-gray-400">
            No Image
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex min-w-0 flex-1 flex-col justify-between">
        {/* Title and location */}
        <div className="min-w-0">
          <h3 className="truncate text-[13px] font-semibold text-navy">
            {plot.name || plot.plotNumber || "Unnamed Plot"}
          </h3>
          <p className="mt-0.5 flex items-center gap-1 text-[9px] text-[#8f99a4]">
            <svg width="8" height="8" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
            </svg>
            <span className="truncate">
              {plot.city?.name || "Unknown"}, {plot.region?.name || "Thailand"}
            </span>
          </p>
        </div>

        {/* Size and price */}
        <div className="mt-1 flex items-end justify-between gap-2">
          <div>
            <p className="text-[9px] text-[#8f99a4]">Size</p>
            <p className="text-[11px] font-semibold text-brand-red">
              {plot.sizeRai} Rai
            </p>
          </div>
          <div className="text-right">
            <p className="text-[9px] text-[#8f99a4]">Price</p>
            <p className="text-[11px] font-semibold text-navy">
              ${totalPriceUSD.toFixed(2)}
            </p>
          </div>
        </div>
      </div>

      {/* Action button */}
      <div className="flex flex-shrink-0 items-center">
        {isOwned ? (
          <button
            onClick={handleViewDeed}
            className="flex h-[72px] w-[72px] flex-col items-center justify-center gap-1 rounded-lg bg-[#f5f7fa] text-navy transition-colors hover:bg-[#edf0f3]"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <path d="M14 2v6h6"/>
              <path d="M16 13H8"/>
              <path d="M16 17H8"/>
              <path d="M10 9H8"/>
            </svg>
            <span className="text-[8px] font-medium">View Deed</span>
          </button>
        ) : isReserved ? (
          <button
            disabled
            className="flex h-[72px] w-[72px] flex-col items-center justify-center gap-1 rounded-lg bg-[#f5f7fa] text-[#8f99a4]"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zM9 6c0-1.66 1.34-3 3-3s3 1.34 3 3v2H9V6z"/>
            </svg>
            <span className="text-[8px] font-medium">Reserved</span>
          </button>
        ) : isLocked ? (
          <button
            disabled
            className="flex h-[72px] w-[72px] flex-col items-center justify-center gap-1 rounded-lg bg-[#f5f7fa] text-[#8f99a4]"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zM9 6c0-1.66 1.34-3 3-3s3 1.34 3 3v2H9V6z"/>
            </svg>
            <span className="text-[8px] font-medium">Locked</span>
          </button>
        ) : isInCart ? (
          <button
            className="flex h-[72px] w-[72px] flex-col items-center justify-center gap-1 rounded-lg bg-[#0b1f4d] text-white transition-colors hover:bg-[#0b1f4d]/90"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="9" cy="21" r="1"/>
              <circle cx="20" cy="21" r="1"/>
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
            </svg>
            <span className="text-[8px] font-medium">In Cart</span>
          </button>
        ) : isAvailable && onAddToCart ? (
          <button
            onClick={handleAddToCart}
            className="flex h-[72px] w-[72px] flex-col items-center justify-center gap-1 rounded-lg bg-[#0b1f4d] text-white transition-colors hover:bg-[#0b1f4d]/90"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="9" cy="21" r="1"/>
              <circle cx="20" cy="21" r="1"/>
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
            </svg>
            <span className="text-[8px] font-medium">Add</span>
          </button>
        ) : null}
      </div>
    </button>
  );
}
