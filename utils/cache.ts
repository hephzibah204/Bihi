// utils/cache.ts
// Query caching system with TTL and invalidation strategies

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
  tags: string[];
}

interface CacheOptions {
  ttl?: number; // Time to live in milliseconds
  tags?: string[]; // Cache invalidation tags
  key?: string; // Custom cache key
}

class QueryCache {
  private cache = new Map<string, CacheEntry<any>>();
  private defaultTTL = 5 * 60 * 1000; // 5 minutes default

  /**
   * Get cached data or execute query function
   */
  async get<T>(
    key: string,
    queryFn: () => Promise<T>,
    options: CacheOptions = {}
  ): Promise<T> {
    const { ttl = this.defaultTTL, tags = [] } = options;
    
    // Check if we have valid cached data
    const cached = this.cache.get(key);
    if (cached && this.isValid(cached)) {
      return cached.data as T;
    }

    // Execute query and cache result
    try {
      const data = await queryFn();
      this.set(key, data, { ttl, tags });
      return data;
    } catch (error) {
      // Remove invalid cache entry if it exists
      this.cache.delete(key);
      throw error;
    }
  }

  /**
   * Set cache entry
   */
  set<T>(key: string, data: T, options: CacheOptions = {}): void {
    const { ttl = this.defaultTTL, tags = [] } = options;
    
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
      tags
    });
  }

  /**
   * Check if cache entry is still valid
   */
  private isValid(entry: CacheEntry<any>): boolean {
    return Date.now() - entry.timestamp < entry.ttl;
  }

  /**
   * Invalidate cache entries by key pattern or tags
   */
  invalidate(keyOrTags: string | string[]): number {
    let invalidated = 0;

    if (typeof keyOrTags === 'string') {
      // Direct key invalidation or pattern matching
      if (keyOrTags.includes('*')) {
        // Pattern matching
        const pattern = new RegExp(keyOrTags.replace(/\*/g, '.*'));
        for (const [key] of this.cache) {
          if (pattern.test(key)) {
            this.cache.delete(key);
            invalidated++;
          }
        }
      } else {
        // Direct key
        if (this.cache.delete(keyOrTags)) {
          invalidated = 1;
        }
      }
    } else {
      // Tag-based invalidation
      const tagsToInvalidate = new Set(keyOrTags);
      for (const [key, entry] of this.cache) {
        if (entry.tags.some(tag => tagsToInvalidate.has(tag))) {
          this.cache.delete(key);
          invalidated++;
        }
      }
    }

    // Cache invalidation completed
    
    return invalidated;
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Clean up expired entries
   */
  cleanup(): number {
    let cleaned = 0;
    for (const [key, entry] of this.cache) {
      if (!this.isValid(entry)) {
        this.cache.delete(key);
        cleaned++;
      }
    }
    
    // Cleanup completed
    
    return cleaned;
  }

  /**
   * Get cache statistics
   */
  getStats() {
    let valid = 0;
    let expired = 0;

    for (const [, entry] of this.cache) {
      if (this.isValid(entry)) {
        valid++;
      } else {
        expired++;
      }
    }

    return {
      total: this.cache.size,
      valid,
      expired,
      hitRatio: 0 // Would need to track hits/misses for this
    };
  }
}

// Global cache instance
const queryCache = new QueryCache();

// Export the cache instance and utilities
export { queryCache };

/**
 * Cache decorator for query functions
 */
export function cached<T extends any[], R>(
  options: CacheOptions & { keyBuilder?: (...args: T) => string } = {}
) {
  return function(target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;
    const { keyBuilder = (...args: T) => `${propertyName}:${JSON.stringify(args)}` } = options;

    descriptor.value = async function(...args: T): Promise<R> {
      const key = keyBuilder(...args);
      return queryCache.get(key, () => method.apply(this, args), options);
    };

    return descriptor;
  };
}

/**
 * Cached query wrapper function
 */
export async function withCache<T>(
  key: string,
  queryFn: () => Promise<T>,
  options: CacheOptions = {}
): Promise<T> {
  return queryCache.get(key, queryFn, options);
}

/**
 * Cache invalidation helper
 */
export function invalidateCache(keyOrTags: string | string[]): number {
  return queryCache.invalidate(keyOrTags);
}

/**
 * Predefined cache configurations for different data types
 */
export const CACHE_CONFIGS = {
  // Static/reference data - cache for 30 minutes
  STATIC: { ttl: 30 * 60 * 1000, tags: ['static'] },
  
  // User-specific data - cache for 5 minutes
  USER: { ttl: 5 * 60 * 1000, tags: ['user'] },
  
  // Tenant/school settings - cache for 15 minutes
  TENANT: { ttl: 15 * 60 * 1000, tags: ['tenant', 'settings'] },
  
  // Academic data (scores, attendance) - cache for 2 minutes
  ACADEMIC: { ttl: 2 * 60 * 1000, tags: ['academic'] },
  
  // Financial data - cache for 1 minute (frequently changing)
  FINANCIAL: { ttl: 1 * 60 * 1000, tags: ['financial'] },
  
  // Communication data - cache for 30 seconds
  COMMUNICATION: { ttl: 30 * 1000, tags: ['communication'] }
};

/**
 * Cache key builders for common patterns
 */
export const CACHE_KEYS = {
  student: (tenantId: string, studentId?: string) => 
    studentId ? `students:${tenantId}:${studentId}` : `students:${tenantId}:all`,
  
  teacher: (tenantId: string, teacherId?: string) =>
    teacherId ? `teachers:${tenantId}:${teacherId}` : `teachers:${tenantId}:all`,
  
  class: (tenantId: string, classId?: string) =>
    classId ? `classes:${tenantId}:${classId}` : `classes:${tenantId}:all`,
  
  scores: (tenantId: string, studentId?: string, subjectId?: string) => {
    let key = `scores:${tenantId}`;
    if (studentId) key += `:student:${studentId}`;
    if (subjectId) key += `:subject:${subjectId}`;
    return key;
  },
  
  settings: (tenantId: string, category?: string) =>
    category ? `settings:${tenantId}:${category}` : `settings:${tenantId}:all`
};

// Auto-cleanup expired entries every 10 minutes
if (typeof window !== 'undefined') {
  setInterval(() => {
    queryCache.cleanup();
  }, 10 * 60 * 1000);
}

export default queryCache;