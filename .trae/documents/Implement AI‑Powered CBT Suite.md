## Scope
- Build a comprehensive Computer‑Based Testing (CBT) suite: authoring, delivery, proctoring, grading, analytics, and AI co‑pilot.
- Integrate with existing stack: React (Vite), Cloudflare Pages Functions, Supabase, and current AI services (`services/ai*`).

## Architecture
- Data: Supabase tables for item bank, exams, sessions, responses, grading, proctoring events, and analytics.
- API: Cloudflare functions under `functions/api/cbt/*` (REST) + Supabase edge functions for heavy jobs.
- Client: React pages and components under `pages/cbt/*`, `components/cbt/*`, hooks in `hooks/*`, repositories in `repositories/*`.
- AI: Orchestration via `services/aiRouter.ts` → Gemini (`@google/genai`) with `enhancedFallbackAI` for reliability and `semanticSearch.ts` for corpus grounding.

## Phase 1: Data Model & Access
- Migrations (`supabase/migrations`):
  - `cbt_items` (type, stem, options, keys, rubric, difficulty, tags, LO mapping, media).
  - `cbt_exams` (structure, time window, rules, randomization, access policy, accommodations).
  - `cbt_exam_sections` (blueprints and weights).
  - `cbt_sessions` (tenant, user, status, start/end, risk score, environment).
  - `cbt_responses` (per item attempt, answer payload, auto/AI score, rationale, time‑on‑item).
  - `cbt_grades` (final scores, subscore breakdowns, mastery levels).
  - `cbt_proctor_events` (focus loss, device changes, webcam/mic signals, flagged behaviors).
- Repositories: `ExamRepository`, `ItemRepository`, `SessionRepository`, `ResponseRepository` built atop `BaseRepository` and Supabase client.

## Phase 2: Item Bank & Authoring UI
- Pages/components: item list, filters (difficulty, tags), editors for MCQ/MA/TF/Short Answer/Essay/Code/Numeric/Matrix, import/export (CSV/ZIP via `jszip`).
- Versioning/approval workflow; LO tagging and metadata; media attachments.
- Hooks: `useItemEditor`, `useItemImportExport`, reuse `useAI` for AI assist.

## Phase 3: Exam Builder
- Section/blueprint editor: target counts by tag/difficulty/LO, randomization pools.
- Rules: time limit, attempts, shuffle, navigation, calculator, formula sheets, per‑section timers, accommodations.
- Preview/sanity checks; publish with `draft → ready` lifecycle.

## Phase 4: Secure Delivery & Proctoring
- Session start with environment checks (camera/mic/screen permissions, device fingerprint) and honor code.
- Anti‑cheat: clipboard/print block, tab focus tracking, screen change detection, optional webcam snapshot stream (privacy‑aware).
- Lockdown mode (best‑effort in browser); robust event logging to `cbt_proctor_events`.
- Offline resilience: cache exam payload, queue responses, sync when online (align with existing offline tests).

## Phase 5: AI‑Powered Authoring & Grading
- Question generation: from syllabus/docs/url; distractor crafting; hint and solution drafting.
- Rubric generation for short answer/essay; scoring via LLM with rule constraints and calibration sets.
- Grounding with `semanticSearch` (retrieval‑augmented) to reduce hallucination; cost‑aware batching and caching.
- Explain‑to‑student mode: generate rationales per item if allowed.

## Phase 6: Adaptive Testing (CAT)
- IRT‑like metadata (a/b/c params or simplified difficulty) on items.
- Ability estimation per session; item selection policy (max information / content constraints).
- Fallback to stratified randomization when CAT constraints aren’t met; audit trail.

## Phase 7: Analytics & Reports
- Dashboards: item stats (p‑value, discrimination), LO mastery, time‑on‑item, risk flags.
- Cohort analytics per tenant/class; export to CSV/PDF; integrate with existing report card exporter.
- Per‑student scorecards with subscores and growth; shareable links.

## APIs (Illustrative)
- `POST /api/cbt/items` CRUD + import/export.
- `POST /api/cbt/exams` create/update/publish.
- `POST /api/cbt/sessions/start` init; `POST /api/cbt/sessions/:id/submit` finalize.
- `POST /api/cbt/responses` stream answers; `POST /api/cbt/grade` trigger AI grading.
- `GET /api/cbt/analytics/*` cohort and item stats.

## Client UI (Key Screens)
- Item bank; exam builder; readiness checks; test player; proctoring console; analytics.
- Reuse design system and `Tailwind` styles; route group under `/cbt/*` with `react‑router`.

## AI Integration Details
- Use `services/aiRouter` to select providers; default Gemini via `geminiService`.
- Prompt safety and privacy: no PII leaves tenant context; enforce content filters.
- Deterministic modes for grading via rubric; human‑in‑the‑loop overrides.

## Security & Compliance
- Role‑based access (SuperAdmin/Admin/Teacher/Student) via `AuthContext` and tenant policies.
- Data minimization, secure storage of proctoring artifacts, retention policies.
- Accessibility (WCAG): keyboard navigation, screen reader support, font scaling.
- Localization: reuse `utils/i18n` patterns if present; otherwise minimal infra.

## Testing & Verification
- Unit tests: repositories and AI helpers (`vitest`).
- Integration tests: session start/end, response streaming, grading pipeline.
- Load tests for exams with large pools; resilience tests for offline.

## Milestones & Deliverables
- M1: Migrations + repositories + basic CRUD APIs.
- M2: Item bank UI + import/export + publish flow.
- M3: Exam builder + player (linear) + proctoring events.
- M4: AI authoring + AI grading with rubrics.
- M5: Adaptive testing + analytics + reports.

## Risks & Assumptions
- Browser‑only lockdown limits; communicate proctoring scope transparently.
- AI grading requires careful calibration; include manual override.
- Coding question execution likely via external sandbox (e.g., Judge0) proxied through edge function.

## Next Step
- After approval, scaffold routes, repositories, and initial migrations, then iterate per milestone with demoable slices.