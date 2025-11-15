// repositories/BaseRepository.ts
// Base repository class with common database operations

import { getSupabase } from '../services/supabaseClient';
import { getDatabaseProvider } from '../services/databaseProvider';
import { withRetry } from '../utils/retry';
import { parseSupabaseError, NotFoundError } from '../utils/errors';
import { withCache, invalidateCache, CACHE_CONFIGS } from '../utils/cache';
import { validateInput, paginationSchema } from '../utils/validation';

export interface PaginationOptions {
  limit?: number;
  offset?: number;
}

export interface FilterOptions {
  [key: string]: any;
}

export interface QueryOptions extends PaginationOptions {
  select?: string;
  orderBy?: { column: string; ascending?: boolean };
  filters?: FilterOptions;
}

export interface RepositoryConfig {
  table: string;
  idField?: string;
  tenantField?: string;
  cacheConfig?: { ttl: number; tags: string[] };
}

/**
 * Base repository class providing common database operations
 */
export abstract class BaseRepository<T = any> {
  protected table: string;
  protected idField: string;
  protected tenantField: string | null;
  protected cacheConfig: { ttl: number; tags: string[] };
  protected provider = getDatabaseProvider();

  constructor(config: RepositoryConfig) {
    this.table = config.table;
    this.idField = config.idField || 'id';
    this.tenantField = config.tenantField || null;
    this.cacheConfig = config.cacheConfig || CACHE_CONFIGS.USER;
  }

  /**
   * Get Supabase client instance
   */
  protected getClient() {
    return getSupabase();
  }

  /**
   * Build cache key for this repository
   */
  protected getCacheKey(operation: string, params?: any): string {
    const baseKey = `${this.table}:${operation}`;
    if (params) {
      return `${baseKey}:${JSON.stringify(params)}`;
    }
    return baseKey;
  }

  /**
   * Apply tenant filtering if configured
   */
  protected applyTenantFilter(query: any, tenantId?: string): any {
    if (this.tenantField && tenantId) {
      return query.eq(this.tenantField, tenantId);
    }
    return query;
  }

