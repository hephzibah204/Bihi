## API Extensions (Full CRUD + Filters)
- Endpoints:
  - Items: `functions/api/cbt/items.js` (list/create), `functions/api/cbt/items/[id].js` (get/update/delete)
  - Exams: `functions/api/cbt/exams.js` (list/create), `functions/api/cbt/exams/[id].js` (get/update/delete)
- Auth: `requirePlatformRoles` for `['Super Admin','School Admin','Teacher']` with tenant-bound inserts/updates via user metadata.
- Filters (PostgREST mapping):
  - `difficulty`: `gte`/`lte` range via `difficulty=gte.<min>&difficulty=lte.<max>`
  - `tags`: array contains via `tags.cs.{math,algebra}` or overlap via `tags.ov.{math}`
  - `learningObjectives`: `learningObjectives.cs.{LO-12}`
  - `type`: `type.eq.mcq`
  - Pagination: `limit=<n>`; select via `select=*` or narrowed columns.
- Bodies:
  - Item: `type`, `stem`, `options[]`, `answerKey`, `rubric[]`, `difficulty`, `tags[]`, `learningObjectives[]`, `mediaUrls[]`, `status`, `tenant_id`
  - Exam: `title`, `description`, `sections[]`, `rules{}`, `timeWindowStart/End`, `status`, `tenant_id`
- Update/Delete:
  - `PUT /api/cbt/items/:id` and `DELETE /api/cbt/items/:id` → PostgREST calls with `eq.id=<id>`; return updated row or `204`.
  - Same pattern for exams.

## Supabase Migrations (Tables + RLS)
- Files under `supabase/migrations`, timestamped (e.g., `20251114_cbt_tables.sql`).
- Tables:
  - `cbt_items`:
    - `id UUID PK DEFAULT gen_random_uuid()`, `tenant_id TEXT`, `type TEXT CHECK (type IN ('mcq','multiple_answer','true_false','short_answer','essay','code','numeric','matrix'))`, `stem TEXT NOT NULL`, `options JSONB DEFAULT '[]'::jsonb`, `answer_key JSONB`, `rubric JSONB DEFAULT '[]'::jsonb`, `difficulty INT`, `tags TEXT[] DEFAULT '{}'`, `learning_objectives TEXT[] DEFAULT '{}'`, `media_urls TEXT[] DEFAULT '{}'`, `status TEXT CHECK (status IN ('draft','approved','archived')) DEFAULT 'draft'`, `author_id TEXT`, `version INT DEFAULT 1`, `created_at TIMESTAMPTZ DEFAULT NOW()`, `updated_at TIMESTAMPTZ DEFAULT NOW()`
    - Indexes: `idx_cbt_items_tenant`, `idx_cbt_items_difficulty`, `idx_cbt_items_status`, GIN on `tags` and `learning_objectives`.
  - `cbt_exams`:
    - `id UUID PK`, `tenant_id TEXT`, `title TEXT NOT NULL`, `description TEXT`, `sections JSONB DEFAULT '[]'::jsonb`, `rules JSONB DEFAULT '{}'::jsonb`, `time_window_start TIMESTAMPTZ`, `time_window_end TIMESTAMPTZ`, `status TEXT CHECK (status IN ('draft','ready','archived')) DEFAULT 'draft'`, `created_at`, `updated_at`
    - Indexes: `idx_cbt_exams_tenant`, `idx_cbt_exams_status`, `idx_cbt_exams_created_at`.
  - `cbt_sessions`:
    - `id UUID PK`, `exam_id UUID REFERENCES public.cbt_exams(id) ON DELETE CASCADE`, `user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE`, `tenant_id TEXT`, `status TEXT CHECK (status IN ('not_started','in_progress','submitted','graded')) DEFAULT 'not_started'`, `started_at`, `submitted_at`, `risk_score INT`, `created_at DEFAULT NOW()`
    - Indexes: `idx_cbt_sessions_exam`, `idx_cbt_sessions_user`, `idx_cbt_sessions_status`.
  - `cbt_responses`:
    - `id UUID PK`, `session_id UUID REFERENCES public.cbt_sessions(id) ON DELETE CASCADE`, `item_id UUID REFERENCES public.cbt_items(id) ON DELETE CASCADE`, `answer JSONB`, `auto_score NUMERIC`, `ai_score NUMERIC`, `rationale TEXT`, `time_on_item_seconds INT`, `created_at DEFAULT NOW()`
    - Indexes: `idx_cbt_responses_session_item`, `idx_cbt_responses_session`, `idx_cbt_responses_item`.
  - `cbt_grades`:
    - `id UUID PK`, `session_id UUID REFERENCES public.cbt_sessions(id) ON DELETE CASCADE UNIQUE`, `total_score NUMERIC NOT NULL`, `sub_scores JSONB DEFAULT '{}'::jsonb`, `mastery_levels JSONB DEFAULT '{}'::jsonb`, `created_at DEFAULT NOW()`
    - Indexes: `idx_cbt_grades_session`.
  - `cbt_proctor_events`:
    - `id UUID PK`, `session_id UUID REFERENCES public.cbt_sessions(id) ON DELETE CASCADE`, `event_type TEXT CHECK (event_type IN ('focus_loss','tab_switch','screen_change','clipboard','camera_blocked','mic_blocked','webcam_snapshot','flagged_behavior','network_loss','restore'))`, `payload JSONB DEFAULT '{}'::jsonb`, `risk_increment INT DEFAULT 0`, `created_at DEFAULT NOW()`
    - Indexes: `idx_cbt_proctor_session`, `idx_cbt_proctor_event_type`, `idx_cbt_proctor_created_at`.
