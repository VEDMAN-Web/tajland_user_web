import { describe, expect, it, vi } from "vitest";
import { createPageMetadata, serializeJsonLd } from "./metadata";

describe("serializeJsonLd", () => {
  it("escapes HTML-breaking characters", () => {
    expect(serializeJsonLd({ name: "</script><script>alert(1)" })).toContain("\\u003c");
    expect(serializeJsonLd({ name: "</script><script>alert(1)" })).not.toContain(
      "</script>",
    );
  });
});

describe("createPageMetadata", () => {
  it("builds canonical metadata for a safe path", () => {
    const metadata = createPageMetadata({
      title: "Home",
      description: "Desc",
      path: "/",
    });

    expect(metadata.alternates?.canonical).toBe("http://localhost:3000/");
    expect(metadata.openGraph?.url).toBe("http://localhost:3000/");
  });

  it("rejects protocol-relative metadata paths", () => {
    expect(() =>
      createPageMetadata({
        title: "x",
        description: "y",
        path: "//evil.test",
      }),
    ).toThrow(/same-origin/);
  });

  it("can mark a page as noindex", () => {
    const metadata = createPageMetadata({
      title: "Blog",
      description: "Soon",
      path: "/blog",
      index: false,
    });

    expect(metadata.robots).toEqual({ index: false, follow: false });
  });

  it("gives Polish pages their own canonical, hreflang pair and locale", () => {
    const metadata = createPageMetadata({ title: "x", description: "y", path: "/", locale: "pl" });

    expect(metadata.alternates?.canonical).toBe("http://localhost:3000/pl");
    expect(metadata.alternates?.languages).toEqual({
      en: "http://localhost:3000/",
      pl: "http://localhost:3000/pl",
      "x-default": "http://localhost:3000/",
    });
    expect(metadata.openGraph?.locale).toBe("pl_PL");
    expect(metadata.robots).toEqual({ index: true, follow: true });
  });

  it("keeps untranslated Polish pages out of the index", () => {
    const metadata = createPageMetadata({ title: "x", description: "y", path: "/blog", locale: "pl" });

    expect(metadata.robots).toEqual({ index: false, follow: false });
    expect(metadata.alternates?.languages).toBeUndefined();
  });

  it("adds the default share image", () => {
    const metadata = createPageMetadata({ title: "x", description: "y", path: "/faq" });

    expect(JSON.stringify(metadata.openGraph)).toContain("/images/brand/og-default.jpg");
  });

  it("is noindex on hosts flagged NEXT_PUBLIC_NOINDEX", () => {
    vi.stubEnv("NEXT_PUBLIC_NOINDEX", "true");
    const metadata = createPageMetadata({ title: "x", description: "y", path: "/" });
    vi.unstubAllEnvs();

    expect(metadata.robots).toEqual({ index: false, follow: false });
  });
});
