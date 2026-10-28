import { describe, expect, it } from "vitest";
import {
  createBlogPostingJsonLd,
  createBreadcrumbJsonLd,
  createFaqJsonLd,
  createOrganizationJsonLd,
  createWebsiteJsonLd,
  markdownToPlainText,
} from "./json-ld";

describe("createWebsiteJsonLd", () => {
  it("describes the public site without HTML", () => {
    const data = createWebsiteJsonLd();

    expect(data["@type"]).toBe("WebSite");
    expect(data.url).toBe("http://localhost:3000");
    expect(JSON.stringify(data)).not.toContain("<");
  });
});

describe("more JSON-LD", () => {
  it("builds an organization without placeholder contact data", () => {
    const data = createOrganizationJsonLd();
    expect(data["@type"]).toBe("Organization");
    expect(JSON.stringify(data)).not.toContain("company.com");
  });

  it("keeps the Polish locale in breadcrumbs", () => {
    const data = createBreadcrumbJsonLd([{ name: "Home", path: "/" }, { name: "Blog", path: "/blog" }], "pl");
    expect(data.itemListElement[1]?.item).toBe("http://localhost:3000/pl/blog");
  });

  it("turns markdown answers into plain FAQ text and skips empty ones", () => {
    expect(markdownToPlainText("**Yes** - see [terms](https://x.pl/t).")).toBe("Yes - see terms.");
    expect(createFaqJsonLd([{ question: "Q?", answer: "" }])).toBeNull();
    const data = createFaqJsonLd([{ question: "Q?", answer: "A **b**" }]);
    expect(data?.mainEntity[0]?.acceptedAnswer.text).toBe("A b");
  });

  it("only uses absolute http(s) cover images", () => {
    const withImage = createBlogPostingJsonLd({ id: "a".repeat(24), title: "T", image: "https://cdn.example/x.jpg" });
    const without = createBlogPostingJsonLd({ id: "a".repeat(24), title: "T", image: "/relative.jpg" });
    expect(withImage.image).toBe("https://cdn.example/x.jpg");
    expect(without.image).toBeUndefined();
  });
});
