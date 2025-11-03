# Fix Registration & Login Issue

## Spec Provenance
**Problem Statement**: Users can register successfully but cannot login afterwards. The app shows "incorrect credentials" error even though the Supabase authentication succeeds.

**Discovered Root Cause**: 
1. Registration creates auth user but teacher profile creation may fail silently
2. Login succeeds at Supabase level but fails at app level because AuthContext can't find matching teacher record
3. The registration endpoint shows a warning when teacher creation fails but doesn't prevent "success" message

## Spec Header

### Name
Fix Registration & Login Flow - Ensure Teacher Profile Creation

### Smallest Acceptable Scope
- Make teacher profile creation **mandatory** during registration (fail registration if it fails)
- Add proper error handling and validation in registration flow
- Improve AuthContext to show better error messages when teacher profile is missing
- Add retry mechanism for teacher profile creation

### Non-Goals
- Multi-step registration wizard
- Email verification flow changes
- Password reset improvements (separate ticket)
- Bulk user import features

## Paths to Supplementary Guidelines
Not applicable - this is a bug fix for existing authentication flow

## Decision Snapshot

### Architecture Choices
1. **Make teacher creation blocking** - Registration should fail if teacher profile isn't created
2. **Add transaction-like behavior** - Rollback auth user if teacher creation fails
3. **Better error feedback** - Show specific errors to users about what failed
4. **Graceful degradation for local dev** - Keep local API server behavior consistent

### Why These Choices?
- **Data integrity**: Every auth user MUST have a corresponding teacher/user profile
- **Better UX**: Users need to know if registration truly succeeded vs. partially succeeded
- **Debugging**: Clear error messages help identify issues faster
- **Consistency**: Same behavior in local dev and production

## Architecture at a Glance

### Current Flow (Broken)
```
1. User fills registration form
2. POST /api/register
   ├─ Create tenant ✓
   ├─ Create auth user ✓
   ├─ Create teacher profile ⚠️ (can fail silently)
   └─ Seed default data ✓
3. Returns success even if teacher creation failed
4. User tries to login
5. Supabase auth succeeds ✓
6. AuthContext looks for teacher record ✗
7. User stays logged out (appears as "wrong credentials")
```

### Fixed Flow
```
1. User fills registration form
2. POST /api/register
   ├─ Create tenant ✓
   ├─ Create auth user ✓
   ├─ Create teacher profile (MUST succeed)
   │  ├─ If fails: rollback auth user
   │  └─ Return clear error to user
   └─ Seed default data ✓
3. Returns success ONLY if all steps succeed
4. User tries to login
5. Supabase auth succeeds ✓
6. AuthContext finds teacher record ✓
7. User is logged in ✓
```

## Implementation Plan

### Phase 1: Fix Registration Endpoint (Priority: CRITICAL)

#### 1.1 Update Cloudflare Function `/functions/api/register.js`

**Current problematic code** (lines 145-160):
```javascript
const teacherRes = await fetch(`${SUPABASE_URL}/rest/v1/teachers`, {
    method: 'POST', headers: adminHeaders,
    body: JSON.stringify(teacherPayload)
});
let teacherCreationWarning = null;
if (!teacherRes.ok) {
    // Do NOT rollback tenant or auth user on teacher creation failure.
    let raw = '';
    try { raw = await teacherRes.text(); } catch {}
    teacherCreationWarning = raw || `Admin profile creation failed...`;
}
```

**Fix to apply**:
```javascript
const teacherRes = await fetch(`${SUPABASE_URL}/rest/v1/teachers`, {
    method: 'POST', 
    headers: adminHeaders,
    body: JSON.stringify(teacherPayload)
});

if (!teacherRes.ok) {
    // Teacher creation is CRITICAL - rollback everything if it fails
    let errorDetails = '';
    try { 
        const errorJson = await teacherRes.json();
        errorDetails = errorJson.message || errorJson.hint || JSON.stringify(errorJson);
    } catch {
        try { errorDetails = await teacherRes.text(); } catch {}
    }
    
    // Rollback: Delete the auth user we just created
    try {
        await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${userData.id}`, { 
            method: 'DELETE', 
            headers: adminHeaders 
        });
    } catch (rollbackErr) {
        console.error('Failed to rollback auth user:', rollbackErr);
    }
    
    // Rollback: Delete the tenant we just created
    try {
        await fetch(`${SUPABASE_URL}/rest/v1/tenants?id=eq.${subdomain}`, { 
            method: 'DELETE', 
            headers: adminHeaders 
        });
    } catch (rollbackErr) {
        console.error('Failed to rollback tenant:', rollbackErr);
    }
    
    throw new Error(`Failed to create admin profile: ${errorDetails}. Registration has been rolled back. Please try again or contact support if the issue persists.`);
}

