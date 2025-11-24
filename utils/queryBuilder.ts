// utils/queryBuilder.ts
// Advanced query builder with optimized filtering logic and performance enhancements

import { getSupabase } from '../services/supabaseClient';
import { withRetry } from './retry';
import { parseSupabaseError } from './errors';
import { withCache } from './cache';

export interface FilterCondition {
  field: string;
  operator: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'like' | 'ilike' | 'in' | 'not_in' | 'is' | 'contains' | 'contained_by' | 'overlap';
  value: any;
  logicalOperator?: 'AND' | 'OR';
}

export interface SortOption {
  field: string;
  direction: 'asc' | 'desc';
  nullsFirst?: boolean;
}

export interface PaginationOptions {
  limit?: number;
  offset?: number;
}

export interface QueryOptions {
  select?: string | string[];
  filters?: FilterCondition[];
  sorts?: SortOption[];
  pagination?: PaginationOptions;
  joins?: JoinConfig[];
  groupBy?: string[];
  having?: FilterCondition[];
  distinct?: boolean;
  cache?: {
    enabled: boolean;
    ttl?: number;
    tags?: string[];
  };
}

export interface JoinConfig {
  table: string;
  alias: string;
  type: 'inner' | 'left' | 'right' | 'full';
  on: {
    left: string;
    right: string;
  };
  select?: string[];
}

export class QueryBuilder {
  private readonly supabase = getSupabase();
  private query: any;
  private readonly tableName: string;
  private readonly tenantField?: string;
  private readonly tenantId?: string;

  constructor(tableName: string, tenantField?: string, tenantId?: string) {
    this.tableName = tableName;
    this.tenantField = tenantField;
    this.tenantId = tenantId;
    this.reset();
  }

  /**
   * Reset query builder
   */
  reset(): QueryBuilder {
    this.query = this.supabase.from(this.tableName);
    return this;
  }

  /**
   * Set select fields with optimization
   */
  select(fields: string | string[] = '*'): QueryBuilder {
    const selectClause = Array.isArray(fields) ? fields.join(',') : fields;
    this.query = this.query.select(selectClause);
    return this;
  }

  /**
   * Add optimized filter conditions
   */
  where(conditions: FilterCondition[]): QueryBuilder {
    if (!conditions || conditions.length === 0) {
      return this;
    }

    // Group conditions by logical operator for optimization
    const andConditions = conditions.filter(c => !c.logicalOperator || c.logicalOperator === 'AND');
    const orConditions = conditions.filter(c => c.logicalOperator === 'OR');

    // Apply AND conditions (most common case)
    andConditions.forEach(condition => {
      this.applyCondition(condition);
    });

    // Apply OR conditions using the or() method
    if (orConditions.length > 0) {
      const orClause = orConditions
        .map(condition => this.buildConditionString(condition))
        .join(',');
      
      if (orClause) {
        this.query = this.query.or(orClause);
      }
    }

    return this;
  }

  /**
   * Apply individual condition with optimization
   */
  private applyCondition(condition: FilterCondition): void {
    const { field, operator, value } = condition;

    // Skip null/undefined values unless specifically checking for them
    if (value === null || value === undefined) {
      if (operator === 'is') {
        this.query = this.query.is(field, null);
      }
      return;
    }

    // Optimize array operations
    if (Array.isArray(value) && value.length === 0) {
      return; // Skip empty arrays
    }

    switch (operator) {
      case 'eq':
        this.query = this.query.eq(field, value);
        break;
      case 'neq':
        this.query = this.query.neq(field, value);
        break;
      case 'gt':
        this.query = this.query.gt(field, value);
        break;
      case 'gte':
        this.query = this.query.gte(field, value);
        break;
      case 'lt':
        this.query = this.query.lt(field, value);
        break;
      case 'lte':
        this.query = this.query.lte(field, value);
        break;
      case 'like':
        this.query = this.query.like(field, value);
        break;
      case 'ilike':
        this.query = this.query.ilike(field, value);
        break;
      case 'in':
        if (Array.isArray(value) && value.length > 0) {
          // Optimize large IN clauses by batching
          if (value.length > 1000) {
            console.warn(`[QueryBuilder] Large IN clause detected (${value.length} items). Consider pagination.`);
          }
          this.query = this.query.in(field, value);
        }
        break;
      case 'not_in':
        if (Array.isArray(value) && value.length > 0) {
          this.query = this.query.not(field, 'in', `(${value.join(',')})`);
        }
        break;
      case 'contains':
        this.query = this.query.contains(field, value);
        break;
      case 'contained_by':
        this.query = this.query.containedBy(field, value);
        break;
      case 'overlap':
        this.query = this.query.overlaps(field, value);
        break;
      case 'is':
        this.query = this.query.is(field, value);
        break;
      default:
        console.warn(`[QueryBuilder] Unsupported operator: ${operator}`);
    }
  }

