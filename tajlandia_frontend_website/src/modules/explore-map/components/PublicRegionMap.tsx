"use client";

import { useEffect, useImperativeHandle, useRef, useState, type Ref, type RefObject } from "react";
import { useRouter } from "next/navigation";
import type { MapboxMapHandle, MapPlot, MapPlotHover, MapRegion } from "@/components/maps/MapboxMap";
import { isAuthenticated } from "@/lib/api/auth.utils";
import { routes } from "@/lib/constants/routes";
import { plotColor } from "../constants/plot-status";
import { getPublicRegionPlots } from "../services/explore-map.client";
import type { ExplorePlot } from "../types/explore-map.types";
import { ExploreThailandMap, THAILAND_VIEW, type MapLegendLabels } from "./ExploreThailandMap";
import { PlotCard } from "./PlotCard";

/** What a page can do to the map besides the user's own clicks (e.g. its destination cards). */
export type PublicRegionMapControl = {
  openRegion: (region: { id: string; name: string; center: [number, number] }) => void;
};

type PublicRegionMapProps = {
  regions: MapRegion[];
  /** Shared with the page when its search or zoom buttons drive the map. */
  mapRef?: RefObject<MapboxMapHandle | null>;
  controlRef?: Ref<PublicRegionMapControl>;
  legendLabels?: MapLegendLabels;
  /** Replaces the frame's size classes (default: the Explore page's aspect ratio). */
  frameClassName?: string;
};

const REGION_ZOOM = 9.5;
const PLOT_FOCUS_MAX_ZOOM = 18;
const MAP_LABEL_MAX_LENGTH = 22;

// Hover card above a plot name: the same card as the dashboard's Explore Map, drawn a little smaller.
const HOVER_CARD_SCALE = 0.85;
const HOVER_CARD_WIDTH = Math.round(340 * HOVER_CARD_SCALE);
const HOVER_CARD_HEIGHT = Math.round(164 * HOVER_CARD_SCALE);
// Space between the plot name under the cursor and the card (clears the name's pill).
const HOVER_CARD_GAP = 20;
// How long the card stays after the cursor leaves the name (time to move onto the card).
const HOVER_CARD_HIDE_MS = 300;

const identity = (source: string) => source;
const noop = () => {};

function mapLabel(text: string) {
  const label = text.trim();
  return label.length > MAP_LABEL_MAX_LENGTH ? `${label.slice(0, MAP_LABEL_MAX_LENGTH - 1).trimEnd()}…` : label;
}

function toMapPlot(plot: ExplorePlot): MapPlot {
  return {
    id: plot.id,
    color: plotColor(plot.status, plot.isOwned),
    center: [plot.coordinates.lng, plot.coordinates.lat],
    polygon: plot.geometry?.coordinates,
    label: mapLabel(plot.plotName?.trim() || plot.name || plot.plotNumber),
    priority: plot.status === "AVAILABLE" ? 1 : plot.status === "LOCKED" ? 2 : 3,
  };
}

function polygonBounds(plot: Pick<ExplorePlot, "geometry">) {
  const ring = plot.geometry?.coordinates[0];
  if (!ring?.length) return null;
  const lngs = ring.flatMap(([lng]) => (lng === undefined ? [] : [lng]));
  const lats = ring.flatMap(([, lat]) => (lat === undefined ? [] : [lat]));
  return { north: Math.max(...lats), south: Math.min(...lats), east: Math.max(...lngs), west: Math.min(...lngs) };
}

/**
 * The public Thailand map (Explore page and home): pick a region to see its plots, hover a plot
 * for its card, and log in when adding to the cart. Plots come from `GET /public/explore/plots`,
 * so none of this needs an account.
 */
