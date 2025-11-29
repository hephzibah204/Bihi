# Signup Network Error - Diagnosis and Fix

## Problem
Users are getting "network error" messages when trying to sign up after filling the form and clicking "Create Account".

## Root Causes

The network error can be caused by several issues:

### 1. **CORS (Cross-Origin Resource Sharing) Error** ⚠️ MOST LIKELY
The registration endpoint (`/api/register`) has CORS restrictions that only allow specific domains. If your production domain is not in the allowed list, users will get a 403 Forbidden error that appears as a "network error".

**Current Allowed Origins:**
- `localhost` (any port)
- `127.0.0.1` (any port)
- `reportsheet.com.ng`
- `*.reportsheet.com.ng` (subdomains)
- `reportsheet.pages.dev`
- `*.pages.dev` (any Cloudflare Pages subdomain)
- Google AI Studio domains

### 2. **Endpoint Not Deployed**
The `/api/register` endpoint must be deployed as a Cloudflare Pages Function. If it's not deployed, users will get a 404 or network error.

### 3. **Missing Environment Variables**
The Cloudflare Pages Function needs these environment variables:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

If these are missing, the function will return a 500 error.

## Solutions

### Fix 1: Add Your Domain to CORS Allowed Origins

#### Option A: Use Environment Variable (Recommended)
1. Go to Cloudflare Pages Dashboard → Your Project → Settings → Environment Variables
2. Add a new variable:
   - **Name:** `ALLOWED_ORIGINS`
   - **Value:** Your domain(s), comma-separated (e.g., `yourdomain.com,www.yourdomain.com`)
3. Redeploy your site

The code already supports this! The `handleCors` function in `functions/api/register.js` reads `ALLOWED_ORIGINS` from environment variables.

#### Option B: Update Code Directly
Edit `functions/api/register.js` and add your domain to the `allowedOriginPatterns` array:

```javascript
const allowedOriginPatterns = [
    /^https?:\/\/localhost(:\d+)?$/,
    /^https?:\/\/127\.0\.0\.1(:\d+)?$/,
    /^https:\/\/reportsheet\.com\.ng$/,
    /^https:\/\/.+\.reportsheet\.com\.ng$/,
    /^https:\/\/reportsheet\.pages\.dev$/,
    /^https:\/\/.+\.pages\.dev$/,
    /^https:\/\/yourdomain\.com$/,  // ADD YOUR DOMAIN HERE
    /^https:\/\/.+\.yourdomain\.com$/,  // ADD YOUR SUBDOMAINS HERE
    // ... rest of patterns
];
```

### Fix 2: Verify Endpoint is Deployed

1. Check that `functions/api/register.js` exists in your repository
2. Deploy to Cloudflare Pages (the function should be automatically detected)
3. Test the endpoint:
   ```bash
   curl -X POST https://yourdomain.com/api/register \
     -H "Content-Type: application/json" \
     -H "Origin: https://yourdomain.com" \
     -d '{"schoolName":"Test","subdomain":"test","adminEmail":"test@test.com","adminPassword":"test123","adminName":"Test"}'
   ```

### Fix 3: Verify Environment Variables

1. Go to Cloudflare Pages Dashboard → Your Project → Settings → Environment Variables
2. Ensure these are set:
   - `SUPABASE_URL` - Your Supabase project URL
   - `SUPABASE_SERVICE_ROLE_KEY` - Your Supabase service role key (keep secret!)
3. Redeploy after adding variables

### Fix 4: Use Explicit Supabase Function URL (Alternative)

If you're using Supabase Edge Functions instead of Cloudflare Pages Functions:

1. Set environment variable `VITE_SUPABASE_FUNCTION_REGISTER_URL` in your build settings
2. Value should be: `https://your-project.supabase.co/functions/v1/register`
3. The frontend will use this URL instead of `/api/register`

## Testing

After applying fixes, test the signup flow:

1. Open browser DevTools (F12) → Network tab
2. Try to sign up
3. Check the Network tab for the `/api/register` request
4. Look at:
   - **Status Code:** Should be 200 (success) or 400/409 (validation errors), NOT 403 or 404
   - **Response:** Should contain JSON with `success: true` or a specific error message
   - **CORS Headers:** Response should include `Access-Control-Allow-Origin` header

## Improved Error Messages

The code has been updated to show more specific error messages:
- **CORS errors:** "Access denied: Your domain is not authorized..."
- **Network errors:** "Network error: Unable to connect..."
- **Timeout errors:** "Request timeout: The server took too long..."
- **Server errors:** Specific error messages from the server

## Quick Checklist

- [ ] Domain added to CORS allowed origins (via `ALLOWED_ORIGINS` env var or code)
- [ ] `/api/register` endpoint deployed as Cloudflare Pages Function
- [ ] Environment variables set in Cloudflare Pages dashboard
- [ ] Tested signup flow in browser DevTools
- [ ] Checked browser console for specific error messages

## Need Help?

If the issue persists:
1. Check browser console (F12) for specific error messages
2. Check Network tab to see the actual HTTP status code
3. Check Cloudflare Pages Function logs for server-side errors
4. Verify your domain matches exactly (including `www.` prefix if applicable)

