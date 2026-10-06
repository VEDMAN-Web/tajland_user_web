"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { cn } from "@/lib/utils/cn";

export type MapboxMapHandle = {
  zoomIn: () => void;
  zoomOut: () => void;
  locate: () => void;
  flyToCoordinates: (
    coordinates: [number, number],
    zoom?: number,
    label?: string,
  ) => void;
  searchAndFlyTo: (query: string) => Promise<"success" | "not-found" | "error">;
  /** Camera-only flight (no marker). Waits for the map to load; resolves when the flight ends. */
  flyToView: (view: {
    center: [number, number];
    zoom: number;
    duration?: number;
    curve?: number;
    bearing?: number;
    pitch?: number;
  }) => Promise<void>;
  /** Removes the pin left by `flyToCoordinates` / `searchAndFlyTo`. */
  clearMarker: () => void;
  /** Moves the camera so the whole area is visible. */
  /** `duration` in ms; 0 (default) jumps straight there. */
  fitBounds: (
    bounds: LngLatBounds,
    options?: {
      duration?: number;
      /** Space to keep clear (e.g. under a panel); defaults to 40px all round. */
      padding?: number | { top: number; bottom: number; left: number; right: number };
      maxZoom?: number;
    },
  ) => void;
};

export type LngLatBounds = { west: number; south: number; east: number; north: number };

function toMapboxBounds({
  west,
  south,
  east,
  north,
}: LngLatBounds): mapboxgl.LngLatBoundsLike {
  return [
    [west, south],
    [east, north],
  ];
}

type GeocodeFeature = {
  center?: [number, number];
  text?: string;
  place_name?: string;
  place_type?: string[];
  properties?: { short_code?: string };
  context?: Array<{ id?: string; short_code?: string }>;
};

const thailandBounds = { west: 97.3, south: 5.6, east: 105.7, north: 20.5 };

function isInsideThailand(center: [number, number]) {
  const [lng, lat] = center;
  return (
    lng >= thailandBounds.west &&
    lng <= thailandBounds.east &&
    lat >= thailandBounds.south &&
    lat <= thailandBounds.north
  );
}

function isThailandFeature(feature: GeocodeFeature) {
  const country = feature.context?.find((item) => item.id?.startsWith("country."));
  if (country?.short_code?.toLowerCase() === "th") return true;
  if (
    feature.place_type?.includes("country") &&
    feature.properties?.short_code?.toLowerCase() === "th"
  ) {
    return true;
  }
  if (feature.place_name?.toLowerCase().includes("thailand")) return true;
  return feature.center ? isInsideThailand(feature.center) : false;
}

function zoomForPlace(placeType?: string) {
  if (placeType === "region") return 8;
  if (placeType === "district") return 9.5;
  if (placeType === "place") return 11;
  if (placeType === "locality") return 12.5;
  return 14;
}

export type MapboxMapStatus = "loading" | "ready" | "error";

/** A plot drawn on the map: a dot when zoomed out, its outline when zoomed in. */
export type MapPlot = {
  id: string;
  color: string;
  center: [number, number];
  /** GeoJSON Polygon rings ([lng, lat] pairs). */
  polygon?: number[][][];
  /** Shown in a pill above the plot, e.g. its plot number. */
  label?: string;
};

/** A region shown as a photo pill on the zoomed-out map (see `regionsMaxZoom`). */
export type MapRegion = {
  id: string;
  name: string;
  center: [number, number];
  /** Same-origin URL (e.g. through `/_next/image`); the CSP blocks remote images. */
  imageSrc?: string;
};

/** What the camera shows, reported after each move. */
export type MapView = { zoom: number; bounds: LngLatBounds };

function regionMarkerElement(region: MapRegion, onClick: () => void) {
  const button = document.createElement("button");
  button.type = "button";
  button.setAttribute("aria-label", region.name);
  button.style.cssText =
    "display:flex;align-items:center;gap:6px;padding:3px 10px 3px 3px;border:0;border-radius:999px;" +
    "background:#ffffff;box-shadow:0 4px 14px rgba(11,31,77,.22);cursor:pointer;" +
    "font:600 12px/1 var(--font-manrope),sans-serif;color:#001f54;white-space:nowrap;";
  if (region.imageSrc) {
    const image = document.createElement("img");
    image.src = region.imageSrc;
    image.alt = "";
    image.style.cssText = "width:26px;height:26px;border-radius:999px;object-fit:cover;";
    button.append(image);
  } else {
    const dot = document.createElement("span");
    dot.style.cssText =
      "width:10px;height:10px;margin:8px 0 8px 6px;border-radius:999px;background:#001f54;";
    button.append(dot);
  }
  const label = document.createElement("span");
  label.textContent = region.name;
  button.append(label);
  button.addEventListener("click", (event) => {
    event.stopPropagation();
    onClick();
  });
  return button;
}

