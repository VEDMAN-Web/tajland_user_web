import "server-only";

import type { MapRegion } from "@/components/maps/MapboxMap";
import { apiGet } from "@/lib/api/client";
import { apiEnvelope } from "@/lib/api/envelope";
import { regionImageSrc } from "@/lib/config/remote-images";
import { exploreMapSchema } from "../schemas/explore-map.schema";

// Regions change rarely; serve them from the cache for a few minutes.
const PUBLIC_MAP_REVALIDATE_SECONDS = 300;
const PUBLIC_MAP_TIMEOUT_MS = 15_000;

/**
 * Region pills for the public maps (home and `/explore`), from
 * `GET /explore/public/map` (no token). Empty on failure, so the map still shows.
 */
export async function fetchPublicMapRegions(): Promise<MapRegion[]> {
  try {
    const response = await apiGet("/explore/public/map", apiEnvelope(exploreMapSchema), {
      revalidate: PUBLIC_MAP_REVALIDATE_SECONDS,
      timeoutMs: PUBLIC_MAP_TIMEOUT_MS,
    });
    return response.data.regions.map((region) => ({
      id: region.id,
      name: region.name,
      center: [region.longitude, region.latitude],
      imageSrc: regionImageSrc(region.imageUrl),
    }));
  } catch {
    return [];
  }
}
