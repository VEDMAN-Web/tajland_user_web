import { z } from "zod";

// Real `GET /page/faq` shape (Swagger `PageFaqListItemDto`). `category` isn't
// shown (the design is one flat list), so it's left out.
const faqItemSchema = z.object({
  _id: z.string().min(1),
  question: z.string(),
  answer: z
    .string()
    .nullish()
    .transform((value) => value ?? ""),
  displayOrder: z.number().nullish(),
});

/** `GET /page/faq` `data` (one page). */
export const faqListPageSchema = z.object({
  items: z.array(faqItemSchema),
  pagination: z.object({
    page: z.number().int(),
    limit: z.number().int(),
    total: z.number().int().nonnegative(),
    totalPages: z.number().int().nonnegative(),
  }),
});

export type FaqItem = z.infer<typeof faqItemSchema>;
