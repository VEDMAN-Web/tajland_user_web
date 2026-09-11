import { describe, expect, it } from "vitest";
import { homePageContent } from "./home.mock";
import { homePageContentSchema } from "../schemas/home-content.schema";

describe("home mock data", () => {
  it("matches the Home content schema", () => {
    const parsed = homePageContentSchema.parse(homePageContent);

    expect(parsed.features.items).toHaveLength(3);
    expect(parsed.howItWorks.steps).toHaveLength(4);
    expect(parsed.hero.image?.src).toMatch(/^\/images\/home\//);
  });

  it("rejects remote image paths", () => {
    const result = homePageContentSchema.safeParse({
      ...homePageContent,
      hero: {
        ...homePageContent.hero,
        image: {
          src: "https://evil.test/hero.jpg",
          alt: "x",
          width: 100,
          height: 100,
        },
      },
    });

    expect(result.success).toBe(false);
  });
});
