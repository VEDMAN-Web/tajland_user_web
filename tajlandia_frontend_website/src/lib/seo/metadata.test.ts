import { describe, expect, it } from "vitest";
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
});
