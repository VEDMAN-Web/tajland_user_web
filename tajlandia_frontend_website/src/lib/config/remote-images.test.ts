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

  it("accepts uploads from the backend host only", () => {
    const apiUrl = "https://api.tajlandia.test/api/v1";
    expect(isAllowedRemoteImage("https://api.tajlandia.test/uploads/userProfile/a.jpg", apiUrl)).toBe(true);
    expect(isAllowedRemoteImage("https://api.tajlandia.test/api/v1/orders", apiUrl)).toBe(false);
    expect(isAllowedRemoteImage("https://other.test/uploads/a.jpg", apiUrl)).toBe(false);
    expect(isAllowedRemoteImage("https://api.tajlandia.test/uploads/a.jpg", "")).toBe(false);
  });
});