export function PublicRegionMap({ regions, mapRef: sharedMapRef, controlRef, legendLabels, frameClassName }: PublicRegionMapProps) {
  const router = useRouter();
  const ownMapRef = useRef<MapboxMapHandle | null>(null);
  const mapRef = sharedMapRef ?? ownMapRef;

  const [activeRegion, setActiveRegion] = useState<{ id: string; name: string } | null>(null);
  const [plots, setPlots] = useState<ExplorePlot[]>([]);
  const [plotsStatus, setPlotsStatus] = useState<"loading" | "ready" | "error">("loading");
  const [plotsReloadKey, setPlotsReloadKey] = useState(0);
  const [hoveredPlot, setHoveredPlot] = useState<MapPlotHover | null>(null);
  const [selectedPlotId, setSelectedPlotId] = useState<string | null>(null);
  const hoverTimerRef = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(hoverTimerRef.current), []);

  useEffect(() => {
    if (!activeRegion) return;
    const controller = new AbortController();
    getPublicRegionPlots(activeRegion.id, controller.signal)
      .then((items) => {
        setPlots(items);
        setPlotsStatus("ready");
      })
      .catch(() => {
        if (!controller.signal.aborted) setPlotsStatus("error");
      });
    return () => controller.abort();
  }, [activeRegion, plotsReloadKey]);

  function openRegion(region: { id: string; name: string; center: [number, number] }) {
    setActiveRegion({ id: region.id, name: region.name });
    setPlots([]);
    setPlotsStatus("loading");
    setHoveredPlot(null);
    setSelectedPlotId(null);
    mapRef.current?.clearMarker();
    void mapRef.current?.flyToView({ center: region.center, zoom: REGION_ZOOM, duration: 1500 });
  }

  useImperativeHandle(controlRef, () => ({ openRegion }));

  function handleRegionClick(regionId: string) {
    const region = regions.find((item) => item.id === regionId);
    if (region) openRegion(region);
  }

  function closeRegion() {
    setActiveRegion(null);
    setPlots([]);
    setHoveredPlot(null);
    setSelectedPlotId(null);
    void mapRef.current?.flyToView({ ...THAILAND_VIEW, duration: 1200 });
  }

  function focusPlot(plot: Pick<ExplorePlot, "coordinates" | "geometry">) {
    const bounds = polygonBounds(plot);
    if (bounds) {
      mapRef.current?.fitBounds(bounds, { padding: 60, maxZoom: PLOT_FOCUS_MAX_ZOOM, duration: 1200 });
      return;
    }
    void mapRef.current?.flyToView({
      center: [plot.coordinates.lng, plot.coordinates.lat],
      zoom: 15,
      duration: 1200,
    });
  }

  // Click: zoom to the plot and keep its card on the map (touch screens have no hover).
  function handleMapPlotClick(plotId: string) {
    const plot = plots.find((item) => item.id === plotId);
    if (!plot) return;
    window.clearTimeout(hoverTimerRef.current);
    setHoveredPlot(null);
    setSelectedPlotId(plot.id);
    focusPlot(plot);
  }

  function handleMapPlotHover(hover: MapPlotHover | null) {
    window.clearTimeout(hoverTimerRef.current);
    if (hover) {
      setHoveredPlot(hover);
      return;
    }
    hoverTimerRef.current = window.setTimeout(() => setHoveredPlot(null), HOVER_CARD_HIDE_MS);
  }

  // Adding to the cart needs an account: signed-out visitors log in first and land on this plot
  // in the dashboard's Explore Map, where Add to Cart works.
  function addPlotToCart(plotId: string) {
    const plot = plots.find((item) => item.id === plotId);
    const query = new URLSearchParams({ plotId });
    if (plot) {
      query.set("lat", String(plot.coordinates.lat));
      query.set("lng", String(plot.coordinates.lng));
      query.set("zoom", "17");
      query.set("plotNumber", plot.plotNumber);
    }
    const path = `${routes.dashboardExplore}?${query.toString()}`;
    router.push(isAuthenticated() ? path : `${routes.login}?next=${encodeURIComponent(path)}`);
  }

  const mapPlots = activeRegion ? plots.map(toMapPlot) : [];

  // The plot under the cursor, as a card above its name (or below when there is no room above),
  // centred on the cursor and kept inside the map.
  const hoveredItem =
    hoveredPlot && !(selectedPlotId && hoveredPlot.plotIds.includes(selectedPlotId))
      ? plots.find((item) => item.id === hoveredPlot.plotId)
      : undefined;
  const hoverCard =
    hoveredPlot && hoveredItem
      ? {
          plot: hoveredItem,
          left: Math.min(
            Math.max(hoveredPlot.x - HOVER_CARD_WIDTH / 2, 8),
            Math.max(8, hoveredPlot.width - HOVER_CARD_WIDTH - 8),
          ),
          top:
            hoveredPlot.y - HOVER_CARD_GAP - HOVER_CARD_HEIGHT >= 56
              ? hoveredPlot.y - HOVER_CARD_GAP - HOVER_CARD_HEIGHT
              : Math.min(hoveredPlot.y + HOVER_CARD_GAP, Math.max(56, hoveredPlot.height - HOVER_CARD_HEIGHT - 12)),
        }
      : null;
  const selectedItem = selectedPlotId ? plots.find((item) => item.id === selectedPlotId) : undefined;

  const overlay = activeRegion ? (
    <>
      <div className="absolute left-3 top-3 z-20 flex max-w-[calc(100%-7rem)] items-center gap-2 rounded-full bg-white/95 py-1 pl-1 pr-3 shadow-[0_4px_12px_rgba(11,31,77,0.14)] sm:left-4 sm:top-4">
        <button
          type="button"
          onClick={closeRegion}
          className="flex h-8 shrink-0 cursor-pointer items-center gap-1 rounded-full border border-[#e6e8ef] bg-white px-3 text-[12px] font-medium text-navy hover:bg-[#f4f7fa]"
        >
          <span aria-hidden="true">←</span> All regions
        </button>
        <span className="min-w-0 truncate text-[13px] font-semibold text-navy">{activeRegion.name}</span>
        {plotsStatus === "error" ? (
          <button
            type="button"
            onClick={() => {
              setPlotsStatus("loading");
              setPlotsReloadKey((key) => key + 1);
            }}
            className="shrink-0 cursor-pointer text-[12px] font-semibold text-brand-red underline underline-offset-2"
          >
            Couldn&apos;t load plots. Retry
          </button>
        ) : (
          <span className="shrink-0 text-[12px] text-[#8d97a3]">
            {plotsStatus === "loading" ? "Loading plots..." : `${plots.length} ${plots.length === 1 ? "plot" : "plots"}`}
          </span>
        )}
      </div>

      {hoverCard ? (
        <div
          className="absolute z-20 hidden w-[340px] [@media(hover:hover)]:block"
          style={{
            left: hoverCard.left,
            top: hoverCard.top,
            transform: `scale(${HOVER_CARD_SCALE})`,
            transformOrigin: "top left",
          }}
          onMouseEnter={() => window.clearTimeout(hoverTimerRef.current)}
          onMouseLeave={() => handleMapPlotHover(null)}
        >
          <PlotCard
            plot={hoverCard.plot}
            selected={false}
            onSelect={(item) => handleMapPlotClick(item.id)}
            isAddingToCart={false}
            onAddToCart={(item) => addPlotToCart(item.id)}
            isRemovingFromCart={false}
            onRemoveFromCart={noop}
            isOpeningDeed={false}
            onViewDeed={noop}
            t={identity}
          />
        </div>
      ) : null}

      {selectedItem && !hoverCard ? (
        <div className="absolute bottom-4 left-1/2 z-20 w-[340px] max-w-[calc(100%-1.5rem)] -translate-x-1/2">
          <button
            type="button"
            aria-label="Close"
            onClick={() => setSelectedPlotId(null)}
            className="absolute -right-2 -top-2 z-10 flex h-7 w-7 cursor-pointer items-center justify-center rounded-full bg-white text-[14px] text-[#6d7784] shadow-[0_2px_8px_rgba(11,31,77,0.2)] hover:text-navy"
          >
            ×
          </button>
          <PlotCard
            plot={selectedItem}
            selected
            onSelect={noop}
            isAddingToCart={false}
            onAddToCart={(item) => addPlotToCart(item.id)}
            isRemovingFromCart={false}
            onRemoveFromCart={noop}
            isOpeningDeed={false}
            onViewDeed={noop}
            t={identity}
          />
        </div>
      ) : null}
    </>
  ) : null;

  return (
    <ExploreThailandMap
      mapRef={mapRef}
      regions={regions}
      onRegionClick={handleRegionClick}
      plots={mapPlots}
      onPlotClick={handleMapPlotClick}
      onPlotHover={handleMapPlotHover}
      overlay={overlay}
      legendLabels={legendLabels}
      frameClassName={frameClassName}
    />
  );
}
