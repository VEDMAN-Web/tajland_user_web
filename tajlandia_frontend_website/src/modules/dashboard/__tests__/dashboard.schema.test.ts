import { describe, expect, it } from "vitest";
import { dashboardSchema } from "../schemas/dashboard.schema";

// Real `GET /dashboard` `data` (one featured region kept).
const data = {
  user: {
    id: "6aab6ed207ecb69641182ace",
    name: "Michael Anderson",
    email: "michael.anderson.test2026@gmail.com",
    avatarUrl: "",
  },
  collection: {
    totalLandSqFt: 0,
    totalLandRai: 0,
    plotsClaimed: 0,
    regionsCount: 0,
    totalSpent: 0,
    currency: "USD",
  },
  verification: {
    verified: true,
    verifiedHoldings: 0,
    totalHoldings: 0,
    status: "not_verified",
    message: "No holdings to verify yet. Start exploring and claiming plots.",
  },
  featuredRegions: [
    {
      id: "6abb6223c8e9d44533f7aa3f",
      name: "Bangkok",
      slug: "bangkok",
      description: "Thailand capital metropolitan region",
      imageUrl: "https://i.postimg.cc/NFfv24SN/bankok.png",
      locationCount: 5,
      badge: "Featured",
      displayOrder: 0,
    },
  ],
  gift: { enabled: true },
};

describe("dashboardSchema", () => {
  it("accepts the backend response", () => {
    const parsed = dashboardSchema.parse(data);
    expect(parsed.user.name).toBe("Michael Anderson");
    expect(parsed.featuredRegions[0]?.locationCount).toBe(5);
  });

  it("accepts Swagger's nullable fields and a missing gift block", () => {
    const parsed = dashboardSchema.parse({
      ...data,
      user: { ...data.user, avatarUrl: null },
      featuredRegions: [{ ...data.featuredRegions[0], imageUrl: null, badge: null }],
      gift: undefined,
    });
    expect(parsed.gift).toBeUndefined();
  });

  it("rejects a response without collection stats", () => {
    expect(() => dashboardSchema.parse({ ...data, collection: undefined })).toThrow();
  });
});
