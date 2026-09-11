const GENERIC_USER_ERROR = "Something went wrong. Please try again.";

export function toUserErrorMessage(error: unknown): string {
  if (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    typeof error.code === "string" &&
    error.code.startsWith("API_") &&
    "message" in error &&
    typeof error.message === "string"
  ) {
    return error.message;
  }

  return GENERIC_USER_ERROR;
}
