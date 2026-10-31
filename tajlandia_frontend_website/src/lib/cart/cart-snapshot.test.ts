import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/api/errors";

const authedGet = vi.fn();
vi.mock("@/lib/api/browser-client", () => ({
  authedGet: (...args: unknown[]) => authedGet(...args),
  isAbortError: (error: unknown) => error instanceof ApiError && error.code === "API_ABORTED",
}));

const TOKEN_KEY = "tajlandia_auth_token";

// The store is module state, so each test loads a fresh copy.
async function loadStore() {
  vi.resetModules();
  return import("./cart-snapshot");
}

const cartData = (totalRai: number, total: number, items = 1) => ({
  items: Array.from({ length: items }, () => ({ sizeRai: totalRai / items, subtotal: total / items })),
  totalRai,
  minimumRai: 100,
  total,
});

async function settle() {
  await new Promise((resolve) => setTimeout(resolve, 0));
}

beforeEach(() => {
  authedGet.mockReset();
  localStorage.setItem(TOKEN_KEY, "token-123");
});

afterEach(() => {
  localStorage.clear();
});

describe("cart snapshot", () => {
  it("loads the cart's count, Rai, minimum and total", async () => {
    authedGet.mockResolvedValue(cartData(4.5, 0.045, 2));
    const { refreshCartSnapshot, useCartSnapshot } = await loadStore();
    const { renderHook } = await import("@testing-library/react");
    const { result } = renderHook(() => useCartSnapshot());
    refreshCartSnapshot();
    await settle();
    expect(result.current).toEqual({ count: 2, totalRai: 4.5, minimumRai: 100, total: 0.045 });
  });

  it("falls back to the items' sums and a 100 Rai minimum when the totals are missing", async () => {
    authedGet.mockResolvedValue({
      items: [
        { sizeRai: 10, subtotal: 1 },
        { sizeRai: 5, subtotal: 0.5 },
      ],
    });
    const { useCartSnapshot } = await loadStore();
    const { renderHook } = await import("@testing-library/react");
    const { result } = renderHook(() => useCartSnapshot());
    await settle();
    expect(result.current).toEqual({ count: 2, totalRai: 15, minimumRai: 100, total: 1.5 });
  });

  it("shows an add and a remove straight away, then takes the server's numbers", async () => {
    authedGet.mockResolvedValueOnce(cartData(10, 1));
    const { applyCartChange, useCartSnapshot } = await loadStore();
    const { renderHook, act } = await import("@testing-library/react");
    const { result } = renderHook(() => useCartSnapshot());
    await settle();
    expect(result.current?.count).toBe(1);

    // Server is slow: the optimistic numbers show first.
    let resolveReload: (value: unknown) => void = () => {};
    authedGet.mockReturnValueOnce(new Promise((resolve) => (resolveReload = resolve)));
    act(() => applyCartChange(1, { rai: 5, total: 0.5 }));
    expect(result.current).toMatchObject({ count: 2, totalRai: 15, total: 1.5 });
    await act(async () => resolveReload(cartData(15, 1.5, 2)));
    expect(result.current).toMatchObject({ count: 2, totalRai: 15, total: 1.5 });

    authedGet.mockResolvedValueOnce(cartData(10, 1));
    act(() => applyCartChange(-1, { rai: 5, total: 0.5 }));
    expect(result.current).toMatchObject({ count: 1, totalRai: 10, total: 1 });
  });

  it("never goes below zero and clears to an empty cart", async () => {
    authedGet.mockResolvedValue(cartData(0, 0, 0));
    const { applyCartChange, clearCartSnapshot, useCartSnapshot } = await loadStore();
    const { renderHook, act } = await import("@testing-library/react");
    const { result } = renderHook(() => useCartSnapshot());
    await settle();
    act(() => applyCartChange(-1, { rai: 5, total: 1 }));
    expect(result.current).toMatchObject({ count: 0, totalRai: 0, total: 0 });

    authedGet.mockResolvedValue(cartData(10, 1));
    await act(async () => {
      applyCartChange(1, { rai: 10, total: 1 });
      await settle();
    });
    act(() => clearCartSnapshot());
    expect(result.current).toMatchObject({ count: 0, totalRai: 0, total: 0 });
  });

  it("keeps the last numbers when a reload fails, and drops them when logged out", async () => {
    authedGet.mockResolvedValueOnce(cartData(10, 1));
    const { refreshCartSnapshot, useCartSnapshot } = await loadStore();
    const { renderHook, act } = await import("@testing-library/react");
    const { result } = renderHook(() => useCartSnapshot());
    await settle();

    authedGet.mockRejectedValueOnce(new Error("network"));
    refreshCartSnapshot();
    await settle();
    expect(result.current?.count).toBe(1);

    localStorage.removeItem(TOKEN_KEY);
    act(() => refreshCartSnapshot());
    expect(result.current).toBeNull();
  });
});
