import { describe, expect, it } from "vitest";
import { buildContentSecurityPolicy } from "./csp";

describe("buildContentSecurityPolicy", () => {
  it("allows Next.js production hydration scripts", () => {
    const policy = buildContentSecurityPolicy({ nonce: "abc123", isDev: false });

    expect(policy).toContain("script-src 'self' 'unsafe-inline'");
    expect(policy).toContain("frame-ancestors 'none'");
    expect(policy).toContain("connect-src 'self'");
    expect(policy).toContain("media-src 'self'");
    expect(policy).toContain("frame-src https://accounts.google.com/gsi/");
    expect(policy).not.toContain("unsafe-eval");
  });

  it("allows Google Identity Services for Sign in with Google", () => {
    const policy = buildContentSecurityPolicy({ nonce: "abc123", isDev: false });

    expect(policy).toContain("https://accounts.google.com/gsi/client");
    expect(policy).toContain("https://accounts.google.com/gsi/style");
    expect(policy).toMatch(/connect-src [^;]*https:\/\/accounts\.google\.com\/gsi\//);
  });

  it("allows unsafe-eval only in development", () => {
    const policy = buildContentSecurityPolicy({ nonce: "devnonce", isDev: true });

    expect(policy).toContain("unsafe-eval");
    expect(policy).toContain("style-src 'self' 'unsafe-inline'");
    expect(policy).not.toContain("style-src 'self' 'nonce-devnonce'");
  });
});
