# Codebase Cleanup Migration Guide

This guide provides step-by-step examples for migrating existing code to use the new utilities and patterns.

## 🚀 Quick Start Examples

### Example 1: Refactoring Component Data Fetching

#### ❌ Before (Current Pattern)
```typescript
// components/SomeComponent.tsx
const [data, setData] = useState(null);
const [loading, setLoading] = useState(true);
const [error, setError] = useState(null);

useEffect(() => {
  const fetchData = async () => {
    try {
      setLoading(true);
      const result = await apiGetStudents();
      setData(result);
    } catch (e: any) {
      setError(e?.message || 'Failed to load');
    } finally {
      setLoading(false);
    }
  };
  fetchData();
}, []);
```

#### ✅ After (Using New Hook)
```typescript
// components/SomeComponent.tsx
import { useAsyncData } from '@/hooks/useAsyncData';
import { apiGetStudents } from '@/services/api';

const { data, loading, error, refetch } = useAsyncData({
  fetchFn: () => apiGetStudents(),
  errorMessage: 'Failed to load students',
});

if (loading) return <Spinner />;
if (error) return <ErrorMessage message={error} />;
return <StudentList students={data} />;
```

**Benefits:**
- ✅ 50% less code
- ✅ Consistent error handling
- ✅ Built-in loading states
- ✅ Type-safe

---

### Example 2: Removing `as any` with Type Guards

#### ❌ Before
```typescript
const user = response.data as any;
const name = user.name; // No type safety
const age = user.age; // Could be anything
```

#### ✅ After
```typescript
import { isObject, isString, isNumber, safeGet } from '@/utils/typeGuards';

interface User {
  name: string;
  age: number;
  email: string;
}

function isUser(data: unknown): data is User {
  return (
    isObject(data) &&
    isString(data.name) &&
    isNumber(data.age) &&
    isString(data.email)
  );
}

// Usage
if (isUser(response.data)) {
  const name = response.data.name; // TypeScript knows it's a string
  const age = response.data.age;   // TypeScript knows it's a number
} else {
  // Handle invalid data
}

// Or with safe access
const name = safeGet(response.data, 'name', isString);
const age = safeGet(response.data, 'age', isNumber);
```

**Benefits:**
- ✅ Type safety at runtime
- ✅ No `as any` needed
- ✅ Clear error handling

---

### Example 3: Standardizing API Calls

#### ❌ Before
```typescript
const fetchDashboardData = async () => {
  try {
    const students = await apiGetStudents();
    const teachers = await apiGetTeachers();
    const subjects = await apiGetSubjects();
    // Handle each separately...
  } catch (error) {
    // Inconsistent error handling
  }
};
```

#### ✅ After
```typescript
import { handleParallelApiCalls } from '@/utils/apiHelpers';

const fetchDashboardData = async () => {
  const { results, errors } = await handleParallelApiCalls(
    () => apiGetStudents(),
    () => apiGetTeachers(),
    () => apiGetSubjects()
  );

  const [students, teachers, subjects] = results;
  
  // All errors are captured in errors array
  if (errors.some(e => e !== null)) {
    console.error('Some data failed to load:', errors);
  }
};
```

**Benefits:**
- ✅ Consistent error handling
- ✅ Parallel execution
- ✅ All errors captured

---

### Example 4: Component Organization

#### ❌ Before (Flat Structure)
```
components/
├── AdminDashboard.tsx
├── AdminProfile.tsx
├── AdminSettings.tsx
├── TeacherDashboard.tsx
├── TeacherProfile.tsx
└── ... (500+ files)
```

#### ✅ After (Organized Structure)
```
components/
├── admin/
│   ├── dashboard/
│   │   └── AdminDashboard.tsx
│   ├── profile/
│   │   └── AdminProfile.tsx
│   └── settings/
│       └── AdminSettings.tsx
├── teacher/
│   ├── dashboard/
│   │   └── TeacherDashboard.tsx
│   └── profile/
│       └── TeacherProfile.tsx
└── shared/
    └── ...
```

