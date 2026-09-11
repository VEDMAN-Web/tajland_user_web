import { describe, expect, it } from "vitest";
import { createWebsiteJsonLd } from "./json-ld";

describe("createWebsiteJsonLd", () => {
  it("describes the public site without HTML", () => {
    const data = createWebsiteJsonLd();

    expect(data["@type"]).toBe("WebSite");
    expect(data.url).toBe("http://localhost:3000");
    expect(JSON.stringify(data)).not.toContain("<");
  });
});
