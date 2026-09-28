/**
 * PlotBottomSheet
 *
 * Bottom drawer that slides up when user taps a plot marker.
 * Shows plot details, eligibility status, and "Add to Cart" button.
 */

"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import type { PlotDetail, PlotEligibilityData } from "@/lib/api/explore.schemas";
import { checkPlotEligibility, fetchPlotDetail } from "../services/explore.service";
import { isBrowserApiError } from "@/lib/api/client.browser";

type PlotBottomSheetProps = {
  plotId: string | null;
  onClose: () => void;
  onAddToCart?: (plotId: string) => void;
};

export function PlotBottomSheet({ plotId, onClose, onAddToCart }: PlotBottomSheetProps) {
  const [plot, setPlot] = useState<PlotDetail | null>(null);
  const [eligibility, setEligibility] = useState<PlotEligibilityData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!plotId) {
      setPlot(null);
      setEligibility(null);
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

  const isOpen = Boolean(plotId);
  const canAddToCart =
    plot?.status === "AVAILABLE" && eligibility?.eligible && !plot?.isInCart;

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-40 bg-black/20 transition-opacity duration-300 ${isOpen ? "opacity-100" : "pointer-events-none opacity-0"}`}
        onClick={onClose}
      />

      {/* Bottom Sheet */}
      <div
        className={`fixed bottom-0 left-0 right-0 z-50 max-h-[85vh] overflow-y-auto rounded-t-[24px] bg-white shadow-[0_-4px_24px_rgba(0,0,0,0.15)] transition-transform duration-300 ${isOpen ? "translate-y-0" : "translate-y-full"}`}
      >
        {/* Drag Handle */}
        <div className="sticky top-0 z-10 flex justify-center bg-white py-3">
          <span className="h-1 w-12 rounded-full bg-gray-300" />
        </div>

        <div className="px-5 pb-6">
          {isLoading ? (
            <div className="py-12 text-center text-sm text-gray-500">
              Loading plot details...
            </div>
          ) : error ? (
            <div className="py-8 text-center">
              <p className="text-sm text-red-600">{error}</p>
              <button
                onClick={onClose}
                className="mt-4 text-sm font-medium text-navy underline"
              >
                Close
              </button>
            </div>
          ) : plot ? (
            <>
              {/* Image */}
              {plot.imageUrl && (
                <div className="relative -mx-5 h-48 overflow-hidden">
                  <Image
                    src={plot.imageUrl}
                    alt={plot.name || "Plot"}
                    fill
                    className="object-cover"
                  />
                </div>
              )}

              {/* Header */}
              <div className="mt-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h2 className="text-xl font-semibold text-navy">
                      {plot.name || "Unnamed Plot"}
                    </h2>
                    <p className="mt-1 text-sm text-gray-600">
                      Plot #{plot.plotNumber}
                    </p>
                  </div>
                  <button
                    onClick={onClose}
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200"
                    aria-label="Close"
                  >
                    ×
                  </button>
                </div>

                {/* Status Badge */}
                <div className="mt-3">
                  <StatusBadge
                    status={plot.status}
                    isOwned={plot.isOwned}
                    isInCart={plot.isInCart}
                  />
                </div>
              </div>

              {/* Details Grid */}
              <div className="mt-6 grid grid-cols-2 gap-4">
                <DetailItem label="Size" value={`${plot.sizeRai} Rai`} />
                <DetailItem
                  label="Price per Rai"
                  value={`$${plot.pricePerRai?.toLocaleString()}`}
                />
                <DetailItem
                  label="Total Price"
                  value={`$${plot.totalPrice?.toLocaleString()} ${plot.currency}`}
                />
                <DetailItem
                  label="Location"
                  value={`${plot.location?.name}, ${plot.region?.name}`}
                />
              </div>

              {/* Zone Info */}
              {plot.zone && (
                <div className="mt-4 rounded-lg bg-gray-50 p-3">
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                    Zone
                  </p>
                  <p className="mt-1 text-sm font-semibold text-navy">
                    {plot.zone.name}
                    {plot.zone.tier && (
                      <span className="ml-2 text-xs text-gray-600">
                        ({plot.zone.tier})
                      </span>
                    )}
                  </p>
                </div>
              )}

              {/* Eligibility Message */}
              {eligibility && !eligibility.eligible && eligibility.reason && (
                <div className="mt-4 rounded-lg bg-yellow-50 p-3 text-sm text-yellow-800">
                  {eligibility.reason}
                </div>
              )}

              {/* Actions */}
              <div className="mt-6 flex gap-3">
                {canAddToCart && onAddToCart ? (
                  <button
                    onClick={() => onAddToCart(plot.id)}
                    className="flex-1 rounded-full bg-brand-red px-6 py-3 text-sm font-medium text-white shadow-sm hover:bg-brand-red/90"
                  >
                    Add to Cart
                  </button>
                ) : plot.isInCart ? (
                  <button
                    disabled
                    className="flex-1 rounded-full bg-gray-200 px-6 py-3 text-sm font-medium text-gray-500"
                  >
                    Already in Cart
                  </button>
                ) : plot.isOwned ? (
                  <button className="flex-1 rounded-full bg-navy px-6 py-3 text-sm font-medium text-white">
                    View Certificate
                  </button>
                ) : null}

                <button
                  onClick={onClose}
                  className="rounded-full border border-gray-300 px-6 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Close
                </button>
              </div>
            </>
          ) : null}
        </div>
      </div>
    </>
  );
}

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
      <span className="inline-flex items-center gap-1.5 rounded-full bg-navy px-3 py-1 text-xs font-medium text-white">
        <span className="h-2 w-2 rounded-full bg-white" />
        Your Plot
      </span>
    );
  }

  if (isInCart) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-800">
        <span className="h-2 w-2 rounded-full bg-blue-600" />
        In Cart
      </span>
    );
  }

  const badges = {
    AVAILABLE: {
      bg: "bg-green-100",
      text: "text-green-800",
      dot: "bg-green-600",
      label: "Available",
    },
    LOCKED: {
      bg: "bg-yellow-100",
      text: "text-yellow-800",
      dot: "bg-yellow-600",
      label: "Locked",
    },
    CLAIMED: {
      bg: "bg-red-100",
      text: "text-red-800",
      dot: "bg-red-600",
      label: "Claimed",
    },
    SOLD: {
      bg: "bg-gray-100",
      text: "text-gray-800",
      dot: "bg-gray-600",
      label: "Sold",
    },
  };

  const badge = badges[status as keyof typeof badges] || badges.SOLD;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full ${badge.bg} px-3 py-1 text-xs font-medium ${badge.text}`}
    >
      <span className={`h-2 w-2 rounded-full ${badge.dot}`} />
      {badge.label}
    </span>
  );
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-medium text-gray-500">{label}</p>
      <p className="mt-1 text-sm font-semibold text-navy">{value}</p>
    </div>
  );
}
