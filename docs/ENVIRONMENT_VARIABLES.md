# Environment Variables Setup Guide

## 🔐 Required API Keys

### Gemini AI (Primary)
```bash
NEXT_PUBLIC_GEMINI_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```
**Get it from**: https://aistudio.google.com/app/apikey

### HuggingFace (Optional Fallback)
```bash
HUGGINGFACE_API_KEY=hf_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
# OR for client-side access:
NEXT_PUBLIC_HUGGINGFACE_API_KEY=hf_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```
**Get it from**: https://huggingface.co/settings/tokens

### Supabase (Database)
```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```
**Get it from**: Supabase Dashboard → Project Settings → API

## 📝 Setup Instructions

### 1. Local Development

Create `.env.local` in project root:

```bash
# .env.local (This file is gitignored - safe to put keys here)

# Gemini AI (Required)
NEXT_PUBLIC_GEMINI_API_KEY=your_gemini_key_here

# HuggingFace (Optional - for additional fallback)
NEXT_PUBLIC_HUGGINGFACE_API_KEY=your_hf_key_here

# Supabase (Required for database features)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_key
```

### 2. Cloudflare Pages (Production)

**Method 1: Dashboard**
1. Go to https://dash.cloudflare.com
2. Select your Pages project
3. Go to **Settings** → **Environment Variables**
4. Add each variable:
   - Variable name: `NEXT_PUBLIC_GEMINI_API_KEY`
   - Value: Your actual key
   - Environment: Production (or both Production + Preview)
5. Click **Save**
6. **Redeploy** your project for changes to take effect


### 3. Verify Setup

Run this in your browser console after deployment:

```javascript
// Should log 'true' if keys are loaded
console.log('Gemini configured:', !!process.env.NEXT_PUBLIC_GEMINI_API_KEY);
console.log('HF configured:', !!process.env.NEXT_PUBLIC_HUGGINGFACE_API_KEY);
```

Or use the AI Fallback Dashboard to check service status.

## 🔒 Security Best Practices

### ✅ DO:
- Store keys in environment variables
- Use `.env.local` for local development
- Add `.env.local` to `.gitignore` (already done)
- Use Cloudflare dashboard for production keys
- Rotate keys periodically
- Use different keys for dev/prod

### ❌ DON'T:
- Commit keys to Git
- Share keys in public channels
- Use production keys in development
- Hard-code keys in source files
- Store keys in client-side code without `NEXT_PUBLIC_` prefix

## 🎯 Variable Naming Convention

### Client-Side (Browser Access)
```bash
NEXT_PUBLIC_VARIABLE_NAME=value
```
**Can be accessed in browser** - Use for APIs called from React components

### Server-Side Only
```bash
VARIABLE_NAME=value
```
**Hidden from browser** - Use for sensitive server operations

## 📦 Example `.env.local` File

```bash
# =============================================================================
# Dossier.NG Environment Variables
# =============================================================================
# This file is for LOCAL DEVELOPMENT ONLY
# Never commit this file to version control
# =============================================================================

# -----------------------------------------------------------------------------
# AI Services
# -----------------------------------------------------------------------------

# Gemini AI (Primary) - REQUIRED
# Get from: https://aistudio.google.com/app/apikey
NEXT_PUBLIC_GEMINI_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX

# HuggingFace (Fallback) - OPTIONAL
# Get from: https://huggingface.co/settings/tokens
# Free tier: 30 requests/minute
NEXT_PUBLIC_HUGGINGFACE_API_KEY=hf_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX

# -----------------------------------------------------------------------------
# Database (Supabase)
# -----------------------------------------------------------------------------

# Supabase Project URL - REQUIRED
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co

# Supabase Anon Key - REQUIRED
# This is safe to expose in the browser (has RLS protection)
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# -----------------------------------------------------------------------------
# Optional: Service Keys (if needed for server-side operations)
# -----------------------------------------------------------------------------

# Supabase Service Role Key - DANGEROUS (full access, no RLS)
# Only use server-side, NEVER expose to browser
# SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# -----------------------------------------------------------------------------
# Other Configuration
# -----------------------------------------------------------------------------

# Environment
NODE_ENV=development

# API Base URL (if different from default)
# NEXT_PUBLIC_API_URL=http://localhost:3000
```

## 🔍 Checking Your Current Environment

Create a debug page to check what's configured:

```tsx
// pages/debug-env.tsx (Remove in production!)
export default function DebugEnv() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Environment Check</h1>
      <table className="border">
        <tbody>
          <tr>
            <td className="border p-2">Gemini Key</td>
            <td className="border p-2">
              {process.env.NEXT_PUBLIC_GEMINI_API_KEY 
                ? '✓ Configured' 
                : '✗ Missing'}
            </td>
          </tr>
          <tr>
            <td className="border p-2">HuggingFace Key</td>
            <td className="border p-2">
              {process.env.NEXT_PUBLIC_HUGGINGFACE_API_KEY 
                ? '✓ Configured' 
                : '✗ Missing (Optional)'}
            </td>
          </tr>
          <tr>
            <td className="border p-2">Supabase URL</td>
            <td className="border p-2">
              {process.env.NEXT_PUBLIC_SUPABASE_URL 
                ? '✓ Configured' 
                : '✗ Missing'}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
```

## 🚨 If Keys Are Leaked

1. **Immediately revoke** the compromised key
2. **Generate new key** from the provider
3. **Update environment variables**
4. **Redeploy** your application
5. **Monitor** for unauthorized usage

### Gemini Key Leaked
- Go to https://aistudio.google.com/app/apikey
- Delete the compromised key
- Create a new key
- Update your environment

### HuggingFace Key Leaked
- Go to https://huggingface.co/settings/tokens
- Revoke the token
- Create a new token
- Update your environment

## 📚 Resources

- [Cloudflare Pages Environment Variables](https://developers.cloudflare.com/pages/platform/environment-variables/)
- [Next.js Environment Variables](https://nextjs.org/docs/basic-features/environment-variables)
- [Google AI Studio](https://aistudio.google.com/)
- [HuggingFace Tokens](https://huggingface.co/settings/tokens)

---

**Last Updated**: January 21, 2025  
**Security Level**: Critical - Handle with care
