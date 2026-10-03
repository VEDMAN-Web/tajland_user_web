import { z, type ZodType } from "zod";

/**
 * Every backend response is wrapped as `{ success, message, data }`.
 * Pass the schema for `data` only; use with `apiGet` on the server, while
 * `browser-client` applies it for you and returns `data`.
 */
export function apiEnvelope<T>(data: ZodType<T>) {
  return z.object({
    success: z.boolean(),
    message: z.string().optional(),
    data,
  });
}
