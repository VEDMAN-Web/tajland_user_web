import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { proxyToBackend } from "./backend-proxy";
import { resetServerEnvCache } from "@/lib/config/server-env";

const API_URL = "https://api.tajlandia.test/api/v1";

function makeRequest(url: string, init: RequestInit & { token?: string | null } = {}) {
  const { token = "abc", ...rest } = init;
  const headers = new Headers(rest.headers);
  if (token) headers.set("authorization", `Bearer ${token}`);
  return new Request(`http://localhost${url}`, { ...rest, headers });
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

beforeEach(() => {
  process.env.NEXT_PUBLIC_API_URL = API_URL;
});

afterEach(() => {
  resetServerEnvCache();
  delete process.env.NEXT_PUBLIC_API_URL;
});

describe("proxyToBackend", () => {
  it("forwards GET with token and query string to the backend", async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValue(jsonResponse({ success: true, data: [] }));

    const response = await proxyToBackend(
      makeRequest("/api/backend/explore/map?bbox=97.3,5.6,105.6,20.5"),
      ["explore", "map"],
      { fetchImpl },
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ success: true, data: [] });
    const [url, init] = fetchImpl.mock.calls[0] as [URL, RequestInit];
    expect(url.toString()).toBe(`${API_URL}/explore/map?bbox=97.3,5.6,105.6,20.5`);
    expect(new Headers(init.headers).get("authorization")).toBe("Bearer abc");
    expect(init.method).toBe("GET");
  });

  it("forwards a JSON body on POST", async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValue(jsonResponse({ success: true, data: {} }, 201));

    const response = await proxyToBackend(
      makeRequest("/api/backend/reservations", {
        method: "POST",
        body: JSON.stringify({ plotId: "p1" }),
      }),
      ["reservations"],
      { fetchImpl },
    );

    expect(response.status).toBe(201);
    const [, init] = fetchImpl.mock.calls[0] as [URL, RequestInit];
    expect(init.body).toBe(JSON.stringify({ plotId: "p1" }));
    expect(new Headers(init.headers).get("content-type")).toBe("application/json");
  });

  it("rejects paths outside the allowlist", async () => {
    const fetchImpl = vi.fn();

    const response = await proxyToBackend(
      makeRequest("/api/backend/auth/me"),
      ["auth", "me"],
      {
        fetchImpl,
      },
    );

    expect(response.status).toBe(404);
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("allows the user dashboard and coupons but not the admin dashboard", async () => {
    const fetchImpl = vi
      .fn()
      .mockImplementation(() =>
        Promise.resolve(jsonResponse({ success: true, data: {} })),
      );

    const user = await proxyToBackend(
      makeRequest("/api/backend/dashboard"),
      ["dashboard"],
      {
        fetchImpl,
      },
    );
    const admin = await proxyToBackend(
      makeRequest("/api/backend/dashboard/admin/overview"),
      ["dashboard", "admin", "overview"],
      { fetchImpl },
    );

    expect(user.status).toBe(200);
    expect(admin.status).toBe(404);
    expect(fetchImpl).toHaveBeenCalledTimes(1);

    const coupons = await proxyToBackend(
      makeRequest("/api/backend/coupons"),
      ["coupons"],
      {
        fetchImpl,
      },
    );
    expect(coupons.status).toBe(200);
  });

  it("rejects traversal and unsafe segments", async () => {
    const fetchImpl = vi.fn();

    for (const segments of [
      ["explore", ".."],
      ["explore", "a/b"],
      ["explore", "x?y"],
      [],
    ]) {
      const response = await proxyToBackend(makeRequest("/api/backend/x"), segments, {
        fetchImpl,
      });
      expect(response.status).toBe(404);
    }
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("requires a Bearer token", async () => {
    const fetchImpl = vi.fn();

    const response = await proxyToBackend(
      makeRequest("/api/backend/explore/map", { token: null }),
      ["explore", "map"],
      { fetchImpl },
    );

    expect(response.status).toBe(401);
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("rejects unsupported methods and invalid JSON bodies", async () => {
    const fetchImpl = vi.fn();

    const head = await proxyToBackend(
      makeRequest("/api/backend/cart", { method: "HEAD" }),
      ["cart"],
      {
        fetchImpl,
      },
    );
    const badBody = await proxyToBackend(
      makeRequest("/api/backend/cart/items", { method: "POST", body: "not json" }),
      ["cart", "items"],
      { fetchImpl },
    );

    expect(head.status).toBe(405);
    expect(badBody.status).toBe(400);
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("returns 500 when the API is not configured", async () => {
    delete process.env.NEXT_PUBLIC_API_URL;
    resetServerEnvCache();

    const response = await proxyToBackend(makeRequest("/api/backend/plots"), ["plots"], {
      fetchImpl: vi.fn(),
    });

    expect(response.status).toBe(500);
  });

  it("keeps the backend status but hides unsafe error bodies", async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({ message: "Plot is currently locked" }, 409))
      .mockResolvedValueOnce(new Response("db password=<secret>", { status: 500 }));

    const conflict = await proxyToBackend(
      makeRequest("/api/backend/reservations"),
      ["reservations"],
      {
        fetchImpl,
      },
    );
    const crash = await proxyToBackend(makeRequest("/api/backend/plots"), ["plots"], {
      fetchImpl,
    });

    expect(conflict.status).toBe(409);
    await expect(conflict.json()).resolves.toEqual({
      success: false,
      message: "Plot is currently locked",
    });
    expect(crash.status).toBe(500);
    await expect(crash.json()).resolves.toEqual({
      success: false,
      message: "The request failed",
    });
  });

  it("maps network failures and timeouts", async () => {
    const timeout = new Error("timed out");
    timeout.name = "TimeoutError";
    const fetchImpl = vi
      .fn()
      .mockRejectedValueOnce(timeout)
      .mockRejectedValueOnce(new TypeError("fetch failed"));

    const slow = await proxyToBackend(makeRequest("/api/backend/plots"), ["plots"], {
      fetchImpl,
    });
    const down = await proxyToBackend(makeRequest("/api/backend/plots"), ["plots"], {
      fetchImpl,
    });

    expect(slow.status).toBe(504);
    expect(down.status).toBe(503);
  });

  it("rejects non-JSON and oversized success responses", async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(new Response("<html>", { status: 200 }))
      .mockResolvedValueOnce(
        new Response("{}", { status: 200, headers: { "content-length": "999999999" } }),
      );

    const html = await proxyToBackend(makeRequest("/api/backend/plots"), ["plots"], {
      fetchImpl,
    });
    const huge = await proxyToBackend(makeRequest("/api/backend/plots"), ["plots"], {
      fetchImpl,
    });

    expect(html.status).toBe(502);
    expect(huge.status).toBe(502);
  });

  it("turns an empty success body into 204", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(new Response(null, { status: 200 }));

    const response = await proxyToBackend(
      makeRequest("/api/backend/explore/recent-searches", { method: "DELETE" }),
      ["explore", "recent-searches"],
      { fetchImpl },
    );

    expect(response.status).toBe(204);
  });
});
