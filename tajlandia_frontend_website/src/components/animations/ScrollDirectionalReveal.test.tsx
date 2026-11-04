import { act, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ScrollDirectionalReveal } from "./ScrollDirectionalReveal";

type ObserverCallback = (entries: Partial<IntersectionObserverEntry>[]) => void;

let observerCallback: ObserverCallback | undefined;
const originalObserver = globalThis.IntersectionObserver;

beforeEach(() => {
  globalThis.IntersectionObserver = class {
    constructor(callback: ObserverCallback) {
      observerCallback = callback;
    }
    observe() {}
    disconnect() {}
  } as unknown as typeof IntersectionObserver;
});

afterEach(() => {
  globalThis.IntersectionObserver = originalObserver;
  observerCallback = undefined;
  vi.restoreAllMocks();
});

function scrollTo(y: number) {
  Object.defineProperty(window, "scrollY", { value: y, configurable: true });
  window.dispatchEvent(new Event("scroll"));
}

function intersect(isIntersecting = true) {
  act(() => {
    observerCallback?.([
      {
        isIntersecting,
        intersectionRatio: isIntersecting ? 0.5 : 0,
      },
    ]);
  });
}

function renderReveal() {
  render(
    <ScrollDirectionalReveal delay={300} reverseDelay={0}>
      <p>Content</p>
    </ScrollDirectionalReveal>,
  );
  return screen.getByText("Content").parentElement as HTMLElement;
}

describe("ScrollDirectionalReveal", () => {
  it("starts hidden", () => {
    const wrapper = renderReveal();
    expect(wrapper).toHaveAttribute("data-reveal", "hidden");
    expect(wrapper.style.opacity).toBe("0");
  });

  it("slides in from the left with `delay` when entering while scrolling down", () => {
    scrollTo(0);
    const wrapper = renderReveal();
    scrollTo(400);
    intersect();
    expect(wrapper).toHaveAttribute("data-reveal", "from-left");
    expect(wrapper.style.animation).toContain("reveal-left");
    expect(wrapper.style.animation).toContain("300ms");
  });

  it("slides in from the right with `reverseDelay` when entering while scrolling up", () => {
    scrollTo(1200);
    const wrapper = renderReveal();
    // One big wheel tick: the element lands fully inside the viewport at once.
    scrollTo(1000);
    intersect();
    expect(wrapper).toHaveAttribute("data-reveal", "from-right");
    expect(wrapper.style.animation).toContain("reveal-right");
    expect(wrapper.style.animation).toContain("0ms");
  });

  it("hides once out of view so the next entry replays", () => {
    scrollTo(0);
    const wrapper = renderReveal();
    scrollTo(400);
    intersect();
    scrollTo(1600);
    intersect(false);
    expect(wrapper).toHaveAttribute("data-reveal", "hidden");
    scrollTo(900);
    intersect();
    expect(wrapper).toHaveAttribute("data-reveal", "from-right");
  });
});
