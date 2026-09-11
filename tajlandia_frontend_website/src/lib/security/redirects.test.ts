import { describe, expect, it } from "vitest";
import { toSafeInternalRedirect } from "./redirects";
import { routes } from "@/lib/constants/routes";

describe("toSafeInternalRedirect", () => {
  it("allows known app routes", () => {
    expect(toSafeInternalRedirect(routes.explore)).toBe("/explore");
    expect(toSafeInternalRedirect("/contact")).toBe("/contact");
  });

  it("rejects open redirects and unknown paths", () => {
    expect(toSafeInternalRedirect("https://evil.test")).toBeNull();
    expect(toSafeInternalRedirect("//evil.test")).toBeNull();
    expect(toSafeInternalRedirect("/admin")).toBeNull();
    expect(toSafeInternalRedirect("")).toBeNull();
    expect(toSafeInternalRedirect(null)).toBeNull();
  });
});
