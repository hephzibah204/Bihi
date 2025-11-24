// utils/queryOptimizer.ts
// Optimized query utilities to eliminate N+1 patterns

import { getSupabase } from '../services/supabaseClient';
import { withRetry } from './retry';
import { parseSupabaseError } from './errors';
import { withCache, CACHE_CONFIGS } from './cache';

interface JoinConfig {
  table: string;
  alias: string;
  fields: string[];
  foreignKey: string;
  localKey?: string;
}

interface BatchQueryOptions {
  batchSize?: number;
  cache?: boolean;
  cacheKey?: string;
}

/**
 * Execute batch queries to avoid N+1 patterns
 */
export class QueryOptimizer {
  private readonly supabase = getSupabase();

  /**
   * Fetch multiple entities with their related data in a single query
   */
  async fetchWithJoins<T>(
    table: string, 
    joins: JoinConfig[], 
    filters: Record<string, any> = {},
    options: BatchQueryOptions = {}
  ): Promise<T[]> {
    const { cache = true, cacheKey } = options;
    const key = cacheKey || `${table}:joins:${JSON.stringify({ joins, filters })}`;

    const executeQuery = async (): Promise<T[]> => {
      return withRetry(async () => {
        // Build the select clause with joins
        const selectFields = [
          '*', // Main table fields
          ...joins.map(join => 
            `${join.alias}:${join.table}(${join.fields.join(',')})`
          )
        ];

        let query = this.supabase
          .from(table)
          .select(selectFields.join(','));

        // Apply filters
        Object.entries(filters).forEach(([key, value]) => {
          if (Array.isArray(value)) {
            query = query.in(key, value);
          } else if (value !== undefined && value !== null) {
            query = query.eq(key, value);
          }
        });

        const { data, error } = await query;
        
        if (error) {
          throw parseSupabaseError(error, 'SELECT', table);
        }

        return data || [];
      });
    };

    if (cache) {
      return withCache(key, executeQuery, CACHE_CONFIGS.ACADEMIC);
    }
    
    return executeQuery();
  }

  /**
   * Batch load related entities for a list of parent entities
   */
  async batchLoad<T>(
    relatedTable: string,
    foreignKey: string,
    parentIds: string[],
    options: BatchQueryOptions = {}
  ): Promise<Record<string, T[]>> {
    const { batchSize = 100, cache = true } = options;
    const cacheKey = `batch:${relatedTable}:${foreignKey}:${parentIds.join(',')}`;

    const executeQuery = async (): Promise<Record<string, T[]>> => {
      const results: Record<string, T[]> = {};
      
      // Process in batches to avoid URL length limits
      for (let i = 0; i < parentIds.length; i += batchSize) {
        const batch = parentIds.slice(i, i + batchSize);
        
        const { data, error } = await withRetry(async () => {
          return this.supabase
            .from(relatedTable)
            .select('*')
            .in(foreignKey, batch);
        });

        if (error) {
          throw parseSupabaseError(error, 'SELECT', relatedTable);
        }

        // Group by foreign key
        (data || []).forEach((item: any) => {
          const key = item[foreignKey];
          if (!results[key]) {
            results[key] = [];
          }
          results[key].push(item);
        });
      }

      // Ensure all parent IDs have an entry (even if empty)
      parentIds.forEach(id => {
        if (!results[id]) {
          results[id] = [];
        }
      });

      return results;
    };

    if (cache) {
      return withCache(cacheKey, executeQuery, CACHE_CONFIGS.ACADEMIC);
    }
    
    return executeQuery();
  }

  /**
   * Optimized query for students with their scores, attendance, and remarks
   */
  async getStudentsWithAcademicData(studentIds?: string[], tenantId?: string) {
    const cacheKey = `students:academic:${tenantId}:${studentIds?.join(',')}`;
    
    return withCache(
      cacheKey,
      async () => {
        return withRetry(async () => {
          let query = this.supabase
            .from('students')
            .select(`
              *,
              scores:scores(
                id,
                subject,
                score,
                maxScore,
                date,
                type,
                term,
                session
              ),
              attendance:attendance(
                date,
                status,
                reason
              ),
              remarks:remarks(
                id,
                content,
                type,
                date,
                teacherId
              )
            `);

          if (tenantId) {
            query = query.eq('tenantId', tenantId);
          }

          if (studentIds && studentIds.length > 0) {
            query = query.in('id', studentIds);
          }

          const { data, error } = await query;
          
          if (error) {
            throw parseSupabaseError(error, 'SELECT', 'students');
          }

          return data || [];
        });
      },
      CACHE_CONFIGS.ACADEMIC
    );
  }

  /**
   * Optimized query for teachers with their subjects and classes
   */
  async getTeachersWithAssignments(teacherIds?: string[], tenantId?: string) {
    const cacheKey = `teachers:assignments:${tenantId}:${teacherIds?.join(',')}`;
    
    return withCache(
      cacheKey,
      async () => {
        return withRetry(async () => {
          let query = this.supabase
            .from('teachers')
            .select(`
              *,
              subjects:teacher_subjects(
                subjectId,
                subject:subjects(
                  id,
                  name,
                  code
                )
              ),
              classes:teacher_classes(
                classId,
                class:classes(
                  id,
                  name,
                  level
                )
              )
            `);

          if (tenantId) {
            query = query.eq('tenantId', tenantId);
          }

          if (teacherIds && teacherIds.length > 0) {
            query = query.in('id', teacherIds);
          }

          const { data, error } = await query;
          
          if (error) {
            throw parseSupabaseError(error, 'SELECT', 'teachers');
          }

          return data || [];
        });
      },
      CACHE_CONFIGS.USER
    );
  }

