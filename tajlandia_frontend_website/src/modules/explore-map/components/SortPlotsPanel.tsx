"use client";

import { useState } from "react";
import { cn } from "@/lib/utils/cn";
import type { PlotSortOption, Translate } from "../types/explore-filters.types";
import {
  PanelPrimaryButton,
  PanelTextButton,
  PlotOptionsPanel,
} from "./PlotOptionsPanel";

type SortPlotsPanelProps = {
  /** From `GET /explore/sort-options`; empty while loading or after an error. */
  options: PlotSortOption[];
  status: "loading" | "ready" | "error";
  onRetry: () => void;
  /** Applied option key; null means the default (backend) order. */
  value: string | null;
  onApply: (key: string | null) => void;
  onClose: () => void;
  t: Translate;
};

const bone = "animate-pulse rounded-[6px] bg-[#eef1f5] motion-reduce:animate-none";

function SortIcon() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true" className="h-4 w-4">
      <path
        d="M5 13V3M5 3 2.5 5.5M5 3l2.5 2.5M11 3v10m0 0 2.5-2.5M11 13l-2.5-2.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function SortPlotsPanel({
  options,
  status,
  onRetry,
  value,
  onApply,
  onClose,
  t,
}: SortPlotsPanelProps) {
  const defaultKey = options.find((option) => option.badge === "default")?.key ?? null;
  // Unset until the user picks: follows `value`, or the default once options load.
  const [draft, setDraft] = useState<string | null>(value);
  const selectedKey = draft ?? defaultKey;

  return (
    <PlotOptionsPanel
      icon={<SortIcon />}
      title={t("Sort by")}
      subtitle={t("Reorder active parcel markers")}
      closeLabel={t("Close")}
      widthClassName="sm:w-[340px]"
      onClose={onClose}
      footer={
        <>
          <PanelTextButton onClick={() => setDraft(null)}>{t("Reset")}</PanelTextButton>
          <PanelPrimaryButton
            onClick={() => {
              // The default option is the same as no sort params.
              onApply(selectedKey === defaultKey ? null : selectedKey);
              onClose();
            }}
          >
            {t("Apply")}
          </PanelPrimaryButton>
        </>
      }
    >
      {status === "loading" ? (
        <div
          role="status"
          aria-label={t("Loading sort options...")}
          className="flex flex-col gap-1 px-3 pb-4 pt-3"
        >
          {Array.from({ length: 6 }, (_, row) => (
            <span key={row} className="flex items-center gap-3 p-[11px]">
              <span className={cn(bone, "h-[18px] w-[18px] shrink-0 rounded-full")} />
              <span className={cn(bone, "h-3.5 flex-1")} />
              <span className={cn(bone, "h-3.5 w-12")} />
            </span>
          ))}
        </div>
      ) : status === "error" || !options.length ? (
        <div
          role="alert"
          className="flex flex-col items-center gap-2 px-6 py-10 text-center"
        >
          <p className="text-[12px] text-[#6b7785]">
            {t(
              status === "error"
                ? "Couldn't load sort options."
                : "No sort options available.",
            )}
          </p>
          {status === "error" ? (
            <button
              type="button"
              onClick={onRetry}
              className="flex h-7 cursor-pointer items-center rounded-[6px] border border-[#001f54] px-3 text-[11px] font-semibold text-[#001f54] hover:bg-[#f5f7fa]"
            >
              {t("Try Again")}
            </button>
          ) : null}
        </div>
      ) : (
        <div
          role="radiogroup"
          aria-label={t("Sort plots by")}
          className="flex flex-col gap-1 px-3 pb-4 pt-3"
        >
          {options.map((option) => {
            const selected = selectedKey === option.key;

            return (
              <label
                key={option.key}
                className={cn(
                  "flex cursor-pointer items-center justify-between gap-3 rounded-[12px] border p-[11px] transition-colors",
                  selected
                    ? "border-[#eaf3ff] bg-[#f7f9fc]"
                    : "border-transparent hover:bg-[#fafbfd]",
                )}
              >
                <span className="flex min-w-0 items-center gap-3">
                  <input
                    type="radio"
                    name="plot-sort"
                    value={option.key}
                    checked={selected}
                    onChange={() => setDraft(option.key)}
                    className="peer sr-only"
                  />
                  <span
                    aria-hidden="true"
                    className={cn(
                      "flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full border-[1.5px] peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[#001f54]",
                      selected ? "border-[#001f54]" : "border-[#d9e1ea]",
                    )}
                  >
                    {selected ? (
                      <span className="h-[9px] w-[9px] rounded-full bg-[#001f54]" />
                    ) : null}
                  </span>
                  <span className="min-w-0">
                    <span
                      className={cn(
                        "block truncate text-[13px] leading-[18px]",
                        selected ? "font-semibold text-[#001f54]" : "text-[#6b7785]",
                      )}
                    >
                      {t(option.label)}
                    </span>
                    {option.description ? (
                      <span className="block truncate text-[11px] leading-4 text-[#0b1f33]">
                        {t(option.description)}
                      </span>
                    ) : null}
                  </span>
                </span>
                {option.badge === "default" ? (
                  <span className="shrink-0 rounded-[6px] bg-[#eaf3ff] px-2 py-1 text-[10px] font-bold uppercase leading-3 tracking-[0.04em] text-[#001f54]">
                    {t("DEFAULT")}
                  </span>
                ) : option.badge === "recent" ? (
                  <span className="shrink-0 rounded-[6px] border border-[#dcfce7] bg-[#f0fdf4] px-2 py-0.5 text-[10.5px] font-semibold leading-3 text-[#16a34a]">
                    {t("Recent")}
                  </span>
                ) : (
                  <span className="shrink-0 text-[11px] text-[#6b7785]">
                    {option.hint ? t(option.hint) : null}
                  </span>
                )}
              </label>
            );
          })}
        </div>
      )}
    </PlotOptionsPanel>
  );
}
