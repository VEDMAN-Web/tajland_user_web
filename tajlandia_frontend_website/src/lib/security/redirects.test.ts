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

  it("allows a leaderboard owner's profile", () => {
    const path = "/dashboard/leaderboard/6aab6ed207ecb69641182ace";
    expect(toSafeInternalRedirect(path)).toBe(path);
  });

  it("rejects leaderboard paths that are not an owner id", () => {
    expect(toSafeInternalRedirect("/dashboard/leaderboard/not-an-id")).toBeNull();
    expect(toSafeInternalRedirect("/dashboard/leaderboard/6aab6ed207ecb69641182ace/extra")).toBeNull();
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
