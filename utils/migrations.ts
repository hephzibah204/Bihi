// utils/migrations.ts
// Database migration system for schema versioning and database changes

import { getSupabase } from '../services/supabaseClient';
import { withRetry } from './retry';
import { parseSupabaseError, DatabaseError } from './errors';

export interface Migration {
  version: string;
  name: string;
  description: string;
  up: () => Promise<void>;
  down?: () => Promise<void>;
  dependencies?: string[];
}

export interface MigrationRecord {
  version: string;
  name: string;
  applied_at: string;
  checksum: string;
  execution_time_ms: number;
}

class MigrationManager {
  private supabase = getSupabase();
  private migrations: Map<string, Migration> = new Map();

  /**
   * Register a migration
   */
  register(migration: Migration): void {
    this.migrations.set(migration.version, migration);
  }

  /**
   * Register multiple migrations
   */
  registerAll(migrations: Migration[]): void {
    migrations.forEach(migration => this.register(migration));
  }

  /**
   * Initialize migration tracking table
   */
  async initialize(): Promise<void> {
    const createMigrationsTable = `
      CREATE TABLE IF NOT EXISTS schema_migrations (
        version VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        checksum VARCHAR(64) NOT NULL,
        execution_time_ms INTEGER NOT NULL,
        rollback_sql TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
      
      CREATE INDEX IF NOT EXISTS idx_schema_migrations_applied_at ON schema_migrations(applied_at);
    `;

    try {
      await withRetry(async () => {
        const { error } = await this.supabase.rpc('exec_sql', { sql: createMigrationsTable });
        if (error) throw error;
      });
      
      console.info('[Migrations] Migration tracking table initialized');
    } catch (error) {
      console.error('[Migrations] Failed to initialize migration table:', error);
      throw new DatabaseError('Failed to initialize migration system', 'CREATE');
    }
  }

  /**
   * Get applied migrations
   */
  async getAppliedMigrations(): Promise<MigrationRecord[]> {
    return withRetry(async () => {
      const { data, error } = await this.supabase
        .from('schema_migrations')
        .select('*')
        .order('applied_at', { ascending: true });

      if (error) {
        throw parseSupabaseError(error, 'SELECT', 'schema_migrations');
      }

      return data || [];
    });
  }

  /**
   * Get pending migrations
   */
  async getPendingMigrations(): Promise<Migration[]> {
    const applied = await this.getAppliedMigrations();
    const appliedVersions = new Set(applied.map(m => m.version));
    
    const pending: Migration[] = [];
    const sortedVersions = Array.from(this.migrations.keys()).sort();
    
    for (const version of sortedVersions) {
      if (!appliedVersions.has(version)) {
        const migration = this.migrations.get(version)!;
        
        // Check dependencies
        if (migration.dependencies) {
          const missingDeps = migration.dependencies.filter(dep => !appliedVersions.has(dep));
          if (missingDeps.length > 0) {
            throw new Error(`Migration ${version} has unmet dependencies: ${missingDeps.join(', ')}`);
          }
        }
        
        pending.push(migration);
      }
    }
    
    return pending;
  }

  /**
   * Run a single migration
   */
  async runMigration(migration: Migration): Promise<void> {
    const startTime = Date.now();
    const checksum = await this.calculateChecksum(migration);
    
    console.info(`[Migrations] Running migration: ${migration.version} - ${migration.name}`);
    
    try {
      await migration.up();
      
      const executionTime = Date.now() - startTime;
      
      // Record successful migration
      await this.recordMigration(migration, checksum, executionTime);
      
      console.info(`[Migrations] ✅ Migration ${migration.version} completed in ${executionTime}ms`);
      
    } catch (error) {
      console.error(`[Migrations] ❌ Migration ${migration.version} failed:`, error);
      
      // Attempt rollback if available
      if (migration.down) {
        console.info(`[Migrations] Attempting rollback for ${migration.version}...`);
        try {
          await migration.down();
          console.info(`[Migrations] ✅ Rollback completed for ${migration.version}`);
        } catch (rollbackError) {
          console.error(`[Migrations] ❌ Rollback failed for ${migration.version}:`, rollbackError);
        }
      }
      
      throw new DatabaseError(
        `Migration ${migration.version} failed: ${error.message}`,
        'UPDATE'
      );
    }
  }

  /**
   * Run all pending migrations
   */
  async migrate(): Promise<void> {
    await this.initialize();
    
    const pending = await this.getPendingMigrations();
    
    if (pending.length === 0) {
      console.info('[Migrations] No pending migrations');
      return;
    }
    
    console.info(`[Migrations] Found ${pending.length} pending migrations`);
    
    for (const migration of pending) {
      await this.runMigration(migration);
    }
    
    console.info('[Migrations] All migrations completed successfully');
  }

