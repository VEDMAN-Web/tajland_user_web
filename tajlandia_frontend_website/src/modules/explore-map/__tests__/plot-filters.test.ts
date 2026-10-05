import { describe, expect, it } from "vitest";
import {
  DEFAULT_PLOT_FILTERS,
  isInvalidRange,
  parseFilterNumber,
  toPlotFilterQuery,
} from "../constants/explore-filters";
import { filterOptionsSchema } from "../schemas/explore-filters.schema";

// Real `GET /explore/filters` `data`.
const data = {
  zoneTypes: [
    { id: "6abb6223c8e9d44533f7aa49", name: "Icon 01", tier: "ICON" },
    { id: "6abb6223c8e9d44533f7aa4a", name: "Popular 02", tier: "POPULAR" },
    { id: "6abb6223c8e9d44533f7aa4b", name: "Standard 03", tier: "STANDARD" },
  ],
  raiRange: { min: 2, max: 6 },
  priceRange: { min: 0, max: 1 },
};

describe("filterOptionsSchema", () => {
  it("accepts the backend response", () => {
    expect(filterOptionsSchema.parse(data).zoneTypes).toHaveLength(3);
  });

  it("rejects a response without ranges", () => {
    expect(() => filterOptionsSchema.parse({ zoneTypes: [] })).toThrow();
  });
});

describe("toPlotFilterQuery", () => {
  it("sends nothing for the default filters", () => {
    expect(toPlotFilterQuery(DEFAULT_PLOT_FILTERS)).toEqual({
      zoneId: undefined,
      minRai: undefined,
      maxRai: undefined,
      minPrice: undefined,
      maxPrice: undefined,
    });
  });

  it("sends zones as a JSON array string and ranges as numbers", () => {
    expect(
      toPlotFilterQuery({
        ...DEFAULT_PLOT_FILTERS,
        // UI only, never sent.
        myPlots: true,
        zones: ["6abb6223c8e9d44533f7aa49", "6abb6223c8e9d44533f7aa4b"],
        minRai: "3",
        maxRai: "4.5",
        minPrice: ".",
        maxPrice: "0.45",
      }),
    ).toEqual({
      zoneId: '["6abb6223c8e9d44533f7aa49","6abb6223c8e9d44533f7aa4b"]',
      minRai: 3,
      maxRai: 4.5,
      minPrice: undefined,
      maxPrice: 0.45,
    });
  });
});

describe("filter number helpers", () => {
  it("parses typed values", () => {
    expect(parseFilterNumber("")).toBeUndefined();
    expect(parseFilterNumber("2.")).toBe(2);
  });

  it("flags min above max only when both are set", () => {
    expect(isInvalidRange("5", "3")).toBe(true);
    expect(isInvalidRange("3", "3")).toBe(false);
    expect(isInvalidRange("5", "")).toBe(false);
  });
});