**Migration Steps:**
1. Create new directory structure
2. Move files to appropriate directories
3. Update imports using path aliases:
   ```typescript
   // Old
   import AdminDashboard from '../components/AdminDashboard';
   
   // New
   import AdminDashboard from '@/components/admin/dashboard/AdminDashboard';
   ```

---

### Example 5: Import Path Standardization

#### ❌ Before (Inconsistent Paths)
```typescript
import { apiGetStudents } from '../../services/api';
import { useAuth } from '../../../contexts/AuthContext';
import { formatDate } from '../../../../utils/dateUtils';
```

#### ✅ After (Path Aliases)
```typescript
import { apiGetStudents } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import { formatDate } from '@/utils/dateUtils';
```

**Setup:**
1. Update `tsconfig.json`:
```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./*"]
    }
  }
}
```

2. Update `vite.config.ts`:
```typescript
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
});
```

---

## 📋 Migration Checklist

### Week 1: Foundation
- [ ] Set up path aliases in `tsconfig.json` and `vite.config.ts`
- [ ] Create new utility files (`apiHelpers.ts`, `typeGuards.ts`)
- [ ] Create new hooks (`useAsyncData.ts`)
- [ ] Update one component as a reference example

### Week 2: Component Refactoring
- [ ] Refactor 10 components to use `useAsyncData`
- [ ] Remove `as any` from 20 files using type guards
- [ ] Standardize import paths in 50 files

### Week 3: Organization
- [ ] Create new component directory structure
- [ ] Move admin components to `components/admin/`
- [ ] Move teacher components to `components/teacher/`
- [ ] Update all imports

### Week 4: Type Safety
- [ ] Enable TypeScript strict mode for new files
- [ ] Create proper type definitions for all API responses
- [ ] Replace remaining `as any` with proper types

---

## 🎯 Priority Files to Refactor First

### High Impact, Low Effort
1. **Components with data fetching:**
   - `components/AdminBlueDashboard.tsx` ✅ (Already refactored)
   - `components/TeacherHome.tsx`
   - `components/StudentHome.tsx`
   - `components/ParentHome.tsx`

2. **Components with many `as any`:**
   - `components/Timetable.tsx` (13 instances)
   - `components/ui/TopBar.tsx` (15 instances)
   - `components/SchoolSettings.tsx` (10 instances)

3. **API service files:**
   - `services/api.ts` - Add proper return types
   - `services/secureApi.ts` - Standardize error handling

---

## 🔧 Tools & Scripts

### Find All `as any` Usage
```bash
grep -r "as any" components/ --include="*.tsx" --include="*.ts" | wc -l
```

### Find Components Needing Refactoring
```bash
# Find components with data fetching patterns
grep -r "useState.*loading" components/ --include="*.tsx"
```

### Batch Update Imports
```bash
# Use find and replace in your IDE:
# Find: from '../../services/api'
# Replace: from '@/services/api'
```

---

## 📚 Additional Resources

- See `CODEBASE_CLEANUP_PLAN.md` for the full strategy
- See `utils/apiHelpers.ts` for API utility examples
- See `hooks/useAsyncData.ts` for hook examples
- See `utils/typeGuards.ts` for type guard examples

---

## ❓ FAQ

**Q: Should I refactor everything at once?**  
A: No, do it incrementally. Start with new code, then refactor existing code module by module.

**Q: What if a refactor breaks something?**  
A: Test thoroughly. Use the new patterns in new features first, then migrate existing code.

**Q: How do I handle complex types?**  
A: Create proper interfaces/types in `types/` directory. Use Zod for runtime validation.

**Q: Can I use `as any` temporarily?**  
A: Yes, but add a comment explaining why and create a ticket to fix it:
```typescript
// TODO: Replace with proper type - see ticket #123
const data = response as any;
```

---

**Last Updated:** 2025-12-01

