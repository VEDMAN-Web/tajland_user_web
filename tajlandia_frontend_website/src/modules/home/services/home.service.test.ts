import { describe, expect, it } from "vitest";
import { homePageContent } from "../data/home.mock";
import { homePageContentSchema } from "../schemas/home-content.schema";
import {
  getHomePageContent,
  parseHomePageContent,
  toHomePageViewModel,
} from "./home.service";

describe("home service", () => {
  it("returns schema-valid home content", async () => {
    const content = await getHomePageContent();
    expect(content.hero.titleAccent).toBe("Thailand.");
    expect(homePageContentSchema.parse(homePageContent)).toMatchObject({
      hero: content.hero,
    });
  });

  it("rejects content that does not match the schema", () => {
    expect(() => parseHomePageContent({ hero: {} })).toThrow(/failed validation/);
  });

  it("hides inactive cards and keeps sort order", () => {
    const parsed = parseHomePageContent(homePageContent);
    const [explore, purchases, gift] = parsed.features.items;

    if (!explore || !purchases || !gift) {
      throw new Error("expected three feature cards in mock data");
    }

    const view = toHomePageViewModel({
      ...parsed,
      features: {
        ...parsed.features,
        items: [
          { ...gift, order: 1, isActive: false },
          { ...explore, order: 3, isActive: true },
          { ...purchases, order: 2, isActive: true },
        ],
      },
    });

    expect(view.features.items).toHaveLength(2);
    expect(view.features.items.map((item) => item.id)).toEqual([
      "purchases",
      "explore",
    ]);
  });
});
