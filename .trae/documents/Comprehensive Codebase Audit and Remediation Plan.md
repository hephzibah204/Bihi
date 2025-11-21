# Comprehensive Codebase Audit and Remediation Plan

## Scope & Context
- React + Vite SPA (`App.tsx`), Cloudflare/Vercel serverless (`functions/api/*`), Supabase Edge Functions (`supabase/functions/*`), Supabase DB with RLS and migrations, AI services and fallbacks.
- Linting with ESLint, unit tests via Vitest (`tests/*`), Tailwind CSS.

## Audit Methodology
- Static analysis: run `npm run lint`, `npm run type-check`, `npm audit`, Semgrep (OWASP profiles), secret scanners.
- Manual review: critical paths (auth, AI routing, serverless handlers, storage, payments, communications).
- Dynamic analysis: strengthen Vitest coverage, add integration tests for serverless handlers (mock `env`), add security-focused tests.
- Standards verification: enforce ESLint across all code (including `supabase/functions/*`), TypeScript strictness, consistent CORS/auth middleware usage.

## Priority Remediation Tracks
### Security (Critical First)
1. Add authentication/authorization to monitoring endpoints and file I/O:
   - Adopt `functions/_lib/auth.js` helpers; require roles and tenant scoping for `functions/api/monitoring/*` and `functions/api/get-file.ts`.
2. Remove `Access-Control-Allow-Origin: "*"` in Supabase Functions; replace with allowlist logic mirroring `handleCors`.
3. Eliminate client-side storage of AI provider keys:
   - Move keys to server-side config; expose token-scoped proxy endpoints; purge `sitewide_ai_settings` usage.
4. Add SSRF protections:
   - Validate/allowlist `sourceUrl` in `supabase/functions/sync-ai-simulations`.
5. Harden HTML injection points:
   - Review `dangerouslySetInnerHTML` usage; confine to sanitized, minimal whitelist, add tests for XSS payloads.

### Validation & Completeness
1. Introduce `zod` schemas for teachers, admissions, financials, and edge functions (register, AI gateway, offline-ai);
2. Enforce sanitization on text fields before persistence and echo.
3. Replace conceptual `functions/api/login.js` with real auth or remove.

### Performance & Scalability
1. Replace `.select('*')` with column-specific selects and add pagination caps.
2. Review `.in(...)` batch sizes; chunk and index supporting columns.
3. Confirm and extend DB indexes for high-traffic filters (`tenant_id`, `status`, `conversation_id`, `timestamp`).
4. Add backoff/retry consistency; standardize `withRetry` usage for network calls.

### Code Quality & Standards
1. Expand ESLint coverage to Supabase Functions and JS files; tune rules to catch unsafe patterns.
2. Enable TypeScript strict mode where feasible; remove `any` usage in critical modules.
3. Consolidate CORS policy; centralize via utility and import in all handlers.

## Testing & Verification
- Unit tests: add schemas, sanitizers, and auth helpers tests; target 100% branch coverage for security and validation modules.
- Integration tests: serverless handlers (auth, monitoring, file serving) with mocked env and RLS behaviors.
- Performance tests: query benchmarks for `.select` variants; payload size checks for AI prompts.
- Security tests: XSS injection cases, SSRF allowlist enforcement, unauthorized access checks.

## CI/CD & QA
- Set up GitHub Actions: lint, type-check, tests with coverage, Semgrep, OWASP ZAP baseline (CI-safe), `npm audit`.
- Pre-merge checklist: peer review, CI green, regression suite run, static analysis clean.
- Post-implementation: benchmark comparisons, rescan vulnerabilities, E2E scenario runs.

## Deliverables
- Technical debt inventory (issues categorized with severity and estimates).
- Implementation report (solutions applied, components modified, test methodology and results).
- Updated artifacts: enhanced tests, refactored code, current documentation.
- Metrics dashboard: performance deltas, code quality improvements, coverage stats, security scan results.

## Execution Plan
1. Security hardening PR(s): auth/CORS/SSRF/fallback keys.
2. Validation PR(s): schemas + sanitization + serverless handlers.
3. Performance PR(s): query/select refactors + pagination + indexes.
4. Standards PR(s): ESLint/TS strictness and CORS consolidation.
5. CI/CD PR: actions and gates; baseline reporting.

Please confirm to proceed; I will implement the above in prioritized phases and produce the requested deliverables.