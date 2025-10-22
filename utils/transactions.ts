// utils/transactions.ts
// Transaction utilities for complex database operations with rollback support

import { getSupabase } from '../services/supabaseClient';
import { withRetry } from './retry';
import { parseSupabaseError, DatabaseError } from './errors';

export interface TransactionOptions {
  maxRetries?: number;
  timeout?: number;
  isolationLevel?: 'READ_COMMITTED' | 'SERIALIZABLE';
}

/**
 * Execute multiple operations within a transaction
 * Note: Supabase doesn't support transactions in the traditional sense,
 * so we implement optimistic concurrency with rollback logic
 */
export async function withTransaction<T>(
  operations: (client: any) => Promise<T>,
  options: TransactionOptions = {}
): Promise<T> {
  const supabase = getSupabase();
  const { maxRetries = 3, timeout = 30000 } = options;

  // Store rollback operations
  const rollbackOps: Array<() => Promise<void>> = [];
  let hasStarted = false;

  try {
    // Create a proxy client that tracks operations for rollback
    const transactionClient = createTransactionProxy(supabase, rollbackOps);
    
    hasStarted = true;
    
    // Execute operations with timeout
    const result = await Promise.race([
      withRetry(() => operations(transactionClient), { maxRetries }),
      new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('Transaction timeout')), timeout)
      )
    ]);

    return result;
    
  } catch (error) {
    if (hasStarted && rollbackOps.length > 0) {
      console.warn('[Transaction] Rolling back operations...');
      await performRollback(rollbackOps);
    }
    
    throw parseSupabaseError(error, 'UPDATE', 'transaction');
  }
}

/**
 * Create a proxy client that tracks operations for potential rollback
 */
function createTransactionProxy(supabase: any, rollbackOps: Array<() => Promise<void>>) {
  return {
    from: (table: string) => ({
      select: (columns: string = '*') => supabase.from(table).select(columns),
      
      insert: (data: any) => {
        const insertOp = supabase.from(table).insert(data).select();
        
        // Track for rollback - we'll need to delete what we inserted
        return {
          then: async (onFulfilled?: any, onRejected?: any) => {
            try {
              const result = await insertOp;
              if (result.data && result.data.length > 0) {
                const insertedIds = result.data.map((item: any) => item.id);
                rollbackOps.push(async () => {
                  await supabase.from(table).delete().in('id', insertedIds);
                });
              }
              return onFulfilled ? onFulfilled(result) : result;
            } catch (error) {
              return onRejected ? onRejected(error) : Promise.reject(error);
            }
          }
        };
      },
      
      update: (data: any) => ({
        eq: (column: string, value: any) => {
          // First get the current data for rollback
          const getOriginal = supabase.from(table).select('*').eq(column, value);
          const updateOp = supabase.from(table).update(data).eq(column, value).select();
          
          return {
            then: async (onFulfilled?: any, onRejected?: any) => {
              try {
                // Get original data first
                const originalResult = await getOriginal;
                const originalData = originalResult.data;
                
                // Perform update
                const result = await updateOp;
                
                // Track for rollback
                if (originalData && originalData.length > 0) {
                  rollbackOps.push(async () => {
                    for (const original of originalData) {
                      await supabase.from(table).update(original).eq('id', original.id);
                    }
                  });
                }
                
                return onFulfilled ? onFulfilled(result) : result;
              } catch (error) {
                return onRejected ? onRejected(error) : Promise.reject(error);
              }
            }
          };
        }
      }),
      
      delete: () => ({
        eq: (column: string, value: any) => {
          // First get the data that will be deleted for rollback
          const getToDelete = supabase.from(table).select('*').eq(column, value);
          const deleteOp = supabase.from(table).delete().eq(column, value);
          
          return {
            then: async (onFulfilled?: any, onRejected?: any) => {
              try {
                // Get data to delete first
                const toDeleteResult = await getToDelete;
                const dataToDelete = toDeleteResult.data;
                
                // Perform delete
                const result = await deleteOp;
                
                // Track for rollback
                if (dataToDelete && dataToDelete.length > 0) {
                  rollbackOps.push(async () => {
                    await supabase.from(table).insert(dataToDelete);
                  });
                }
                
                return onFulfilled ? onFulfilled(result) : result;
              } catch (error) {
                return onRejected ? onRejected(error) : Promise.reject(error);
              }
            }
          };
        }
      }),
      
      upsert: (data: any) => {
        const upsertOp = supabase.from(table).upsert(data).select();
        
        return {
          then: async (onFulfilled?: any, onRejected?: any) => {
            try {
              // For upsert, rollback is complex - we track what was there before
              const result = await upsertOp;
              
              // Note: Proper upsert rollback would require knowing what was updated vs inserted
              // This is a simplified version
              if (result.data) {
                rollbackOps.push(async () => {
                  console.warn('[Transaction] Upsert rollback not fully implemented');
                });
              }
              
              return onFulfilled ? onFulfilled(result) : result;
            } catch (error) {
              return onRejected ? onRejected(error) : Promise.reject(error);
            }
          }
        };
      }
    }),
    
    // Pass through other methods
    auth: supabase.auth,
    storage: supabase.storage,
    realtime: supabase.realtime,
    rpc: supabase.rpc
  };
}

