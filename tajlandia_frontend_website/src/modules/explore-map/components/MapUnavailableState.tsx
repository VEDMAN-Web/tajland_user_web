"use client";

import type { Translate } from "../types/explore-filters.types";

type MapUnavailableStateProps = {
  onRetry: () => void;
  t: Translate;
};

/** Replaces the search panel's place list while the map is in its error state. */
export function MapUnavailableState({ onRetry, t }: MapUnavailableStateProps) {
  return (
    <div className="flex min-h-[280px] flex-1 flex-col items-center justify-center gap-2 px-4 py-10 text-center">
      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#eef1f5] text-[#8a94a3]">
        <svg viewBox="0 0 16 16" aria-hidden="true" className="h-4 w-4">
          <path
            d="M8 14.5s4.5-4.2 4.5-7.8a4.5 4.5 0 1 0-9 0c0 3.6 4.5 7.8 4.5 7.8Z"
            fill="currentColor"
          />
          <circle cx="8" cy="6.7" r="1.6" fill="#eef1f5" />
        </svg>
      </span>
      <p className="mt-1 text-[13px] font-bold uppercase tracking-[0.06em] text-[#001f54]">
        {t("Map unavailable")}
      </p>
      <p className="text-[11px] leading-4 text-[#6b7785]">
        {t("We couldn't load nearby plots right now.")}
      </p>
      <button
        type="button"
        onClick={onRetry}
        className="cursor-pointer mt-2 flex h-7 items-center gap-1.5 rounded-[6px] border border-[#001f54] px-3 text-[11px] font-semibold text-[#001f54] hover:bg-[#f5f7fa]"
      >
        {t("Try Again")}
        <svg viewBox="0 0 16 16" aria-hidden="true" className="h-3 w-3">
          <path
            d="M3 8h10m0 0-3.5-3.5M13 8l-3.5 3.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
    </div>
  );
}
