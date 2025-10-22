// utils/rls.ts
// Row Level Security utilities and tenant isolation system

import { getSupabase } from '../services/supabaseClient';
import { withRetry } from './retry';
import { DatabaseError, AuthorizationError } from './errors';

export interface RLSPolicy {
  name: string;
  table: string;
  operation: 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE' | 'ALL';
  role?: string;
  using?: string;
  withCheck?: string;
  description?: string;
}

export interface TenantContext {
  tenantId: string;
  userId?: string;
  role?: string;
}

class RLSManager {
  private supabase = getSupabase();

  /**
   * Set tenant context for RLS policies
   */
  async setTenantContext(context: TenantContext): Promise<void> {
    const { tenantId, userId, role } = context;

    try {
      await withRetry(async () => {
        const settings = [
          `SET app.current_tenant_id = '${tenantId}'`,
          userId ? `SET app.current_user_id = '${userId}'` : null,
          role ? `SET app.current_user_role = '${role}'` : null
        ].filter(Boolean);

        for (const setting of settings) {
          const { error } = await this.supabase.rpc('exec_sql', { sql: setting });
          if (error) throw error;
        }
      });

      console.log(`[RLS] Tenant context set: ${tenantId}`, { userId, role });
    } catch (error) {
      console.error('[RLS] Failed to set tenant context:', error);
      throw new AuthorizationError('Failed to set tenant context');
    }
  }

  /**
   * Clear tenant context
   */
  async clearTenantContext(): Promise<void> {
    try {
      await withRetry(async () => {
        const settings = [
          'RESET app.current_tenant_id',
          'RESET app.current_user_id',
          'RESET app.current_user_role'
        ];

        for (const setting of settings) {
          const { error } = await this.supabase.rpc('exec_sql', { sql: setting });
          if (error) throw error;
        }
      });

      console.log('[RLS] Tenant context cleared');
    } catch (error) {
      console.error('[RLS] Failed to clear tenant context:', error);
    }
  }

  /**
   * Create RLS policy
   */
  async createPolicy(policy: RLSPolicy): Promise<void> {
    const { name, table, operation, role, using, withCheck } = policy;

    try {
      await withRetry(async () => {
        let sql = `CREATE POLICY ${name} ON ${table}`;
        
        if (operation !== 'ALL') {
          sql += ` FOR ${operation}`;
        }
        
        if (role) {
          sql += ` TO ${role}`;
        }
        
        if (using) {
          sql += ` USING (${using})`;
        }
        
        if (withCheck) {
          sql += ` WITH CHECK (${withCheck})`;
        }

        const { error } = await this.supabase.rpc('exec_sql', { sql });
        if (error) throw error;
      });

      console.log(`[RLS] Policy created: ${name} on ${table}`);
    } catch (error) {
      console.error(`[RLS] Failed to create policy ${name}:`, error);
      throw new DatabaseError(`Failed to create RLS policy: ${name}`, 'CREATE');
    }
  }

  /**
   * Drop RLS policy
   */
  async dropPolicy(policyName: string, tableName: string): Promise<void> {
    try {
      await withRetry(async () => {
        const sql = `DROP POLICY IF EXISTS ${policyName} ON ${tableName}`;
        const { error } = await this.supabase.rpc('exec_sql', { sql });
        if (error) throw error;
      });

      console.log(`[RLS] Policy dropped: ${policyName} on ${tableName}`);
    } catch (error) {
      console.error(`[RLS] Failed to drop policy ${policyName}:`, error);
      throw new DatabaseError(`Failed to drop RLS policy: ${policyName}`, 'DELETE');
    }
  }

  /**
   * Enable RLS on table
   */
  async enableRLS(tableName: string): Promise<void> {
    try {
      await withRetry(async () => {
        const sql = `ALTER TABLE ${tableName} ENABLE ROW LEVEL SECURITY`;
        const { error } = await this.supabase.rpc('exec_sql', { sql });
        if (error) throw error;
      });

      console.log(`[RLS] Enabled RLS on table: ${tableName}`);
    } catch (error) {
      console.error(`[RLS] Failed to enable RLS on ${tableName}:`, error);
      throw new DatabaseError(`Failed to enable RLS on table: ${tableName}`, 'UPDATE');
    }
  }

  /**
   * Disable RLS on table
   */
  async disableRLS(tableName: string): Promise<void> {
    try {
      await withRetry(async () => {
        const sql = `ALTER TABLE ${tableName} DISABLE ROW LEVEL SECURITY`;
        const { error } = await this.supabase.rpc('exec_sql', { sql });
        if (error) throw error;
      });

      console.log(`[RLS] Disabled RLS on table: ${tableName}`);
    } catch (error) {
      console.error(`[RLS] Failed to disable RLS on ${tableName}:`, error);
      throw new DatabaseError(`Failed to disable RLS on table: ${tableName}`, 'UPDATE');
    }
  }

