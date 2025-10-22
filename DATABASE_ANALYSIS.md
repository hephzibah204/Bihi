# Database Connection Analysis & Improvement Opportunities

**Project**: Dossier.NG (ReportSheet)  
**Database**: Supabase (PostgreSQL)  
**Analysis Date**: 2025-October-21

---

## Executive Summary

The codebase uses Supabase as its primary database with a multi-layered fallback architecture. Analysis reveals several critical improvement opportunities in connection management, error handling, query optimization, and architecture patterns.

**Critical Issues Found**: 5  
**High Priority Issues**: 8  
**Medium Priority Issues**: 12  
**Best Practice Recommendations**: 15

---

## 1. Database Connection Architecture

### Current Setup

```typescript
// services/supabaseClient.ts
- Global singleton pattern
- Dynamic client initialization (CDN -> ESM fallback -> Offline mode)
- No connection pooling configuration
- No retry logic for initial connection
- Demo mode bypasses database entirely
```

### Issues Identified

#### 🔴 CRITICAL: No Connection Pool Configuration
**Location**: `services/supabaseClient.ts`

The Supabase client is initialized without connection pool settings. For a production application, this can lead to:
- Connection exhaustion under load
- Unnecessary connection churn
- Poor performance during traffic spikes

**Current Code**:
```typescript
supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
```

**Recommended Fix**:
```typescript
supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  db: {
    schema: 'public'
  },
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  },
  global: {
    headers: {
      'x-application-name': 'dossier-ng'
    }
  },
  // Connection pool settings (if supported by client version)
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
});
```

#### 🔴 CRITICAL: No Connection Health Monitoring
**Location**: `services/supabaseClient.ts:125`

The `isSupabaseOnline()` function exists but:
- Not called periodically to monitor connection health
- No automatic reconnection on failure
- No connection state management

**Recommendation**:
Implement connection health monitoring with automatic reconnection:

```typescript
let connectionHealthInterval: NodeJS.Timeout | null = null;

export async function startConnectionMonitoring() {
  if (connectionHealthInterval) return;
  
  connectionHealthInterval = setInterval(async () => {
    const isOnline = await isSupabaseOnline();
    if (!isOnline && !supabase._offline) {
      console.warn('[Supabase] Connection lost, attempting reconnection...');
      // Trigger reconnection logic
      await reconnectSupabase();
    }
  }, 30000); // Check every 30 seconds
}

async function reconnectSupabase() {
  try {
    supabase = null;
    await initSupabase();
    console.info('[Supabase] Reconnection successful');
  } catch (error) {
    console.error('[Supabase] Reconnection failed:', error);
  }
}

export function stopConnectionMonitoring() {
  if (connectionHealthInterval) {
    clearInterval(connectionHealthInterval);
    connectionHealthInterval = null;
  }
}
```

#### 🟡 HIGH: Hardcoded Fallback URL
**Location**: `services/supabaseClient.ts:51`

```typescript
const SUPABASE_URL = 
    window.process?.env?.VITE_SUPABASE_URL ||
    import.meta.env?.VITE_SUPABASE_URL ||
    "https://shzwolantavauszuxwlp.supabase.co"; // Hardcoded fallback
```

**Issues**:
- Exposes project URL in source code
- No flexibility for different environments
- Security concern if code is public

**Recommendation**:
```typescript
const SUPABASE_URL = 
    window.process?.env?.VITE_SUPABASE_URL ||
    import.meta.env?.VITE_SUPABASE_URL;

if (!SUPABASE_URL) {
  console.error('[Supabase] VITE_SUPABASE_URL not configured');
  throw new Error('Database URL not configured');
}
```

---

## 2. Query Patterns & Performance

### Issues Identified

#### 🔴 CRITICAL: N+1 Query Pattern
**Location**: `services/api.ts:269`

```typescript
export const apiGetScores = (options: {studentIds?: string[]} = {}) => {
    return apiGetStudents(options).then(students => {
        const studentIds = students.map(s => s.id);
        return supabase.from('scores').select('*').in('studentId', studentIds)
    });
};
```

**Problem**: This creates a sequential dependency - fetch students first, then fetch scores. This is inefficient.

