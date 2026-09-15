import { afterEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { ApiError, apiGet, apiPost, isApiError } from "./client";
import { resetPublicEnvCache } from "@/lib/config/public-env";

const schema = z.object({ id: z.string() });

afterEach(() => {
  resetPublicEnvCache();
  delete process.env.NEXT_PUBLIC_API_URL;
  delete process.env.API_SECRET;
  window.localStorage.clear();
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

  it("sends the stored access token and maps timeouts", async () => {
    process.env.NEXT_PUBLIC_API_URL = "https://api.tajlandia.test";
    window.localStorage.setItem("tajlandia_access_token", "access-token");

    const fetchImpl = vi.fn().mockImplementation((_url, init: RequestInit) => {
      const headers = new Headers(init.headers);
      expect(headers.get("Authorization")).toBe("Bearer access-token");

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

describe("apiPost", () => {
  it("uses the configured API base URL and sends the JSON body", async () => {
    process.env.NEXT_PUBLIC_API_URL = "https://tajlandai-backend.onrender.com/api/v1";
    const fetchImpl = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ id: "login" }), { status: 200 }),
    );

    await apiPost("/auth/login", { email: "", password: "" }, schema, { fetchImpl });

    expect(fetchImpl).toHaveBeenCalledWith(
      new URL("https://tajlandai-backend.onrender.com/api/v1/auth/login"),
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ email: "", password: "" }),
      }),
    );
  });
});