  /**
   * Setup comprehensive RLS policies for the application
   */
  async setupApplicationRLS(): Promise<void> {
    console.log('[RLS] Setting up application RLS policies...');

    const tables = [
      'students',
      'teachers', 
      'parents',
      'classes',
      'scores',
      'attendance',
      'remarks',
      'invoices',
      'payments',
      'expenses',
      'income',
      'communication_logs',
      'platform_settings'
    ];

    // Enable RLS on all tables
    for (const table of tables) {
      try {
        await this.enableRLS(table);
      } catch (error) {
        console.warn(`[RLS] Could not enable RLS on ${table} (may not exist):`, error);
      }
    }

    // Create tenant isolation policies
    const tenantPolicies: RLSPolicy[] = tables.map(table => ({
      name: `${table}_tenant_isolation`,
      table,
      operation: 'ALL',
      using: `tenant_id = current_setting('app.current_tenant_id', true)::text`,
      withCheck: `tenant_id = current_setting('app.current_tenant_id', true)::text`,
      description: `Tenant isolation for ${table}`
    }));

    // Create service role bypass policies
    const serviceRolePolicies: RLSPolicy[] = tables.map(table => ({
      name: `${table}_service_role`,
      table,
      operation: 'ALL',
      role: 'service_role',
      using: 'true',
      withCheck: 'true',
      description: `Service role bypass for ${table}`
    }));

    // Create user-specific policies
    const userPolicies: RLSPolicy[] = [
      // Students can only see their own data
      {
        name: 'students_own_data',
        table: 'students',
        operation: 'SELECT',
        using: `id = current_setting('app.current_user_id', true)::uuid OR 
                parent_id = current_setting('app.current_user_id', true)::uuid`,
        description: 'Students and parents can view student data'
      },
      
      // Teachers can see students in their classes
      {
        name: 'teachers_class_students',
        table: 'students',
        operation: 'SELECT',
        using: `current_setting('app.current_user_role', true) = 'teacher' AND
                class_id IN (
                  SELECT class_id FROM teacher_classes 
                  WHERE teacher_id = current_setting('app.current_user_id', true)::uuid
                )`,
        description: 'Teachers can view students in their classes'
      },

      // Parents can only see their children's scores
      {
        name: 'parents_child_scores',
        table: 'scores',
        operation: 'SELECT',
        using: `student_id IN (
                  SELECT id FROM students 
                  WHERE parent_id = current_setting('app.current_user_id', true)::uuid
                )`,
        description: 'Parents can view their children\'s scores'
      },

      // Financial data access restrictions
      {
        name: 'financial_admin_only',
        table: 'expenses',
        operation: 'ALL',
        using: `current_setting('app.current_user_role', true) IN ('admin', 'finance_manager')`,
        withCheck: `current_setting('app.current_user_role', true) IN ('admin', 'finance_manager')`,
        description: 'Only admins and finance managers can access expenses'
      }
    ];

    // Apply all policies
    const allPolicies = [...tenantPolicies, ...serviceRolePolicies, ...userPolicies];

    for (const policy of allPolicies) {
      try {
        await this.createPolicy(policy);
      } catch (error) {
        console.warn(`[RLS] Could not create policy ${policy.name}:`, error);
      }
    }

    console.log('[RLS] Application RLS setup completed');
  }

  /**
   * Test RLS policies
   */
  async testRLSPolicies(tenantId: string): Promise<{ passed: number; failed: number; results: any[] }> {
    const results = [];
    let passed = 0;
    let failed = 0;

    console.log(`[RLS] Testing RLS policies for tenant: ${tenantId}`);

    // Set tenant context
    await this.setTenantContext({ tenantId });

    const tests = [
      {
        name: 'Student tenant isolation',
        test: async () => {
          const { data, error } = await this.supabase
            .from('students')
            .select('id, tenant_id')
            .limit(5);
          
          if (error) throw error;
          
          const wrongTenant = data?.find(s => s.tenant_id !== tenantId);
          if (wrongTenant) {
            throw new Error(`Found student from different tenant: ${wrongTenant.tenant_id}`);
          }
          
          return `✅ All ${data?.length || 0} students belong to correct tenant`;
        }
      },
      
      {
        name: 'Teacher tenant isolation',
        test: async () => {
          const { data, error } = await this.supabase
            .from('teachers')
            .select('id, tenant_id')
            .limit(5);
          
          if (error) throw error;
          
          const wrongTenant = data?.find(t => t.tenant_id !== tenantId);
          if (wrongTenant) {
            throw new Error(`Found teacher from different tenant: ${wrongTenant.tenant_id}`);
          }
          
          return `✅ All ${data?.length || 0} teachers belong to correct tenant`;
        }
      },

      {
        name: 'Financial data isolation',
        test: async () => {
          const { data, error } = await this.supabase
            .from('invoices')
            .select('id, tenant_id')
            .limit(5);
          
          if (error && error.code !== 'PGRST116') throw error; // Ignore not found
          
          if (data) {
            const wrongTenant = data.find(i => i.tenant_id !== tenantId);
            if (wrongTenant) {
              throw new Error(`Found invoice from different tenant: ${wrongTenant.tenant_id}`);
            }
          }
          
          return `✅ All ${data?.length || 0} invoices belong to correct tenant`;
        }
      }
    ];

    for (const { name, test } of tests) {
      try {
        const result = await test();
        results.push({ name, status: 'PASSED', result });
        passed++;
      } catch (error) {
        results.push({ name, status: 'FAILED', error: error.message });
        failed++;
      }
    }

    // Clear context
    await this.clearTenantContext();

    console.log(`[RLS] Test results: ${passed} passed, ${failed} failed`);
    
    return { passed, failed, results };
  }