const PLOT_LABEL_IMAGE = "plot-label-pill";
// Labels appear once a region fills the screen, so Thailand-wide views stay clean.
const PLOT_LABEL_MIN_ZOOM = 9;

/**
 * A white rounded pill registered as an SDF image, so the label layer can
 * stretch it around each plot number and tint it with the plot's colour.
 */
function addLabelPill(map: mapboxgl.Map) {
  if (map.hasImage(PLOT_LABEL_IMAGE)) return;
  const size = 32;
  const radius = 12;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext("2d");
  if (!context) return;
  context.fillStyle = "#ffffff";
  context.beginPath();
  context.roundRect(0, 0, size, size, radius);
  context.fill();
  map.addImage(PLOT_LABEL_IMAGE, context.getImageData(0, 0, size, size), {
    sdf: true,
    pixelRatio: 2,
    // Only the straight middle stretches, so the rounded ends keep their shape.
    stretchX: [[radius, size - radius]],
    stretchY: [[radius, size - radius]],
    // Text fills almost the whole pill; the fit padding below adds the spacing.
    content: [2, 2, size - 2, size - 2],
  });
}

// GeoJSON as mapbox-gl types it (its bundled types aren't exported by name).
type PlotGeoJson = Exclude<Parameters<mapboxgl.GeoJSONSource["setData"]>[0], string>;

const PLOT_AREAS_SOURCE = "plot-areas";
const PLOT_POINTS_SOURCE = "plot-points";
// Plots are small (tens of metres), so show dots until their shape is visible.
const PLOT_SHAPE_MIN_ZOOM = 13;

function plotCollections(plots: MapPlot[]) {
  const areas: PlotGeoJson = {
    type: "FeatureCollection",
    features: plots
      .filter((plot) => plot.polygon)
      .map((plot) => ({
        type: "Feature",
        id: plot.id,
        properties: { id: plot.id, color: plot.color },
        geometry: { type: "Polygon", coordinates: plot.polygon! },
      })),
  };
  const points: PlotGeoJson = {
    type: "FeatureCollection",
    features: plots.map((plot) => ({
      type: "Feature",
      id: plot.id,
      properties: { id: plot.id, color: plot.color, label: plot.label ?? "" },
      geometry: { type: "Point", coordinates: plot.center },
    })),
  };
  return { areas, points };
}

/** Adds the plot sources and layers on first use, then just swaps their data. */
function drawPlots(map: mapboxgl.Map, plots: MapPlot[]) {
  const { areas, points } = plotCollections(plots);
  const areaSource = map.getSource(PLOT_AREAS_SOURCE) as
    mapboxgl.GeoJSONSource | undefined;
  const pointSource = map.getSource(PLOT_POINTS_SOURCE) as
    mapboxgl.GeoJSONSource | undefined;
  if (areaSource && pointSource) {
    areaSource.setData(areas);
    pointSource.setData(points);
    return;
  }

  map.addSource(PLOT_AREAS_SOURCE, { type: "geojson", data: areas });
  map.addSource(PLOT_POINTS_SOURCE, { type: "geojson", data: points });
  map.addLayer({
    id: "plot-areas-fill",
    type: "fill",
    source: PLOT_AREAS_SOURCE,
    minzoom: PLOT_SHAPE_MIN_ZOOM,
    paint: { "fill-color": ["get", "color"], "fill-opacity": 0.4 },
  });
  map.addLayer({
    id: "plot-areas-outline",
    type: "line",
    source: PLOT_AREAS_SOURCE,
    minzoom: PLOT_SHAPE_MIN_ZOOM,
    paint: { "line-color": ["get", "color"], "line-width": 2 },
  });
  map.addLayer({
    id: "plot-points",
    type: "circle",
    source: PLOT_POINTS_SOURCE,
    maxzoom: PLOT_SHAPE_MIN_ZOOM,
    paint: {
      "circle-color": ["get", "color"],
      "circle-radius": 6,
      "circle-stroke-color": "#ffffff",
      "circle-stroke-width": 2,
    },
  });
  addLabelPill(map);
  map.addLayer({
    id: "plot-labels",
    type: "symbol",
    source: PLOT_POINTS_SOURCE,
    minzoom: PLOT_LABEL_MIN_ZOOM,
    filter: ["!=", ["get", "label"], ""],
    layout: {
      "text-field": ["get", "label"],
      "text-font": ["DIN Pro Bold", "Arial Unicode MS Bold"],
      "text-size": 10,
      "text-line-height": 1,
      // Every plot keeps its number, even when neighbours sit close together.
      "text-allow-overlap": true,
      "icon-allow-overlap": true,
      "text-anchor": "bottom",
      // Sit just above the plot's dot / shape.
      "text-offset": [0, -0.9],
      "icon-image": PLOT_LABEL_IMAGE,
      "icon-text-fit": "both",
      "icon-text-fit-padding": [2, 6, 1, 6],
    },
    paint: {
      "text-color": "#ffffff",
      "icon-color": ["get", "color"],
    },
  });
}

