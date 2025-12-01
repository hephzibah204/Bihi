# Codebase Cleanup Plan

## 🎯 Executive Summary

This document outlines a comprehensive plan to improve code quality, maintainability, and developer experience across the Bihi codebase.

**Current State:**
- 281 instances of `as any` (type safety issues)
- 500+ components in flat structure
- TypeScript strict mode disabled
- Inconsistent patterns and code duplication
- Mixed concerns across directories

**Target State:**
- Type-safe codebase with minimal `any` usage
- Well-organized, modular structure
- Consistent patterns and reusable utilities
- Clear separation of concerns
- Improved developer experience

---

## 📋 Priority 1: Critical Improvements (Week 1-2)

### 1.1 Enable TypeScript Strict Mode Gradually

**Current Issue:** `strict: false` in `tsconfig.json` allows unsafe code patterns.

**Action Plan:**
```typescript
// Phase 1: Enable basic strict checks
{
  "strict": true,
  "noImplicitAny": true,
  "strictNullChecks": true,
  "strictFunctionTypes": true
}

// Phase 2: Fix errors incrementally
// - Start with new files
// - Fix existing files module by module
```

**Steps:**
1. Create `tsconfig.strict.json` with strict settings
2. Gradually migrate files to use strict config
3. Fix type errors as they're discovered
4. Add `// @ts-expect-error` comments with explanations where truly needed

### 1.2 Organize Components Directory

**Current Issue:** 500+ components in flat structure makes navigation difficult.

**Proposed Structure:**
```
components/
├── admin/          # Admin-specific components
│   ├── dashboard/
│   ├── students/
│   ├── teachers/
│   └── financials/
├── teacher/        # Teacher-specific components
├── student/        # Student-specific components
├── parent/         # Parent-specific components
├── shared/         # Shared across roles
│   ├── forms/
│   ├── tables/
│   └── charts/
├── ui/             # Base UI components (keep existing)
├── features/       # Feature-specific components
└── layouts/        # Layout components
```

**Migration Script:**
```bash
# Create migration script to move files
# components/move-components.sh
```

### 1.3 Create Shared Utilities for Common Patterns

**Common Patterns to Extract:**

1. **API Error Handling**
```typescript
// utils/apiHelpers.ts
export async function handleApiCall<T>(
  apiCall: () => Promise<T>,
  errorMessage: string
): Promise<{ data: T | null; error: string | null }> {
  try {
    const data = await apiCall();
    return { data, error: null };
  } catch (error) {
    console.error(errorMessage, error);
    return { 
      data: null, 
      error: error instanceof Error ? error.message : errorMessage 
    };
  }
}
```

2. **Loading States**
```typescript
// hooks/useAsyncData.ts
export function useAsyncData<T>(
  fetchFn: () => Promise<T>,
  deps: React.DependencyList = []
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Implementation
  }, deps);

  return { data, loading, error, refetch };
}
```

3. **Form Validation**
```typescript
// hooks/useFormValidation.ts
export function useFormValidation<T extends Record<string, any>>(
  schema: z.ZodSchema<T>,
  initialValues: T
) {
  // Unified form validation logic
}
```

---

## 📋 Priority 2: Code Quality (Week 3-4)

### 2.1 Reduce `as any` Usage

**Current:** 281 instances across 110 files

**Strategy:**
1. Create proper type definitions for all data structures
2. Use type guards instead of `as any`
3. Create utility types for common patterns

**Example Fixes:**

```typescript
// ❌ Before
const user = data as any;
user.name = 'John';

// ✅ After
interface User {
  id: string;
  name: string;
  email: string;
}
const user = data as User; // Or better: validate with Zod

// ✅ Even Better: Type Guard
function isUser(data: unknown): data is User {
  return (
    typeof data === 'object' &&
    data !== null &&
    'id' in data &&
    'name' in data &&
    'email' in data
  );
}
```

### 2.2 Standardize Import Paths

**Create Path Aliases:**
```json
// tsconfig.json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./*"],
      "@/components/*": ["./components/*"],
      "@/services/*": ["./services/*"],
      "@/utils/*": ["./utils/*"],
      "@/hooks/*": ["./hooks/*"],
      "@/types/*": ["./types/*"],
      "@/contexts/*": ["./contexts/*"]
    }
  }
}
```

**Update Imports:**
```typescript
// ❌ Before
import { apiGetStudents } from '../../services/api';
import { useAuth } from '../../../contexts/AuthContext';

// ✅ After
import { apiGetStudents } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
```

### 2.3 Create Consistent Error Handling

**Centralized Error Handler:**
```typescript
// utils/errorHandler.ts
export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500,
    public details?: unknown
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export function handleError(error: unknown): AppError {
  if (error instanceof AppError) return error;
  if (error instanceof Error) return new AppError(error.message, 'UNKNOWN_ERROR');
  return new AppError('An unexpected error occurred', 'UNKNOWN_ERROR');
}
```

---

## 📋 Priority 3: Architecture Improvements (Week 5-6)

