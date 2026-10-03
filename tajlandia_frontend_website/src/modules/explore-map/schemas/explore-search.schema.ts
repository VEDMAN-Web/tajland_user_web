import { z } from "zod";

const locationSchema = z.object({ lat: z.number(), lng: z.number() });

const searchSuggestionSchema = z.object({
  // REGION | CITY today; Swagger also mentions zones, so keep it open.
  type: z.string(),
  id: z.string().min(1),
  name: z.string().min(1),
  location: locationSchema,
});

/** `GET /explore/search/suggestions` `data`. */
export const searchSuggestionsSchema = z.object({
  query: z.string(),
  suggestions: z.array(searchSuggestionSchema),
});

const searchResultSchema = z.object({
  // Lowercase here ("region"), unlike suggestions ("REGION").
  type: z.string(),
  id: z.string().min(1),
  name: z.string().min(1),
  imageUrl: z.string().nullish(),
  location: locationSchema,
  // Counts are new; optional until every backend environment returns them.
  zone: z.number().int().nonnegative().optional(),
  plots: z.number().int().nonnegative().optional(),
});

/** `GET /explore/search` `data`. */
export const searchResultsSchema = z.object({
  query: z.string(),
  results: z.array(searchResultSchema),
});

export type SearchSuggestion = z.infer<typeof searchSuggestionSchema>;
export type SearchResult = z.infer<typeof searchResultSchema>;

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
  location: locationSchema.optional(),
  zone: z.number().int().nonnegative().optional(),
  plots: z.number().int().nonnegative().optional(),
});

/** `GET /explore/recent-searches` `data` (newest first). */
export const recentSearchesSchema = z.array(recentSearchSchema);

export type RecentSearch = z.infer<typeof recentSearchSchema>;
