## Goals
- Teachers upload exams and questions (objective and theory).
- Students attempt; AI marks both theory and objective items.
- Auto-record scores into school results.
- Scoring pipeline with fallbacks: Gemini → HuggingFace → Local scorer.

## Current Foundations
- CBT endpoints exist: `/api/cbt/items`, `/api/cbt/exams` (Cloudflare Pages Functions).
- Media, storage and Supabase client patterns are already in place (`services/api.ts`, storage usage).
- AI providers: Gemini/HuggingFace services are present (`services/geminiService.ts`, `services/huggingFaceAPI.ts`), and a robust fallback layer (`services/enhancedFallbackAI.ts`).

## Data Model
- Reuse CBT tables (items, exams, sessions, responses, grades). If missing, add them:
  - `cbt_items`: `type`, `stem`, `options`, `answer_key`, `rubric`.
  - `cbt_exams`: `sections` and `rules`.
  - `cbt_sessions`: one per student attempt.
  - `cbt_responses`: per item answers; add `auto_score`, `ai_score`, `rationale`.
  - `cbt_grades`: per session totals (`total_score`, `sub_scores`).
- Link exams to subjects/terms to enable auto-recording into the normal `scores` table.

## Upload & Build (Teacher UX)
- Item Bank enhancements:
  - Create objective items (MCQ/True-False/Multiple Answer), theory items (Short Answer/Essay), rubrics.
  - Bulk upload via CSV/JSON (columns: `type, stem, options, answerKey, rubric, tags, difficulty`).
- Exam Builder:
  - Add sections, include item ids, set rules (`shuffleItems`, `timeLimitMinutes`).
  - Tag exam with subject, class, session, term (for recording mapping).

## Attempt & Capture (Student UX)
- Exam Player:
  - Render objective items with option selection; theory items with free-text editor (length limits, attachments optional).
  - Save progress to `cbt_responses` with timestamps; submit to `cbt_sessions`.

## Scoring Pipeline (Server Functions)
- New function: `POST /api/cbt/mark-session`
  - Input: `session_id`, `strategy?: 'auto'|'objective-only'|'theory-only'`.
  - Steps:
    1. Fetch `responses` and `items`.
    2. Objective scoring: compare with `answer_key` (supports single/multiple/true_false), write `auto_score`.
    3. Theory scoring:
       - Build prompt from `stem`, rubric, and student's answer.
       - Attempt Gemini: call existing `geminiService` with strict timeout.
       - If failure/low-confidence: call `huggingFaceAPI` model (e.g., instruction-LM for grading).
       - If still failing: use local scorer (keyword/rubric-based; length normalization; simple semantic matches) to produce `ai_score` and short `rationale`.
    4. Aggregate to `cbt_grades.totalScore` + `subScores`.
    5. Persist `ai_score`, `rationale` on each response; upsert `cbt_grades`.
- Reliability:
  - Timeouts per provider, exponential backoff, circuit-breaker counters.
  - Confidence thresholds; if below threshold, flag item for manual review.

## Local Scorer (No External AI)
- New service: `examLocalScorer.ts` (pure TypeScript).
  - Inputs: `stem`, `rubric`, `studentAnswer`.
  - Scoring: keyword coverage, rubric criteria weights, penalty for irrelevance/repetition; length-normalized.
  - Output: score [0..item.max], `rationale` with matched criteria.

## Auto-Record to Results
- Mapping: `exam.subjectId`, `class`, `session`, `term` → `scores` table.
- After grading, push totals:
  - Create or upsert `Score` records for each student (`services/api.ts` → `batchUpsert('scores', ...)`).
  - Include CA/exam components if configured (e.g., `includeInCA` weights).

## Frontend Changes
- Teacher
  - Extend `ItemBank` for add/edit and bulk upload; show rubric fields.
  - Extend `ExamBuilder` to bind subject/class/session/term.
  - New `ExamResults` view: run marking, monitor progress, review AI rationales, override scores, push to results.
- Student
  - `ExamPlayer` view: attempt UI; submission confirmation.

## Permissions & Tenancy
- Only Teachers/Admins can create items/exams and trigger marking.
- Students can only attempt assigned exams.
- All queries and inserts filtered by `tenant_id`.

## APIs (Cloudflare Pages Functions)
- `POST /api/cbt/items` (exists) — add theory/objective items with rubrics.
- `POST /api/cbt/exams` (exists) — create exams; add subject/session/term metadata.
- `POST /api/cbt/mark-session` — scoring pipeline and persistence.
- `POST /api/cbt/record-scores` — push graded totals to `scores` table.

## Fallback Strategy Details
- Gemini attempt: 5–8s timeout, deterministic rubric prompt, expected JSON `{score, rationale, confidence}`.
- HuggingFace attempt: 5–8s timeout, same schema; choose reliable instruction-tuned model (e.g., `tiiuae/falcon-7b-instruct` or similar).
- Local scorer: always succeeds; bounded runtime; produces reasonable rubric-based scores.
- Provider selection metrics stored in `cbt_responses.metadata` for audit.

## Testing & QA
- Unit tests for objective scoring, rubric weighting, provider fallback.
- E2E on marking function with varied answer lengths.
- Manual checks: boundary cases, timeouts, invalid inputs.

## Acceptance Criteria
- Teachers upload items/exams (objective + theory).
- Students submit; `mark-session` assigns scores to all items.
- Scores auto-recorded into the `scores` table with correct subject/class mapping.
- Fallback chain reliably marks theory items when providers fail; rationales stored.
- Role/tenant isolation enforced throughout.

## Rollout
- Phase 1: objective scoring + manual theory scoring preview (for validation).
- Phase 2: enable full AI marking chain and auto-recording.
- Phase 3: add proctoring signals and advanced rubric editors.