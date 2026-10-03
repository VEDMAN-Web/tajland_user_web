import { describe, expect, it } from "vitest";
import { plotColor, PLOT_STATUS_COLORS } from "../constants/plot-status";
import { explorePlotsPageSchema } from "../schemas/explore-plots.schema";

// Real `GET /explore/plots?regionId=…` page (one item).
const page = {
  items: [
    {
      id: "6abb6224c8e9d44533f7aa4f",
      plotNumber: "PKT-01",
      region: { id: "6abb6223c8e9d44533f7aa3d", name: "Phuket", slug: "phuket" },
      imageUrl: "https://i.postimg.cc/m2NHjt97/Cape-Yamu-Phuket-aerial-landscape.png",
      sizeRai: 2,
      areaUnit: "rai",
      pricePerRai: 0.1,
      totalPrice: 0.2,
      currency: "USD",
      status: "AVAILABLE",
      coordinates: { lat: 7.8804, lng: 98.3923 },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [98.392, 7.88],
            [98.3926, 7.88],
            [98.3926, 7.8808],
            [98.392, 7.8808],
            [98.392, 7.88],
          ],
        ],
      },
      isOwned: false,
      isInCart: false,
    },
  ],
  pagination: { page: 1, limit: 100, total: 4, totalPages: 1 },
};

describe("explorePlotsPageSchema", () => {
  it("accepts the backend response", () => {
    const parsed = explorePlotsPageSchema.parse(page);
    expect(parsed.items[0]?.geometry?.coordinates[0]).toHaveLength(5);
    expect(parsed.pagination.totalPages).toBe(1);
  });

  it("accepts a plot without geometry", () => {
    const parsed = explorePlotsPageSchema.parse({
      ...page,
      items: [{ ...page.items[0], geometry: null }],
    });
    expect(parsed.items[0]?.geometry).toBeNull();
  });

  it("rejects a plot without coordinates", () => {
    const broken = { ...page, items: [{ ...page.items[0], coordinates: undefined }] };
    expect(explorePlotsPageSchema.safeParse(broken).success).toBe(false);
  });
});

describe("plotColor", () => {
  it("matches the legend", () => {
    expect(plotColor("AVAILABLE", false)).toBe(PLOT_STATUS_COLORS.AVAILABLE);
    expect(plotColor("LOCKED", false)).toBe(PLOT_STATUS_COLORS.LOCKED);
    expect(plotColor("CLAIMED", false)).toBe(PLOT_STATUS_COLORS.TAKEN);
    expect(plotColor("SOLD", undefined)).toBe(PLOT_STATUS_COLORS.TAKEN);
    expect(plotColor("SOLD", true)).toBe(PLOT_STATUS_COLORS.OWNED);
  });
});