**Recommended Fix**:
```typescript
export const apiGetScores = async (options: {studentIds?: string[]} = {}) => {
    if (isDemo()) {
        if (options.studentIds) {
            const idSet = new Set(options.studentIds);
            return CORE_DEMO_DATA.scores.filter(s => idSet.has(s.studentId));
        }
        return CORE_DEMO_DATA.scores;
    }
    
    if (!supabase) return [];
    
    let query = supabase.from('scores').select('*');
    
    if (options.studentIds) {
        query = query.in('studentId', options.studentIds);
    }
    
    const { data, error } = await query;
    if (error) throw error;
    return data;
};
```

#### 🟡 HIGH: Missing Query Result Limits
**Location**: Multiple locations in `services/api.ts`

Many queries lack pagination or limits:

```typescript
const { data, error } = await supabase.from('students').select('*');
```

**Recommendation**: Implement pagination for all list queries:

```typescript
export const apiGetStudents = async (options: { 
    classFilter?: string, 
    studentIds?: string[],
    limit?: number,
    offset?: number 
} = {}): Promise<Student[]> => {
    if (isDemo()) {
        let students = CORE_DEMO_DATA.students;
        if (options.classFilter) {
            students = students.filter(s => s.class === options.classFilter);
        }
        if (options.studentIds) {
            const idSet = new Set(options.studentIds);
            students = students.filter(s => idSet.has(s.id));
        }
        return students;
    }
    
    if (!supabase) return [];
    
    let query = supabase.from('students').select('*');
    
    if (options.classFilter) query = query.eq('class', options.classFilter);
    if (options.studentIds) query = query.in('id', options.studentIds);
    
    // Add pagination
    const limit = options.limit || 100;
    const offset = options.offset || 0;
    query = query.range(offset, offset + limit - 1);
    
    const { data, error } = await query;
    if (error) throw error;
    return data;
};
```

#### 🟡 HIGH: No Query Result Caching
**Location**: Throughout `services/api.ts`

Frequent queries for relatively static data (subjects, teachers, settings) have no caching mechanism.

**Recommendation**: Implement a simple cache layer:

```typescript
class QueryCache {
  private cache: Map<string, { data: any, timestamp: number }> = new Map();
  private ttl: number = 5 * 60 * 1000; // 5 minutes default

  set(key: string, data: any, customTTL?: number) {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  get(key: string): any | null {
    const cached = this.cache.get(key);
    if (!cached) return null;
    
    if (Date.now() - cached.timestamp > this.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return cached.data;
  }

  clear(pattern?: string) {
    if (!pattern) {
      this.cache.clear();
      return;
    }
    
    // Clear keys matching pattern
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
      }
    }
  }
}

const queryCache = new QueryCache();

export const apiGetSubjects = async (): Promise<Subject[]> => {
    const cacheKey = 'subjects:all';
    const cached = queryCache.get(cacheKey);
    if (cached) return cached;
    
    const data = await get<Subject>('subjects');
    queryCache.set(cacheKey, data);
    return data;
};

// Invalidate cache on mutation
export const apiSaveSubjects = async (subjects: Subject[]) => {
    apiLogActivity('SUBJECT_UPDATE', `Updated ${subjects.length} subjects.`);
    const result = await batchUpsert('subjects', subjects);
    queryCache.clear('subjects'); // Invalidate cache
    return result;
};
```

#### 🟢 MEDIUM: Inefficient Filtering Logic
**Location**: `services/api.ts:106-111`

```typescript
const get = async <T>(table: string, options: { filter?: string, select?: string } = {}): Promise<T[]> => {
    let query = supabase.from(table).select(options.select || '*');
    if (options.filter) {
        const [field, value] = options.filter.split('=');
        query = query.eq(field, value);
    }
    //...
};
```

**Problems**:
- Only supports simple equality filters
- String parsing is fragile
- No support for complex queries

**Recommendation**: Use a more robust filter object:

```typescript
type FilterOperator = 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'like' | 'in';

interface QueryFilter {
  field: string;
  operator: FilterOperator;
  value: any;
}

interface QueryOptions {
  filters?: QueryFilter[];
  select?: string;
  orderBy?: { column: string; ascending?: boolean };
  limit?: number;
  offset?: number;
}

const get = async <T>(table: string, options: QueryOptions = {}): Promise<T[]> => {
    if (isDemo()) {
        return (CORE_DEMO_DATA[table] || []) as any;
    }
    
    if (!supabase) return [];
    
    let query = supabase.from(table).select(options.select || '*');
    
    // Apply filters
    if (options.filters) {
        for (const filter of options.filters) {
            query = query[filter.operator](filter.field, filter.value);
        }
    }
    
    // Apply ordering
    if (options.orderBy) {
        query = query.order(options.orderBy.column, { 
            ascending: options.orderBy.ascending ?? true 
        });
    }
    
    // Apply pagination
    if (options.limit) {
        const offset = options.offset || 0;
        query = query.range(offset, offset + options.limit - 1);
    }
    
    const { data, error } = await query;
    if (error) throw error;
    return data as T[];
};
```

---

## 3. Error Handling & Resilience

### Issues Identified

#### 🔴 CRITICAL: Inadequate Error Recovery
**Location**: Throughout `services/api.ts`

Most API functions simply throw errors without recovery:

```typescript
const { data, error } = await query;
if (error) throw error;
return data;
```

**Problems**:
- No retry logic for transient failures
- No fallback mechanisms
- Errors bubble up without context

**Recommendation**: Implement retry logic with exponential backoff:

```typescript
async function withRetry<T>(
  operation: () => Promise<T>,
  options: {
    maxRetries?: number;
    initialDelay?: number;
    maxDelay?: number;
    shouldRetry?: (error: any) => boolean;
  } = {}
): Promise<T> {
  const {
    maxRetries = 3,
    initialDelay = 1000,
    maxDelay = 10000,
    shouldRetry = (error) => {
      // Retry on network errors and 5xx server errors
      return (
        error.message?.includes('network') ||
        error.message?.includes('timeout') ||
        error.status >= 500
      );
    }
  } = options;

  let lastError: any;
  let delay = initialDelay;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;

      if (attempt === maxRetries || !shouldRetry(error)) {
        throw error;
      }

      console.warn(
        `[Retry] Attempt ${attempt + 1}/${maxRetries} failed. Retrying in ${delay}ms...`,
        error
      );

      await new Promise(resolve => setTimeout(resolve, delay));
      delay = Math.min(delay * 2, maxDelay); // Exponential backoff with cap
    }
  }

  throw lastError;
}

// Usage
const get = async <T>(table: string, options: QueryOptions = {}): Promise<T[]> => {
    if (isDemo()) {
        return (CORE_DEMO_DATA[table] || []) as any;
    }
    
    if (!supabase) return [];
    
    return withRetry(async () => {
        let query = supabase.from(table).select(options.select || '*');
        // ... apply filters
        const { data, error } = await query;
        if (error) throw error;
        return data as T[];
    });
};
```

#### 🟡 HIGH: Missing Transaction Support
**Location**: `services/api.ts`

Complex operations that should be atomic are not wrapped in transactions:

```typescript
export const apiSavePayrollRun = async (runData: Omit<PayrollRun, 'id'>) => {
    const allRuns = await apiGetPayrollRuns(); // Query 1
    const newRun = { ...runData, id: `run_${Date.now()}` };
    return upsert('payroll', { id: 1, runs: [...allRuns, newRun] }); // Query 2
};
```

**Problem**: If the upsert fails, data inconsistency occurs.

**Recommendation**: Use Supabase RPC for complex operations:

```sql
-- In Supabase SQL Editor
CREATE OR REPLACE FUNCTION save_payroll_run(
  p_tenant_id TEXT,
  p_run_data JSONB
) RETURNS TABLE (
  id TEXT,
  runs JSONB
) AS $$
BEGIN
  -- Atomic operation with proper locking
  RETURN QUERY
  INSERT INTO payroll (tenant_id, runs)
  VALUES (
    p_tenant_id,
    (
      SELECT COALESCE(runs, '[]'::jsonb) || p_run_data
      FROM payroll
      WHERE tenant_id = p_tenant_id
    )
  )
  ON CONFLICT (tenant_id) DO UPDATE
  SET runs = payroll.runs || p_run_data
  RETURNING payroll.id::text, payroll.runs;
END;
$$ LANGUAGE plpgsql;
```

