import "server-only";

import { serverEnvSchema, type ServerEnv } from "@/lib/validation/env.schema";

let cached: ServerEnv | undefined;

function emptyToUndefined(value: string | undefined) {
  return value === undefined || value.trim() === "" ? undefined : value;
}

export function getServerEnv(): ServerEnv {
  if (cached) {
    return cached;
  }

  const parsed = serverEnvSchema.safeParse({
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
    NEXT_PUBLIC_SITE_NAME: process.env.NEXT_PUBLIC_SITE_NAME,
    API_BASE_URL: emptyToUndefined(process.env.API_BASE_URL),
    API_SECRET: emptyToUndefined(process.env.API_SECRET),
  });

  if (!parsed.success) {
    throw new Error(
      `Invalid server environment variables: ${parsed.error.issues
        .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
        .join("; ")}`,
    );
  }

  cached = parsed.data;
  return parsed.data;
}

export function resetServerEnvCache() {
  cached = undefined;
}
