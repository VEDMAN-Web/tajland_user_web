/**
 * Tests for GeoJSON geometry validation and helper functions
 */

import { describe, expect, it } from "vitest";
import {
  geometrySchema,
  polygonGeometrySchema,
  multiPolygonGeometrySchema,
  plotSummarySchema,
  toPlotFeatureCollection,
  EMPTY_FEATURE_COLLECTION,
  type PlotSummary,
  type PlotGeometry,
} from "./explore.schemas";

// ─── Geometry Schema Tests ────────────────────────────────────────────────────

describe("geometrySchema", () => {
  it("validates a correct Polygon (Bangkok sample)", () => {
    const validPolygon = {
      type: "Polygon",
      coordinates: [
        [
          [100.5018, 13.7563], // Bangkok center
          [100.5118, 13.7563],
          [100.5118, 13.7663],
          [100.5018, 13.7663],
          [100.5018, 13.7563], // Closed ring
        ],
      ],
    };

    expect(() => geometrySchema.parse(validPolygon)).not.toThrow();
    const result = geometrySchema.parse(validPolygon);
    expect(result?.type).toBe("Polygon");
  });

  it("validates a correct MultiPolygon (island chain)", () => {
    const validMultiPolygon = {
      type: "MultiPolygon",
      coordinates: [
        [
          [
            [98.3923, 7.8804], // Phuket island
            [98.4023, 7.8804],
            [98.4023, 7.8904],
            [98.3923, 7.8904],
            [98.3923, 7.8804], // Closed
          ],
        ],
        [
          [
            [99.9817, 8.7883], // Nearby island
            [99.9917, 8.7883],
            [99.9917, 8.7983],
            [99.9817, 8.7983],
            [99.9817, 8.7883], // Closed
          ],
        ],
      ],
    };

    expect(() => geometrySchema.parse(validMultiPolygon)).not.toThrow();
    const result = geometrySchema.parse(validMultiPolygon);
    expect(result?.type).toBe("MultiPolygon");
  });

  it("rejects unclosed ring (first !== last)", () => {
    const unclosedRing = {
      type: "Polygon",
      coordinates: [
        [
          [100.5018, 13.7563],
          [100.5118, 13.7563],
          [100.5118, 13.7663],
          [100.5018, 13.7663],
          // Missing closing position!
        ],
      ],
    };

    expect(() => geometrySchema.parse(unclosedRing)).toThrow(/must be closed/);
  });

  it("rejects coordinates outside Thailand bounds (lat/lng swapped)", () => {
    const swappedCoords = {
      type: "Polygon",
      coordinates: [
        [
          [13.7563, 100.5018], // Swapped: lat, lng instead of lng, lat
          [13.7563, 100.5118],
          [13.7663, 100.5118],
          [13.7663, 100.5018],
          [13.7563, 100.5018],
        ],
      ],
    };

    expect(() => geometrySchema.parse(swappedCoords)).toThrow();
  });

  it("rejects coordinates outside Thailand bounds (too far north)", () => {
    const outOfBounds = {
      type: "Polygon",
      coordinates: [
        [
          [100.5018, 25.0000], // 25° N is outside Thailand (max 21)
          [100.5118, 25.0000],
          [100.5118, 25.0100],
          [100.5018, 25.0100],
          [100.5018, 25.0000],
        ],
      ],
    };

    expect(() => geometrySchema.parse(outOfBounds)).toThrow(/must be within Thailand bounds/);
  });

  it("rejects ring with only 3 positions", () => {
    const tooFewPositions = {
      type: "Polygon",
      coordinates: [
        [
          [100.5018, 13.7563],
          [100.5118, 13.7563],
          [100.5018, 13.7563], // Only 3 positions (triangle needs 4 to close)
        ],
      ],
    };

    expect(() => geometrySchema.parse(tooFewPositions)).toThrow(/at least 4 positions/);
  });

  it("allows missing geometry (backward compatibility)", () => {
    expect(() => geometrySchema.parse(undefined)).not.toThrow();
    const result = geometrySchema.parse(undefined);
    expect(result).toBeUndefined();
  });
});

// ─── PlotSummary Schema Tests ─────────────────────────────────────────────────

describe("plotSummarySchema with geometry", () => {
  it("validates plot with valid geometry", () => {
    const plotWithGeometry = {
      id: "plot-123",
      name: "Bangkok Plot A",
      status: "AVAILABLE",
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [100.5018, 13.7563],
            [100.5118, 13.7563],
            [100.5118, 13.7663],
            [100.5018, 13.7663],
            [100.5018, 13.7563],
          ],
        ],
      },
    };

    expect(() => plotSummarySchema.parse(plotWithGeometry)).not.toThrow();
  });

  it("validates plot without geometry (backward compat)", () => {
    const plotWithoutGeometry = {
      id: "plot-456",
      name: "Legacy Plot",
      status: "AVAILABLE",
      coordinates: { lat: 13.7563, lng: 100.5018 },
      // No geometry field
    };

    expect(() => plotSummarySchema.parse(plotWithoutGeometry)).not.toThrow();
  });
});