type MapboxMapProps = {
  className?: string;
  /** Called whenever the map moves between loading, ready and error. */
  onStatusChange?: (status: MapboxMapStatus) => void;
  /** Set false when the page renders its own error UI. */
  showErrorOverlay?: boolean;
  /** Extra classes for the loading overlay, e.g. padding so its card centres beside a side panel. */
  loadingOverlayClassName?: string;
  /** Loading card text (pass translated strings). */
  loadingLabels?: { title: string; subtitle: string };
  initialCenter?: [number, number];
  initialZoom?: number;
  /** "globe" shows the Earth as a sphere when zoomed out (blends to flat when zoomed in). */
  projection?: "mercator" | "globe";
  selectedLocation?: {
    id: string;
    coordinates: [number, number];
    zoom?: number;
  };
  /** Plots to draw; pass a new array to replace them, `[]` to clear. */
  plots?: MapPlot[];
  /** Called with a plot's id when its dot, shape or label is clicked. */
  onPlotClick?: (plotId: string) => void;
  /** Regions drawn as photo pills while zoomed out (below `regionsMaxZoom`). */
  regions?: MapRegion[];
  regionsMaxZoom?: number;
  onRegionClick?: (regionId: string) => void;
  /** Called once the map loads and after every move / zoom ends. */
  onViewChange?: (view: MapView) => void;
};

const CLICKABLE_PLOT_LAYERS = ["plot-areas-fill", "plot-points", "plot-labels"];

