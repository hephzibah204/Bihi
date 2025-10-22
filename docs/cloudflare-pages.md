# Deploy to Cloudflare Pages

This project is set up to run API endpoints on Cloudflare Pages Functions (under `functions/api/*`) and serve the frontend built by Vite from `dist/`.

## Prerequisites

- Cloudflare account with Pages enabled
- Wrangler CLI (`npm i -g wrangler`)
- Node.js 18+

## Environment Variables

Configure these in Cloudflare Pages (Dashboard → Pages → your project → Settings → Environment variables):

- `SUPABASE_URL` (required by Functions)
- `SUPABASE_SERVICE_ROLE_KEY` (required by Functions)
- `VITE_SUPABASE_URL` (required by frontend build)
- `VITE_SUPABASE_PUBLISHABLE_KEY` or `VITE_SUPABASE_ANON_KEY` (frontend auth)
- Optional: `GEMINI_API_KEY` if AI features are used

For local development of Pages Functions, `.dev.vars` is provided and used by `wrangler pages dev`.

## Local Validate (Pages Functions)

1. Install dependencies: `npm install`
2. Build the frontend: `npm run build`
3. Start Pages dev server: `wrangler pages dev dist`
4. Test endpoints:
   - `GET /api/platform-settings`
   - `POST /api/register`

## Deploy via Wrangler

1. Create project: `wrangler pages project create reportsheet-pages`
2. Push secrets:
   - `wrangler pages secret put SUPABASE_URL --project-name reportsheet-pages`
   - `wrangler pages secret put SUPABASE_SERVICE_ROLE_KEY --project-name reportsheet-pages`
3. Deploy: `wrangler pages deploy dist --project-name reportsheet-pages`

Alternatively, connect the repository in the Cloudflare Dashboard and set Build command `npm run build`, Output directory `dist`.

## Routes

- `functions/api/register.js` → `POST /api/register`
- `functions/api/login.js` → `POST /api/login`
- `functions/api/platform-settings.js` → `GET /api/platform-settings`

These functions enforce CORS for `localhost`, `*.pages.dev`, and `reportsheet.com.ng`.