/**
 * Zod schemas for every Explore Map API response.
 *
 * Matches the actual payloads from the tested backend:
 *   https://tajlandai-backend.onrender.com/api/v1/explore/*
 *
 * All shapes are validated at runtime so bad/missing fields surface
 * immediately as a parse error rather than a silent undefined.
 */

import { z } from "zod";

// ─── Primitives ───────────────────────────────────────────────────────────────

export const plotStatusSchema = z.enum(["AVAILABLE", "LOCKED", "CLAIMED", "SOLD"]);
export type PlotStatus = z.infer<typeof plotStatusSchema>;

export const zoneTierSchema = z.enum(["ICON", "PREMIUM", "STANDARD"]);
export type ZoneTier = z.infer<typeof zoneTierSchema>;

// ─── Shared sub-schemas ───────────────────────────────────────────────────────

export const coordinatesSchema = z.object({
  lat: z.number(),
  lng: z.number(),
});

export const regionSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  description: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  displayOrder: z.number().optional(),
});
export type Region = z.infer<typeof regionSchema>;

export const citySchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
});
export type City = z.infer<typeof citySchema>;

export const zoneTypeSchema = z.object({
  id: z.string(),
  name: z.string(),
  tier: zoneTierSchema.optional(),
});
export type ZoneType = z.infer<typeof zoneTypeSchema>;

export const plotSummarySchema = z.object({
  id: z.string(),
  plotNumber: z.string().optional(),
  name: z.string().optional(),
  status: plotStatusSchema,
  sizeRai: z.number().optional(),
  pricePerRai: z.number().optional(),
  totalPrice: z.number().optional(),
  currency: z.string().optional(),
  imageUrl: z.string().optional(),
  coordinates: coordinatesSchema.optional(),
  // map-only fields from /explore/map
  regionId: z.string().optional(),
  geometry: z.unknown().optional(),
  centroid: z.unknown().optional(),
});
export type PlotSummary = z.infer<typeof plotSummarySchema>;

// ─── GET /explore/map ─────────────────────────────────────────────────────────

export const exploreMapResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: z.object({
    map: z.object({
      country: z.string(),
      bounds: z.object({
        north: z.number(),
        south: z.number(),
        east: z.number(),
        west: z.number(),
      }),
      center: z.object({
        lat: z.number(),
        lng: z.number(),
      }),
    }),
    regions: z.array(regionSchema),
    plots: z.array(plotSummarySchema).optional().default([]),
  }),
});
export type ExploreMapResponse = z.infer<typeof exploreMapResponseSchema>;
export type MapConfig = ExploreMapResponse["data"]["map"];

// ─── GET /explore/plots ───────────────────────────────────────────────────────

export const plotListItemSchema = z.object({
  id: z.string(),
  plotNumber: z.string().optional(),
  name: z.string().optional(),
  status: plotStatusSchema,
  sizeRai: z.number().optional(),
  pricePerRai: z.number().optional(),
  totalPrice: z.number().optional(),
  currency: z.string().optional(),
  imageUrl: z.string().optional(),
  coordinates: coordinatesSchema.optional(),
  zone: z
    .object({
      id: z.string(),
      name: z.string(),
      tier: zoneTierSchema.optional(),
    })
    .optional(),
  city: citySchema.optional(),
  region: regionSchema.optional(),
});
export type PlotListItem = z.infer<typeof plotListItemSchema>;

export const paginationSchema = z.object({
  page: z.number(),
  limit: z.number(),
  total: z.number(),
  totalPages: z.number(),
});
export type Pagination = z.infer<typeof paginationSchema>;

export const plotsListResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: z.object({
    items: z.array(plotListItemSchema),
    pagination: paginationSchema,
  }),
});
export type PlotsListResponse = z.infer<typeof plotsListResponseSchema>;

// ─── GET /explore/plots/:id ───────────────────────────────────────────────────

export const plotDetailSchema = z.object({
  id: z.string(),
  plotNumber: z.string().optional(),
  name: z.string().optional(),
  region: regionSchema.optional(),
  location: citySchema.optional(),
  zone: zoneTypeSchema.optional(),
  imageUrl: z.string().optional(),
  sizeRai: z.number().optional(),
  sizeSquareFeet: z.number().optional(),
  areaUnit: z.string().optional(),
  pricePerRai: z.number().optional(),
  totalPrice: z.number().optional(),
  currency: z.string().optional(),
  status: plotStatusSchema,
  geometry: z.unknown().optional(),
  coordinates: coordinatesSchema.optional(),
  isOwned: z.boolean().optional(),
  isInCart: z.boolean().optional(),
  purchase: z
    .object({
      available: z.boolean(),
      minimumRequired: z.boolean().optional(),
      reason: z.string().optional(),
    })
    .optional(),
});
export type PlotDetail = z.infer<typeof plotDetailSchema>;

export const plotDetailResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: plotDetailSchema,
});
export type PlotDetailResponse = z.infer<typeof plotDetailResponseSchema>;

// ─── GET /explore/plots/:id/status ───────────────────────────────────────────

