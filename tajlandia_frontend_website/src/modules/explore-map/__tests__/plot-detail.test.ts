import { describe, expect, it } from "vitest";
import { formatCoordinates, plotSizeSqm } from "../components/PlotDetailPanel";
import { explorePlotDetailSchema } from "../schemas/explore-plots.schema";

// Real `GET /explore/plots/{plotId}` `data`.
const detail = {
  id: "6abb6224c8e9d44533f7aa5a",
  plotNumber: "BKK-02",
  name: "BKK-02",
  region: { id: "6abb6223c8e9d44533f7aa3f", name: "Bangkok", slug: "bangkok" },
  location: {
    id: "6abb6223c8e9d44533f7aa45",
    name: "Bangkok City",
    slug: "bangkok-city",
  },
  zone: {
    id: "6abb6223c8e9d44533f7aa4b",
    name: "Standard",
    slug: "standard",
    tier: "STANDARD",
  },
  imageUrl: "https://i.postimg.cc/m2NHjt97/Cape-Yamu-Phuket-aerial-landscape.png",
  description: "BKK-02 dummy plot in bangkok",
  sizeRai: 4,
  sizeSquareFeet: 68889,
  areaUnit: "rai",
  pricePerRai: 0.01,
  totalPrice: 0.04,
  currency: "USD",
  status: "AVAILABLE",
  geometry: {
    type: "Polygon",
    coordinates: [
      [
        [100.5687, 13.7296],
        [100.5693, 13.7296],
        [100.5693, 13.7304],
        [100.5687, 13.7304],
        [100.5687, 13.7296],
      ],
    ],
  },
  coordinates: { lat: 13.73, lng: 100.569 },
  isOwned: false,
  isInCart: false,
  purchase: {
    available: true,
    minimumRequired: false,
    reason: "User can purchase this plot",
  },
};

describe("explorePlotDetailSchema", () => {
  it("accepts the backend response", () => {
    const parsed = explorePlotDetailSchema.parse(detail);
    expect(parsed.location?.name).toBe("Bangkok City");
    expect(parsed.zone?.tier).toBe("STANDARD");
  });

  it("accepts a plot without city, zone, size in feet or geometry", () => {
    const parsed = explorePlotDetailSchema.parse({
      ...detail,
      location: null,
      zone: null,
      sizeSquareFeet: undefined,
      geometry: null,
      purchase: undefined,
    });
    expect(parsed.zone).toBeNull();
  });

  it("rejects a plot without a region", () => {
    expect(() =>
      explorePlotDetailSchema.parse({ ...detail, region: undefined }),
    ).toThrow();
  });
});

describe("plot detail formatting", () => {
  it("formats coordinates as degrees, minutes, seconds", () => {
    expect(formatCoordinates({ lat: 13.73, lng: 100.569 })).toBe(
      "13°43'48.0\"N 100°34'8.4\"E",
    );
    expect(formatCoordinates({ lat: -7.5, lng: -98.25 })).toBe(
      "7°30'0.0\"S 98°15'0.0\"W",
    );
  });

  it("converts the API's square feet to square metres", () => {
    // 4 rai = 6,400 m².
    expect(plotSizeSqm(68889)).toBe(6400);
    expect(plotSizeSqm(null)).toBeNull();
  });
});
