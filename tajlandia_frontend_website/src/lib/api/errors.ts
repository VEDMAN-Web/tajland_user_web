export class ApiError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(message: string, status: number, code = "API_ERROR") {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

const SAFE_API_MESSAGE = /^[\w\s.,'!?:()-]{1,180}$/;

/** Reads `message` from a backend JSON body, or returns the fallback if it is missing or unsafe to show. */
export function readSafeApiMessage(json: unknown, fallback: string): string {
  if (!json || typeof json !== "object" || !("message" in json)) {
    return fallback;
  }

  const message = json.message;
  const text =
    typeof message === "string"
      ? message
      : Array.isArray(message)
        ? message.filter((item): item is string => typeof item === "string").join(" ")
        : "";
  const trimmed = text.trim();

  return SAFE_API_MESSAGE.test(trimmed) ? trimmed : fallback;
}
