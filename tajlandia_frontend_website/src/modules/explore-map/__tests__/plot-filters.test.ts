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
  zoneCategories: [
    { id: "6ae584d3144cea5ae996fb51", name: "Icon", type: "ICON" },
    { id: "6ae584d3144cea5ae996fb52", name: "Popular", type: "POPULAR" },
    { id: "6ae584d3144cea5ae996fb53", name: "Standard", type: "STANDARD" },
  ],
  raiRange: { min: 2, max: 6 },
  priceRange: { min: 0, max: 1 },
};

describe("filterOptionsSchema", () => {
  it("accepts the backend response", () => {
    expect(filterOptionsSchema.parse(data).zoneCategories).toHaveLength(3);
  });

  it("rejects a response without ranges", () => {
    expect(() => filterOptionsSchema.parse({ zoneCategories: [] })).toThrow();
  });
});

describe("toPlotFilterQuery", () => {
  it("sends nothing for the default filters", () => {
    expect(toPlotFilterQuery(DEFAULT_PLOT_FILTERS)).toEqual({
      zoneCategoryId: undefined,
      minRai: undefined,
      maxRai: undefined,
      minPrice: undefined,
      maxPrice: undefined,
    });
  });

  it("sends the zone category id and ranges as numbers", () => {
    expect(
      toPlotFilterQuery({
        ...DEFAULT_PLOT_FILTERS,
        // UI only, never sent.
        myPlots: true,
        zoneCategoryId: "6ae584d3144cea5ae996fb51",
        minRai: "3",
        maxRai: "4.5",
        minPrice: ".",
        maxPrice: "0.45",
      }),
    ).toEqual({
      zoneCategoryId: "6ae584d3144cea5ae996fb51",
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
