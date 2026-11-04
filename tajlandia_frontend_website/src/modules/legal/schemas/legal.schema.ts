import { z } from "zod";

// Real `GET /page/legal-pages` and `GET /page/legal-pages/{legalPageId}` shape
// (Swagger's `PageLegalPageListItemDto` / `PageLegalPageDetailDto`). The list only
// has the id and title; text fields the page doesn't need are left out.
const legalPageListItemSchema = z.object({
  _id: z.string().min(1),
  title: z.string(),
});

/** `GET /page/legal-pages` `data`: every publicly visible legal page. */
export const legalPageListSchema = z.array(legalPageListItemSchema);

/** `GET /page/legal-pages/{legalPageId}` `data`; `content` is Markdown from the admin editor. */
export const legalPageDetailSchema = legalPageListItemSchema.extend({
  slug: z.string().nullish(),
  description: z.string().nullish(),
  content: z
    .string()
    .nullish()
    .transform((value) => value ?? ""),
  // e.g. "v1.0".
  version: z.string().nullish(),
  effectiveDate: z.string().nullish(),
  jurisdiction: z.string().nullish(),
  updatedAt: z.string().nullish(),
});

export type LegalPageListItem = z.infer<typeof legalPageListItemSchema>;
export type LegalPageDetail = z.infer<typeof legalPageDetailSchema>;
