import { publicEnvSchema, type PublicEnv } from "@/lib/validation/env.schema";

let cached: PublicEnv | undefined;

export function getPublicEnv(): PublicEnv {
  if (cached) {
    return cached;
  }

  const parsed = publicEnvSchema.safeParse({
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
    NEXT_PUBLIC_SITE_NAME: process.env.NEXT_PUBLIC_SITE_NAME,
  });

  if (!parsed.success) {
    throw new Error(
      `Invalid public environment variables: ${parsed.error.issues
        .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
        .join("; ")}`,
    );
  }

  cached = parsed.data;
  return parsed.data;
}

export function resetPublicEnvCache() {
  cached = undefined;
}
