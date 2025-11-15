import { getSupabase } from './supabaseClient';

export type PaginationOptions = { limit?: number; offset?: number };
export type FilterOptions = { [key: string]: any };
export type QueryOptions = PaginationOptions & {
  select?: string;
  orderBy?: { column: string; ascending?: boolean };
  filters?: FilterOptions;
};

export interface DatabaseProvider {
  select: (table: string, options?: QueryOptions, tenantField?: string | null, tenantId?: string) => Promise<{ data: any[]; error?: any }>;
  selectOneById: (table: string, idField: string, id: string, tenantField?: string | null, tenantId?: string) => Promise<{ data: any | null; error?: any }>;
  insert: (table: string, data: any, tenantField?: string | null, tenantId?: string) => Promise<{ data: any; error?: any }>;
  updateById: (table: string, idField: string, id: string, data: any, tenantField?: string | null, tenantId?: string) => Promise<{ data: any; error?: any; notFound?: boolean }>;
  deleteById: (table: string, idField: string, id: string, tenantField?: string | null, tenantId?: string) => Promise<{ error?: any; notFound?: boolean }>;
  batchInsert: (table: string, records: any[], tenantField?: string | null, tenantId?: string) => Promise<{ data: any[]; error?: any }>;
  count: (table: string, filters?: FilterOptions, tenantField?: string | null, tenantId?: string) => Promise<{ count: number; error?: any }>;
}

let provider: DatabaseProvider | null = null;

export function getDatabaseProvider(): DatabaseProvider {
  if (provider) return provider;
  const name = (typeof window !== 'undefined')
    ? (window.process?.env?.VITE_DATABASE_PROVIDER || (import.meta as any)?.env?.VITE_DATABASE_PROVIDER)
    : process.env.VITE_DATABASE_PROVIDER;
  const selected = String(name || 'supabase').toLowerCase();
  if (selected === 'supabase') {
    provider = createSupabaseProvider();
    return provider;
  }
  provider = createSupabaseProvider();
  return provider;
}

function createSupabaseProvider(): DatabaseProvider {
  function applyFilters(query: any, filters: FilterOptions = {}): any {
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          query = query.in(key, value);
        } else if (typeof value === 'object' && (value as any).operator) {
          const op = (value as any).operator;
          const val = (value as any).value;
          query = query[op](key, val);
        } else {
          query = query.eq(key, value);
        }
      }
    });
    return query;
  }

  function applyPagination(query: any, options: PaginationOptions = {}): any {
    const { limit, offset } = options;
    if (limit && offset !== undefined) {
      return query.range(offset, offset + limit - 1);
    }
    return query;
  }

  function applyOrdering(query: any, orderBy?: { column: string; ascending?: boolean }): any {
    if (orderBy) {
      return query.order(orderBy.column, { ascending: orderBy.ascending !== false });
    }
    return query;
  }

  function applyTenant(query: any, tenantField?: string | null, tenantId?: string): any {
    if (tenantField && tenantId) {
      return query.eq(tenantField, tenantId);
    }
    return query;
  }

  return {
    async select(table, options = {}, tenantField, tenantId) {
      const client = getSupabase();
      const { select = '*', filters, orderBy } = options;
      let query = client.from(table).select(select);
      query = applyTenant(query, tenantField, tenantId);
      query = applyFilters(query, filters);
      query = applyOrdering(query, orderBy);
      query = applyPagination(query, options);
      const { data, error } = await query;
      return { data: data || [], error };
    },
    async selectOneById(table, idField, id, tenantField, tenantId) {
      const client = getSupabase();
      let query = client.from(table).select('*').eq(idField, id);
      query = applyTenant(query, tenantField, tenantId);
      const { data, error } = await query.single();
      if (error && error.code === 'PGRST116') return { data: null };
      return { data, error };
    },
    async insert(table, data, tenantField, tenantId) {
      const client = getSupabase();
      if (tenantField && tenantId) data[tenantField] = tenantId;
      const { data: result, error } = await client.from(table).insert(data).select().single();
      return { data: result, error };
    },
    async updateById(table, idField, id, data, tenantField, tenantId) {
      const client = getSupabase();
      let query = client.from(table).update(data).eq(idField, id);
      query = applyTenant(query, tenantField, tenantId);
      const { data: result, error } = await query.select().single();
      const notFound = !!(error && error.code === 'PGRST116');
      return { data: result, error, notFound };
    },
    async deleteById(table, idField, id, tenantField, tenantId) {
      const client = getSupabase();
      let query = client.from(table).delete().eq(idField, id);
      query = applyTenant(query, tenantField, tenantId);
      const { error } = await query;
      const notFound = !!(error && error.code === 'PGRST116');
      return { error, notFound };
    },
    async batchInsert(table, records, tenantField, tenantId) {
      const client = getSupabase();
      if (tenantField && tenantId) {
        records = records.map(r => ({ ...r, [tenantField!]: tenantId }));
      }
      const { data, error } = await client.from(table).insert(records).select();
      return { data: data || [], error };
    },
    async count(table, filters = {}, tenantField, tenantId) {
      const client = getSupabase();
      let query = client.from(table).select('*', { count: 'exact', head: true });
      query = applyTenant(query, tenantField, tenantId);
      query = applyFilters(query, filters);
      const { count, error } = await query;
      return { count: count || 0, error };
    }
  };
}