// ─── toPlotFeatureCollection Helper Tests ────────────────────────────────────

describe("toPlotFeatureCollection", () => {
  const validGeometry: NonNullable<PlotGeometry> = {
    type: "Polygon",
    coordinates: [
      [
        [100.5018, 13.7563],
        [100.5118, 13.7563],
        [100.5118, 13.7663],
        [100.5018, 13.7663],
        [100.5018, 13.7563],
      ],
    ],
  };

  it("converts valid plots with geometry to FeatureCollection", () => {
    const plots: PlotSummary[] = [
      {
        id: "plot-1",
        name: "Plot A",
        status: "AVAILABLE",
        geometry: validGeometry,
      },
      {
        id: "plot-2",
        name: "Plot B",
        status: "LOCKED",
        geometry: validGeometry,
      },
    ];

    const result = toPlotFeatureCollection(plots, new Set());

    expect(result.type).toBe("FeatureCollection");
    expect(result.features).toHaveLength(2);
    expect(result.features[0]?.properties.id).toBe("plot-1");
    expect(result.features[1]?.properties.id).toBe("plot-2");
  });

  it("skips plots without geometry", () => {
    const plots: PlotSummary[] = [
      {
        id: "plot-1",
        name: "Has Geometry",
        status: "AVAILABLE",
        geometry: validGeometry,
      },
      {
        id: "plot-2",
        name: "No Geometry",
        status: "AVAILABLE",
        // No geometry field
      },
    ];

    const result = toPlotFeatureCollection(plots, new Set());

    expect(result.features).toHaveLength(1);
    expect(result.features[0]?.properties.id).toBe("plot-1");
  });

  it("sets isOwned: true for plots in myPlotIds", () => {
    const plots: PlotSummary[] = [
      {
        id: "plot-owned",
        name: "My Plot",
        status: "CLAIMED",
        geometry: validGeometry,
      },
      {
        id: "plot-other",
        name: "Other Plot",
        status: "AVAILABLE",
        geometry: validGeometry,
      },
    ];

    const myPlotIds = new Set(["plot-owned"]);
    const result = toPlotFeatureCollection(plots, myPlotIds);

    const ownedFeature = result.features.find((f) => f.id === "plot-owned");
    const otherFeature = result.features.find((f) => f.id === "plot-other");

    expect(ownedFeature?.properties.isOwned).toBe(true);
    expect(otherFeature?.properties.isOwned).toBe(false);
  });

  it("sets displayStatus: OWNED when isOwned is true", () => {
    const plots: PlotSummary[] = [
      {
        id: "plot-owned",
        name: "My Plot",
        status: "CLAIMED",
        geometry: validGeometry,
      },
    ];

    const myPlotIds = new Set(["plot-owned"]);
    const result = toPlotFeatureCollection(plots, myPlotIds);

    const feature = result.features[0];
    expect(feature?.properties.displayStatus).toBe("OWNED");
    expect(feature?.properties.status).toBe("CLAIMED"); // Original status preserved
  });

  it("preserves original status when not owned", () => {
    const plots: PlotSummary[] = [
      {
        id: "plot-1",
        status: "AVAILABLE",
        geometry: validGeometry,
      },
      {
        id: "plot-2",
        status: "LOCKED",
        geometry: validGeometry,
      },
    ];

    const result = toPlotFeatureCollection(plots, new Set());

    expect(result.features[0]?.properties.displayStatus).toBe("AVAILABLE");
    expect(result.features[1]?.properties.displayStatus).toBe("LOCKED");
  });

  it("handles empty input", () => {
    const result = toPlotFeatureCollection([], new Set());

    expect(result.type).toBe("FeatureCollection");
    expect(result.features).toHaveLength(0);
  });

  it("uses plotNumber as fallback for name", () => {
    const plots: PlotSummary[] = [
      {
        id: "plot-1",
        plotNumber: "PL-001",
        status: "AVAILABLE",
        geometry: validGeometry,
      },
    ];

    const result = toPlotFeatureCollection(plots, new Set());

    expect(result.features[0]?.properties.name).toBe("PL-001");
  });

  it("uses id as fallback when name and plotNumber are missing", () => {
    const plots: PlotSummary[] = [
      {
        id: "plot-123",
        status: "AVAILABLE",
        geometry: validGeometry,
      },
    ];

    const result = toPlotFeatureCollection(plots, new Set());

    expect(result.features[0]?.properties.name).toBe("plot-123");
  });
});

// ─── Empty FeatureCollection Constant ─────────────────────────────────────────

describe("EMPTY_FEATURE_COLLECTION", () => {
  it("is a valid empty GeoJSON FeatureCollection", () => {
    expect(EMPTY_FEATURE_COLLECTION.type).toBe("FeatureCollection");
    expect(EMPTY_FEATURE_COLLECTION.features).toEqual([]);
  });
});

