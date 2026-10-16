import { z } from "zod";

// Real `GET /page/blog` and `GET /page/blog/{blogId}` shape (matches Swagger's
// `PageBlogListItemDto` / `PageBlogDetailDto`). Fields the design doesn't use
// (category, tags, primaryRegion) are left out; text fields fall back instead of
// failing the page.
const blogListItemSchema = z.object({
  _id: z.string().min(1),
  title: z.string(),
  slug: z.string().nullish(),
  excerpt: z
    .string()
    .nullish()
    .transform((value) => value ?? ""),
  coverImage: z.string().nullish(),
  publishedAt: z.string().nullish(),
  authorName: z.string().nullish(),
});

/** `GET /page/blog` `data` (one page). */
export const blogListPageSchema = z.object({
  items: z.array(blogListItemSchema),
  pagination: z.object({
    page: z.number().int(),
    limit: z.number().int(),
    total: z.number().int().nonnegative(),
    totalPages: z.number().int().nonnegative(),
  }),
});

/** `GET /page/blog/{blogId}` `data`; `content` is Markdown from the admin editor. */
export const blogDetailSchema = blogListItemSchema.extend({
  content: z
    .string()
    .nullish()
    .transform((value) => value ?? ""),
  seo: z
    .object({
      metaTitle: z.string().nullish(),
      metaDescription: z.string().nullish(),
    })
    .nullish(),
});

export type BlogListItem = z.infer<typeof blogListItemSchema>;
export type BlogListPage = z.infer<typeof blogListPageSchema>;
export type BlogDetail = z.infer<typeof blogDetailSchema>;
