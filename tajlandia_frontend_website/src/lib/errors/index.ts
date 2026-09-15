/**
 * Error handling barrel export.
 */

export {
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  RateLimitError,
  NetworkError,
  handleError,
  getErrorMessage,
  isOperationalError,
  getUserFriendlyMessage,
  USER_FRIENDLY_MESSAGES,
  type ErrorResult,
} from "./error-handler";