- RLS:
  - Enable RLS on all tables.
  - Policies:
    - Tenants/Admins/Teachers: can `SELECT/INSERT/UPDATE/DELETE` for rows where `tenant_id = current_setting('request.jwt.claims')::jsonb->>'tenant_id'` (or via helper) and role in allowed set.
    - Students: restricted `SELECT` on `cbt_exams` when within time window and assigned; restricted `INSERT` on `cbt_responses` for own `session_id`.
- Triggers:
  - Update `updated_at` on `cbt_items`/`cbt_exams` changes.

## UI Scaffolding (React + Tailwind)
- Routes under `/cbt/*` using `react-router`:
  - `/cbt/items`: Item Bank list with filters (tags, difficulty, LO, type).
  - `/cbt/items/new` and `/cbt/items/:id`: Item Editor.
  - `/cbt/exams`: Exam list.
  - `/cbt/exams/new` and `/cbt/exams/:id`: Exam Builder.
  - `/cbt/player/:sessionId`: Exam Player.
- Components:
  - Filters bar, item table, item form (type-aware), options editor, rubric builder, blueprint editor, section list, rules panel, publish dialog.
- Hooks:
  - `useItemBank(filters)`, `useItemEditor(id?)`, `useExamBuilder(id?)`, `useExamPlayer(sessionId)` wired to repositories and APIs.
- Styling:
  - Tailwind utility classes consistent with existing components; shared input components reused.

## AI Authoring & Grading
- Authoring:
  - Use `services/aiRouter.generate` with task detectors for: question generation, distractors, hints, worked solutions.
  - Grounding via `services/semanticSearch` over tenant corpus; include context in prompts.
  - Structured outputs validated by `zod` schemas per item type.
- Grading:
  - For short-answer/essay/code: rubric-based scoring via Gemini (`geminiService`), temperature low; return rationale and scores per rubric criterion.
  - Cache rubric objects on item; store AI grading outputs in `cbt_responses.ai_score`/`rationale`.
- Safety & Privacy:
  - Respect tenant boundaries; no PII in prompts; use safe content filters and cost-aware batching.

## Proctoring & Offline Resilience
- Proctoring events:
  - Focus/tab/screen changes via `visibilitychange`, `pagehide`, `fullscreenchange`, clipboard events.
  - Environment checks: camera/mic permission via `getUserMedia`; snapshot stream optional (with clear consent and privacy toggles).
  - Log to `cbt_proctor_events` with `risk_increment`; aggregate per session to compute `risk_score`.
- Offline:
  - Use existing `connectionManager` and `supabaseClient` health events.
  - Local queue for responses and proctor events in `localStorage` (or small IndexedDB if added); sync on `service-connection-restored`.
  - Exam payload caching and resume workflows.

## Adaptive Testing (Later Phase)
- Item metadata extensions: IRT-like params (`a`,`b`,`c`) or simplified difficulty bands.
- Ability estimation per session; item selection policy obeying content constraints and max-information.
- Fallback: stratified randomization when constraints unmet; audit trail stored in `cbt_sessions` metadata.

## Testing & Verification
- Unit tests: repositories, filters, AI schema parsing.
- Integration tests: CRUD APIs, RLS access with role tokens, session start/submit, grading pipeline.
- Offline tests: simulate network loss/restore; queued responses sync.
- Load tests: large item banks/exams; proctoring event flood.

## Milestones
- M1: Migrations + RLS + CRUD APIs (items/exams) with filters.
- M2: Item Bank + Item Editor with AI authoring.
- M3: Exam Builder + Player + Proctoring events and offline sync.
- M4: AI grading integration + analytics dashboards; begin adaptive policies.

## Deliverables
- SQL migrations with indexes and policies.
- Cloudflare functions for full CRUD and filtered queries.
- React pages/components under `/cbt/*` following existing design.
- AI pipelines for authoring/grading, grounded and schema-validated.
- Proctoring and offline reliability integrated into player.

## Notes
- We will follow the repository’s migration styles: timestamped files, UUID PKs, JSONB defaults, array indexes, and RLS patterns.
- APIs will reuse CORS/auth helpers; PostgREST filters will match Supabase operators (e.g., `cs`, `ov`, `gte`, `lte`).