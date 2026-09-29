/**
 * Tile Grid System - Google Maps Grade
 * 
 * Divides the world into a grid of tiles for efficient caching.
 * Similar to how Google Maps loads map tiles progressively.
 */

export interface TileCoord {
  x: number;      // Column index
  y: number;      // Row index
  zoom: number;   // Zoom level
}

export interface BBox {
  west: number;
  south: number;
  east: number;
  north: number;
}

/**
 * Get tile size in degrees based on zoom level
 * 
 * Lower zoom = larger tiles (fewer requests)
 * Higher zoom = smaller tiles (more precision)
 */
export function getTileSize(zoom: number): number {
  if (zoom <= 10) return 1.0;      // Country view
  if (zoom <= 12) return 0.5;      // Region view
  if (zoom <= 14) return 0.25;     // City view
  return 0.1;                       // Street view
}

/**
 * Convert lat/lng to tile coordinate
 */
export function latLngToTile(lat: number, lng: number, zoom: number): TileCoord {
  const tileSize = getTileSize(zoom);
  
  return {
    x: Math.floor(lng / tileSize),
    y: Math.floor(lat / tileSize),
    zoom,
  };
}

/**
 * Get bounding box for a tile coordinate
 */
export function getTileBBox(tile: TileCoord): BBox {
  const tileSize = getTileSize(tile.zoom);
  
  return {
    west: tile.x * tileSize,
    south: tile.y * tileSize,
    east: (tile.x + 1) * tileSize,
    north: (tile.y + 1) * tileSize,
  };
}

/**
 * Generate unique cache key for tile
 * Format: "zoom-x-y" (e.g., "13-400-54")
 */
export function getTileKey(tile: TileCoord): string {
  return `${tile.zoom}-${tile.x}-${tile.y}`;
}

/**
 * Parse tile key back to coordinate
 */
export function parseTileKey(key: string): TileCoord | null {
  const parts = key.split('-');
  if (parts.length !== 3) return null;
  
  const zoom = Number(parts[0]);
  const x = Number(parts[1]);
  const y = Number(parts[2]);
  
  if (isNaN(zoom) || isNaN(x) || isNaN(y)) return null;
  
  return { zoom, x, y };
}

/**
 * Get all tiles that intersect with a bounding box
 */
export function getTilesInBBox(bbox: BBox, zoom: number): TileCoord[] {
  const tiles: TileCoord[] = [];
  
  const topLeft = latLngToTile(bbox.north, bbox.west, zoom);
  const bottomRight = latLngToTile(bbox.south, bbox.east, zoom);
  
  // Iterate through all tiles in the rectangle
  for (let x = topLeft.x; x <= bottomRight.x; x++) {
    for (let y = bottomRight.y; y <= topLeft.y; y++) {
      tiles.push({ x, y, zoom });
    }
  }
  
  return tiles;
}

/**
 * Get adjacent tiles (1-tile border around given tiles)
 * Used for prefetching
 */
export function getAdjacentTiles(tiles: TileCoord[]): TileCoord[] {
  if (tiles.length === 0) return [];
  
  const firstTile = tiles[0];
  if (!firstTile) return [];
  
  const zoom = firstTile.zoom;
  const tileSet = new Set(tiles.map(getTileKey));
  const adjacent: TileCoord[] = [];
  
  tiles.forEach((tile) => {
    // Check 8 surrounding tiles
    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        if (dx === 0 && dy === 0) continue; // Skip center tile
        
        const adjTile: TileCoord = {
          x: tile.x + dx,
          y: tile.y + dy,
          zoom,
        };
        
        const key = getTileKey(adjTile);
        if (!tileSet.has(key)) {
          tileSet.add(key);
          adjacent.push(adjTile);
        }
      }
    }
  });
  
  return adjacent;
}

/**
 * Check if two tiles are the same
 */
export function tilesEqual(a: TileCoord, b: TileCoord): boolean {
  return a.zoom === b.zoom && a.x === b.x && a.y === b.y;
}

/**
 * Convert bbox to API string format
 */
export function bboxToString(bbox: BBox): string {
  return `${bbox.west},${bbox.south},${bbox.east},${bbox.north}`;
}