export const MapboxMap = forwardRef<MapboxMapHandle, MapboxMapProps>(function MapboxMap(
  {
    className,
    initialCenter,
    initialZoom,
    projection = "mercator",
    selectedLocation,
    onStatusChange,
    showErrorOverlay = true,
    loadingOverlayClassName,
    loadingLabels = {
      title: "Loading Map",
      subtitle: "Preparing Thailand for exploration...",
    },
    plots,
    onPlotClick,
    regions,
    regionsMaxZoom = 8,
    onRegionClick,
    onViewChange,
  },
  ref,
) {
  const projectionRef = useRef(projection);
  const loadedRef = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const selectedMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const initialViewRef = useRef({
    center:
      initialCenter ?? selectedLocation?.coordinates ?? ([100.5, 15] as [number, number]),
    zoom: initialZoom ?? selectedLocation?.zoom ?? 4.5,
  });
  const [status, setStatus] = useState<MapboxMapStatus>("loading");
  // Latest plots, so the load handler can draw ones that arrived before the style.
  const plotsRef = useRef(plots);
  // Latest handler, so the map listeners (added once) never call a stale one.
  const onPlotClickRef = useRef(onPlotClick);
  useEffect(() => {
    onPlotClickRef.current = onPlotClick;
  }, [onPlotClick]);
  const onRegionClickRef = useRef(onRegionClick);
  const onViewChangeRef = useRef(onViewChange);
  useEffect(() => {
    onRegionClickRef.current = onRegionClick;
    onViewChangeRef.current = onViewChange;
  }, [onRegionClick, onViewChange]);
  const regionMarkersRef = useRef<mapboxgl.Marker[]>([]);
  const regionsMaxZoomRef = useRef(regionsMaxZoom);
  regionsMaxZoomRef.current = regionsMaxZoom;

  useEffect(() => {
    onStatusChange?.(status);
  }, [onStatusChange, status]);

  function focusLocation(coordinates: [number, number], zoom: number, label: string) {
    const map = mapRef.current;
    if (!map) return;

    map.flyTo({ center: coordinates, zoom, essential: true });
    selectedMarkerRef.current?.remove();

    const markerElement = document.createElement("div");
    markerElement.style.alignItems = "center";
    markerElement.style.display = "flex";
    markerElement.style.flexDirection = "column";
    markerElement.style.gap = "5px";
    markerElement.style.pointerEvents = "none";

    const labelElement = document.createElement("span");
    labelElement.textContent = label;
    labelElement.style.background = "#082a68";
    labelElement.style.borderRadius = "999px";
    labelElement.style.boxShadow = "0 2px 8px rgba(8,42,104,.25)";
    labelElement.style.color = "white";
    labelElement.style.fontSize = "11px";
    labelElement.style.fontWeight = "600";
    labelElement.style.padding = "4px 9px";

    const pin = document.createElement("span");
    pin.style.background = "#082a68";
    pin.style.border = "3px solid white";
    pin.style.borderRadius = "50%";
    pin.style.boxShadow = "0 0 0 6px rgba(8,42,104,.18)";
    pin.style.height = "14px";
    pin.style.width = "14px";
    markerElement.append(labelElement, pin);

    selectedMarkerRef.current = new mapboxgl.Marker({
      element: markerElement,
      anchor: "bottom",
    })
      .setLngLat(coordinates)
      .addTo(map);
  }

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;
    if (!accessToken) {
      setStatus("error");
      return;
    }

    mapboxgl.accessToken = accessToken;
    let disposed = false;
    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: initialViewRef.current.center,
      zoom: initialViewRef.current.zoom,
      minZoom: 2,
      projection: { name: projectionRef.current },
      attributionControl: false,
    });

    mapRef.current = map;
    // Keep the required Mapbox attribution compact and inside the map frame.
    map.addControl(new mapboxgl.AttributionControl({ compact: true }), "bottom-right");
    const resizeObserver = new ResizeObserver(() => map.resize());
    resizeObserver.observe(containerRef.current);
    map.once("load", () => {
      loadedRef.current = true;
      map.resize();
      if (plotsRef.current) drawPlots(map, plotsRef.current);
      // Layer listeners work even before the layers exist (added when plots load).
      for (const layer of CLICKABLE_PLOT_LAYERS) {
        map.on("click", layer, (event) => {
          const props = (
            event.features?.[0] as { properties?: { id?: unknown } } | undefined
          )?.properties;
          const id = props?.id;
          if (typeof id === "string") onPlotClickRef.current?.(id);
        });
        map.on("mouseenter", layer, () => {
          if (onPlotClickRef.current) map.getCanvas().style.cursor = "pointer";
        });
        map.on("mouseleave", layer, () => {
          map.getCanvas().style.cursor = "";
        });
      }
    });
    map.once("load", () => {
      if (!selectedLocation) return;
      focusLocation(
        selectedLocation.coordinates,
        selectedLocation.zoom ?? 16,
        selectedLocation.id,
      );
    });
    map.once("idle", () => {
      if (!disposed) setStatus("ready");
    });
    function reportView() {
      const bounds = map.getBounds();
      if (!bounds) return;
      onViewChangeRef.current?.({
        zoom: map.getZoom(),
        bounds: {
          west: bounds.getWest(),
          south: bounds.getSouth(),
          east: bounds.getEast(),
          north: bounds.getNorth(),
        },
      });
    }
    map.once("load", reportView);
    map.on("moveend", reportView);
    // Region pills only while zoomed out; plots take over closer in.
    map.on("zoom", () => {
      const visible = map.getZoom() < regionsMaxZoomRef.current;
      for (const marker of regionMarkersRef.current) {
        marker.getElement().style.display = visible ? "flex" : "none";
      }
    });
    map.on("error", (event) => {
      console.error("Mapbox failed to load", event.error);
      if (!map.isStyleLoaded() && !disposed) setStatus("error");
    });

    return () => {
      disposed = true;
      resizeObserver.disconnect();
      map.remove();
      mapRef.current = null;
      loadedRef.current = false;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !regions) return;
    const visible = map.getZoom() < regionsMaxZoomRef.current;
    const markers = regions.map((region) => {
      const element = regionMarkerElement(region, () =>
        onRegionClickRef.current?.(region.id),
      );
      element.style.display = visible ? "flex" : "none";
      return new mapboxgl.Marker({ element, anchor: "center" })
        .setLngLat(region.center)
        .addTo(map);
    });
    regionMarkersRef.current = markers;
    return () => {
      for (const marker of markers) marker.remove();
      regionMarkersRef.current = [];
    };
  }, [regions]);

  useEffect(() => {
    plotsRef.current = plots;
    const map = mapRef.current;
    if (!map || !loadedRef.current || !plots) return;
    drawPlots(map, plots);
  }, [plots]);

  useImperativeHandle(
    ref,
    () => ({
      zoomIn: () => mapRef.current?.zoomIn(),
      zoomOut: () => mapRef.current?.zoomOut(),
      flyToCoordinates: (coordinates, zoom = 13, label = "Selected location") => {
        focusLocation(coordinates, zoom, label);
      },
      searchAndFlyTo: async (query) => {
        const map = mapRef.current;
        const accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;
        const normalizedQuery = query.trim();

        if (!map || !accessToken || !normalizedQuery) return "not-found";

        try {
          if (!map.isStyleLoaded()) {
            await new Promise<void>((resolve) => {
              map.once("load", () => resolve());
            });
          }

          const params = new URLSearchParams({
            access_token: accessToken,
            country: "th",
            bbox: "97.3,5.6,105.7,20.5",
            limit: "5",
            language: "en",
            types: "region,district,place,locality,poi",
          });
          const response = await fetch(
            `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(normalizedQuery)}.json?${params}`,
          );
          if (!response.ok) return "error";

          const data = (await response.json()) as {
            features?: GeocodeFeature[];
          };
          const feature = data.features?.find(
            (item) => item.center && isThailandFeature(item),
          );
          const center = feature?.center;

          if (!feature || !center) return "not-found";
          focusLocation(
            center,
            zoomForPlace(feature.place_type?.[0]),
            feature.text || normalizedQuery,
          );
          return "success";
        } catch {
          return "error";
        }
      },
      flyToView: async ({
        center,
        zoom,
        duration = 3000,
        curve = 1.6,
        bearing = 0,
        pitch = 0,
      }) => {
        const map = mapRef.current;
        if (!map) return;
        if (!loadedRef.current) {
          await new Promise<void>((resolve) => map.once("load", () => resolve()));
        }
        await new Promise<void>((resolve) => {
          map.once("moveend", () => resolve());
          map.flyTo({ center, zoom, duration, curve, bearing, pitch, essential: true });
        });
      },
      clearMarker: () => {
        selectedMarkerRef.current?.remove();
        selectedMarkerRef.current = null;
      },
      fitBounds: (bounds, options) => {
        mapRef.current?.fitBounds(toMapboxBounds(bounds), {
          padding: options?.padding ?? 40,
          duration: options?.duration ?? 0,
          // An explicit `maxZoom: undefined` overrides Mapbox's default and the fit fails (NaN zoom).
          ...(options?.maxZoom !== undefined && { maxZoom: options.maxZoom }),
        });
      },
      locate: () => {
        if (!mapRef.current || !navigator.geolocation) return;
        navigator.geolocation.getCurrentPosition(({ coords }) => {
          mapRef.current?.flyTo({
            center: [coords.longitude, coords.latitude],
            zoom: 10,
          });
        });
      },
    }),
    [],
  );

  return (
    <div
      className={cn("relative h-full min-h-[100svh] w-full", className)}
      aria-label="Interactive Thailand map"
    >
      <div ref={containerRef} className="absolute inset-0 h-full w-full" />
      <div
        className={cn(
          "pointer-events-none absolute inset-0 z-10 flex items-center justify-center bg-[#effbfd]/75 transition-opacity duration-300",
          status === "loading" ? "opacity-100" : "opacity-0",
          loadingOverlayClassName,
        )}
        aria-hidden={status !== "loading"}
      >
        <div className="flex h-[116px] w-[220px] flex-col items-center justify-center rounded-[14px] bg-white shadow-[0_8px_24px_rgba(11,31,77,0.08)]">
          <span className="h-7 w-7 animate-spin rounded-full border-[4px] border-[#151515]/20 border-t-[#151515]" />
          <strong className="mt-2 text-[14px] font-bold text-[#151515]">
            {loadingLabels.title}
          </strong>
          <span className="mt-1 text-[11px] text-[#737373]">
            {loadingLabels.subtitle}
          </span>
        </div>
      </div>
      {status === "error" && showErrorOverlay ? (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-[#74d0e1] px-6 text-center text-sm text-navy">
          The map could not be loaded. Please check your connection and try again.
        </div>
      ) : null}
    </div>
  );
});
