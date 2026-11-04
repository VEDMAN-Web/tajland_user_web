"use client";

import type { Translate } from "../types/explore-filters.types";
import type { SearchResult } from "../types/explore-map.types";
import { PlaceCounts, PlaceThumbnail } from "./PlaceThumbnail";

type SearchResultRowProps = {
  result: SearchResult;
  onSelect: (result: SearchResult) => void;
  t: Translate;
};

export function SearchResultRow({ result, onSelect, t }: SearchResultRowProps) {
  return (
    // Figma "Selected" look on hover / keyboard focus: navy outline, light fill,
    // and the chevron in a 28px navy circle.
    <button
      type="button"
      onClick={() => onSelect(result)}
      className="group/place flex w-full cursor-pointer items-center gap-3 rounded-[10px] border border-transparent p-2 text-left transition-colors hover:border-[#001f54] hover:bg-[#f7f9fc] focus-visible:border-[#001f54] focus-visible:bg-[#f7f9fc] focus-visible:outline-none"
    >
      <PlaceThumbnail src={result.imageUrl} />
      <span className="min-w-0 flex-1">
        <strong className="block truncate text-[12px] font-medium text-navy">
          {result.name}
        </strong>
        <PlaceCounts zone={result.zone} plots={result.plots} t={t} />
      </span>
      <span
        aria-hidden="true"
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[#aab2bd] transition-colors group-hover/place:bg-[#001f54] group-hover/place:text-white group-hover/place:shadow-[0_1px_2px_rgba(0,0,0,0.05)] group-focus-visible/place:bg-[#001f54] group-focus-visible/place:text-white"
      >
        <svg viewBox="0 0 16 16" className="h-3 w-3">
          <path
            d="m6 3 5 5-5 5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
    </button>
  );
}
