## PUT/DELETE UI Flows
- Items
  - Add Item Editor page under `components/cbt/ItemEditor.tsx` with editable fields (type, stem, options, tags, LO, difficulty, rubric).
  - Actions: `Save` → `PUT /api/cbt/items/:id`, `Delete` → `DELETE /api/cbt/items/:id` with confirmation modal.
  - Navigation: link from Item Bank rows to editor (`/cbt/items/:id`).
- Exams
  - Add Exam Detail/Editor `components/cbt/ExamEditor.tsx` to edit title/description/sections/rules; list sections and allow rearrange.
  - Actions: `Save` → `PUT /api/cbt/exams/:id`, `Delete` → `DELETE /api/cbt/exams/:id`.
  - Navigation: link from ExamBuilder list to editor (`/cbt/exams/:id`).
- UX
  - Optimistic updates with rollback on error; toast notifications via existing `GlobalSuccessNotification`.
  - Keep Tailwind styles consistent with current components (`btn btn-primary`, tables/forms).

## AI Authoring in Item Editor
- Integrations via `services/aiRouter.ts` and Gemini
  - Buttons: `Generate Stem`, `Generate Options`, `Generate Distractors`, `Generate Rubric`, `Generate Hint`, `Generate Rationale`.
  - Context: query `services/semanticSearch` for top-K matches; include `response` snippets in system prompt.
  - Structured output: validate with `zod` schemas mapped to `types/cbt.ts` (options, rubric criteria).
  - Controls: temperature low for grading, moderate for generation; cost-aware batching and caching.
- Flow
  - Author clicks an action → call `router.generate(prompt, conversationId?, metadata)` → apply validated result into editor fields.
  - Provide manual edit and version bump on AI-applied changes (`version++`).

## Rubric-Based Grading in Player
- Player scaffold: `components/cbt/ExamPlayer.tsx`
  - Start session, render items sequentially (linear), capture answers and time-on-item.
  - On submit: trigger grading pipeline.
- Grading pipeline
  - Endpoint: `POST /api/cbt/grade` → aggregates responses, auto-scores objective items (mcq/true_false/multiple_answer), uses Gemini for short-answer/essay/code.
  - Store per-criterion scores and rationale back into `cbt_responses (auto_score, ai_score, rationale)` and insert/update `cbt_grades`.
  - Display final score and subscore breakdowns.

## Sessions Endpoints and Player Lifecycle
- `POST /api/cbt/sessions/start` → insert `cbt_sessions` (`in_progress`, timestamps, tenant_id via user metadata); role gate for `['Student','Parent']`.
- `POST /api/cbt/responses` → insert per-item response with `time_on_item_seconds`; allow updates if reattempt within rules.
- `POST /api/cbt/sessions/submit` → set `submitted`, call grading, return grade summary.
- Proctoring hook: use `hooks/useCbtProctoring.ts` inside player to emit focus/tab/clipboard events and sync with local queue.

## RLS Policies (Finalize)
- Principles
  - Admin/Teacher: full CRUD scoped by `tenant_id` match with JWT claim (`auth.jwt() ->> 'tenant_id'`).
  - Student: restricted `SELECT` on `cbt_exams` if within time window; `INSERT`/`UPDATE` only on `cbt_responses` for their own `session_id`; `SELECT` proctor events for own session; no write to items/exams.
- SQL (illustrative)
  - `cbt_items`: `FOR SELECT/INSERT/UPDATE/DELETE TO authenticated USING (tenant_id = (auth.jwt() ->> 'tenant_id')) WITH CHECK (tenant_id = (auth.jwt() ->> 'tenant_id'))`.
  - `cbt_exams`: same tenant-scoped policies for admin/teacher; add student `FOR SELECT USING (tenant_id = (auth.jwt() ->> 'tenant_id') AND now() BETWEEN time_window_start AND time_window_end)`.
  - `cbt_sessions`: `FOR SELECT/INSERT/UPDATE/DELETE USING (tenant_id = (auth.jwt() ->> 'tenant_id') AND (user_id = auth.uid() OR user_role IN ('Teacher','School Admin','Super Admin')))`.
  - `cbt_responses`: `FOR SELECT USING (session_id IN (SELECT id FROM cbt_sessions WHERE user_id = auth.uid()))`; `FOR INSERT/UPDATE WITH CHECK (session_id IN (SELECT id FROM cbt_sessions WHERE user_id = auth.uid()))`.
  - `cbt_grades`: `FOR SELECT USING (session_id IN (SELECT id FROM cbt_sessions WHERE user_id = auth.uid() OR tenant_id = (auth.jwt() ->> 'tenant_id')))`; writes limited to service role.
  - `cbt_proctor_events`: student `SELECT` restricted to own session; admin/teacher `SELECT` within tenant; writes allowed from service or authenticated client via check on session.

## Testing & Verification
- Unit tests: AI authoring schema validation; auto-scoring functions.
- Integration tests: CRUD flows for items/exams; session start/submit; grading endpoint; RLS access with different role tokens.
- UI tests: Editor PUT/DELETE, player submit; offline proctor queue flush on reconnect.

## Milestone Order
1) Sessions endpoints + Exam Player scaffold.
2) Item/Exam Editor with PUT/DELETE and AI authoring buttons.
3) Grading endpoint + UI summary display.
4) RLS policies SQL migration and role-token tests.

## Deliverables
- Server: `sessions/start`, `responses`, `sessions/submit`, `grade` endpoints.
- Client: Item/Exam Editor with AI actions; Exam Player using proctor hook.
- DB: RLS policies migration for CBT tables.

If approved, I’ll implement the endpoints and UIs, wire AI authoring/grading, and add the RLS policies migration, then run type-checks and basic integration tests.