// Verify teacher was actually created by fetching it
const verifyRes = await fetch(
    `${SUPABASE_URL}/rest/v1/teachers?${teacherCols.email}=eq.${adminEmail}&${teacherCols.tenantId}=eq.${subdomain}`, 
    { headers: adminHeaders }
);
const teachers = await verifyRes.json();
if (!Array.isArray(teachers) || teachers.length === 0) {
    // Rollback everything
    try {
        await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${userData.id}`, { 
            method: 'DELETE', 
            headers: adminHeaders 
        });
        await fetch(`${SUPABASE_URL}/rest/v1/tenants?id=eq.${subdomain}`, { 
            method: 'DELETE', 
            headers: adminHeaders 
        });
    } catch {}
    
    throw new Error('Admin profile creation verification failed. Please try again.');
}
```

#### 1.2 Apply Same Fix to Supabase Edge Function `/supabase/functions/register/index.ts`

Apply identical logic to maintain consistency between Cloudflare and Supabase deployment options.

#### 1.3 Update Local Dev Servers

Update both `local-api-server.js` and `local-api-server2.js` with the same fix.

### Phase 2: Improve AuthContext Error Handling

#### 2.1 Update `/contexts/AuthContext.tsx`

**Current code** (lines 120-127):
```typescript
const teachers = await apiGetTeachers();
const currentUser = teachers.find(t => t.email.toLowerCase() === session.user.email.toLowerCase());
if (currentUser) {
    setUser(currentUser);
    setRole(currentUser.role);
}
```

**Enhanced version**:
```typescript
try {
    const teachers = await apiGetTeachers();
    const currentUser = teachers.find(t => 
        t.email.toLowerCase() === session.user.email.toLowerCase()
    );
    
    if (currentUser) {
        setUser(currentUser);
        setRole(currentUser.role);
    } else {
        // Auth user exists but no teacher profile - this is a data integrity issue
        console.error('Authentication succeeded but no teacher profile found for:', session.user.email);
        
        // Show helpful error to user
        const errorMessage = 
            'Your account exists but your profile is incomplete. ' +
            'Please contact support with this email: ' + session.user.email;
        
        // Store error for display
        sessionStorage.setItem('authProfileError', errorMessage);
        
        // Sign out the user to prevent stuck state
        await supabase.auth.signOut();
    }
} catch (error) {
    console.error('Error loading teacher profile:', error);
    // Don't sign out on network errors - allow retry
}
```

#### 2.2 Update `/components/PortalLogin.tsx`

Add display for profile errors:

```typescript
// After existing error state
const [profileError, setProfileError] = useState('');

// In useEffect, check for stored errors
useEffect(() => {
    const storedError = sessionStorage.getItem('authProfileError');
    if (storedError) {
        setProfileError(storedError);
        sessionStorage.removeItem('authProfileError');
    }
}, []);

// In the render, show profile error prominently
{profileError && (
    <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
        <p className="text-sm text-amber-800 font-medium">Profile Error</p>
        <p className="text-sm text-amber-700 mt-1">{profileError}</p>
        <button 
            onClick={() => setProfileError('')}
            className="mt-2 text-sm text-amber-600 hover:text-amber-800 underline"
        >
            Dismiss
        </button>
    </div>
)}
```

### Phase 3: Add Diagnostic Logging

#### 3.1 Add Registration Logging

In both registration endpoints, add detailed logging:

```javascript
console.log('Registration attempt:', { subdomain, adminEmail, schoolName });
console.log('Tenant creation result:', { ok: tenantRes.ok, status: tenantRes.status });
console.log('Auth user creation result:', { ok: userRes.ok, userId: userData?.id });
console.log('Teacher profile creation result:', { ok: teacherRes.ok, status: teacherRes.status });
console.log('Teacher columns detected:', teacherCols);
console.log('Teacher payload:', teacherPayload);
```

#### 3.2 Add Login Logging

In AuthContext, add:

```typescript
console.log('Session established for:', session.user.email);
console.log('Teachers found:', teachers.length);
console.log('Matching teacher:', currentUser ? 'Found' : 'NOT FOUND');
```

### Phase 4: Database Schema Validation

#### 4.1 Create Migration Check Script

Create `/scripts/validate-teacher-schema.js`:

```javascript
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function validateSchema() {
    console.log('Checking teachers table schema...\n');
    
    // Check if teachers table exists
    const { data: tables, error: tableError } = await supabase
        .from('teachers')
        .select('*')
        .limit(0);
    
    if (tableError) {
        console.error('❌ Teachers table not found or not accessible:', tableError.message);
        return false;
    }
    
    console.log('✓ Teachers table exists');
    
    // Check required columns
    const requiredColumns = ['email', 'tenant_id', 'role'];
    const recommendedColumns = ['auth_id', 'full_name', 'name'];
    
    // Query pg_meta for actual columns
    const { data: columns } = await supabase.rpc('exec_sql', {
        sql: `SELECT column_name FROM information_schema.columns 
              WHERE table_name = 'teachers' AND table_schema = 'public'`
    });
    
    const columnNames = columns?.map(c => c.column_name) || [];
    
    console.log('\nColumn Analysis:');
    requiredColumns.forEach(col => {
        if (columnNames.includes(col)) {
            console.log(`✓ ${col} (required)`);
        } else {
            console.log(`❌ ${col} (MISSING - REQUIRED)`);
        }
    });
    
    recommendedColumns.forEach(col => {
        if (columnNames.includes(col)) {
            console.log(`✓ ${col} (recommended)`);
        } else {
            console.log(`⚠ ${col} (missing - recommended)`);
        }
    });
    
    console.log('\nAll columns found:', columnNames.join(', '));
    
    return true;
}

validateSchema().then(() => process.exit(0)).catch(err => {
    console.error('Validation failed:', err);
    process.exit(1);
});
```

Add to package.json:
```json
"scripts": {
    "validate:schema": "node scripts/validate-teacher-schema.js"
}
```

### Phase 5: Testing & Validation

#### 5.1 Manual Test Checklist

Test in this order:

1. **Fresh Registration (Happy Path)**
   - [ ] Register new school with unique subdomain
   - [ ] Verify success message appears
   - [ ] Immediately try to login with same credentials
   - [ ] Should successfully reach dashboard
   - [ ] Verify user profile shows correct name and role

2. **Duplicate Registration (Error Path)**
   - [ ] Try to register with same subdomain again
   - [ ] Should show clear error about subdomain being taken
   - [ ] Should NOT create auth user or teacher profile

3. **Database Integrity Check**
   - [ ] After successful registration, check Supabase dashboard
   - [ ] Verify tenant exists in `tenants` table
   - [ ] Verify auth user exists in Authentication section
   - [ ] Verify teacher exists in `teachers` table with correct:
     - email matching auth user
     - tenant_id matching subdomain
     - role = 'Admin'
     - auth_id matching auth user id (if column exists)

4. **Failed Teacher Creation (Forced Error)**
   - [ ] Temporarily remove required permission from service role
   - [ ] Attempt registration
   - [ ] Should show error about profile creation
   - [ ] Check database: tenant and auth user should be rolled back (NOT present)

5. **Login After Registration**
   - [ ] Clear browser cache/cookies
   - [ ] Visit the portal subdomain directly (e.g., testschool.reportsheet.com.ng)
   - [ ] Login with registered credentials
   - [ ] Should successfully authenticate and load dashboard

#### 5.2 Automated Test Cases

Create `/tests/registration-flow.test.ts`:

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { createClient } from '@supabase/supabase-js';

describe('Registration Flow', () => {
    const testSubdomain = `test-${Date.now()}`;
    const testEmail = `admin-${Date.now()}@test.com`;
    
    it('should create tenant, auth user, and teacher profile', async () => {
        const response = await fetch('/api/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                schoolName: 'Test School',
                subdomain: testSubdomain,
                adminEmail: testEmail,
                adminPassword: 'TestPass123!',
                adminName: 'Test Admin',
                schoolType: 'secondary'
            })
        });
        
        expect(response.ok).toBe(true);
        const data = await response.json();
        expect(data.teacherProfileCreated).toBe(true);
        expect(data.warning).toBeUndefined();
    });
    
    it('should allow login after registration', async () => {
        // Register first
        await fetch('/api/register', { /* ... */ });
        
        // Then try to login
        const supabase = createClient(/* ... */);
        const { data, error } = await supabase.auth.signInWithPassword({
            email: testEmail,
            password: 'TestPass123!'
        });
        
        expect(error).toBeNull();
        expect(data.session).toBeDefined();
    });
});
```

### Phase 6: Production Deployment

#### 6.1 Pre-Deployment Steps

1. **Run schema validation**:
   ```bash
   npm run validate:schema
   ```

2. **Run tests**:
   ```bash
   npm test
   ```

3. **Test on local dev server**:
   ```bash
   npm run dev
   ```

4. **Check environment variables** in Cloudflare Pages dashboard:
   - SUPABASE_URL is set
   - SUPABASE_SERVICE_ROLE_KEY is set
   - Both are correct (test with a simple API call)

#### 6.2 Deployment Steps

1. Commit changes:
   ```bash
   git add .
   git commit -m "fix: Ensure teacher profile creation during registration & improve auth error handling"
   git push origin main
   ```

2. Cloudflare Pages will auto-deploy

3. Monitor deployment in Cloudflare dashboard

#### 6.3 Post-Deployment Validation

1. Test registration on production domain
2. Verify can login immediately after
3. Check Cloudflare Functions logs for any errors
4. Test on multiple browsers (Chrome, Firefox, Safari)

#### 6.4 Rollback Plan

If issues occur:

1. **Immediate**: Revert to previous deployment in Cloudflare Pages dashboard
2. **Quick fix**: Can hot-patch by editing function directly in Cloudflare dashboard (emergency only)
3. **Proper fix**: Fix code, test locally, redeploy

## Verification & Demo Script

### Demo Script for Stakeholders

**Scenario: New School Registration**

1. **Navigate to signup page**
   - Go to `https://reportsheet.com.ng/signup`
   - Fill in school details

