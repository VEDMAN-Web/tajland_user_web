"use client";

import { useId } from "react";
import type { Translate } from "../types/explore-filters.types";

type MapErrorDialogProps = {
  onContinue: () => void;
  onRetry: () => void;
  t: Translate;
};

/** Shown over the explore map whenever the map or its data fails to load. */
export function MapErrorDialog({ onContinue, onRetry, t }: MapErrorDialogProps) {
  const titleId = useId();
  const descriptionId = useId();

  return (
    <div
      role="alertdialog"
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      className="flex w-full max-w-[460px] flex-col items-center gap-2.5 rounded-[16px] border border-[#e9ecef] bg-white px-5 py-8 text-center shadow-[0_0_0_1px_rgba(11,31,51,0.04),0_20px_40px_-15px_rgba(11,31,51,0.18)] @[400px]:px-8"
    >
      <span className="flex h-20 w-20 items-center justify-center rounded-full bg-[#fdecee]">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#e11d2e] text-white">
          <svg viewBox="0 0 16 16" aria-hidden="true" className="h-4 w-4">
            <path
              d="M8 3.5v5.5"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <circle cx="8" cy="12" r="1.2" fill="currentColor" />
          </svg>
        </span>
      </span>
      <h2
        id={titleId}
        className="text-[18px] font-semibold leading-6 text-[#0b1f33] @[400px]:text-[20px] @[400px]:leading-7"
      >
        {t("Map couldn't load")}
      </h2>
      <p id={descriptionId} className="text-[14px] leading-[18px] text-[#6b7785]">
        {t("We're having trouble loading the map. Please try again.")}
      </p>
      {/* Narrow room (beside the panel on small tablets): buttons stack, Try again on top. */}
      <div className="mt-4 flex w-full flex-col-reverse gap-3 @[340px]:grid @[340px]:grid-cols-2">
        <button
          type="button"
          onClick={onContinue}
          className="cursor-pointer h-11 rounded-[8px] border border-[#e9ecef] bg-white px-4 text-[13px] font-medium text-[#6b7785] hover:border-[#cfd8e3] hover:text-[#001f54]"
        >
          {t("Continue")}
        </button>
        <button
          type="button"
          // Retry is the action we want, so it takes focus when the dialog opens.
          autoFocus
          onClick={onRetry}
          className="cursor-pointer flex h-11 items-center justify-center gap-2 rounded-[8px] bg-[#001f54] px-4 text-[13px] font-semibold text-white shadow-[0_1px_2px_rgba(0,0,0,0.05)] hover:bg-[#0b2d6b]"
        >
          <svg viewBox="0 0 16 16" aria-hidden="true" className="h-3.5 w-3.5">
            <path
              d="M13 8a5 5 0 1 1-1.46-3.54M13 2.5v3h-3"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          {t("Try again")}
        </button>
      </div>
    </div>
  );
}