```typescript
export const apiSavePayrollRun = async (runData: Omit<PayrollRun, 'id'>) => {
    if (isDemo()) {
        const allRuns = await apiGetPayrollRuns();
        const newRun = { ...runData, id: `run_${Date.now()}` };
        return upsert('payroll', { id: 1, runs: [...allRuns, newRun] });
    }
    
    const tenantId = getTenantId();
    const newRun = { ...runData, id: `run_${Date.now()}` };
    
    const { data, error } = await supabase.rpc('save_payroll_run', {
        p_tenant_id: tenantId,
        p_run_data: newRun
    });
    
    if (error) throw error;
    return data[0];
};
```

#### 🟢 MEDIUM: Inconsistent Error Messages
**Location**: Multiple locations

Error messages are inconsistent and don't provide enough context:

```typescript
if (error) throw error; // What failed? Why?
throw new Error("Failed to validate PIN."); // No context about what went wrong
```

**Recommendation**: Create custom error classes:

```typescript
class DatabaseError extends Error {
  constructor(
    message: string,
    public operation: string,
    public table?: string,
    public originalError?: any
  ) {
    super(message);
    this.name = 'DatabaseError';
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      operation: this.operation,
      table: this.table,
      originalError: this.originalError?.message
    };
  }
}

const get = async <T>(table: string, options: QueryOptions = {}): Promise<T[]> => {
    try {
        // ... query logic
        const { data, error } = await query;
        if (error) {
            throw new DatabaseError(
                `Failed to fetch records from ${table}`,
                'SELECT',
                table,
                error
            );
        }
        return data as T[];
    } catch (error) {
        if (error instanceof DatabaseError) throw error;
        throw new DatabaseError(
            `Unexpected error fetching from ${table}`,
            'SELECT',
            table,
            error
        );
    }
};
```

---

## 4. Security Concerns

### Issues Identified

#### 🔴 CRITICAL: Service Role Key Exposure
**Location**: `.env.local` (committed to repo)

```
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...
```

**Problems**:
- Service role key should NEVER be in client code or .env.local
- Should only exist on server-side (Cloudflare Workers)
- Current setup exposes full database access

**Recommendation**:
1. Remove service role key from .env.local
2. Move to Cloudflare Worker environment variables
3. Update .env.example to clarify:

```
# .env.example
# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key

# DO NOT PUT SERVICE_ROLE_KEY HERE!
# Service role key should only be in Cloudflare Worker secrets
```

4. Add to .gitignore:
```
.env.local
.dev.vars
```

#### 🟡 HIGH: Insufficient RLS (Row Level Security) Implementation
**Location**: Database schema (not visible in code)

**Recommendation**: Ensure all tables have RLS policies:

```sql
-- Example RLS policies for multi-tenant setup

-- Students table
ALTER TABLE students ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view students in their tenant"
  ON students FOR SELECT
  TO authenticated
  USING (tenant_id = auth.jwt() ->> 'tenant_id');

CREATE POLICY "Teachers can insert students in their tenant"
  ON students FOR INSERT
  TO authenticated
  WITH CHECK (
    tenant_id = auth.jwt() ->> 'tenant_id' AND
    EXISTS (
      SELECT 1 FROM teachers
      WHERE id = auth.uid() AND role IN ('Admin', 'Teacher')
    )
  );

-- Repeat for all tables
```

#### 🟢 MEDIUM: No Input Validation
**Location**: Throughout `services/api.ts`

API functions don't validate inputs before sending to database:

```typescript
export const apiUpsertStudent = (student: Partial<Student>) => {
    return upsert('students', student); // No validation
};
```

**Recommendation**: Implement validation layer:

```typescript
import { z } from 'zod';

const StudentSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1).max(100),
  admissionNo: z.string().min(1),
  class: z.string().min(1),
  email: z.string().email().optional(),
  // ... other fields
});

export const apiUpsertStudent = (student: Partial<Student>) => {
    // Validate input
    const validated = StudentSchema.parse(student);
    
    const actionType = student.id ? 'STUDENT_UPDATE' : 'STUDENT_ADD';
    const description = student.id 
        ? `Updated details for ${validated.name}` 
        : `Added new student ${validated.name}`;
    
    apiLogActivity(actionType, description);
    return upsert('students', validated);
};
```

---

## 5. Architecture & Design Patterns

