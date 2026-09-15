import { describe, expect, it } from "vitest";
import { buildContentSecurityPolicy } from "./csp";

describe("buildContentSecurityPolicy", () => {
  it("uses a nonce and omits unsafe-inline in production", () => {
    const policy = buildContentSecurityPolicy({ nonce: "abc123", isDev: false });

    expect(policy).toContain("nonce-abc123");
    expect(policy).toContain("strict-dynamic");
    expect(policy).toContain("frame-ancestors 'none'");
    expect(policy).toContain("connect-src 'self'");
    expect(policy).toContain("media-src 'self'");
    expect(policy).toContain("frame-src 'none'");
    expect(policy).not.toContain("unsafe-inline");
    expect(policy).not.toContain("unsafe-eval");
  });

  it("allows unsafe-eval only in development", () => {
    const policy = buildContentSecurityPolicy({ nonce: "devnonce", isDev: true });

    expect(policy).toContain("unsafe-eval");
    expect(policy).not.toContain("unsafe-inline");
  });
});
