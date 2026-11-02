import { z } from "zod";

const locationSchema = z.object({ lat: z.number(), lng: z.number() });

const searchSuggestionSchema = z
  .object({
    // REGION | CITY | PLOT (PLOT has no location; CITY and PLOT carry their region).
    type: z.string(),
    id: z.string().min(1),
    name: z.string().min(1),
    imageUrl: z.string().nullish(),
    location: locationSchema.optional(),
    regionId: z.string().nullish(),
    regionName: z.string().nullish(),
  })
  .refine(
    (suggestion) =>
      suggestion.location !== undefined || suggestion.type.toUpperCase() === "PLOT",
    { path: ["location"], message: "A region or city suggestion needs a location" },
  );

/** `GET /explore/search/suggestions` `data`. */
export const searchSuggestionsSchema = z.object({
  query: z.string(),
  suggestions: z.array(searchSuggestionSchema),
});

const namedRef = z.object({ id: z.string().min(1), name: z.string().min(1) });

// A region or city hit. Lowercase `type` here ("region"), unlike suggestions ("REGION").
const searchPlaceSchema = z.object({
  type: z.string(),
  id: z.string().min(1),
  name: z.string().min(1),
  imageUrl: z.string().nullish(),
  location: locationSchema,
  // Regions carry zone and plot counts; cities only a plot count. Optional so an
  // older backend without them still parses.
  zone: z.number().int().nonnegative().optional(),
  plots: z.number().int().nonnegative().optional(),
  // Cities: the region they belong to.
  region: namedRef.optional(),
});

// A plot hit: found by plot number or plot name. No coordinates; the detail has them.
const searchPlotSchema = z.object({
  type: z.literal("plot"),
  id: z.string().min(1),
  plotNumber: z.string().min(1),
  plotName: z.string().nullish(),
  status: z.string(),
  region: namedRef.nullish(),
  city: namedRef.nullish(),
  zoneCategory: z.object({ name: z.string(), type: z.string() }).nullish(),
  sizeRai: z.number().nullish(),
  totalPrice: z.number().nullish(),
  currency: z.string().nullish(),
  imageUrl: z.string().nullish(),
  // Plot photos (Cloudinary); `imageUrl` is the older single image, now usually null.
  images: z.array(z.string()).nullish(),
});

/**
 * `GET /explore/search` `data`. `results` (all three flattened) is kept by the
 * backend only for compatibility, so read the typed lists instead.
 */
export const searchResultsSchema = z.object({
  query: z.string(),
  regions: z.array(searchPlaceSchema),
  cities: z.array(searchPlaceSchema),
  plots: z.array(searchPlotSchema),
});

export type SearchSuggestion = z.infer<typeof searchSuggestionSchema>;
export type SearchResult = z.infer<typeof searchPlaceSchema>;
export type SearchPlotResult = z.infer<typeof searchPlotSchema>;

const recentSearchSchema = z.object({
  id: z.string().min(1),
  query: z.string().min(1),
  // LOCATION (typed text) | REGION | CITY | PLOT (saved from a click, with `referenceId`)
  type: z.string(),
  createdAt: z.string(),
  referenceId: z.string().min(1).nullish(),
  // The backend is adding the same place fields as search results; optional
  // until that is deployed, then the row shows the image, name and counts.
  name: z.string().min(1).optional(),
  imageUrl: z.string().nullish(),
  // A PLOT entry has no `imageUrl`; its photos are here (the first is the thumbnail).
  images: z.array(z.string()).nullish(),
  location: locationSchema.optional(),
  // Null on typed-text (LOCATION) entries.
  zone: z.number().int().nonnegative().nullish(),
  plots: z.number().int().nonnegative().nullish(),
});

/** `GET /explore/recent-searches` `data` (newest first). */
export const recentSearchesSchema = z.array(recentSearchSchema);

export type RecentSearch = z.infer<typeof recentSearchSchema>;
