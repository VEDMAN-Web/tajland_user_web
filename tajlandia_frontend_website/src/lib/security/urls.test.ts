import { describe, expect, it } from "vitest";
import {
  isSafeHttpUrl,
  isSameOriginUrl,
  joinSameOriginUrl,
  resolveInternalPath,
  toSafeExternalUrl,
} from "./urls";

describe("url security helpers", () => {
  it("accepts http and https URLs", () => {
    expect(isSafeHttpUrl("https://example.com/path")).toBe(true);
    expect(isSafeHttpUrl("http://localhost:3000")).toBe(true);
  });

  it("rejects javascript and malformed URLs", () => {
    expect(isSafeHttpUrl("javascript:alert(1)")).toBe(false);
    expect(isSafeHttpUrl("not-a-url")).toBe(false);
    expect(toSafeExternalUrl("javascript:alert(1)")).toBeNull();
  });

  it("rejects protocol-relative, backslash, and data URLs", () => {
    expect(resolveInternalPath("//evil.com")).toBeNull();
    expect(resolveInternalPath("/explore")).toBe("/explore");
    expect(resolveInternalPath("https://evil.com")).toBeNull();
    expect(resolveInternalPath("/https://evil.com")).toBeNull();
    expect(resolveInternalPath("/\\evil.com")).toBeNull();
    expect(isSafeHttpUrl("data:text/html;base64,PHNjcmlwdD4=")).toBe(false);
  });

  it("keeps API paths on the same origin", () => {
    const url = joinSameOriginUrl("https://api.tajlandia.test/v1", "/home");
    expect(url?.toString()).toBe("https://api.tajlandia.test/v1/home");
    expect(
      joinSameOriginUrl("https://api.tajlandia.test", "https://evil.com"),
    ).toBeNull();
    expect(joinSameOriginUrl("https://api.tajlandia.test", "http:evil.com")).toBeNull();
    expect(joinSameOriginUrl("https://api.tajlandia.test", "\\\\evil.com")).toBeNull();
  });

  it("compares origins safely", () => {
    expect(isSameOriginUrl("/explore", "http://localhost:3000")).toBe(true);
    expect(isSameOriginUrl("https://evil.test", "http://localhost:3000")).toBe(false);
    expect(isSameOriginUrl("http://[", "http://localhost:3000")).toBe(false);
    expect(isSameOriginUrl("/explore", "not-a-valid-origin")).toBe(false);
  });

  it("returns null when the API base URL cannot be parsed", () => {
    expect(joinSameOriginUrl("http://[", "/home")).toBeNull();
    expect(joinSameOriginUrl("not-a-url", "/home")).toBeNull();
  });
});
