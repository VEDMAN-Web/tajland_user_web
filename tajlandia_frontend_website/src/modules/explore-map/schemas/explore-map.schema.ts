import { z } from "zod";

const mapBoundsSchema = z.object({
  north: z.number(),
  south: z.number(),
  east: z.number(),
  west: z.number(),
});

const exploreRegionSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  slug: z.string().min(1),
  description: z.string().optional(),
  latitude: z.number(),
  longitude: z.number(),
  displayOrder: z.number(),
});

/** `GET /explore/map` `data`. */
export const exploreMapSchema = z.object({
  map: z.object({
    country: z.string(),
    bounds: mapBoundsSchema,
    center: z.object({ lat: z.number(), lng: z.number() }),
  }),
  regions: z.array(exploreRegionSchema),
});

export type MapBounds = z.infer<typeof mapBoundsSchema>;
export type ExploreRegion = z.infer<typeof exploreRegionSchema>;
export type ExploreMap = z.infer<typeof exploreMapSchema>;