2. **Complete registration**
   - School Name: "Demo High School"
   - Portal Address: "demo-high" (will become demo-high.reportsheet.com.ng)
   - Admin Name: "John Doe"
   - Email: "john@demohigh.edu"
   - Password: (secure password)
   - Click "Create Account"

3. **Verify success message**
   - Should see "Success! Your Portal is Ready!"
   - Should see portal URL displayed

4. **Navigate to portal**
   - Click "Go to My Portal" or manually visit demo-high.reportsheet.com.ng

5. **Login with credentials**
   - Email: john@demohigh.edu
   - Password: (password from step 2)
   - Click "Sign In"

6. **Verify successful login**
   - Should see dashboard
   - User profile in top-right should show "John Doe"
   - Role should be "Admin"

**Expected Result**: ✅ Complete flow works without errors

**Previous Behavior**: ❌ Step 5 would fail with "incorrect credentials"

### Test Edge Cases

1. **Duplicate subdomain**:
   - Try to register with existing subdomain
   - Should show: "The portal address 'demo-high' is already taken"

2. **Invalid email**:
   - Try invalid email format
   - Should show validation error before submission

3. **Weak password**:
   - Try password < 6 characters
   - Should show validation error

4. **Network interruption**:
   - Simulate network failure during registration
   - Should show appropriate error
   - Should not create partial records

