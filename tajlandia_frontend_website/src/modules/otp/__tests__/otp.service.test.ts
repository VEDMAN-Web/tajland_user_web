import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError, RATE_LIMITED_MESSAGE } from "@/lib/api/errors";
import { requestOtpAction, resendOtpAction, verifyOtpAction } from "../services/otp.service";

const apiPost = vi.hoisted(() => vi.fn());

vi.mock("@/lib/api/client", async () => {
  const errors = await import("@/lib/api/errors");
  return { apiPost, isApiError: errors.isApiError };
});

describe("otp service rate limiting", () => {
  beforeEach(() => {
    apiPost.mockReset();
  });

  it("flags a rate-limited resend so the page can restart its cooldown", async () => {
    apiPost.mockRejectedValue(new ApiError("ThrottlerException: Too Many Requests", 429));

    await expect(resendOtpAction("user@example.com")).resolves.toEqual({
      ok: false,
      message: RATE_LIMITED_MESSAGE,
      rateLimited: true,
    });
  });

  it("shows the rate-limit message when requesting an OTP", async () => {
    apiPost.mockRejectedValue(new ApiError("The request failed", 429));

    await expect(requestOtpAction("user@example.com")).resolves.toEqual({
      ok: false,
      message: RATE_LIMITED_MESSAGE,
    });
  });

  it("shows the rate-limit message when verifying an OTP", async () => {
    apiPost.mockRejectedValue(new ApiError("The request failed", 429));

    await expect(verifyOtpAction("user@example.com", "123456")).resolves.toEqual({
      ok: false,
      message: RATE_LIMITED_MESSAGE,
    });
  });

  it("keeps the generic message for other resend failures", async () => {
    apiPost.mockRejectedValue(new ApiError("The request failed", 500));

    await expect(resendOtpAction("user@example.com")).resolves.toEqual({
      ok: false,
      message: "Unable to resend OTP right now. Please try again.",
    });
  });
});
