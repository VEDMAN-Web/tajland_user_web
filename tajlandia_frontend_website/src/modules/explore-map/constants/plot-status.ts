// Map colours for plots; the same colours as the "Plot Status" legend.
export const PLOT_STATUS_COLORS = {
  AVAILABLE: "#2cbf65",
  LOCKED: "#e7b52c",
  // CLAIMED and SOLD both show as "Taken" in the legend.
  TAKEN: "#d64242",
  OWNED: "#0b1f4d",
} as const;

export type PlotCardStatus = "available" | "locked" | "taken" | "owned";

/** The four states the legend and plot cards use. */
export function plotCardStatus(
  status: string,
  isOwned: boolean | undefined,
): PlotCardStatus {
  if (isOwned) return "owned";
  if (status === "AVAILABLE") return "available";
  if (status === "LOCKED") return "locked";
  return "taken";
}

export function plotColor(status: string, isOwned: boolean | undefined) {
  if (isOwned) return PLOT_STATUS_COLORS.OWNED;
  if (status === "AVAILABLE") return PLOT_STATUS_COLORS.AVAILABLE;
  if (status === "LOCKED") return PLOT_STATUS_COLORS.LOCKED;
  return PLOT_STATUS_COLORS.TAKEN;
}