  /**
   * Rollback a specific migration
   */
  async rollback(version: string): Promise<void> {
    const migration = this.migrations.get(version);
    if (!migration) {
      throw new Error(`Migration ${version} not found`);
    }
    
    if (!migration.down) {
      throw new Error(`Migration ${version} does not have a rollback method`);
    }
    
    const applied = await this.getAppliedMigrations();
    const isApplied = applied.some(m => m.version === version);
    
    if (!isApplied) {
      throw new Error(`Migration ${version} is not applied`);
    }
    
    console.info(`[Migrations] Rolling back migration: ${version} - ${migration.name}`);
    
    try {
      await migration.down();
      
      // Remove from migration records
      await withRetry(async () => {
        const { error } = await this.supabase
          .from('schema_migrations')
          .delete()
          .eq('version', version);
        
        if (error) {
          throw parseSupabaseError(error, 'DELETE', 'schema_migrations');
        }
      });
      
      console.info(`[Migrations] ✅ Migration ${version} rolled back successfully`);
      
    } catch (error) {
      console.error(`[Migrations] ❌ Rollback failed for ${version}:`, error);
      throw new DatabaseError(
        `Rollback failed for migration ${version}: ${error.message}`,
        'DELETE'
      );
    }
  }

  /**
   * Get migration status
   */
  async getStatus(): Promise<{
    applied: MigrationRecord[];
    pending: Migration[];
    total: number;
  }> {
    const applied = await this.getAppliedMigrations();
    const pending = await this.getPendingMigrations();
    
    return {
      applied,
      pending,
      total: this.migrations.size
    };
  }

  /**
   * Record a successful migration
   */
  private async recordMigration(migration: Migration, checksum: string, executionTime: number): Promise<void> {
    await withRetry(async () => {
      const { error } = await this.supabase
        .from('schema_migrations')
        .insert({
          version: migration.version,
          name: migration.name,
          description: migration.description,
          checksum,
          execution_time_ms: executionTime
        });
      
      if (error) {
        throw parseSupabaseError(error, 'INSERT', 'schema_migrations');
      }
    });
  }

  /**
   * Calculate checksum for migration consistency
   */
  private async calculateChecksum(migration: Migration): Promise<string> {
    const content = `${migration.version}${migration.name}${migration.description}${migration.up.toString()}`;
    
    // Simple hash function (in production, use crypto.subtle.digest)
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    return Math.abs(hash).toString(16);
  }

  /**
   * Create a new migration template
   */
  createMigrationTemplate(name: string): Migration {
    const timestamp = new Date().toISOString().replace(/[-:]/g, '').split('.')[0];
    const version = `${timestamp}_${name.toLowerCase().replace(/\s+/g, '_')}`;
    
    return {
      version,
      name,
      description: `Migration: ${name}`,
      up: async () => {
        // TODO: Implement migration logic
        throw new Error(`Migration ${version} up method not implemented`);
      },
      down: async () => {
        // TODO: Implement rollback logic
        throw new Error(`Migration ${version} down method not implemented`);
      }
    };
  }
}

// Export singleton instance
export const migrationManager = new MigrationManager();

// Example migrations
export const exampleMigrations: Migration[] = [
  {
    version: '20241021_001_create_students_table',
    name: 'Create Students Table',
    description: 'Create the students table with basic fields',
    up: async () => {
      const sql = `
        CREATE TABLE IF NOT EXISTS students (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          tenant_id VARCHAR(255) NOT NULL,
          first_name VARCHAR(255) NOT NULL,
          last_name VARCHAR(255) NOT NULL,
          email VARCHAR(255) UNIQUE,
          phone VARCHAR(20),
          date_of_birth DATE,
          address TEXT,
          parent_id UUID REFERENCES parents(id),
          class_id UUID REFERENCES classes(id),
          enrollment_date DATE DEFAULT CURRENT_DATE,
          status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'graduated', 'transferred')),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        CREATE INDEX idx_students_tenant_id ON students(tenant_id);
        CREATE INDEX idx_students_status ON students(status);
        CREATE INDEX idx_students_class_id ON students(class_id);
      `;
      
      const supabase = getSupabase();
      const { error } = await supabase.rpc('exec_sql', { sql });
      if (error) throw error;
    },
    down: async () => {
      const sql = 'DROP TABLE IF EXISTS students CASCADE;';
      const supabase = getSupabase();
      const { error } = await supabase.rpc('exec_sql', { sql });
      if (error) throw error;
    }
  },
  
  {
    version: '20241021_002_add_rls_policies',
    name: 'Add Row Level Security Policies',
    description: 'Implement RLS policies for multi-tenant isolation',
    dependencies: ['20241021_001_create_students_table'],
    up: async () => {
      const sql = `
        -- Enable RLS on students table
        ALTER TABLE students ENABLE ROW LEVEL SECURITY;
        
        -- Policy for tenant isolation
        CREATE POLICY students_tenant_isolation ON students
          USING (tenant_id = current_setting('app.current_tenant_id', true)::text);
        
        -- Policy for service role to bypass RLS
        CREATE POLICY students_service_role ON students
          TO service_role
          USING (true);
      `;
      
      const supabase = getSupabase();
      const { error } = await supabase.rpc('exec_sql', { sql });
      if (error) throw error;
    },
    down: async () => {
      const sql = `
        DROP POLICY IF EXISTS students_tenant_isolation ON students;
        DROP POLICY IF EXISTS students_service_role ON students;
        ALTER TABLE students DISABLE ROW LEVEL SECURITY;
      `;
      
      const supabase = getSupabase();
      const { error } = await supabase.rpc('exec_sql', { sql });
      if (error) throw error;
    }
  }
];

// Auto-register example migrations
migrationManager.registerAll(exampleMigrations);

export default migrationManager;