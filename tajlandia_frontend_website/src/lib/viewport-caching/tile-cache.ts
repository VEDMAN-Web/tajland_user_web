/**
 * Tile Cache Manager - LRU with TTL
 * 
 * Caches map tiles in memory with:
 * - LRU eviction (oldest accessed tiles removed first)
 * - TTL expiration (tiles expire after 5 minutes)
 * - Memory limits (max 100 tiles ≈ 50MB)
 */

import type { PlotSummary } from "@/lib/api/explore.schemas";
import type { BBox, TileCoord } from "./tile-grid";
import { getTileKey } from "./tile-grid";

export interface CachedTile {
  key: string;
  bbox: BBox;
  plots: PlotSummary[];
  loadedAt: number;        // Timestamp when loaded
  lastAccessedAt: number;  // Timestamp when last accessed (for LRU)
}

export class TileCache {
  private tiles: Map<string, CachedTile>;
  private maxTiles: number;
  private maxAge: number; // milliseconds

  constructor(maxTiles = 100, maxAgeMinutes = 5) {
    this.tiles = new Map();
    this.maxTiles = maxTiles;
    this.maxAge = maxAgeMinutes * 60 * 1000;
  }

  /**
   * Get tile from cache (returns null if not found or expired)
   */
  get(tileCoord: TileCoord): CachedTile | null {
    const key = getTileKey(tileCoord);
    const tile = this.tiles.get(key);
    
    if (!tile) return null;
    
    // Check if expired
    const now = Date.now();
    if (now - tile.loadedAt > this.maxAge) {
      this.tiles.delete(key);
      return null;
    }
    
    // Update last accessed time (for LRU)
    tile.lastAccessedAt = now;
    return tile;
  }

  /**
   * Set tile in cache (evicts LRU if full)
   */
  set(tileCoord: TileCoord, bbox: BBox, plots: PlotSummary[]): void {
    const key = getTileKey(tileCoord);
    const now = Date.now();
    
    const cachedTile: CachedTile = {
      key,
      bbox,
      plots,
      loadedAt: now,
      lastAccessedAt: now,
    };
    
    // Evict LRU tiles if cache is full
    if (this.tiles.size >= this.maxTiles && !this.tiles.has(key)) {
      this.evictLRU();
    }
    
    this.tiles.set(key, cachedTile);
  }

  /**
   * Check if tile exists in cache (and not expired)
   */
  has(tileCoord: TileCoord): boolean {
    return this.get(tileCoord) !== null;
  }

  /**
   * Get multiple tiles at once
   */
  getMany(tileCoords: TileCoord[]): Map<string, CachedTile> {
    const result = new Map<string, CachedTile>();
    
    tileCoords.forEach((coord) => {
      const tile = this.get(coord);
      if (tile) {
        result.set(tile.key, tile);
      }
    });
    
    return result;
  }

  /**
   * Filter tiles that are NOT in cache
   */
  getMissing(tileCoords: TileCoord[]): TileCoord[] {
    return tileCoords.filter((coord) => !this.has(coord));
  }

  /**
   * Invalidate specific tile
   */
  invalidate(tileCoord: TileCoord): void {
    const key = getTileKey(tileCoord);
    this.tiles.delete(key);
  }

  /**
   * Invalidate tiles by zoom level
   */
  invalidateZoom(zoom: number): void {
    const keys = Array.from(this.tiles.keys());
    keys.forEach((key) => {
      if (key.startsWith(`${zoom}-`)) {
        this.tiles.delete(key);
      }
    });
  }

  /**
   * Clear entire cache
   */
  clear(): void {
    this.tiles.clear();
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    size: number;
    maxSize: number;
    hitRate: number;
    totalPlots: number;
  } {
    const totalPlots = Array.from(this.tiles.values()).reduce(
      (sum, tile) => sum + tile.plots.length,
      0
    );
    
    return {
      size: this.tiles.size,
      maxSize: this.maxTiles,
      hitRate: 0, // Updated externally
      totalPlots,
    };
  }

  /**
   * Evict least recently used tile
   */
  private evictLRU(): void {
    let oldestKey: string | null = null;
    let oldestTime = Date.now();
    
    this.tiles.forEach((tile, key) => {
      if (tile.lastAccessedAt < oldestTime) {
        oldestTime = tile.lastAccessedAt;
        oldestKey = key;
      }
    });
    
    if (oldestKey) {
      this.tiles.delete(oldestKey);
      console.log(`[TileCache] Evicted LRU tile: ${oldestKey}`);
    }
  }

  /**
   * Clean up expired tiles
   */
  cleanup(): void {
    const now = Date.now();
    const expired: string[] = [];
    
    this.tiles.forEach((tile, key) => {
      if (now - tile.loadedAt > this.maxAge) {
        expired.push(key);
      }
    });
    
    expired.forEach((key) => this.tiles.delete(key));
    
    if (expired.length > 0) {
      console.log(`[TileCache] Cleaned up ${expired.length} expired tiles`);
    }
  }
}

// Global singleton instance
let globalCache: TileCache | null = null;

/**
 * Get or create global tile cache instance
 */
export function getTileCache(): TileCache {
  if (!globalCache) {
    globalCache = new TileCache(100, 5); // 100 tiles, 5 min TTL
  }
  return globalCache;
}
