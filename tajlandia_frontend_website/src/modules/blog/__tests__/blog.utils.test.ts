import { describe, expect, it } from "vitest";
import { blogAuthorName, formatBlogDate } from "../utils/blog.utils";

describe("blog utils", () => {
  it("formats the publish date like the design", () => {
    expect(formatBlogDate("2026-09-03T07:00:00.000Z")).toBe("Sep 03, 2026");
    expect(formatBlogDate("nope")).toBeNull();
  });

  it("falls back to the site name without an author", () => {
    expect(blogAuthorName("Alexander B.")).toBe("Alexander B.");
    expect(blogAuthorName("  ")).toBe("Tajlandia.pl");
    expect(blogAuthorName(null)).toBe("Tajlandia.pl");
  });
});
