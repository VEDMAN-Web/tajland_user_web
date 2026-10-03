import { describe, expect, it } from "vitest";
import { isAllowedRemoteImage } from "./remote-images";

describe("isAllowedRemoteImage", () => {
  it("accepts https images from an allowed host", () => {
    expect(isAllowedRemoteImage("https://i.postimg.cc/tTd9x7T1/phuket.png")).toBe(true);
  });

  it("rejects other hosts, http and invalid values", () => {
    expect(isAllowedRemoteImage("https://evil.test/x.png")).toBe(false);
    expect(isAllowedRemoteImage("http://i.postimg.cc/x.png")).toBe(false);
    expect(isAllowedRemoteImage("not a url")).toBe(false);
    expect(isAllowedRemoteImage(null)).toBe(false);
    expect(isAllowedRemoteImage(undefined)).toBe(false);
  });
});
