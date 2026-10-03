import { describe, expect, it } from "vitest";
import {
  recentSearchesSchema,
  searchResultsSchema,
  searchSuggestionsSchema,
} from "../schemas/explore-search.schema";

// Trimmed from a real `GET /explore/search/suggestions?q=ph` response.
const suggestionsResponse = {
  query: "ph",
  suggestions: [
    {
      type: "REGION",
      id: "6abb6223c8e9d44533f7aa3d",
      name: "Phuket",
      location: { lat: 7.8804, lng: 98.3923 },
    },
    {
      type: "CITY",
      id: "6abb6223c8e9d44533f7aa43",
      name: "Phuket City",
      location: { lat: 7.8804, lng: 98.3923 },
    },
  ],
};

// Real `GET /explore/search?q=phuket` response.
const searchResponse = {
  query: "phuket",
  results: [
    {
      type: "region",
      id: "6abb6223c8e9d44533f7aa3d",
      name: "Phuket",
      imageUrl: "https://i.postimg.cc/tTd9x7T1/phuket.png",
      location: { lat: 7.8804, lng: 98.3923 },
      zone: 1,
      plots: 4,
    },
  ],
};

describe("searchSuggestionsSchema", () => {
  it("accepts the backend response", () => {
    expect(searchSuggestionsSchema.parse(suggestionsResponse)).toEqual(
      suggestionsResponse,
    );
  });

  it("accepts an empty result", () => {
    expect(
      searchSuggestionsSchema.parse({ query: "xyz", suggestions: [] }).suggestions,
    ).toEqual([]);
  });

  it("rejects a suggestion without a location", () => {
    const broken = {
      ...suggestionsResponse,
      suggestions: [{ ...suggestionsResponse.suggestions[0], location: undefined }],
    };

    expect(searchSuggestionsSchema.safeParse(broken).success).toBe(false);
  });
});

describe("searchResultsSchema", () => {
  it("accepts the backend response with counts", () => {
    expect(searchResultsSchema.parse(searchResponse)).toEqual(searchResponse);
  });

  it("accepts results without counts or image (older backend)", () => {
    const parsed = searchResultsSchema.parse({
      query: "phuket",
      results: [
        {
          type: "region",
          id: "6abb6223c8e9d44533f7aa3d",
          name: "Phuket",
          imageUrl: null,
          location: { lat: 7.8804, lng: 98.3923 },
        },
      ],
    });

    expect(parsed.results[0]?.zone).toBeUndefined();
    expect(parsed.results[0]?.imageUrl).toBeNull();
  });

  it("rejects negative counts", () => {
    const broken = {
      ...searchResponse,
      results: [{ ...searchResponse.results[0], plots: -1 }],
    };

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
