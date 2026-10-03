import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";
import {
  authedDelete,
  authedGet,
  authedPost,
  authedPut,
  isAbortError,
} from "./browser-client";

const TOKEN_KEY = "tajlandia_auth_token";
const schema = z.object({ id: z.string() });

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

const assign = vi.fn();

beforeEach(() => {
  localStorage.setItem(TOKEN_KEY, "token-123");
  vi.stubGlobal("location", {
    ...window.location,
    pathname: "/dashboard/explore",
    assign,
  });
});

afterEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  assign.mockReset();
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe("browser-client", () => {
  it("calls the proxy with the token and query, and returns envelope data", async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValue(
        jsonResponse({ success: true, message: "ok", data: { id: "p1" } }),
      );

    const data = await authedGet("/explore/plots", schema, {
      query: { page: 1, status: "AVAILABLE", zoneId: undefined, regionId: null, q: "" },
      fetchImpl,
    });

    expect(data).toEqual({ id: "p1" });
    const [url, init] = fetchImpl.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("/api/backend/explore/plots?page=1&status=AVAILABLE");
    expect(new Headers(init.headers).get("authorization")).toBe("Bearer token-123");
  });

  it("sends JSON bodies for POST and PUT, none for DELETE", async () => {
    const fetchImpl = vi
      .fn()
      .mockImplementation(() =>
        Promise.resolve(jsonResponse({ success: true, data: { id: "x" } })),
      );

    await authedPost("/reservations", { plotId: "p1" }, schema, { fetchImpl });
    await authedPut("/cart/items/p1", undefined, schema, { fetchImpl });
    await authedDelete("/reservations/r1", schema, { fetchImpl });

    const calls = fetchImpl.mock.calls as [string, RequestInit][];
    expect(calls[0]?.[1]).toMatchObject({ method: "POST", body: '{"plotId":"p1"}' });
    expect(calls[1]?.[1]).toMatchObject({ method: "PUT", body: "{}" });
    expect(calls[2]?.[1]).toMatchObject({ method: "DELETE", body: undefined });
  });

  it("handles 204 responses with a schema that accepts undefined", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(new Response(null, { status: 204 }));

    await expect(
      authedDelete("/explore/recent-searches", z.undefined(), { fetchImpl }),
    ).resolves.toBeUndefined();
    await expect(
      authedDelete("/explore/recent-searches", schema, { fetchImpl }),
    ).rejects.toMatchObject({ code: "API_INVALID_RESPONSE" });
  });

  it("accepts success responses without `data` when the schema allows it", async () => {
    // e.g. DELETE /explore/recent-searches/{id} -> { success, message } only.
    const fetchImpl = vi
      .fn()
      .mockResolvedValue(
        jsonResponse({ success: true, message: "Search deleted successfully" }),
      );

    await expect(
      authedDelete("/explore/recent-searches/1", z.unknown().optional(), { fetchImpl }),
    ).resolves.toBeUndefined();
  });

  it("ends the session and redirects to login on 401", async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValue(jsonResponse({ message: "Unauthorized" }, 401));

    await expect(authedGet("/explore/map", schema, { fetchImpl })).rejects.toMatchObject({
      code: "API_SESSION_EXPIRED",
      status: 401,
    });
    expect(localStorage.getItem(TOKEN_KEY)).toBeNull();
    expect(assign).toHaveBeenCalledWith("/login?next=%2Fdashboard%2Fexplore");
  });

  it("can skip the redirect on 401", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse({}, 401));

    await expect(
      authedGet("/explore/map", schema, { fetchImpl, redirectOnUnauthorized: false }),
    ).rejects.toMatchObject({ code: "API_SESSION_EXPIRED" });
    expect(assign).not.toHaveBeenCalled();
  });

  it("does not call the API without a token", async () => {
    localStorage.clear();
    const fetchImpl = vi.fn();

    await expect(authedGet("/explore/map", schema, { fetchImpl })).rejects.toMatchObject({
      code: "API_SESSION_EXPIRED",
    });
    expect(fetchImpl).not.toHaveBeenCalled();
    expect(assign).toHaveBeenCalledWith("/login?next=%2Fdashboard%2Fexplore");
  });

  it("surfaces safe backend messages on failure", async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(
        jsonResponse({ success: false, message: "Plot is currently locked" }, 409),
      )
      .mockResolvedValueOnce(
        jsonResponse({
          success: false,
          message: "Minimum rai not reached",
          data: { id: "x" },
        }),
      );

    await expect(authedGet("/reservations", schema, { fetchImpl })).rejects.toMatchObject(
      {
        status: 409,
        code: "API_REQUEST_FAILED",
        message: "Plot is currently locked",
      },
    );
    await expect(authedGet("/cart", schema, { fetchImpl })).rejects.toMatchObject({
      code: "API_REQUEST_FAILED",
      message: "Minimum rai not reached",
    });
  });

  it("rejects responses that do not match the schema", async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValue(jsonResponse({ success: true, data: { nope: 1 } }));

    await expect(authedGet("/plots", schema, { fetchImpl })).rejects.toMatchObject({
      code: "API_INVALID_RESPONSE",
    });
  });

  it("rejects unsafe paths before calling fetch", async () => {
    const fetchImpl = vi.fn();

    for (const path of ["explore", "/explore/../auth", "//evil.test", "/x\\y"]) {
      await expect(authedGet(path, schema, { fetchImpl })).rejects.toMatchObject({
        code: "INVALID_API_PATH",
      });
    }
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("reports caller aborts separately from network errors", async () => {
    const controller = new AbortController();
    controller.abort();
    const fetchImpl = vi.fn((_url: string, init: RequestInit) =>
      init.signal?.aborted
        ? Promise.reject(new DOMException("aborted", "AbortError"))
        : Promise.reject(new TypeError("offline")),
    );

    const aborted = await authedGet("/plots", schema, {
      fetchImpl: fetchImpl as unknown as typeof fetch,
      signal: controller.signal,
    }).catch((error: unknown) => error);
    const offline = await authedGet("/plots", schema, {
      fetchImpl: fetchImpl as unknown as typeof fetch,
    }).catch((error: unknown) => error);

    expect(isAbortError(aborted)).toBe(true);
    expect(isAbortError(offline)).toBe(false);
    expect(offline).toMatchObject({ code: "API_UNAVAILABLE" });
  });

  it("times out slow requests", async () => {
    vi.useFakeTimers();
    const fetchImpl = vi.fn(
      (_url: string, init: RequestInit) =>
        new Promise<Response>((_resolve, reject) => {
          init.signal?.addEventListener("abort", () =>
            reject(new DOMException("aborted", "AbortError")),
          );
        }),
    );

    const pending = authedGet("/plots", schema, {
      fetchImpl: fetchImpl as unknown as typeof fetch,
      timeoutMs: 1_000,
    }).catch((error: unknown) => error);
    await vi.advanceTimersByTimeAsync(1_000);

    await expect(pending).resolves.toMatchObject({ code: "API_TIMEOUT" });
  });
});