  /**
   * Get current tenant context
   */
  async getCurrentContext(): Promise<{ tenantId?: string; userId?: string; role?: string }> {
    try {
      const { data: tenantResult } = await this.supabase
        .rpc('current_setting', { setting: 'app.current_tenant_id' });
      
      const { data: userResult } = await this.supabase
        .rpc('current_setting', { setting: 'app.current_user_id' });
        
      const { data: roleResult } = await this.supabase
        .rpc('current_setting', { setting: 'app.current_user_role' });

      return {
        tenantId: tenantResult || undefined,
        userId: userResult || undefined,
        role: roleResult || undefined
      };
    } catch (error) {
      console.warn('[RLS] Could not get current context:', error);
      return {};
    }
  }

  /**
   * Validate tenant access for a user
   */
  async validateTenantAccess(userId: string, tenantId: string): Promise<boolean> {
    try {
      // Check if user has access to this tenant
      const { data, error } = await this.supabase
        .from('user_tenants')
        .select('tenant_id')
        .eq('user_id', userId)
        .eq('tenant_id', tenantId)
        .eq('status', 'active')
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      return !!data;
    } catch (error) {
      console.error('[RLS] Error validating tenant access:', error);
      return false;
    }
  }

  /**
   * Create comprehensive security view for auditing
   */
  async createSecurityViews(): Promise<void> {
    const views = [
      {
        name: 'v_tenant_data_summary',
        sql: `
          CREATE OR REPLACE VIEW v_tenant_data_summary AS
          SELECT 
            tenant_id,
            'students' as table_name,
            COUNT(*) as record_count,
            MAX(updated_at) as last_updated
          FROM students 
          GROUP BY tenant_id
          UNION ALL
          SELECT 
            tenant_id,
            'teachers' as table_name,
            COUNT(*) as record_count,
            MAX(updated_at) as last_updated
          FROM teachers 
          GROUP BY tenant_id;
        `
      },
      
      {
        name: 'v_rls_policy_status',
        sql: `
          CREATE OR REPLACE VIEW v_rls_policy_status AS
          SELECT 
            schemaname,
            tablename,
            rowsecurity,
            (SELECT COUNT(*) FROM pg_policies WHERE tablename = c.relname) as policy_count
          FROM pg_class c
          JOIN pg_namespace n ON c.relnamespace = n.oid
          WHERE n.nspname = 'public' 
          AND c.relkind = 'r'
          AND c.relname NOT LIKE 'pg_%';
        `
      }
    ];

    for (const { name, sql } of views) {
      try {
        await withRetry(async () => {
          const { error } = await this.supabase.rpc('exec_sql', { sql });
          if (error) throw error;
        });
        
        console.log(`[RLS] Security view created: ${name}`);
      } catch (error) {
        console.warn(`[RLS] Could not create view ${name}:`, error);
      }
    }
  }
}

// Export singleton instance
export const rlsManager = new RLSManager();

// Predefined RLS policies for common use cases
export const standardPolicies = {
  tenantIsolation: (tableName: string): RLSPolicy => ({
    name: `${tableName}_tenant_isolation`,
    table: tableName,
    operation: 'ALL',
    using: `tenant_id = current_setting('app.current_tenant_id', true)::text`,
    withCheck: `tenant_id = current_setting('app.current_tenant_id', true)::text`,
    description: `Tenant isolation for ${tableName}`
  }),

  serviceRoleBypass: (tableName: string): RLSPolicy => ({
    name: `${tableName}_service_role`,
    table: tableName,
    operation: 'ALL',
    role: 'service_role',
    using: 'true',
    withCheck: 'true',
    description: `Service role bypass for ${tableName}`
  }),

  adminOnly: (tableName: string): RLSPolicy => ({
    name: `${tableName}_admin_only`,
    table: tableName,
    operation: 'ALL',
    using: `current_setting('app.current_user_role', true) = 'admin'`,
    withCheck: `current_setting('app.current_user_role', true) = 'admin'`,
    description: `Admin only access for ${tableName}`
  })
};

export default rlsManager;