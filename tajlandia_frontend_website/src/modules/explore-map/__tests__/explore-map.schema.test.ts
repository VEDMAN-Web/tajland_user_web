import { describe, expect, it } from "vitest";
import { exploreMapSchema } from "../schemas/explore-map.schema";

// Trimmed from a real `GET /explore/map` response.
const response = {
  map: {
    country: "Thailand",
    bounds: { north: 20.5, south: 5.6, east: 105.6, west: 97.3 },
    center: { lat: 15.87, lng: 100.99 },
  },
  regions: [
    {
      id: "6abb6223c8e9d44533f7aa3d",
      name: "Phuket",
      slug: "phuket",
      description: "Island destination and coastal investment region",
      latitude: 7.8804,
      longitude: 98.3923,
      displayOrder: 0,
    },
  ],
};

describe("exploreMapSchema", () => {
  it("accepts the backend response", () => {
    expect(exploreMapSchema.parse(response)).toEqual(response);
  });

  it("rejects a region without coordinates", () => {
    const broken = {
      ...response,
      regions: [{ ...response.regions[0], latitude: undefined }],
    };

    expect(exploreMapSchema.safeParse(broken).success).toBe(false);
  });
});
