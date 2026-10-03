"use client";

import type { Translate } from "../types/explore-filters.types";
import type { RecentSearch } from "../types/explore-map.types";
import { PlaceCounts, PlaceThumbnail } from "./PlaceThumbnail";

type RecentSearchRowProps = {
  item: RecentSearch;
  onSelect: (item: RecentSearch) => void;
  onRemove: (item: RecentSearch) => void;
  t: Translate;
};

export function RecentSearchRow({ item, onSelect, onRemove, t }: RecentSearchRowProps) {
  // `name` arrives with the backend's place fields; until then show the query.
  const label = item.name ?? item.query;

  return (
    <div className="group flex items-center rounded-[10px] hover:bg-[#f5f7fa]">
      <button
        type="button"
        onClick={() => onSelect(item)}
        className="flex min-w-0 flex-1 cursor-pointer items-center gap-3 p-2 text-left"
      >
        <PlaceThumbnail src={item.imageUrl} />
        <span className="min-w-0 flex-1">
          <strong className="block truncate text-[12px] font-medium text-navy">
            {label}
          </strong>
          <PlaceCounts zone={item.zone} plots={item.plots} t={t} />
        </span>
      </button>
      <button
        type="button"
        aria-label={`${t("Remove from recent searches")}: ${label}`}
        onClick={() => onRemove(item)}
        className="mr-1 flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded-md text-[#aab2bd] hover:bg-white hover:text-[#001f54]"
      >
        <svg viewBox="0 0 16 16" aria-hidden="true" className="h-3.5 w-3.5">
          <path
            d="M4 4 12 12M12 4 4 12"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      </button>
    </div>
  );
}