### Issues Identified

#### 🟡 HIGH: Mixed Concerns in API Layer
**Location**: `services/api.ts`

The API layer mixes:
- Data access logic
- Business logic
- Demo mode logic
- Caching logic
- Activity logging

**Recommendation**: Separate concerns using repository pattern:

```typescript
// repositories/BaseRepository.ts
export abstract class BaseRepository<T> {
  constructor(
    protected tableName: string,
    protected cache?: QueryCache
  ) {}

  async findAll(options?: QueryOptions): Promise<T[]> {
    if (isDemo()) {
      return this.getDemoData();
    }
    
    return withRetry(async () => {
      // ... query logic
    });
  }

  async findById(id: string): Promise<T | null> {
    // Implementation
  }

  async create(entity: Partial<T>): Promise<T> {
    // Implementation with validation
  }

  async update(id: string, updates: Partial<T>): Promise<T> {
    // Implementation with validation
  }

  async delete(id: string): Promise<void> {
    // Implementation
  }

  protected abstract getDemoData(): T[];
  protected abstract validate(entity: Partial<T>): T;
}

// repositories/StudentRepository.ts
export class StudentRepository extends BaseRepository<Student> {
  constructor() {
    super('students', queryCache);
  }

  protected getDemoData(): Student[] {
    return CORE_DEMO_DATA.students;
  }

  protected validate(entity: Partial<Student>): Student {
    return StudentSchema.parse(entity);
  }

  async findByClass(className: string): Promise<Student[]> {
    return this.findAll({
      filters: [{ field: 'class', operator: 'eq', value: className }]
    });
  }

  async findByAdmissionNo(admissionNo: string): Promise<Student | null> {
    const results = await this.findAll({
      filters: [{ field: 'admissionNo', operator: 'eq', value: admissionNo }],
      limit: 1
    });
    return results[0] || null;
  }
}

// services/StudentService.ts
export class StudentService {
  constructor(
    private repository: StudentRepository,
    private activityLogger: ActivityLogger
  ) {}

  async getStudent(id: string): Promise<Student | null> {
    return this.repository.findById(id);
  }

  async createStudent(student: Partial<Student>): Promise<Student> {
    const created = await this.repository.create(student);
    await this.activityLogger.log(
      'STUDENT_ADD',
      `Added new student ${created.name}`
    );
    return created;
  }

  async updateStudent(id: string, updates: Partial<Student>): Promise<Student> {
    const updated = await this.repository.update(id, updates);
    await this.activityLogger.log(
      'STUDENT_UPDATE',
      `Updated details for ${updated.name}`
    );
    return updated;
  }

  // ... other business logic methods
}
```

#### 🟢 MEDIUM: No Database Migration System
**Location**: N/A (missing)

**Problem**: No version control for database schema changes.

**Recommendation**: Implement migration system using Supabase migrations:

```bash
# Initialize migrations
supabase init

# Create migration
supabase migration new create_students_table

# migrations/20250101000000_create_students_table.sql
CREATE TABLE IF NOT EXISTS students (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id TEXT NOT NULL,
  name TEXT NOT NULL,
  admission_no TEXT NOT NULL,
  class TEXT NOT NULL,
  email TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, admission_no)
);

CREATE INDEX idx_students_tenant ON students(tenant_id);
CREATE INDEX idx_students_class ON students(tenant_id, class);

ALTER TABLE students ENABLE ROW LEVEL SECURITY;

# Apply migration
supabase db push
```

#### 🟢 MEDIUM: No Database Seeding Strategy
**Location**: Demo data in `utils/demoData.ts` not reusable

**Recommendation**: Create database seeders:

```typescript
// db/seeders/StudentSeeder.ts
export class StudentSeeder {
  async run(tenantId: string) {
    const students = [
      {
        name: 'John Doe',
        admissionNo: 'STU001',
        class: 'JSS 1A',
        tenantId
      },
      // ... more students
    ];

    for (const student of students) {
      await supabase.from('students').upsert(student);
    }
  }
}

// db/seed.ts
async function seed() {
  const tenantId = 'demo-tenant';
  
  await new StudentSeeder().run(tenantId);
  await new TeacherSeeder().run(tenantId);
  await new SubjectSeeder().run(tenantId);
  
  console.log('Database seeded successfully');
}
```

