import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/api/errors";
import { resetPasswordAction, verifyPasswordResetOtpAction } from "../services/reset-password.service";

const apiPost = vi.hoisted(() => vi.fn());
const cookieJar = vi.hoisted(() => new Map<string, string>());

vi.mock("@/lib/api/client", async () => {
  const errors = await import("@/lib/api/errors");
  return { apiPost, isApiError: errors.isApiError };
});

vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) => (cookieJar.has(name) ? { value: cookieJar.get(name) } : undefined),
    set: (name: string, value: string) => void cookieJar.set(name, value),
    delete: (name: string) => void cookieJar.delete(name),
  }),
}));

const passwords = { newPassword: "NewPass@123", confirmPassword: "NewPass@123" };

describe("password reset token flow", () => {
  beforeEach(() => {
    apiPost.mockReset();
    cookieJar.clear();
  });

  it("keeps the reset token from OTP verification and sends it with the new password", async () => {
    apiPost.mockResolvedValueOnce({ success: true, message: "ok", data: { resetToken: "tok-1" } });
    await expect(verifyPasswordResetOtpAction("user@example.com", "123456")).resolves.toMatchObject({ ok: true });

    apiPost.mockResolvedValueOnce({ success: true, message: "done" });
    await expect(resetPasswordAction("user@example.com", passwords)).resolves.toMatchObject({ ok: true });

    expect(apiPost).toHaveBeenLastCalledWith(
      "/auth/reset-password",
      { email: "user@example.com", resetToken: "tok-1", ...passwords },
      expect.anything(),
      expect.anything(),
    );
  });

  it("fails when the OTP response has no reset token", async () => {
    apiPost.mockResolvedValueOnce({ success: true, message: "ok", data: { isEmailVerified: true } });

    await expect(verifyPasswordResetOtpAction("user@example.com", "123456")).resolves.toMatchObject({ ok: false });
    await expect(resetPasswordAction("user@example.com", passwords)).resolves.toMatchObject({ ok: false });
    expect(apiPost).toHaveBeenCalledTimes(1);
  });

  it("does not call the API to reset without a verified token, and asks for a new code", async () => {
    await expect(resetPasswordAction("user@example.com", passwords)).resolves.toEqual({
      ok: false,
      message: "Your password reset session has expired. Please request a new code.",
      needsNewCode: true,
    });
    expect(apiPost).not.toHaveBeenCalled();
  });

  it("uses the token once: a second reset needs a new verification", async () => {
    apiPost.mockResolvedValueOnce({ success: true, message: "ok", data: { resetToken: "tok-1" } });
    await verifyPasswordResetOtpAction("user@example.com", "123456");
    apiPost.mockResolvedValueOnce({ success: true, message: "done" });
    await resetPasswordAction("user@example.com", passwords);

    await expect(resetPasswordAction("user@example.com", passwords)).resolves.toMatchObject({ ok: false });
    expect(apiPost).toHaveBeenCalledTimes(2);
  });

  it("shows a clear message when the backend rejects an expired or used token", async () => {
    apiPost.mockResolvedValueOnce({ success: true, message: "ok", data: { resetToken: "tok-1" } });
    await verifyPasswordResetOtpAction("user@example.com", "123456");
    apiPost.mockRejectedValueOnce(new ApiError("The request failed", 400));

    await expect(resetPasswordAction("user@example.com", passwords)).resolves.toEqual({
      ok: false,
      message: "This reset session expired or was already used. Please request a new code.",
    });
  });
});
