# 🔒 SECURITY WARNING - Environment Variables

## ⚠️ CRITICAL: Service Role Key Exposure

Your `.env.local` file currently contains a **SUPABASE_SERVICE_ROLE_KEY**. This is a **CRITICAL SECURITY ISSUE**.

### What's Wrong?

The service role key in `.env.local`:
```
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...
```

**This key provides FULL administrative access to your database, bypassing all Row Level Security (RLS) policies.**

### Why Is This Dangerous?

1. **Client-side exposure**: `.env.local` variables can be accessed by client-side code
2. **Full database access**: Service role key bypasses all security policies
3. **Data breach risk**: Anyone with this key can read, modify, or delete ANY data
4. **No audit trail**: Operations with service role key may not be properly logged

### Immediate Actions Required

#### 1. Remove Service Role Key from Client

**Delete these lines from `.env.local`:**
```bash
SUPABASE_URL=https://shzwolantavauszuxwlp.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...
```

#### 2. Rotate Your Service Role Key

Go to your Supabase dashboard and generate a new service role key:
1. Navigate to: https://app.supabase.com/project/shzwolantavauszuxwlp/settings/api
2. Click "Regenerate" next to Service Role Key
3. Save the new key securely (see below)

#### 3. Store Service Role Key Securely

**For Cloudflare Workers (Production):**
```bash
# Add as environment variable in Cloudflare dashboard
# Pages & Workers > Your Worker > Settings > Environment Variables
SUPABASE_SERVICE_ROLE_KEY=your_new_service_role_key
```

**For Local Development (if absolutely needed):**
Create a separate `.env.server` file that is NEVER committed:
```bash
# .env.server (add to .gitignore)
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

Then update your `local-api-server.js`:
```javascript
import dotenv from 'dotenv';
dotenv.config({ path: '.env.server' }); // Load server secrets
dotenv.config({ path: '.env.local' });  // Load client config
```

#### 4. Update Your .env.local

Your `.env.local` should ONLY contain:
```bash
# Client-side configuration only
VITE_SUPABASE_URL=https://shzwolantavauszuxwlp.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGci... (your anon key)
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_... (if you have one)
GEMINI_API_KEY=AIzaSy... (if needed)
```

#### 5. Verify .gitignore

Ensure `.env.local` is in `.gitignore` (already done):
```bash
# Check if already ignored
git check-ignore .env.local

# Should output: .env.local
```

#### 6. Check Git History

If `.env.local` was previously committed with the service role key:
```bash
# Search git history for the key
git log -p --all -S 'service_role' | grep -A 5 -B 5 'service_role'

# If found, consider the key compromised and rotate it immediately
```

### Safe Environment Variable Practices

#### What Goes in `.env.local` (Client-Safe)
✅ Supabase URL  
✅ Supabase Anon Key  
✅ Supabase Publishable Key  
✅ Public API endpoints  
✅ Feature flags  

#### What NEVER Goes in `.env.local` (Server-Only)
❌ Service Role Keys  
❌ Database passwords  
❌ Private API keys  
❌ JWT secrets  
❌ Encryption keys  

### Cloudflare Workers Security

For your Cloudflare Workers (in `/functions/api/`):

1. **Set environment variables in Cloudflare dashboard**:
   - Go to Cloudflare Pages dashboard
   - Navigate to Settings > Environment Variables
   - Add `SUPABASE_SERVICE_ROLE_KEY` there

2. **Access in worker code**:
```javascript
export async function onRequest(context) {
  const { request, env } = context;
  
  // env.SUPABASE_SERVICE_ROLE_KEY is only available server-side
  const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;
  
  // Use it for server-side operations
}
```

### Verification Checklist

After following these steps, verify:

- [ ] `.env.local` does NOT contain `SUPABASE_SERVICE_ROLE_KEY`
- [ ] `.env.local` does NOT contain `SUPABASE_URL` (without VITE_ prefix)
- [ ] New service role key generated in Supabase dashboard
- [ ] New service role key added to Cloudflare Workers environment
- [ ] `.env.local` is in `.gitignore`
- [ ] No service role keys in git history
- [ ] Application still works with anon/publishable key only

### Testing After Changes

1. **Test client authentication**:
   - Ensure users can still log in
   - Verify RLS policies work correctly

2. **Test Cloudflare Workers**:
   - Deploy and test functions that need service role key
   - Verify they can access the new key from `env`

3. **Monitor for errors**:
   - Check browser console for authentication errors
   - Check Cloudflare Worker logs for missing environment variables

### Additional Resources

- [Supabase Security Best Practices](https://supabase.com/docs/guides/auth/row-level-security)
- [Managing Secrets in Cloudflare Workers](https://developers.cloudflare.com/workers/configuration/secrets/)
- [Environment Variables Security](https://12factor.net/config)

### Questions?

If you need help implementing these changes or have questions about security:
1. Review the Supabase documentation on key types
2. Check the Cloudflare Workers environment variables docs
3. Consider consulting with a security professional

---

**Last Updated**: 2025-10-21  
**Severity**: CRITICAL  
**Action Required**: IMMEDIATE
