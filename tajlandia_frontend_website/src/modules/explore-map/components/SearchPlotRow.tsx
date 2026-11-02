"use client";

import { plotCardStatus } from "../constants/plot-status";
import type { Translate } from "../types/explore-filters.types";
import type { SearchPlotResult } from "../types/explore-map.types";
import { PlaceThumbnail } from "./PlaceThumbnail";

type SearchPlotRowProps = {
  plot: SearchPlotResult;
  onSelect: (plot: SearchPlotResult) => void;
  t: Translate;
};

const STATUS_LABEL = {
  available: { label: "Available", color: "#2cbf65" },
  inCart: { label: "Locked", color: "#e7b52c" },
  locked: { label: "Locked", color: "#e7b52c" },
  taken: { label: "Taken", color: "#d64242" },
  owned: { label: "Taken", color: "#d64242" },
} as const;

/** A plot found by its number or name: "PH-0001 · Plot name", where it is, and its status. */
export function SearchPlotRow({ plot, onSelect, t }: SearchPlotRowProps) {
  const status = STATUS_LABEL[plotCardStatus(plot.status, false)];
  const place = [plot.city?.name, plot.region?.name].filter(Boolean).join(", ");
  const title = plot.plotName?.trim()
    ? `${plot.plotNumber} · ${plot.plotName.trim()}`
    : plot.plotNumber;
  const size = plot.sizeRai != null ? `${plot.sizeRai} ${t("Rai")}` : "";

  return (
    <button
      type="button"
      onClick={() => onSelect(plot)}
      className="group/place flex w-full cursor-pointer items-center gap-3 rounded-[10px] border border-transparent p-2 text-left transition-colors hover:border-[#001f54] hover:bg-[#f7f9fc] focus-visible:border-[#001f54] focus-visible:bg-[#f7f9fc] focus-visible:outline-none"
    >
      <PlaceThumbnail src={plot.images?.[0] ?? plot.imageUrl} />
      <span className="min-w-0 flex-1">
        <strong className="block truncate text-[12px] font-medium text-navy">{title}</strong>
        <span className="flex items-center gap-1.5 text-[10px] text-[#8d97a3]">
          <span className="truncate">{[place, size].filter(Boolean).join(" · ")}</span>
          <span aria-hidden="true">·</span>
          <span className="flex shrink-0 items-center gap-1">
            <span
              aria-hidden="true"
              className="h-1.5 w-1.5 rounded-full"
              style={{ backgroundColor: status.color }}
            />
            {t(status.label)}
          </span>
        </span>
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
