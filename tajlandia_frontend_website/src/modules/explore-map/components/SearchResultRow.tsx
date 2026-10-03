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
    <button
      type="button"
      onClick={() => onSelect(result)}
      className="flex w-full cursor-pointer items-center gap-3 rounded-[10px] p-2 text-left hover:bg-[#f5f7fa]"
    >
      <PlaceThumbnail src={result.imageUrl} />
      <span className="min-w-0 flex-1">
        <strong className="block truncate text-[12px] font-medium text-navy">
          {result.name}
        </strong>
        <PlaceCounts zone={result.zone} plots={result.plots} t={t} />
      </span>
      <span aria-hidden="true" className="text-[#aab2bd]">
        ›
      </span>
    </button>
  );
}
