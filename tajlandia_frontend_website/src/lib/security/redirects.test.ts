import { describe, expect, it } from "vitest";
import { toSafeInternalRedirect } from "./redirects";
import { routes } from "@/lib/constants/routes";

describe("toSafeInternalRedirect", () => {
  it("allows known app routes", () => {
    expect(toSafeInternalRedirect(routes.explore)).toBe("/explore");
    expect(toSafeInternalRedirect("/contact")).toBe("/contact");
  });

  it("keeps the query string of a known route", () => {
    expect(toSafeInternalRedirect("/dashboard/explore?regionId=abc&region=Phuket")).toBe(
      "/dashboard/explore?regionId=abc&region=Phuket",
    );
  });

  it("rejects open redirects and unknown paths", () => {
    expect(toSafeInternalRedirect("https://evil.test")).toBeNull();
    expect(toSafeInternalRedirect("//evil.test")).toBeNull();
    expect(toSafeInternalRedirect("/admin")).toBeNull();
    expect(toSafeInternalRedirect("/admin?next=/dashboard")).toBeNull();
    expect(toSafeInternalRedirect("")).toBeNull();
    expect(toSafeInternalRedirect(null)).toBeNull();
  });
});