### 3.1 Implement Repository Pattern Consistently

**Current:** Partial implementation exists

**Expand to All Entities:**
```
repositories/
├── BaseRepository.ts      # ✅ Exists
├── StudentRepository.ts   # ✅ Exists
├── TeacherRepository.ts   # Create
├── InvoiceRepository.ts   # Create
├── PaymentRepository.ts   # Create
├── AttendanceRepository.ts # Create
└── ScoreRepository.ts     # Create
```

### 3.2 Create Service Layer

**Structure:**
```
services/
├── api/              # API client (existing)
├── auth/             # Authentication services
├── storage/          # File storage services
├── communication/    # Email/SMS services
├── ai/               # AI services (existing)
└── cache/            # Caching services
```

### 3.3 Implement Feature-Based Organization

**For Large Features:**
```
features/
├── admissions/
│   ├── components/
│   ├── hooks/
│   ├── services/
│   ├── types/
│   └── index.ts
├── billing/
│   └── ...
└── cbt/
    └── ...
```

---

## 📋 Priority 4: Developer Experience (Week 7-8)

### 4.1 Improve Documentation

**Add:**
- JSDoc comments for all public functions
- README files in major directories
- Architecture decision records (ADRs)
- Component usage examples

**Example:**
```typescript
/**
 * Fetches student data with automatic error handling and caching
 * 
 * @param options - Query options including filters and pagination
 * @returns Promise resolving to student array or null on error
 * 
 * @example
 * ```ts
 * const students = await fetchStudents({ classFilter: 'JSS1' });
 * ```
 */
export async function fetchStudents(options: StudentQueryOptions): Promise<Student[]> {
  // Implementation
}
```

### 4.2 Create Development Tools

**Scripts to Add:**
```json
{
  "scripts": {
    "clean": "rm -rf dist node_modules/.vite",
    "type-check": "tsc --noEmit",
    "lint:fix": "eslint . --fix",
    "format": "prettier --write .",
    "analyze": "npm run type-check && npm run lint",
    "check-all": "npm run analyze && npm run test"
  }
}
```

### 4.3 Add Pre-commit Hooks

**Using Husky:**
```json
// package.json
{
  "husky": {
    "hooks": {
      "pre-commit": "lint-staged",
      "pre-push": "npm run type-check && npm run test"
    }
  },
  "lint-staged": {
    "*.{ts,tsx}": [
      "eslint --fix",
      "prettier --write"
    ]
  }
}
```

---

## 📋 Priority 5: Performance & Optimization (Ongoing)

### 5.1 Code Splitting

**Implement Route-Based Splitting:**
```typescript
// App.tsx
const AdminDashboard = lazy(() => import('@/components/admin/AdminDashboard'));
const TeacherDashboard = lazy(() => import('@/components/teacher/TeacherDashboard'));
```

### 5.2 Bundle Analysis

**Add Bundle Analyzer:**
```bash
npm install --save-dev rollup-plugin-visualizer
```

### 5.3 Optimize Imports

**Use Tree Shaking:**
```typescript
// ❌ Before
import _ from 'lodash';
const result = _.map(data, ...);

// ✅ After
import { map } from 'lodash';
const result = map(data, ...);
```

---

## 🛠️ Implementation Strategy

### Phase 1: Foundation (Weeks 1-2)
- [ ] Enable TypeScript strict mode for new files
- [ ] Create path aliases
- [ ] Organize components directory (start with new structure)
- [ ] Create shared utilities

### Phase 2: Quality (Weeks 3-4)
- [ ] Reduce `as any` usage by 50%
- [ ] Standardize error handling
- [ ] Add JSDoc comments to critical functions
- [ ] Fix import paths

### Phase 3: Architecture (Weeks 5-6)
- [ ] Complete repository pattern
- [ ] Create service layer
- [ ] Implement feature-based organization for new features

### Phase 4: Polish (Weeks 7-8)
- [ ] Add comprehensive documentation
- [ ] Set up pre-commit hooks
- [ ] Create development tools
- [ ] Performance optimization

---

## 📊 Success Metrics

- **Type Safety:** Reduce `as any` from 281 to <50
- **Code Organization:** All components in logical directories
- **Documentation:** 80% of public APIs have JSDoc
- **Build Time:** Reduce by 20% through better organization
- **Developer Experience:** New features can be added in <1 hour

---

## 🔄 Maintenance Plan

1. **Weekly Code Reviews:** Focus on one area per week
2. **Monthly Refactoring:** Dedicate one day per month to cleanup
3. **Quarterly Audit:** Review and update this plan
4. **Continuous Improvement:** Address issues as they're found

---

## 📚 Resources

- [TypeScript Best Practices](https://typescript-eslint.io/rules/)
- [React Code Organization](https://react.dev/learn/thinking-in-react)
- [Clean Code Principles](https://github.com/ryanmcdermott/clean-code-javascript)

---

**Last Updated:** 2025-12-01
**Next Review:** 2025-12-15

