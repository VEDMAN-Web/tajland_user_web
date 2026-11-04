import { z } from "zod";

const purchaseTypeSchema = z.enum(["SELF", "GIFT"]);

const certificateListItemSchema = z.object({
  orderId: z.string().min(1),
  certificateNo: z.string().min(1),
  certificateUrl: z.string().nullish(),
  purchaseType: purchaseTypeSchema,
  createdAt: z.string(),
});

/** `GET /certificates` `data`. */
export const certificateListSchema = z.object({
  items: z.array(certificateListItemSchema),
  pagination: z.object({
    page: z.number().int().positive(),
    limit: z.number().int().positive(),
    total: z.number().int().nonnegative(),
    totalPages: z.number().int().nonnegative(),
  }),
});

/** `GET /certificates/{orderId}` `data`. */
export const certificateDetailSchema = certificateListItemSchema.extend({
  /** Who placed the order (the buyer, also for a gift). */
  userName: z.string(),
  plots: z.array(z.object({ plotNumber: z.string() })),
  /** e.g. "Koh Samui / Phuket, Thailand". */
  location: z.string(),
  totalSizeRai: z.number(),
  orderTotal: z.number(),
  totalPlots: z.number(),
  issuingAuthority: z.string(),
});

export type CertificateListItem = z.infer<typeof certificateListItemSchema>;
export type CertificateListPage = z.infer<typeof certificateListSchema>;
export type CertificateDetail = z.infer<typeof certificateDetailSchema>;
