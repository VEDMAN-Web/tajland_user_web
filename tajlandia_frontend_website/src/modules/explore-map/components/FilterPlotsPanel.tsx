"use client";

import { useId, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils/cn";
import {
  DEFAULT_PLOT_FILTERS,
  isInvalidRange,
  SQUARE_METRES_PER_RAI,
} from "../constants/explore-filters";
import type {
  FilterOptions,
  PlotFilters,
  Translate,
} from "../types/explore-filters.types";
import {
  PanelPrimaryButton,
  PanelTextButton,
  PlotOptionsPanel,
} from "./PlotOptionsPanel";

type FilterPlotsPanelProps = {
  value: PlotFilters;
  /** From `GET /explore/filters`; null while loading or after an error. */
  options: FilterOptions | null;
  status: "loading" | "ready" | "error";
  onRetry: () => void;
  // Figma placeholders until the API sends counts.
  totalPlots: number;
  matchingPlots: number;
  onApply: (value: PlotFilters) => void;
  onClose: () => void;
  t: Translate;
};

const numberFormat = new Intl.NumberFormat("en-US");
const bone = "animate-pulse rounded-[8px] bg-[#eef1f5] motion-reduce:animate-none";

const titleCase = (value: string) => value.charAt(0) + value.slice(1).toLowerCase();

/** Checkbox labels: the tier ("Icon"), or the zone name if two zones share a tier. */
function zoneLabels(zoneTypes: FilterOptions["zoneTypes"]) {
  return zoneTypes.map((zone) => {
    const shared = zoneTypes.filter((other) => other.tier === zone.tier).length > 1;
    return { id: zone.id, label: shared ? zone.name : titleCase(zone.tier) };
  });
}

function RangeError({ show, t }: { show: boolean; t: Translate }) {
  if (!show) return null;
  return (
    <p role="alert" className="mt-1.5 text-[11px] text-[#d64242]">
      {t("Min can't be more than Max.")}
    </p>
  );
}

function FilterIcon() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true" className="h-4 w-4">
      <path
        d="M4 2.5v11M8 2.5v11M12 2.5v11"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M2.5 5.5h3M6.5 10h3M10.5 6.5h3"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function Section({
  title,
  note,
  divider = false,
  children,
}: {
  title: string;
  note?: string;
  divider?: boolean;
  children: ReactNode;
}) {
  const titleId = useId();

  return (
    <div
      role="group"
      aria-labelledby={titleId}
      className={cn(divider && "border-t border-[#eef1f5] pt-5")}
    >
      <div className="mb-2.5 flex items-center justify-between gap-3">
        <span
          id={titleId}
          className="text-[11px] font-semibold uppercase leading-4 tracking-[0.08em] text-[#5c6b7a]"
        >
          {title}
        </span>
        {note ? (
          <span className="text-[11px] leading-4 text-[#8a94a3]">{note}</span>
        ) : null}
      </div>
      {children}
    </div>
  );
}

