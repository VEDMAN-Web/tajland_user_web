import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { createElement } from "react";
import { afterEach, vi } from "vitest";

process.env.NEXT_PUBLIC_SITE_URL ??= "http://localhost:3000";
process.env.NEXT_PUBLIC_SITE_NAME ??= "Tajlandia";

vi.mock("server-only", () => ({}));

vi.mock("next/image", () => ({
  default: ({
    alt,
    src,
    fill,
    ...props
  }: {
    alt: string;
    src: string;
    fill?: boolean;
    className?: string;
  }) =>
    createElement("img", {
      alt,
      src,
      className: props.className,
      "data-fill": fill ? "true" : undefined,
    }),
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/",
}));

// jsdom has no IntersectionObserver; scroll-reveal components only need it to exist.
if (typeof globalThis.IntersectionObserver === "undefined") {
  globalThis.IntersectionObserver = class {
    readonly root = null;
    readonly rootMargin = "0px";
    readonly thresholds = [];
    observe() {}
    unobserve() {}
    disconnect() {}
    takeRecords() {
      return [];
    }
  } as unknown as typeof IntersectionObserver;
}

afterEach(() => {
  cleanup();
});