  /**
   * Build condition string for OR clauses
   */
  private buildConditionString(condition: FilterCondition): string {
    const { field, operator, value } = condition;

    switch (operator) {
      case 'eq':
        return `${field}.eq.${value}`;
      case 'neq':
        return `${field}.neq.${value}`;
      case 'gt':
        return `${field}.gt.${value}`;
      case 'gte':
        return `${field}.gte.${value}`;
      case 'lt':
        return `${field}.lt.${value}`;
      case 'lte':
        return `${field}.lte.${value}`;
      case 'like':
        return `${field}.like.${value}`;
      case 'ilike':
        return `${field}.ilike.${value}`;
      case 'in':
        return Array.isArray(value) ? `${field}.in.(${value.join(',')})` : `${field}.eq.${value}`;
      case 'is':
        return `${field}.is.${value}`;
      default:
        return `${field}.eq.${value}`;
    }
  }

  /**
   * Add sorting with optimization
   */
  orderBy(sorts: SortOption[]): QueryBuilder {
    if (!sorts || sorts.length === 0) {
      return this;
    }

    sorts.forEach(sort => {
      const options: any = { 
        ascending: sort.direction === 'asc',
        nullsFirst: sort.nullsFirst 
      };
      
      this.query = this.query.order(sort.field, options);
    });

    return this;
  }

  /**
   * Add pagination with optimization
   */
  paginate(pagination: PaginationOptions): QueryBuilder {
    if (!pagination) {
      return this;
    }

    const { limit = 50, offset = 0 } = pagination;
    
    // Validate and optimize limits
    const optimizedLimit = Math.min(Math.max(1, limit), 1000); // Max 1000 records
    const optimizedOffset = Math.max(0, offset);

    this.query = this.query.range(optimizedOffset, optimizedOffset + optimizedLimit - 1);

    return this;
  }

  /**
   * Apply tenant filtering automatically
   */
  applyTenantFilter(): QueryBuilder {
    if (this.tenantField && this.tenantId) {
      this.query = this.query.eq(this.tenantField, this.tenantId);
    }
    return this;
  }

  /**
   * Add full-text search optimization
   */
  search(searchTerm: string, fields: string[]): QueryBuilder {
    if (!searchTerm || !fields || fields.length === 0) {
      return this;
    }

    // Use textSearch if available, otherwise fall back to ilike
    const searchConditions = fields.map(field => `${field}.ilike.%${searchTerm}%`);
    
    if (searchConditions.length > 0) {
      this.query = this.query.or(searchConditions.join(','));
    }

    return this;
  }

  /**
   * Execute query with caching and retry logic
   */
  async execute<T>(options: { 
    cache?: boolean; 
    cacheKey?: string; 
    cacheTTL?: number;
    retries?: number;
  } = {}): Promise<T[]> {
    const { 
      cache = false, 
      cacheKey, 
      cacheTTL = 300000, // 5 minutes default
      retries = 3 
    } = options;

    // Apply tenant filter automatically
    this.applyTenantFilter();

    const executeQuery = async (): Promise<T[]> => {
      return withRetry(async () => {
        const { data, error } = await this.query;
        
        if (error) {
          throw parseSupabaseError(error, 'SELECT', this.tableName);
        }

        return data || [];
      }, { maxRetries: retries });
    };

    if (cache && cacheKey) {
      return withCache(cacheKey, executeQuery, { ttl: cacheTTL, tags: [this.tableName] });
    }

    return executeQuery();
  }

  /**
   * Execute count query with optimization
   */
  async count(options: { 
    cache?: boolean; 
    cacheKey?: string; 
    exactCount?: boolean;
  } = {}): Promise<number> {
    const { cache = false, cacheKey, exactCount = false } = options;

    // Apply tenant filter
    this.applyTenantFilter();

    const executeCount = async (): Promise<number> => {
      return withRetry(async () => {
        const countOptions = exactCount ? { count: 'exact', head: true } : { count: 'estimated', head: true };
        const { count, error } = await this.query.select('*', countOptions);
        
        if (error) {
          throw parseSupabaseError(error, 'SELECT', this.tableName);
        }

        return count || 0;
      });
    };

    if (cache && cacheKey) {
      return withCache(cacheKey, executeCount, { ttl: 60000, tags: [this.tableName] }); // 1 minute cache for counts
    }

    return executeCount();
  }

