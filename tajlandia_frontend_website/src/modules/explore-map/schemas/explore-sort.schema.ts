import { z } from "zod";

// Real `GET /explore/sort-options` `data`. Swagger promises a field name and a
// default order per option, but the API only sends these three strings, and
// `id` repeats ("Price" for both price options).
const sortOptionSchema = z.object({
  id: z.string(),
  // The label; for the "DEFAULT" option it is the description instead.
  name: z.string(),
  // "DEFAULT", "Recent", or a range hint such as "$ → $$$".
  type: z.string(),
});

export const sortOptionsSchema = z.object({
  options: z.array(sortOptionSchema),
});

export type SortOptionDto = z.infer<typeof sortOptionSchema>;
