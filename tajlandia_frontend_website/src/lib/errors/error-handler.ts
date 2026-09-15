/**
 * Google-grade centralized error handling system.
 * 
 * Provides consistent error handling, logging, and user-friendly messages
 * across the entire application.
 */

import { ZodError } from "zod";

// ─── Error Types ──────────────────────────────────────────────────────────────

export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500,
    public isOperational: boolean = true,
  ) {
    super(message);
    this.name = "AppError";
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, public details?: Record<string, string>) {
    super(message, "VALIDATION_ERROR", 400, true);
    this.name = "ValidationError";
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = "Authentication required") {
    super(message, "AUTHENTICATION_ERROR", 401, true);
    this.name = "AuthenticationError";
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = "Access denied") {
    super(message, "AUTHORIZATION_ERROR", 403, true);
    this.name = "AuthorizationError";
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = "Resource not found") {
    super(message, "NOT_FOUND_ERROR", 404, true);
    this.name = "NotFoundError";
  }
}

export class ConflictError extends AppError {
  constructor(message: string = "Resource conflict") {
    super(message, "CONFLICT_ERROR", 409, true);
    this.name = "ConflictError";
  }
}

export class RateLimitError extends AppError {
  constructor(message: string = "Too many requests") {
    super(message, "RATE_LIMIT_ERROR", 429, true);
    this.name = "RateLimitError";
  }
}

export class NetworkError extends AppError {
  constructor(message: string = "Network request failed") {
    super(message, "NETWORK_ERROR", 503, true);
    this.name = "NetworkError";
  }
}

// ─── Error Handler ────────────────────────────────────────────────────────────

export interface ErrorResult {
  message: string;
  code: string;
  statusCode: number;
  details?: Record<string, string>;
}

/**
 * Central error handler that converts any error into a user-friendly result.
 * Use this in catch blocks to ensure consistent error handling.
 * 
 * @example
 * try {
 *   await someOperation();
 * } catch (error) {
 *   const errorResult = handleError(error);
 *   return { ok: false, ...errorResult };
 * }
 */
export function handleError(error: unknown): ErrorResult {
  // Log error for debugging (in production, send to monitoring service)
  if (process.env.NODE_ENV === "development") {
    console.error("[Error Handler]", error);
  }

  // ─── Known AppError types ─────────────────────────────────────────────────

  if (error instanceof AppError) {
    return {
      message: error.message,
      code: error.code,
      statusCode: error.statusCode,
      details: error instanceof ValidationError ? error.details : undefined,
    };
  }

  // ─── Zod validation errors ────────────────────────────────────────────────

  if (error instanceof ZodError) {
    const details: Record<string, string> = {};
    
    for (const issue of error.issues) {
      const path = issue.path.join(".");
      details[path] = issue.message;
    }

    return {
      message: "Validation failed. Please check your input.",
      code: "VALIDATION_ERROR",
      statusCode: 400,
      details,
    };
  }

  // ─── Network/Fetch errors ─────────────────────────────────────────────────

  if (error instanceof TypeError && error.message.includes("fetch")) {
    return {
      message: "Network connection error. Please check your internet connection.",
      code: "NETWORK_ERROR",
      statusCode: 503,
    };
  }

  // ─── Standard Error with message ──────────────────────────────────────────

  if (error instanceof Error) {
    return {
      message: error.message || "An unexpected error occurred.",
      code: "UNKNOWN_ERROR",
      statusCode: 500,
    };
  }

  // ─── Unknown error type ───────────────────────────────────────────────────

  return {
    message: "An unexpected error occurred. Please try again.",
    code: "UNKNOWN_ERROR",
    statusCode: 500,
  };
}

/**
 * Safely extract error message from any error type.
 * Use this when you only need the message string.
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  
  if (typeof error === "string") {
    return error;
  }
  
  return "An unexpected error occurred.";
}

/**
 * Check if error is operational (expected) vs programming error (bug).
 * Operational errors are shown to users, programming errors are logged.
 */
export function isOperationalError(error: unknown): boolean {
  if (error instanceof AppError) {
    return error.isOperational;
  }
  
  return false;
}

// ─── User-Friendly Messages ───────────────────────────────────────────────────

/**
 * Map of common error codes to user-friendly messages.
 * Customize these based on your application's tone.
 */
export const USER_FRIENDLY_MESSAGES: Record<string, string> = {
  // Auth errors
  AUTHENTICATION_ERROR: "Please log in to continue.",
  AUTHORIZATION_ERROR: "You don't have permission to access this resource.",
  SESSION_EXPIRED: "Your session has expired. Please log in again.",
  INVALID_CREDENTIALS: "Invalid email or password. Please try again.",
  
  // Validation errors
  VALIDATION_ERROR: "Please check your input and try again.",
  INVALID_EMAIL: "Please enter a valid email address.",
  PASSWORD_TOO_WEAK: "Password must be at least 8 characters with letters and numbers.",
  
  // Resource errors
  NOT_FOUND_ERROR: "The requested resource was not found.",
  ALREADY_EXISTS: "This resource already exists.",
  CONFLICT_ERROR: "This action conflicts with existing data.",
  
  // Network errors
  NETWORK_ERROR: "Connection error. Please check your internet and try again.",
  TIMEOUT_ERROR: "Request timed out. Please try again.",
  RATE_LIMIT_ERROR: "Too many requests. Please wait a moment and try again.",
  
  // Server errors
  SERVER_ERROR: "Something went wrong on our end. Please try again later.",
  SERVICE_UNAVAILABLE: "Service is temporarily unavailable. Please try again later.",
  
  // Unknown errors
  UNKNOWN_ERROR: "An unexpected error occurred. Please try again.",
};

/**
 * Get user-friendly message for an error code.
 */
export function getUserFriendlyMessage(code: string, fallback?: string): string {
  return USER_FRIENDLY_MESSAGES[code] || fallback || USER_FRIENDLY_MESSAGES.UNKNOWN_ERROR!;
}
