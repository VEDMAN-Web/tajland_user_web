// Map colours for plots; the same colours as the "Plot Status" legend.
export const PLOT_STATUS_COLORS = {
  AVAILABLE: "#2cbf65",
  LOCKED: "#e7b52c",
  // CLAIMED and SOLD both show as "Taken" in the legend.
  TAKEN: "#d64242",
  // Figma "Theme 2 Logo/Blue" (the My Plot outline).
  OWNED: "#001f54",
} as const;

// Figma "My Plot": a light blue shape inside the navy outline.
export const OWNED_PLOT_FILL = { color: "#b5d3ff", opacity: 0.6 } as const;

export type PlotCardStatus = "available" | "inCart" | "locked" | "taken" | "owned";

/**
 * The legend's four states, plus "inCart": a plot in the user's cart is LOCKED
 * (reserved for them), so it shows as in the cart rather than locked.
 */
export function plotCardStatus(
  status: string,
  isOwned: boolean | undefined,
  isInCart?: boolean,
): PlotCardStatus {
  if (isOwned) return "owned";
  if (isInCart) return "inCart";
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