  /**
   * Optimized query for financial data with related entities
   */
  async getFinancialSummary(tenantId?: string, dateRange?: { start: string; end: string }) {
    const cacheKey = `financial:summary:${tenantId}:${dateRange?.start}-${dateRange?.end}`;
    
    return withCache(
      cacheKey,
      async () => {
        return withRetry(async () => {
          // Use parallel queries instead of sequential ones
          const [invoices, payments, expenses, income] = await Promise.all([
            this.getFinancialData('invoices', tenantId, dateRange),
            this.getFinancialData('payments', tenantId, dateRange),
            this.getFinancialData('expenses', tenantId, dateRange),
            this.getFinancialData('income', tenantId, dateRange)
          ]);

          return {
            invoices,
            payments,
            expenses,
            income,
            summary: {
              totalInvoiced: invoices.reduce((sum: number, inv: any) => sum + inv.amount, 0),
              totalPaid: payments.reduce((sum: number, pay: any) => sum + pay.amount, 0),
              totalExpenses: expenses.reduce((sum: number, exp: any) => sum + exp.amount, 0),
              totalIncome: income.reduce((sum: number, inc: any) => sum + inc.amount, 0)
            }
          };
        });
      },
      CACHE_CONFIGS.FINANCIAL
    );
  }

  /**
   * Helper method for financial data queries
   */
  private async getFinancialData(table: string, tenantId?: string, dateRange?: { start: string; end: string }) {
    let query = this.supabase.from(table).select('*');
    
    if (tenantId) {
      query = query.eq('tenantId', tenantId);
    }
    
    if (dateRange) {
      query = query
        .gte('date', dateRange.start)
        .lte('date', dateRange.end);
    }

    const { data, error } = await query;
    
    if (error) {
      throw parseSupabaseError(error, 'SELECT', table);
    }

    return data || [];
  }

  /**
   * Optimized search across multiple tables
   */
  async globalSearch(searchTerm: string, tenantId?: string, tables: string[] = ['students', 'teachers', 'parents']) {
    const cacheKey = `search:${searchTerm}:${tenantId}:${tables.join(',')}`;
    
    return withCache(
      cacheKey,
      async () => {
        const searchPromises = tables.map(async table => {
          return withRetry(async () => {
            let query = this.supabase
              .from(table)
              .select('*')
              .or(`firstName.ilike.%${searchTerm}%,lastName.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`);

            if (tenantId) {
              query = query.eq('tenantId', tenantId);
            }

            const { data, error } = await query.limit(10); // Limit results per table

            if (error) {
              throw parseSupabaseError(error, 'SELECT', table);
            }

            return {
              table,
              results: data || []
            };
          });
        });

        const results = await Promise.all(searchPromises);
        
        return results.reduce((acc, { table, results }) => {
          acc[table] = results;
          return acc;
        }, {} as Record<string, any[]>);
      },
      { ...CACHE_CONFIGS.USER, ttl: 30000 } // Short cache for search results
    );
  }

  /**
   * Batch update with optimized conflict resolution
   */
  async batchUpdate<T>(
    table: string,
    updates: Array<{ id: string; data: Partial<T> }>,
    options: BatchQueryOptions = {}
  ): Promise<T[]> {
    const { batchSize = 50 } = options;
    const results: T[] = [];

    // Process in batches to avoid payload size limits
    for (let i = 0; i < updates.length; i += batchSize) {
      const batch = updates.slice(i, i + batchSize);
      
      const batchData = batch.map(({ id, data }) => ({ ...data, id }));
      
      const { data, error } = await withRetry(async () => {
        return this.supabase
          .from(table)
          .upsert(batchData)
          .select();
      });

      if (error) {
        throw parseSupabaseError(error, 'UPSERT', table);
      }

      results.push(...(data || []));
    }

    return results;
  }

  /**
   * Aggregate queries for dashboard statistics
   */
  async getDashboardStats(tenantId?: string) {
    const cacheKey = `dashboard:stats:${tenantId}`;
    
    return withCache(
      cacheKey,
      async () => {
        // Use RPC function for complex aggregations
        const { data, error } = await this.supabase
          .rpc('get_dashboard_stats', { p_tenant_id: tenantId });

        if (error) {
          // Fallback to individual queries if RPC not available
          return this.getDashboardStatsFallback(tenantId);
        }

        return data;
      },
      { ...CACHE_CONFIGS.USER, ttl: 60000 } // Cache for 1 minute
    );
  }

  /**
   * Fallback method for dashboard stats using individual queries
   */
  private async getDashboardStatsFallback(tenantId?: string) {
    const queries = [
      this.getCount('students', tenantId),
      this.getCount('teachers', tenantId),
      this.getCount('parents', tenantId),
      this.getCount('classes', tenantId)
    ];

    const [studentCount, teacherCount, parentCount, classCount] = await Promise.all(queries);

    return {
      students: studentCount,
      teachers: teacherCount,
      parents: parentCount,
      classes: classCount
    };
  }

  /**
   * Helper method to get count for a table
   */
  private async getCount(table: string, tenantId?: string): Promise<number> {
    let query = this.supabase
      .from(table)
      .select('*', { count: 'exact', head: true });

    if (tenantId) {
      query = query.eq('tenantId', tenantId);
    }

    const { count, error } = await query;

    if (error) {
      throw parseSupabaseError(error, 'SELECT', table);
    }

    return count || 0;
  }
}

// Export singleton instance
export const queryOptimizer = new QueryOptimizer();