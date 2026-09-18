import { afterEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { ApiError, apiGet, isApiError } from "./client";
import { resetServerEnvCache } from "@/lib/config/server-env";

const schema = z.object({ id: z.string() });

afterEach(() => {
  resetServerEnvCache();
  delete process.env.NEXT_PUBLIC_API_URL;
  delete process.env.API_SECRET;
});

describe("apiGet", () => {
  it("throws when the API is not configured", async () => {
    await expect(apiGet("/home", schema)).rejects.toMatchObject({
      code: "API_NOT_CONFIGURED",
    });
  });

  it("rejects absolute URLs", async () => {
    process.env.NEXT_PUBLIC_API_URL = "https://api.tajlandia.test";
    await expect(apiGet("https://evil.test/x", schema)).rejects.toBeInstanceOf(ApiError);
  });

  it("returns validated JSON on success", async () => {
    process.env.NEXT_PUBLIC_API_URL = "https://api.tajlandia.test";
    const fetchImpl = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ id: "home" }), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );

    await expect(apiGet("/home", schema, { fetchImpl })).resolves.toEqual({ id: "home" });
    expect(fetchImpl).toHaveBeenCalledOnce();
  });

  it("does not leak response bodies on failure", async () => {
    process.env.NEXT_PUBLIC_API_URL = "https://api.tajlandia.test";
    const fetchImpl = vi
      .fn()
      .mockResolvedValue(new Response("internal db password=secret", { status: 500 }));

    await expect(apiGet("/home", schema, { fetchImpl })).rejects.toMatchObject({
      code: "API_REQUEST_FAILED",
      message: "The request failed",
    });
  });

  it("rejects schema-invalid payloads", async () => {
    process.env.NEXT_PUBLIC_API_URL = "https://api.tajlandia.test";
    const fetchImpl = vi
      .fn()
      .mockResolvedValue(new Response(JSON.stringify({ nope: true }), { status: 200 }));

    await expect(apiGet("/home", schema, { fetchImpl })).rejects.toMatchObject({
      code: "API_INVALID_RESPONSE",
    });
  });

  it("rejects oversized responses and identifies API errors", async () => {
    process.env.NEXT_PUBLIC_API_URL = "https://api.tajlandia.test";
    const fetchImpl = vi.fn().mockResolvedValue(
      new Response("{}", {
        status: 200,
        headers: { "content-length": "2000000" },
      }),
    );

    const error = await apiGet("/home", schema, { fetchImpl }).catch((value) => value);
    expect(isApiError(error)).toBe(true);
    expect(error).toMatchObject({ code: "API_RESPONSE_TOO_LARGE" });
    expect(isApiError(new Error("nope"))).toBe(false);
  });

  it("sends the server secret and maps timeouts", async () => {
    process.env.NEXT_PUBLIC_API_URL = "https://api.tajlandia.test";
    process.env.API_SECRET = "super-secret-key-1";

    const fetchImpl = vi.fn().mockImplementation((_url, init: RequestInit) => {
      const headers = new Headers(init.headers);
      expect(headers.get("Authorization")).toBe("Bearer super-secret-key-1");

      return new Promise((_, reject) => {
        init.signal?.addEventListener("abort", () => {
          const abortError = new Error("Aborted");
          abortError.name = "AbortError";
          reject(abortError);
        });
      });
    });

    await expect(
      apiGet("/home", schema, { fetchImpl, timeoutMs: 10 }),
    ).rejects.toMatchObject({
      code: "API_TIMEOUT",
    });
  });

  it("maps network failures to a generic unavailable error", async () => {
    process.env.NEXT_PUBLIC_API_URL = "https://api.tajlandia.test";
    const fetchImpl = vi.fn().mockRejectedValue(new Error("ECONNRESET"));

    await expect(apiGet("/home", schema, { fetchImpl })).rejects.toMatchObject({
      code: "API_UNAVAILABLE",
      message: "Unable to reach the API",
    });
  });
});