## Deploy

### Environment Setup

**Required Environment Variables** (Cloudflare Pages):
```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

**Verification**:
```bash
# Test that env vars are accessible in functions
curl -X POST https://reportsheet.pages.dev/api/env-check \
  -H "Content-Type: application/json"
```

### Deployment Checklist

- [ ] All code changes committed to main branch
- [ ] Schema validation passes locally
- [ ] Tests pass locally
- [ ] Environment variables confirmed in Cloudflare dashboard
- [ ] Deployment triggered and completed successfully
- [ ] Post-deployment tests pass on production
- [ ] Logs show no errors
- [ ] Stakeholder demo completed successfully

### Monitoring

**Key Metrics to Watch**:
- Registration success rate (should be 100% for valid inputs)
- Login success rate after registration (should be 100%)
- Teacher profile creation failures (should be 0)

**Cloudflare Logs to Monitor**:
- Functions > register > Logs
- Look for errors containing "teacher" or "profile"
- Watch for 500 status codes

**Supabase Dashboard to Monitor**:
- Authentication > Users (new users appearing)
- Table Editor > teachers (new teachers appearing)
- Table Editor > tenants (new tenants appearing)
- Logs > API (for any RLS or permission errors)

### Success Criteria

✅ **Fix is successful when**:
1. Users can register AND login in single session
2. Zero "incorrect credentials" errors after successful registration
3. All database records (tenant, auth user, teacher) created atomically
4. Clear error messages when registration fails
5. No orphaned auth users without teacher profiles

---

## Notes

- This fix addresses data integrity and user experience
- The rollback mechanism prevents orphaned records
- Better error messages improve supportability
- Logging helps diagnose future issues quickly
- Schema validation catches misconfigurations early
