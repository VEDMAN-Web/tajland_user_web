import { describe, expect, it } from "vitest";
import { publicEnvSchema, serverEnvSchema } from "./env.schema";

describe("environment schemas", () => {
  it("accepts valid public environment variables", () => {
    const parsed = publicEnvSchema.parse({
      NEXT_PUBLIC_SITE_URL: "http://localhost:3000",
      NEXT_PUBLIC_SITE_NAME: "Tajlandia",
    });

    expect(parsed.NEXT_PUBLIC_SITE_NAME).toBe("Tajlandia");
  });

  it("rejects an invalid public site URL", () => {
    const parsed = publicEnvSchema.safeParse({
      NEXT_PUBLIC_SITE_URL: "not-a-url",
      NEXT_PUBLIC_SITE_NAME: "Tajlandia",
    });

    expect(parsed.success).toBe(false);
  });

  it("allows optional server secrets", () => {
    const parsed = serverEnvSchema.parse({
      NEXT_PUBLIC_SITE_URL: "http://localhost:3000",
      NEXT_PUBLIC_SITE_NAME: "Tajlandia",
    });

    expect(parsed.API_SECRET).toBeUndefined();
  });

  it("rejects a short API secret", () => {
    const parsed = serverEnvSchema.safeParse({
      NEXT_PUBLIC_SITE_URL: "http://localhost:3000",
      NEXT_PUBLIC_SITE_NAME: "Tajlandia",
      API_SECRET: "too-short",
    });

    expect(parsed.success).toBe(false);
  });
});
