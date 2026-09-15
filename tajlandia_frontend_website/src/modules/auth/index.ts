/**
 * Auth module public API.
 *
 * Other modules import auth types from here, never directly from schemas.
 * This is the single source of truth for shared auth contracts.
 */

export type {
  AuthUser,
  AuthUserWithTimestamps,
  AuthTokens,
  RegisterResponse,
  LoginResponse,
  MeResponse,
  RefreshResponse,
  LogoutResponse,
  ChangePasswordResponse,
  RequestOtpResponse,
  VerifyOtpResponse,
  ResendOtpResponse,
} from "./types/auth.types";

export {
  authUserSchema,
  authUserWithTimestampsSchema,
  authTokensSchema,
  registerResponseSchema,
  loginResponseSchema,
  meResponseSchema,
  refreshResponseSchema,
  logoutResponseSchema,
  changePasswordResponseSchema,
  requestOtpResponseSchema,
  verifyOtpResponseSchema,
  resendOtpResponseSchema,
} from "./schemas/auth-response.schema";