  /**
   * Apply filters to query
   */
  protected applyFilters(query: any, filters: FilterOptions = {}): any {
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          query = query.in(key, value);
        } else if (typeof value === 'object' && value.operator) {
          // Support for advanced operators: { operator: 'gte', value: 100 }
          const { operator, value: filterValue } = value;
          query = query[operator](key, filterValue);
        } else {
          query = query.eq(key, value);
        }
      }
    });
    return query;
  }

  /**
   * Apply pagination to query
   */
  protected applyPagination(query: any, options: PaginationOptions = {}): any {
    const pagination = validateInput(paginationSchema, options);
    const { limit, offset } = pagination;
    
    if (limit && offset !== undefined) {
      return query.range(offset, offset + limit - 1);
    }
    return query;
  }

  /**
   * Apply ordering to query
   */
  protected applyOrdering(query: any, orderBy?: { column: string; ascending?: boolean }): any {
    if (orderBy) {
      return query.order(orderBy.column, { ascending: orderBy.ascending !== false });
    }
    return query;
  }

  /**
   * Build complete query with all options
   */
  protected buildQuery(options: QueryOptions = {}, tenantId?: string): any {
    const { select = '*', filters, orderBy } = options;
    
    let query = this.getClient().from(this.table).select(select);
    
    // Apply tenant filtering
    query = this.applyTenantFilter(query, tenantId);
    
    // Apply filters
    query = this.applyFilters(query, filters);
    
    // Apply ordering
    query = this.applyOrdering(query, orderBy);
    
    // Apply pagination
    query = this.applyPagination(query, options);
    
    return query;
  }

  /**
   * Find all records
   */
  async findAll(options: QueryOptions = {}, tenantId?: string): Promise<T[]> {
    const cacheKey = this.getCacheKey('findAll', { options, tenantId });
    
    return withCache(
      cacheKey,
      async () => {
        return withRetry(async () => {
          const { data, error } = await this.provider.select(this.table, options, this.tenantField, tenantId);
          if (error) {
            throw parseSupabaseError(error, 'SELECT', this.table);
          }
          return (data as T[]) || [];
        });
      },
      this.cacheConfig
    );
  }

  /**
   * Find record by ID
   */
  async findById(id: string, tenantId?: string): Promise<T | null> {
    const cacheKey = this.getCacheKey('findById', { id, tenantId });
    
    return withCache(
      cacheKey,
      async () => {
        return withRetry(async () => {
          const { data, error } = await this.provider.selectOneById(this.table, this.idField, id, this.tenantField, tenantId);
          if (error) {
            throw parseSupabaseError(error, 'SELECT', this.table);
          }
          return (data as T) ?? null;
        });
      },
      this.cacheConfig
    );
  }

  /**
   * Find records by field value
   */
  async findBy(field: string, value: any, options: QueryOptions = {}, tenantId?: string): Promise<T[]> {
    const cacheKey = this.getCacheKey('findBy', { field, value, options, tenantId });
    
    return withCache(
      cacheKey,
      async () => {
        return withRetry(async () => {
          const filters = { ...options.filters, [field]: value } as any;
          const queryOptions = { ...options, filters } as any;
          const { data, error } = await this.provider.select(this.table, queryOptions, this.tenantField, tenantId);
          if (error) {
            throw parseSupabaseError(error, 'SELECT', this.table);
          }
          return (data as T[]) || [];
        });
      },
      this.cacheConfig
    );
  }

  /**
   * Create new record
   */
  async create(data: Partial<T>, tenantId?: string): Promise<T> {
    return withRetry(async () => {
      const { data: result, error } = await this.provider.insert(this.table, data, this.tenantField, tenantId);
      if (error) {
        throw parseSupabaseError(error, 'INSERT', this.table);
      }
      this.invalidateCache(['create', 'findAll']);
      return result as T;
    });
  }

  /**
   * Update record by ID
   */
  async update(id: string, data: Partial<T>, tenantId?: string): Promise<T> {
    return withRetry(async () => {
      const { data: result, error, notFound } = await this.provider.updateById(this.table, this.idField, id, data, this.tenantField, tenantId);
      if (error) {
        if (notFound) {
          throw new NotFoundError(`Record not found: ${id}`, this.table, id);
        }
        throw parseSupabaseError(error, 'UPDATE', this.table);
      }
      this.invalidateCache(['update', 'findById', 'findAll'], id);
      return result as T;
    });
  }

  /**
   * Delete record by ID
   */
  async delete(id: string, tenantId?: string): Promise<void> {
    return withRetry(async () => {
      const { error } = await this.provider.deleteById(this.table, this.idField, id, this.tenantField, tenantId);
      if (error) {
        throw parseSupabaseError(error, 'DELETE', this.table);
      }
      this.invalidateCache(['delete', 'findById', 'findAll'], id);
    });
  }

  /**
   * Batch create records
   */
  async batchCreate(records: Partial<T>[], tenantId?: string): Promise<T[]> {
    return withRetry(async () => {
      const { data, error } = await this.provider.batchInsert(this.table, records, this.tenantField, tenantId);
      if (error) {
        throw parseSupabaseError(error, 'INSERT', this.table);
      }
      this.invalidateCache(['batchCreate', 'findAll']);
      return (data as T[]) || [];
    });
  }

  /**
   * Count records
   */
  async count(filters: FilterOptions = {}, tenantId?: string): Promise<number> {
    const cacheKey = this.getCacheKey('count', { filters, tenantId });
    
    return withCache(
      cacheKey,
      async () => {
        return withRetry(async () => {
          const { count, error } = await this.provider.count(this.table, filters, this.tenantField, tenantId);
          if (error) {
            throw parseSupabaseError(error, 'SELECT', this.table);
          }
          return count || 0;
        });
      },
      { ...this.cacheConfig, ttl: 30000 }
    );
  }

  /**
   * Check if record exists
   */
  async exists(id: string, tenantId?: string): Promise<boolean> {
    const cacheKey = this.getCacheKey('exists', { id, tenantId });
    
    return withCache(
      cacheKey,
      async () => {
        const count = await this.count({ [this.idField]: id }, tenantId);
        return count > 0;
      },
      { ...this.cacheConfig, ttl: 30000 }
    );
  }

  /**
   * Invalidate cache entries for this repository
   */
  protected invalidateCache(operations: string[], id?: string): void {
    const tags = this.cacheConfig.tags;
    
    // Invalidate by tags
    invalidateCache(tags);
    
    // Invalidate specific operation keys
    operations.forEach(op => {
      const pattern = `${this.table}:${op}*`;
      invalidateCache(pattern);
    });
    
    // Invalidate specific record if ID provided
    if (id) {
      const specificKey = this.getCacheKey('findById', { id });
      invalidateCache(specificKey);
    }
  }
}