  /**
   * Build complex queries with joins
   */
  join(joins: JoinConfig[]): QueryBuilder {
    if (!joins || joins.length === 0) {
      return this;
    }

    // Build select clause with joined tables
    const selectFields: string[] = ['*']; // Base table fields

    joins.forEach(join => {
      const joinSelect = join.select ? join.select.join(',') : '*';
      selectFields.push(`${join.alias}:${join.table}(${joinSelect})`);
    });

    this.query = this.query.select(selectFields.join(','));
    return this;
  }

  /**
   * Create a new instance for chaining
   */
  static create(tableName: string, tenantField?: string, tenantId?: string): QueryBuilder {
    return new QueryBuilder(tableName, tenantField, tenantId);
  }
}

/**
 * Optimized filter utilities
 */
export class FilterOptimizer {
  /**
   * Optimize filter conditions for performance
   */
  static optimize(conditions: FilterCondition[]): FilterCondition[] {
    if (!conditions || conditions.length === 0) {
      return [];
    }

    // Remove duplicate conditions
    const uniqueConditions = conditions.filter((condition, index, self) => 
      index === self.findIndex(c => 
        c.field === condition.field && 
        c.operator === condition.operator && 
        JSON.stringify(c.value) === JSON.stringify(condition.value)
      )
    );

    // Sort conditions for optimal query execution
    // 1. Equality conditions first (most selective)
    // 2. Range conditions
    // 3. Pattern matching conditions last
    const sortedConditions = uniqueConditions.sort((a, b) => {
      const operatorPriority = {
        'eq': 1,
        'in': 2,
        'neq': 3,
        'gt': 4, 'gte': 4, 'lt': 4, 'lte': 4,
        'like': 5, 'ilike': 5,
        'contains': 6, 'contained_by': 6, 'overlap': 6,
        'is': 7
      };

      return (operatorPriority[a.operator] || 10) - (operatorPriority[b.operator] || 10);
    });

    return sortedConditions;
  }

  /**
   * Validate filter conditions
   */
  static validate(conditions: FilterCondition[]): string[] {
    const errors: string[] = [];

    conditions.forEach((condition, index) => {
      if (!condition.field) {
        errors.push(`Condition ${index}: Field is required`);
      }

      if (!condition.operator) {
        errors.push(`Condition ${index}: Operator is required`);
      }

      // Validate array operations
      if (['in', 'not_in'].includes(condition.operator) && !Array.isArray(condition.value)) {
        errors.push(`Condition ${index}: Value must be an array for ${condition.operator} operator`);
      }

      // Validate range operations
      if (['gt', 'gte', 'lt', 'lte'].includes(condition.operator) && 
          (condition.value === null || condition.value === undefined)) {
        errors.push(`Condition ${index}: Value is required for ${condition.operator} operator`);
      }
    });

    return errors;
  }

  /**
   * Create common filter conditions
   */
  static createDateRangeFilter(field: string, startDate: Date, endDate: Date): FilterCondition[] {
    return [
      { field, operator: 'gte', value: startDate.toISOString() },
      { field, operator: 'lte', value: endDate.toISOString() }
    ];
  }

  static createTextSearchFilter(fields: string[], searchTerm: string): FilterCondition[] {
    return fields.map(field => ({
      field,
      operator: 'ilike' as const,
      value: `%${searchTerm}%`,
      logicalOperator: 'OR' as const
    }));
  }

  static createStatusFilter(field: string, statuses: string[]): FilterCondition {
    return {
      field,
      operator: 'in',
      value: statuses
    };
  }
}

/**
 * Pre-built query templates for common operations
 */
export class QueryTemplates {
  static studentsByClass(classId: string, tenantId?: string): QueryBuilder {
    return QueryBuilder
      .create('students', 'tenant_id', tenantId)
      .select(['id', 'first_name', 'last_name', 'email', 'status'])
      .where([{ field: 'class_id', operator: 'eq', value: classId }])
      .orderBy([{ field: 'last_name', direction: 'asc' }]);
  }

  static activeUsers(tableName: string, tenantId?: string): QueryBuilder {
    return QueryBuilder
      .create(tableName, 'tenant_id', tenantId)
      .where([{ field: 'status', operator: 'eq', value: 'active' }])
      .orderBy([{ field: 'created_at', direction: 'desc' }]);
  }

  static recentActivity(tableName: string, days: number = 30, tenantId?: string): QueryBuilder {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    return QueryBuilder
      .create(tableName, 'tenant_id', tenantId)
      .where([{ field: 'created_at', operator: 'gte', value: cutoffDate.toISOString() }])
      .orderBy([{ field: 'created_at', direction: 'desc' }]);
  }
}

export { QueryBuilder as default, FilterOptimizer, QueryTemplates };