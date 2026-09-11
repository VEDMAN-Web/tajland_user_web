import { describe, expect, it } from "vitest";
import { toUserErrorMessage } from "./user-errors";
import { ApiError } from "@/lib/api/client";

describe("toUserErrorMessage", () => {
  it("returns the API message for known API errors", () => {
    expect(
      toUserErrorMessage(new ApiError("The request timed out", 504, "API_TIMEOUT")),
    ).toBe("The request timed out");
  });

  it("hides unexpected internals", () => {
    expect(toUserErrorMessage(new Error("ECONNRESET at 10.0.0.8"))).toBe(
      "Something went wrong. Please try again.",
    );
    expect(toUserErrorMessage("secret stack")).toBe(
      "Something went wrong. Please try again.",
    );
    expect(toUserErrorMessage({ code: "DB_FAIL", message: "password=secret" })).toBe(
      "Something went wrong. Please try again.",
    );
  });
});