export const plotStatusResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: z.object({
    plotId: z.string(),
    status: plotStatusSchema,
    isAvailable: z.boolean(),
    isLocked: z.boolean(),
    isReserved: z.boolean().optional(),
    isPurchased: z.boolean(),
    canAddToCart: z.boolean(),
    canPurchase: z.boolean(),
    lockedUntil: z.string().nullable().optional(),
    lastUpdated: z.string().optional(),
  }),
});
export type PlotStatusResponse = z.infer<typeof plotStatusResponseSchema>;
export type PlotStatusData = PlotStatusResponse["data"];

// ─── POST /explore/plots/:id/eligibility ─────────────────────────────────────

export const plotEligibilityResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: z.object({
    eligible: z.boolean(),
    reason: z.string().nullable().optional(),
    minimumRai: z.number().optional(),
    currentCartRai: z.number().optional(),
    requiredAdditionalRai: z.number().optional(),
    currency: z.string().optional(),
    requiredAdditionalPrice: z.number().optional(),
    reasons: z.array(z.string()).optional(),
    warnings: z.array(z.string()).optional(),
    recommendations: z.array(z.string()).optional(),
  }),
});
export type PlotEligibilityResponse = z.infer<typeof plotEligibilityResponseSchema>;
export type PlotEligibilityData = PlotEligibilityResponse["data"];

// ─── GET /explore/filters ─────────────────────────────────────────────────────

export const filterOptionsResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: z.object({
    regions: z.array(regionSchema),
    cities: z.array(citySchema),
    zoneTypes: z.array(zoneTypeSchema),
    landTypes: z.array(z.object({ id: z.string(), name: z.string() })),
    statuses: z.array(z.string()),
    raiRange: z.object({ min: z.number(), max: z.number() }),
    priceRange: z.object({ min: z.number(), max: z.number() }),
  }),
});
export type FilterOptionsResponse = z.infer<typeof filterOptionsResponseSchema>;
export type FilterOptions = FilterOptionsResponse["data"];

// ─── GET /explore/sort-options ────────────────────────────────────────────────

export const sortOptionSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  defaultOrder: z.enum(["asc", "desc"]).optional(),
});
export type SortOption = z.infer<typeof sortOptionSchema>;

export const sortOptionsResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: z.object({
    options: z.array(z.union([sortOptionSchema, z.string()])).transform((opts) =>
      opts.map((o) =>
        typeof o === "string" ? { id: o, name: o } : o,
      ),
    ),
  }),
});
export type SortOptionsResponse = z.infer<typeof sortOptionsResponseSchema>;

// ─── GET /explore/search ─────────────────────────────────────────────────────

export const searchResultSchema = z.object({
  id: z.string().optional(),
  type: z.enum(["REGION", "CITY", "ZONE", "PLOT"]).optional(),
  name: z.string(),
  slug: z.string().optional(),
  description: z.string().optional(),
  plotCount: z.number().optional(),
});
export type SearchResult = z.infer<typeof searchResultSchema>;

export const searchResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: z.object({
    query: z.string(),
    results: z.array(searchResultSchema),
  }),
});
export type SearchResponse = z.infer<typeof searchResponseSchema>;

// ─── GET /explore/search/suggestions ─────────────────────────────────────────

export const suggestionSchema = z.union([
  z.string(),
  z.object({
    id: z.string().optional(),
    name: z.string(),
    type: z.string().optional(),
  }),
]);
export type Suggestion = z.infer<typeof suggestionSchema>;

export const searchSuggestionsResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: z.object({
    query: z.string(),
    suggestions: z.array(suggestionSchema),
  }),
});
export type SearchSuggestionsResponse = z.infer<typeof searchSuggestionsResponseSchema>;

// ─── GET/POST /explore/recent-searches ───────────────────────────────────────

export const recentSearchItemSchema = z.object({
  id: z.string(),
  query: z.string(),
  type: z.string().optional(),
  referenceId: z.string().optional(),
  createdAt: z.string(),
});
export type RecentSearchItem = z.infer<typeof recentSearchItemSchema>;

export const recentSearchesResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: z.array(recentSearchItemSchema),
});
export type RecentSearchesResponse = z.infer<typeof recentSearchesResponseSchema>;

export const saveSearchResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: recentSearchItemSchema,
});
export type SaveSearchResponse = z.infer<typeof saveSearchResponseSchema>;

export const deleteSearchResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
});

// ─── GET /explore/my-plots ────────────────────────────────────────────────────

export const myPlotItemSchema = z.object({
  id: z.string(),
  plotNumber: z.string().optional(),
  name: z.string().optional(),
  status: plotStatusSchema,
  sizeRai: z.number().optional(),
  totalPrice: z.number().optional(),
  currency: z.string().optional(),
  imageUrl: z.string().optional(),
  coordinates: coordinatesSchema.optional(),
  region: regionSchema.optional(),
  purchasedAt: z.string().optional(),
  certificateId: z.string().optional(),
});
export type MyPlotItem = z.infer<typeof myPlotItemSchema>;

export const myPlotsResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: z.array(myPlotItemSchema),
});
export type MyPlotsResponse = z.infer<typeof myPlotsResponseSchema>;

// ─── Filter params type (for service layer) ───────────────────────────────────

export type PlotFilterParams = {
  page?: number;
  limit?: number;
  regionId?: string;
  cityId?: string;
  zoneId?: string;
  status?: PlotStatus;
  minRai?: number;
  maxRai?: number;
  minPrice?: number;
  maxPrice?: number;
  bbox?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
};
