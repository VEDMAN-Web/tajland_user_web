import { describe, expect, it } from "vitest";
import { sortOptionsSchema } from "../schemas/explore-sort.schema";
import { toPlotSortOptions } from "../services/explore-map.client";

// Real `GET /explore/sort-options` `data`.
const data = {
  options: [
    { id: "Recommended", name: "Curated by premier parcel score", type: "DEFAULT" },
    { id: "Price", name: "Price: Low to High", type: "$ → $$$" },
    { id: "Price", name: "Price: High to Low", type: "$$$ → $" },
    { id: "Size", name: "Land Area: Small to Large", type: "1 → 50 Rai" },
    { id: "Size", name: "Land Area: Large to Small", type: "50 → 1 Rai" },
    { id: "Newest", name: "Newest Added", type: "Recent" },
  ],
};

describe("toPlotSortOptions", () => {
  const options = toPlotSortOptions(sortOptionsSchema.parse(data).options);

  it("keeps every option with a unique key", () => {
    expect(options.map((option) => option.key)).toEqual([
      "Recommended",
      "Price: Low to High",
      "Price: High to Low",
      "Land Area: Small to Large",
      "Land Area: Large to Small",
      "Newest Added",
    ]);
  });

  it("treats DEFAULT as the backend order with its name as the description", () => {
    expect(options[0]).toEqual({
      key: "Recommended",
      label: "Recommended",
      description: "Curated by premier parcel score",
      badge: "default",
      query: {},
    });
  });

  it("maps each option to the plots API sort params", () => {
    expect(options[1]).toMatchObject({
      hint: "$ → $$$",
      query: { sortBy: "totalPrice", sortOrder: "asc" },
    });
    expect(options[4]?.query).toEqual({ sortBy: "sizeRai", sortOrder: "desc" });
    expect(options[5]).toMatchObject({
      badge: "recent",
      query: { sortBy: "createdAt", sortOrder: "desc" },
    });
  });

  it("drops options it can't map, and duplicates", () => {
    const rows = toPlotSortOptions([
      { id: "Rating", name: "Rating: Best first", type: "★" },
      { id: "Price", name: "Price: Low to High", type: "$ → $$$" },
      { id: "Price", name: "Price: Low to High", type: "$ → $$$" },
    ]);
    expect(rows.map((row) => row.key)).toEqual(["Price: Low to High"]);
  });
});
