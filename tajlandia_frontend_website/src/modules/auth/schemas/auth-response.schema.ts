import { z } from "zod";

/**
 * Canonical shapes for every TajLandia auth API response.
 * All responses share the envelope: { success, message, data }.
 * Define the `data` shape per endpoint, then wrap it.
 */

// ─── Shared user object ───────────────────────────────────────────────────────

export const authUserSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
  role: z.string(),
  isActive: z.boolean(),
  isEmailVerified: z.boolean(),
});

export const authUserWithTimestampsSchema = authUserSchema.extend({
  lastLoginAt: z.string().optional(),
});

// ─── POST /auth/register ──────────────────────────────────────────────────────

export const registerResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: authUserSchema,
});

// ─── POST /auth/login ─────────────────────────────────────────────────────────

export const authTokensSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
  user: authUserSchema,
});

export const loginResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: authTokensSchema,
});

// ─── GET /auth/me ─────────────────────────────────────────────────────────────

export const meResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: authUserWithTimestampsSchema,
});

// ─── POST /auth/refresh ───────────────────────────────────────────────────────

export const refreshResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: z.object({
    accessToken: z.string(),
  }),
});

// ─── POST /auth/logout ────────────────────────────────────────────────────────

export const logoutResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: z.unknown(),
});

// ─── POST /auth/change-password ───────────────────────────────────────────────

export const changePasswordResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: z.unknown(),
});

// ─── POST /auth/request-otp ───────────────────────────────────────────────────

export const requestOtpResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: z.object({
    email: z.string().email(),
    expiresIn: z.number(),
  }),
});

// ─── POST /auth/verify-otp ────────────────────────────────────────────────────

export const verifyOtpResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: z.object({
    email: z.string().email(),
    isEmailVerified: z.boolean(),
  }),
});

// ─── POST /auth/resend-otp ────────────────────────────────────────────────────

export const resendOtpResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: z.object({
    email: z.string().email(),
    expiresIn: z.number(),
  }),
});

// ─── Inferred types ───────────────────────────────────────────────────────────

export type AuthUser = z.infer<typeof authUserSchema>;
export type AuthUserWithTimestamps = z.infer<typeof authUserWithTimestampsSchema>;
export type AuthTokens = z.infer<typeof authTokensSchema>;
export type RegisterResponse = z.infer<typeof registerResponseSchema>;
export type LoginResponse = z.infer<typeof loginResponseSchema>;
export type MeResponse = z.infer<typeof meResponseSchema>;
export type RefreshResponse = z.infer<typeof refreshResponseSchema>;
export type LogoutResponse = z.infer<typeof logoutResponseSchema>;
export type ChangePasswordResponse = z.infer<typeof changePasswordResponseSchema>;
export type RequestOtpResponse = z.infer<typeof requestOtpResponseSchema>;
export type VerifyOtpResponse = z.infer<typeof verifyOtpResponseSchema>;
export type ResendOtpResponse = z.infer<typeof resendOtpResponseSchema>;
