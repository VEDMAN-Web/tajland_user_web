import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError, RATE_LIMITED_MESSAGE } from "@/lib/api/errors";
import { loginAction } from "../services/login.service";

const apiPost = vi.hoisted(() => vi.fn());

vi.mock("@/lib/api/client", async () => {
  const errors = await import("@/lib/api/errors");
  return { apiPost, isApiError: errors.isApiError };
});

const credentials = { email: "user@example.com", password: "Password123!" };

describe("loginAction rate limiting", () => {
  beforeEach(() => {
    apiPost.mockReset();
  });

  it("shows the rate-limit message on 429", async () => {
    apiPost.mockRejectedValue(new ApiError("The request failed", 429));

    await expect(loginAction(credentials)).resolves.toEqual({
      ok: false,
      message: RATE_LIMITED_MESSAGE,
    });
  });

  it("still says invalid credentials on 401", async () => {
    apiPost.mockRejectedValue(new ApiError("The request failed", 401));

    await expect(loginAction(credentials)).resolves.toEqual({
      ok: false,
      message: "Invalid email or password.",
    });
  });
});
