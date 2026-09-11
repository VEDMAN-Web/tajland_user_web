import { describe, expect, it } from "vitest";
import { brand } from "./brand";

describe("brand assets", () => {
  it("points the logo at a same-origin image path", () => {
    expect(brand.logo.src).toBe("/images/brand/tajlandia-logo.png");
    expect(brand.logo.src.startsWith("/images/")).toBe(true);
  });
});