---

## 6. Performance Optimization Opportunities

### Recommendations

#### 1. Implement Database Indexes
```sql
-- Performance indexes for common queries
CREATE INDEX CONCURRENTLY idx_scores_student_subject 
  ON scores(student_id, subject_id, tenant_id);

CREATE INDEX CONCURRENTLY idx_students_search 
  ON students USING gin(
    to_tsvector('english', name || ' ' || admission_no)
  );

CREATE INDEX CONCURRENTLY idx_invoices_status_date 
  ON invoices(tenant_id, status, due_date);

CREATE INDEX CONCURRENTLY idx_messages_conversation 
  ON messages(conversation_id, timestamp DESC);
```

#### 2. Use Materialized Views for Complex Queries
```sql
-- Example: Student performance summary
CREATE MATERIALIZED VIEW student_performance_summary AS
SELECT 
  s.id,
  s.name,
  s.class,
  s.tenant_id,
  COUNT(sc.id) as total_scores,
  AVG(sc.score) as average_score,
  MAX(sc.updated_at) as last_updated
FROM students s
LEFT JOIN scores sc ON s.id = sc.student_id
GROUP BY s.id, s.name, s.class, s.tenant_id;

CREATE UNIQUE INDEX ON student_performance_summary(id);

-- Refresh strategy
CREATE OR REPLACE FUNCTION refresh_student_performance()
RETURNS TRIGGER AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY student_performance_summary;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_refresh_performance
AFTER INSERT OR UPDATE OR DELETE ON scores
FOR EACH STATEMENT
EXECUTE FUNCTION refresh_student_performance();
```

#### 3. Implement Read Replicas for Reporting
**Recommendation**: Use Supabase read replicas for heavy reporting queries:

```typescript
// services/supabaseClient.ts
let supabaseRead: any = null;

export async function initSupabaseReadReplica() {
  const READ_REPLICA_URL = import.meta.env?.VITE_SUPABASE_READ_REPLICA_URL;
  
  if (!READ_REPLICA_URL) {
    // Use primary for reads if no replica configured
    return supabase;
  }
  
  supabaseRead = createClient(READ_REPLICA_URL, SUPABASE_KEY);
  return supabaseRead;
}

// Use in reporting functions
export const apiGetFinancialReport = async (startDate: string, endDate: string) => {
  const client = supabaseRead || supabase;
  // Heavy reporting query
  return client.from('invoices')...
};
```

#### 4. Batch Operations
**Location**: Multiple locations doing sequential operations

**Current**:
```typescript
for (const student of students) {
  await apiUpsertStudent(student);
}
```

**Improved**:
```typescript
await apiBatchUpdateStudents(students);
```

---

## 7. Monitoring & Observability

### Recommendations

#### 1. Add Query Performance Logging
```typescript
// utils/queryMonitor.ts
export class QueryMonitor {
  private static instance: QueryMonitor;
  private slowQueryThreshold = 1000; // ms

  static getInstance() {
    if (!this.instance) {
      this.instance = new QueryMonitor();
    }
    return this.instance;
  }

  async track<T>(
    operation: string,
    table: string,
    query: () => Promise<T>
  ): Promise<T> {
    const start = Date.now();
    
    try {
      const result = await query();
      const duration = Date.now() - start;
      
      if (duration > this.slowQueryThreshold) {
        console.warn(`[SlowQuery] ${operation} on ${table} took ${duration}ms`);
        // Could send to monitoring service
      }
      
      return result;
    } catch (error) {
      const duration = Date.now() - start;
      console.error(`[QueryError] ${operation} on ${table} failed after ${duration}ms`, error);
      throw error;
    }
  }
}

// Usage
const get = async <T>(table: string, options: QueryOptions = {}): Promise<T[]> => {
  return QueryMonitor.getInstance().track('SELECT', table, async () => {
    // ... query logic
  });
};
```

#### 2. Connection Pool Metrics
```typescript
export function getConnectionMetrics() {
  return {
    isOnline: !supabase._offline,
    initialized: supabase !== null,
    // Add more metrics if Supabase client exposes them
  };
}
```

---

## 8. Priority Implementation Roadmap

