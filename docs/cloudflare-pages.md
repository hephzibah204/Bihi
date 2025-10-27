# Deploy to Cloudflare Pages

This project is set up to run API endpoints on Cloudflare Pages Functions (under `functions/api/*`) and serve the frontend built by Vite from `dist/`.

## Prerequisites

- Cloudflare account with Pages enabled
- Node.js 18+

## Environment Variables

Configure these in Cloudflare Pages (Dashboard → Pages → your project → Settings → Environment variables):

- `SUPABASE_URL` (required by Functions)
- `SUPABASE_SERVICE_ROLE_KEY` (required by Functions)
- `VITE_SUPABASE_URL` (required by frontend build)
- `VITE_SUPABASE_PUBLISHABLE_KEY` or `VITE_SUPABASE_ANON_KEY` (frontend auth)
- Optional: `GEMINI_API_KEY` if AI features are used

## Local Validate (Pages Functions)

1. Install dependencies: `npm install`
2. Build the frontend: `npm run build`
3. Serve the built site locally (static preview): `npx serve -s dist`
4. Note: Pages Functions run in Cloudflare's environment; test endpoints after deploying or via Preview deployments.

## Deploy via Cloudflare Dashboard

1. In Cloudflare Dashboard, create a Pages project and connect your repository.
2. Set Build command: `npm run build`
3. Set Output directory: `dist`
4. Configure the environment variables listed above.
5. Deploy (the Dashboard will build and publish).

## Routes

- `functions/api/register.js` → `POST /api/register`
- `functions/api/login.js` → `POST /api/login`
- `functions/api/platform-settings.js` → `GET /api/platform-settings`

These functions enforce CORS for `localhost`, `*.pages.dev`, and `reportsheet.com.ng`.