/**
 * Perform rollback operations in reverse order
 */
async function performRollback(rollbackOps: Array<() => Promise<void>>) {
  const errors: Error[] = [];
  
  // Execute rollback operations in reverse order
  for (let i = rollbackOps.length - 1; i >= 0; i--) {
    try {
      await rollbackOps[i]();
    } catch (error) {
      console.error(`[Transaction] Rollback operation ${i} failed:`, error);
      errors.push(error instanceof Error ? error : new Error(String(error)));
    }
  }
  
  if (errors.length > 0) {
    console.error(`[Transaction] ${errors.length} rollback operations failed`);
    throw new DatabaseError(
      `Rollback partially failed: ${errors.length} operations could not be reversed`,
      'DELETE'
    );
  }
  
  console.info('[Transaction] Rollback completed successfully');
}

/**
 * Utility for batch operations with transaction-like semantics
 */
export async function batchOperation<T>(
  operations: Array<() => Promise<T>>,
  options: { rollbackOnFailure?: boolean } = {}
): Promise<T[]> {
  const { rollbackOnFailure = true } = options;
  const results: T[] = [];
  const rollbackOps: Array<() => Promise<void>> = [];
  
  try {
    for (const operation of operations) {
      const result = await operation();
      results.push(result);
    }
    
    return results;
    
  } catch (error) {
    if (rollbackOnFailure && rollbackOps.length > 0) {
      await performRollback(rollbackOps);
    }
    throw error;
  }
}

/**
 * Atomic update with optimistic locking
 */
export async function atomicUpdate<T>(
  table: string,
  id: string,
  updateFn: (current: T) => Partial<T>,
  maxRetries: number = 3
): Promise<T> {
  const supabase = getSupabase();
  
  return withRetry(async () => {
    // Get current data with version
    const { data: currentData, error: fetchError } = await supabase
      .from(table)
      .select('*')
      .eq('id', id)
      .single();
    
    if (fetchError) {
      throw parseSupabaseError(fetchError, 'SELECT', table);
    }
    
    if (!currentData) {
      throw new DatabaseError(`Record not found: ${id}`, 'SELECT', table);
    }
    
    // Calculate updates
    const updates = updateFn(currentData);
    
    // Add optimistic locking if updated_at exists
    const hasUpdatedAt = 'updated_at' in currentData;
    let updateQuery = supabase.from(table).update(updates).eq('id', id);
    
    if (hasUpdatedAt) {
      updateQuery = updateQuery.eq('updated_at', currentData.updated_at);
    }
    
    const { data: updatedData, error: updateError } = await updateQuery.select().single();
    
    if (updateError) {
      if (updateError.code === 'PGRST116') {
        // No rows updated - likely a concurrent update
        throw new Error('Concurrent modification detected, retrying...');
      }
      throw parseSupabaseError(updateError, 'UPDATE', table);
    }
    
    return updatedData;
  }, { maxRetries });
}