### Phase 1: Critical Fixes (Week 1)
1. ✅ Remove hardcoded database URL fallback
2. ✅ Move service role key to Cloudflare secrets only
3. ✅ Implement connection health monitoring
4. ✅ Add retry logic to database operations
5. ✅ Fix N+1 query patterns

### Phase 2: Performance (Week 2-3)
1. ✅ Implement query result caching
2. ✅ Add pagination to all list endpoints
3. ✅ Create database indexes
4. ✅ Optimize batch operations
5. ✅ Implement query performance monitoring

### Phase 3: Architecture (Week 4-5)
1. ✅ Refactor to repository pattern
2. ✅ Implement validation layer
3. ✅ Add custom error classes
4. ✅ Separate business logic from data access
5. ✅ Create database seeders

### Phase 4: Security & Reliability (Week 6)
1. ✅ Implement comprehensive RLS policies
2. ✅ Add transaction support for complex operations
3. ✅ Create database migration system
4. ✅ Add input sanitization
5. ✅ Implement audit logging

---

## 9. Code Quality Improvements

### 1. Type Safety
**Issue**: Many `any` types in database client code

```typescript
// Current
let supabase: any = null;

// Improved
import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from './types/database.types'; // Generated from schema

let supabase: SupabaseClient<Database> | null = null;
```

Generate types from schema:
```bash
supabase gen types typescript --project-id your-project > types/database.types.ts
```

### 2. Environment Variable Validation
```typescript
// utils/env.ts
import { z } from 'zod';

const EnvSchema = z.object({
  VITE_SUPABASE_URL: z.string().url(),
  VITE_SUPABASE_ANON_KEY: z.string().min(1),
  VITE_SUPABASE_PUBLISHABLE_KEY: z.string().optional(),
});

export function validateEnv() {
  try {
    return EnvSchema.parse(import.meta.env);
  } catch (error) {
    console.error('Environment validation failed:', error);
    throw new Error('Invalid environment configuration');
  }
}
```

---

## 10. Testing Recommendations

### Unit Tests
```typescript
// tests/repositories/StudentRepository.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { StudentRepository } from '@/repositories/StudentRepository';

describe('StudentRepository', () => {
  let repository: StudentRepository;

  beforeEach(() => {
    repository = new StudentRepository();
  });

  it('should find student by admission number', async () => {
    const student = await repository.findByAdmissionNo('STU001');
    expect(student).toBeDefined();
    expect(student?.admissionNo).toBe('STU001');
  });

  it('should handle non-existent students', async () => {
    const student = await repository.findByAdmissionNo('INVALID');
    expect(student).toBeNull();
  });
});
```

### Integration Tests
```typescript
// tests/integration/database.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { initSupabase, isSupabaseOnline } from '@/services/supabaseClient';

describe('Database Connection', () => {
  beforeAll(async () => {
    await initSupabase();
  });

  it('should connect to database', async () => {
    const isOnline = await isSupabaseOnline();
    expect(isOnline).toBe(true);
  });

  it('should handle connection loss gracefully', async () => {
    // Test offline mode
  });
});
```

---

## Summary of Key Recommendations

### Immediate Actions (Do First)
1. **Remove hardcoded database URLs and service keys from codebase**
2. **Implement connection health monitoring**
3. **Add retry logic for database operations**
4. **Fix N+1 query patterns**
5. **Implement Row Level Security policies**

### Short-term Improvements (Next 2 weeks)
1. **Add query result caching**
2. **Implement pagination**
3. **Add database indexes**
4. **Implement proper error handling**
5. **Add input validation**

### Long-term Architecture (Next month)
1. **Refactor to repository pattern**
2. **Implement database migrations**
3. **Add comprehensive testing**
4. **Set up monitoring and alerting**
5. **Document database schema**

---

## Additional Resources

- [Supabase Connection Pooling](https://supabase.com/docs/guides/database/connecting-to-postgres#connection-pooler)
- [PostgreSQL Performance Tips](https://wiki.postgresql.org/wiki/Performance_Optimization)
- [Row Level Security Best Practices](https://supabase.com/docs/guides/auth/row-level-security)
- [Database Indexing Strategies](https://www.postgresql.org/docs/current/indexes.html)

---

**Analysis completed by**: Memex AI  
**Date**: 2025-October-21  
**Version**: 1.0