function CheckboxCard({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex h-8 cursor-pointer items-center gap-2.5 rounded-[8px] border border-[#e3e8ef] px-3 transition-colors hover:border-[#cfd8e3]">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="peer sr-only"
      />
      <span
        aria-hidden="true"
        className={cn(
          "flex h-4 w-4 shrink-0 items-center justify-center rounded-[4px] border peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[#001f54]",
          checked ? "border-[#001f54] bg-[#001f54]" : "border-[#cbd3dd] bg-white",
        )}
      >
        {checked ? (
          <svg viewBox="0 0 12 12" className="h-2.5 w-2.5 text-white">
            <path
              d="m2.5 6.2 2.2 2.2 4.8-4.9"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        ) : null}
      </span>
      <span className="truncate text-[13px] text-[#6b7785]">{label}</span>
    </label>
  );
}

function NumberField({
  label,
  value,
  placeholder,
  prefix,
  suffix,
  onChange,
}: {
  label: string;
  value: string;
  placeholder: string;
  prefix?: string;
  suffix?: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="flex h-8 items-center gap-2 rounded-[8px] border border-[#e3e8ef] px-3 transition-colors focus-within:border-[#001f54]">
      <span className="sr-only">{label}</span>
      {prefix ? <span className="text-[13px] text-[#8a94a3]">{prefix}</span> : null}
      <input
        type="text"
        inputMode="decimal"
        value={value}
        placeholder={placeholder}
        // Digits and one decimal point only.
        onChange={(event) => {
          if (/^\d*\.?\d*$/.test(event.target.value)) onChange(event.target.value);
        }}
        className="min-w-0 flex-1 bg-transparent text-[13px] text-[#001f54] outline-none placeholder:text-[#a0aab6]"
      />
      {suffix ? (
        <span className="text-[10px] font-semibold uppercase text-[#8a94a3]">
          {suffix}
        </span>
      ) : null}
    </label>
  );
}

export function FilterPlotsPanel({
  value,
  options,
  status,
  onRetry,
  totalPlots,
  matchingPlots,
  onApply,
  onClose,
  t,
}: FilterPlotsPanelProps) {
  const [draft, setDraft] = useState(value);
  const raiInvalid = isInvalidRange(draft.minRai, draft.maxRai);
  const priceInvalid = isInvalidRange(draft.minPrice, draft.maxPrice);
  const raiRange = options?.raiRange;
  const priceRange = options?.priceRange;

  function update<K extends keyof PlotFilters>(key: K, next: PlotFilters[K]) {
    setDraft((current) => ({ ...current, [key]: next }));
  }

  function toggleZone(zone: string, checked: boolean) {
    setDraft((current) => ({
      ...current,
      zones: checked
        ? [...current.zones, zone]
        : current.zones.filter((item) => item !== zone),
    }));
  }

  return (
    <PlotOptionsPanel
      icon={<FilterIcon />}
      title={t("Filter Plots")}
      subtitle={`${t("Narrow")} ${numberFormat.format(totalPlots)} ${t("parcels across Thailand")}`}
      closeLabel={t("Close")}
      headerDivider
      widthClassName="sm:w-[420px]"
      onClose={onClose}
      footer={
        <>
          <PanelTextButton onClick={() => setDraft(DEFAULT_PLOT_FILTERS)}>
            {t("Clear All")}
          </PanelTextButton>
          <div className="flex items-center gap-3">
            <span className="text-[11px] text-[#8a94a3]">
              {numberFormat.format(matchingPlots)} {t("plots found")}
            </span>
            <PanelPrimaryButton
              disabled={raiInvalid || priceInvalid}
              onClick={() => {
                onApply(draft);
                onClose();
              }}
            >
              {t("Apply Filters")}
            </PanelPrimaryButton>
          </div>
        </>
      }
    >
      <div className="flex flex-col gap-5 px-6 pb-3 pt-5">
        <Section title={t("Plots")}>
          <div className="grid grid-cols-2 gap-2.5">
            <CheckboxCard
              label={t("My Plots")}
              checked={draft.myPlots}
              onChange={(checked) => update("myPlots", checked)}
            />
            <CheckboxCard
              label={t("Gifted Plots")}
              checked={draft.giftedPlots}
              onChange={(checked) => update("giftedPlots", checked)}
            />
          </div>
        </Section>

        <Section title={t("Zone Category")}>
          <div className="grid grid-cols-2 gap-2.5">
            <CheckboxCard
              label={t("All Zones")}
              checked={draft.zones.length === 0}
              onChange={(checked) => {
                if (checked) update("zones", []);
              }}
            />
            {options
              ? zoneLabels(options.zoneTypes).map((zone) => (
                  <CheckboxCard
                    key={zone.id}
                    label={t(zone.label)}
                    checked={draft.zones.includes(zone.id)}
                    onChange={(checked) => toggleZone(zone.id, checked)}
                  />
                ))
              : status === "loading"
                ? Array.from({ length: 3 }, (_, index) => (
                    <span key={index} aria-hidden="true" className={cn(bone, "h-8")} />
                  ))
                : null}
          </div>
          {status === "error" ? (
            <p
              role="alert"
              className="mt-2 flex items-center gap-2 text-[11px] text-[#6b7785]"
            >
              {t("Couldn't load zone types.")}
              <button
                type="button"
                onClick={onRetry}
                className="cursor-pointer font-semibold text-[#001f54] underline"
              >
                {t("Try Again")}
              </button>
            </p>
          ) : null}
        </Section>

        <Section
          title={t("Land Area (Rai)")}
          note={t(`1 Rai = ${numberFormat.format(SQUARE_METRES_PER_RAI)} m²`)}
          divider
        >
          <div className="grid grid-cols-2 gap-2.5">
            <NumberField
              label={t("Minimum rai")}
              value={draft.minRai}
              placeholder={raiRange ? String(raiRange.min) : t("Min")}
              suffix={t("Rai")}
              onChange={(next) => update("minRai", next)}
            />
            <NumberField
              label={t("Maximum rai")}
              value={draft.maxRai}
              placeholder={raiRange ? String(raiRange.max) : t("Max")}
              suffix={t("Rai")}
              onChange={(next) => update("maxRai", next)}
            />
          </div>
          <RangeError show={raiInvalid} t={t} />
        </Section>

        <Section
          title={t("Price Range (USD)")}
          note={
            priceRange
              ? `$${numberFormat.format(priceRange.min)} – $${numberFormat.format(priceRange.max)}`
              : undefined
          }
          divider
        >
          <div className="grid grid-cols-2 gap-2.5">
            <NumberField
              label={t("Minimum price")}
              value={draft.minPrice}
              placeholder={priceRange ? String(priceRange.min) : t("Min")}
              prefix="$"
              onChange={(next) => update("minPrice", next)}
            />
            <NumberField
              label={t("Maximum price")}
              value={draft.maxPrice}
              placeholder={priceRange ? String(priceRange.max) : t("Max")}
              prefix="$"
              onChange={(next) => update("maxPrice", next)}
            />
          </div>
          <RangeError show={priceInvalid} t={t} />
        </Section>
      </div>
    </PlotOptionsPanel>
  );
}
