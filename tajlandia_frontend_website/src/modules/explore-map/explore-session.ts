import { EXPLORE_STATE_KEY } from "@/lib/explore/explore-signals";
import { DEFAULT_PLOT_FILTERS } from "./constants/explore-filters";
import type { PlotScope } from "./services/explore-map.client";
import type { PlotFilters } from "./types/explore-filters.types";

/**
 * Where the user left Explore Map, kept for the tab (`sessionStorage`), so coming back
 * from another page (sidebar, Home button) shows the same area, plot and map position.
 * Cleared on logout, and when Explore Map is chosen again while it is open.
 */

export type ExploreSavedState = {
  search: string;
  plotScope: PlotScope | null;
  plotAreaName: string;
  selectedPlotId: string | null;
  detailPlotId: string | null;
  plotFilters: PlotFilters;
  plotSortKey: string | null;
  isPanelCollapsed: boolean;
  /** Where the map was, once the user had moved it; null: still the start view. */
  camera: { center: [number, number]; zoom: number } | null;
};

const SCOPE_PARAMS = ["regionId", "cityId", "zoneId"];

const isString = (value: unknown): value is string => typeof value === "string";
const isNullableString = (value: unknown): value is string | null =>
  value === null || typeof value === "string";
const isFiniteNumber = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value);

export function saveExploreState(state: ExploreSavedState) {
  try {
    sessionStorage.setItem(EXPLORE_STATE_KEY, JSON.stringify(state));
  } catch {
    // Storage unavailable (private mode, full): the page just starts fresh next time.
  }
}

export function clearExploreState() {
  try {
    sessionStorage.removeItem(EXPLORE_STATE_KEY);
  } catch {
    // Nothing to clear.
  }
}

/** The saved state, checked field by field (anything off and it is ignored). */
export function loadExploreState(): ExploreSavedState | null {
  try {
    const raw = sessionStorage.getItem(EXPLORE_STATE_KEY);
    if (!raw) return null;
    const value = JSON.parse(raw) as Record<string, unknown> | null;
    if (!value || typeof value !== "object") return null;

    const scope = value.plotScope as { param?: unknown; id?: unknown } | null;
    const plotScope =
      scope && isString(scope.param) && SCOPE_PARAMS.includes(scope.param) && isString(scope.id)
        ? ({ param: scope.param, id: scope.id } as PlotScope)
        : null;
    const camera = value.camera as { center?: unknown; zoom?: unknown } | null;
    const center = camera?.center;
    const validCamera =
      Array.isArray(center) &&
      center.length === 2 &&
      isFiniteNumber(center[0]) &&
      isFiniteNumber(center[1]) &&
      isFiniteNumber(camera?.zoom);

    return {
      search: isString(value.search) ? value.search : "",
      plotScope,
      // The list shows only while the search box still matches this name.
      plotAreaName: plotScope && isString(value.plotAreaName) ? value.plotAreaName : "",
      selectedPlotId: isNullableString(value.selectedPlotId) ? value.selectedPlotId : null,
      detailPlotId: isNullableString(value.detailPlotId) ? value.detailPlotId : null,
      plotFilters:
        value.plotFilters && typeof value.plotFilters === "object"
          ? { ...DEFAULT_PLOT_FILTERS, ...(value.plotFilters as Partial<PlotFilters>) }
          : DEFAULT_PLOT_FILTERS,
      plotSortKey: isNullableString(value.plotSortKey) ? value.plotSortKey : null,
      isPanelCollapsed: value.isPanelCollapsed === true,
      camera: validCamera
        ? { center: [center[0], center[1]] as [number, number], zoom: camera.zoom as number }
        : null,
    };
  } catch {
    return null;
  }
}
