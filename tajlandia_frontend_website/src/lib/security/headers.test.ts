import { describe, expect, it } from "vitest";
import { getStaticSecurityHeaders } from "./headers";

describe("getStaticSecurityHeaders", () => {
  it("sets clickjacking and MIME sniffing protections", () => {
    const headers = getStaticSecurityHeaders(false);
    expect(headers).toContainEqual({ key: "X-Frame-Options", value: "DENY" });
    expect(headers).toContainEqual({
      key: "X-Content-Type-Options",
      value: "nosniff",
    });
    expect(headers.some((header) => header.key === "Strict-Transport-Security")).toBe(
      false,
    );
  });

  it("adds HSTS only in production", () => {
    const headers = getStaticSecurityHeaders(true);
    expect(headers).toContainEqual({
      key: "Strict-Transport-Security",
      value: "max-age=63072000; includeSubDomains; preload",
    });
  });
});
