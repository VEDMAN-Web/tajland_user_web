import { describe, expect, it } from "vitest";
import { isLocalizedPath, localizeHref, splitLocalePath } from "./locale";

describe("locale paths", () => {
  it("splits the Polish prefix", () => {
    expect(splitLocalePath("/pl")).toEqual({ locale: "pl", path: "/" });
    expect(splitLocalePath("/pl/blog")).toEqual({ locale: "pl", path: "/blog" });
    expect(splitLocalePath("/pl?a=1")).toEqual({ locale: "pl", path: "/?a=1" });
    expect(splitLocalePath("/blog")).toEqual({ locale: "en", path: "/blog" });
    expect(splitLocalePath("/play")).toEqual({ locale: "en", path: "/play" });
  });

  it("only localizes public pages", () => {
    expect(isLocalizedPath("/")).toBe(true);
    expect(isLocalizedPath("/blog/64b0c0ffee64b0c0ffee64b0")).toBe(true);
    expect(isLocalizedPath("/dashboard")).toBe(false);
    expect(isLocalizedPath("/login")).toBe(false);
  });

  it("prefixes hrefs for Polish and keeps query/hash", () => {
    expect(localizeHref("pl", "/")).toBe("/pl");
    expect(localizeHref("pl", "/explore")).toBe("/pl/explore");
    expect(localizeHref("pl", "/#how-it-works")).toBe("/pl#how-it-works");
    expect(localizeHref("pl", "/login")).toBe("/login");
    expect(localizeHref("pl", "https://example.com/blog")).toBe("https://example.com/blog");
    expect(localizeHref("en", "/explore")).toBe("/explore");
  });
});

import { isTranslatedPath } from "./locale";

describe("translated pages", () => {
  it("lists only fully translated paths", () => {
    expect(isTranslatedPath("/")).toBe(true);
    expect(isTranslatedPath("/blog")).toBe(false);
  });
});
