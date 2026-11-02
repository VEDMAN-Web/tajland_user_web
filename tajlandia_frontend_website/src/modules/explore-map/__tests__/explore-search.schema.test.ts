import { describe, expect, it } from "vitest";
import {
  recentSearchesSchema,
  searchResultsSchema,
  searchSuggestionsSchema,
} from "../schemas/explore-search.schema";

// Trimmed from a real `GET /explore/search/suggestions?q=phu` response.
const suggestionsResponse = {
  query: "phu",
  suggestions: [
    {
      type: "REGION",
      id: "6abb6223c8e9d44533f7aa3d",
      name: "Phuket",
      imageUrl: "https://i.postimg.cc/Qt5QF0TF/Phuket.jpg",
      location: { lat: 7.8804, lng: 98.3923 },
    },
    {
      type: "CITY",
      id: "6abb6223c8e9d44533f7aa43",
      name: "Phuket City",
      location: { lat: 7.8804, lng: 98.3923 },
      regionId: "6abb6223c8e9d44533f7aa3d",
      regionName: "Phuket",
    },
    {
      // Plots have no location.
      type: "PLOT",
      id: "6ac732fcd151ab3dce7a9fa8",
      name: "Phuket coastal plot",
      regionId: "6abb6223c8e9d44533f7aa3d",
      regionName: "Phuket",
    },
  ],
};

const phuketRegion = {
  type: "region",
  id: "6abb6223c8e9d44533f7aa3d",
  name: "Phuket",
  slug: "phuket",
  imageUrl: "https://i.postimg.cc/Qt5QF0TF/Phuket.jpg",
  location: { lat: 7.8804, lng: 98.3923 },
  zone: 3,
  plots: 114,
  cities: [{ id: "6abb6223c8e9d44533f7aa43", name: "Phuket City", slug: "phuket-city" }],
};

const phuketCity = {
  type: "city",
  id: "6abb6223c8e9d44533f7aa43",
  name: "Phuket City",
  location: { lat: 7.8804, lng: 98.3923 },
  region: { id: "6abb6223c8e9d44533f7aa3d", name: "Phuket", slug: "phuket" },
  plots: 114,
};

const plot = {
  type: "plot",
  id: "6abb6224c8e9d44533f7aa4f",
  plotNumber: "PH-0001",
  plotName: "plotssss",
  status: "CLAIMED",
  region: { id: "6abb6223c8e9d44533f7aa3d", name: "Phuket", slug: "phuket" },
  city: { id: "6abb6223c8e9d44533f7aa43", name: "Phuket City", slug: "phuket-city" },
  zone: { id: "6abb6223c8e9d44533f7aa49", name: "Phuket Icon", slug: "icon", tier: "ICON" },
  zoneCategory: { id: "6ae584d3144cea5ae996fb51", name: "Icon", type: "ICON" },
  sizeRai: 50,
  pricePerRai: 0.1,
  totalPrice: 5,
  currency: "USD",
  imageUrl: null,
};

// Trimmed from a real `GET /explore/search?q=phuket` response (`results`/`counts` omitted).
const searchResponse = {
  query: "phuket",
  regions: [phuketRegion],
  cities: [phuketCity],
  plots: [plot],
};

describe("searchSuggestionsSchema", () => {
  it("accepts the backend response, plots included", () => {
    const parsed = searchSuggestionsSchema.parse(suggestionsResponse);

    expect(parsed.suggestions).toHaveLength(3);
    expect(parsed.suggestions[2]?.location).toBeUndefined();
    expect(parsed.suggestions[2]?.regionName).toBe("Phuket");
  });

  it("accepts an empty result", () => {
    expect(
      searchSuggestionsSchema.parse({ query: "xyz", suggestions: [] }).suggestions,
    ).toEqual([]);
  });

  it("rejects a region or city suggestion without a location", () => {
    const broken = {
      ...suggestionsResponse,
      suggestions: [{ ...suggestionsResponse.suggestions[0], location: undefined }],
    };

    expect(searchSuggestionsSchema.safeParse(broken).success).toBe(false);
  });
});

describe("searchResultsSchema", () => {
  it("accepts regions, cities and plots from the backend", () => {
    const parsed = searchResultsSchema.parse(searchResponse);

    expect(parsed.regions[0]).toMatchObject({ name: "Phuket", zone: 3, plots: 114 });
    expect(parsed.cities[0]).toMatchObject({ name: "Phuket City", plots: 114 });
    expect(parsed.plots[0]).toMatchObject({ plotNumber: "PH-0001", status: "CLAIMED" });
  });

  it("accepts a plot-only result (a plot number search)", () => {
    const parsed = searchResultsSchema.parse({
      query: "PH-0",
      regions: [],
      cities: [],
      plots: [plot],
    });

    expect(parsed.plots).toHaveLength(1);
  });

  it("accepts places without counts or image (older backend)", () => {
    const parsed = searchResultsSchema.parse({
      query: "phuket",
      regions: [{ ...phuketRegion, imageUrl: null, zone: undefined, plots: undefined }],
      cities: [],
      plots: [],
    });

    expect(parsed.regions[0]?.zone).toBeUndefined();
    expect(parsed.regions[0]?.imageUrl).toBeNull();
  });

  it("rejects negative counts", () => {
    const broken = { ...searchResponse, regions: [{ ...phuketRegion, plots: -1 }] };

    expect(searchResultsSchema.safeParse(broken).success).toBe(false);
  });

  it("rejects a plot without a plot number", () => {
    const broken = { ...searchResponse, plots: [{ ...plot, plotNumber: undefined }] };

    expect(searchResultsSchema.safeParse(broken).success).toBe(false);
  });
});

describe("recentSearchesSchema", () => {
  it("accepts today's text-only entries", () => {
    // Real `GET /explore/recent-searches` item.
    const items = [
      {
        id: "6ac0b0d3500952b37ed912b4",
        query: "bang",
        type: "LOCATION",
        createdAt: "2026-10-03T07:37:55.363Z",
      },
    ];

    expect(recentSearchesSchema.parse(items)).toEqual(items);
  });

  it("accepts the upcoming place fields", () => {
    const [item] = recentSearchesSchema.parse([
      {
        id: "1",
        query: "phuket",
        type: "LOCATION",
        createdAt: "2026-10-03T07:37:55.363Z",
        name: "Phuket",
        imageUrl: "https://i.postimg.cc/tTd9x7T1/phuket.png",
        location: { lat: 7.8804, lng: 98.3923 },
        zone: 1,
        plots: 4,
      },
    ]);

    expect(item?.location).toEqual({ lat: 7.8804, lng: 98.3923 });
  });

  it("rejects an entry without an id", () => {
    expect(
      recentSearchesSchema.safeParse([{ query: "x", type: "LOCATION", createdAt: "" }])
        .success,
    ).toBe(false);
  });
});
