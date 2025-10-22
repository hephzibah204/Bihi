# Dossier.NG Resolved Issues

## Fixed Issues

1. **WebSocket Connection (HMR)**
   - Updated `vite.config.ts` to correctly proxy WebSocket connections for hot module replacement
   - Added `hmr: true` to server configuration

2. **Icon Duplication**
   - Removed duplicate `CheckCircleIcon` import in `GlobalSuccessNotification.tsx`
   - Kept only local definition and moved it above first usage

3. **Blank Page Issue (Auth Loading State)**
   - Fixed condition in `AuthContext.tsx` where loading stayed true when subdomain was null
   - Ensured loading is set to false for main site (root domain) with no subdomain

4. **Platform Settings Fetch Failure**
   - Added error handling to `apiGetPlatformSettings` in `services/api.ts`
   - Ensured app gracefully loads default settings if both Cloudflare and Supabase requests fail
   - Prevented app from hanging on blank page due to unresolved promise

5. **Null Reference for Landing Page**
   - Added optional chaining in `App.tsx` for `platformSettings.landingPageContent`
   - Fixed: `<LandingPage content={platformSettings?.landingPageContent} menuItems={platformSettings?.menus?.header} />`

6. **Node.js Version Compatibility**
   - Updated `package.json` to specify Node.js engine requirements
   - Downgraded several `devDependencies` to versions compatible with Node.js v18

## Expected Behaviors

- **CORS Warnings**: Expected in browser console due to missing remote functions in local/Replit environment
- **npm Warnings**: Expected warning about npm v11.5.2 not supporting Node.js v18.20.4, but does not affect functionality
- **Default Content**: Application will display default ReportSheet landing page when external APIs are unavailable

## Verification

All fixes have been verified and the application is running stably at:
- Local: http://localhost:3000/
- Network: http://172.31.152.7:3000/