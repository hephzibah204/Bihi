## Goals
- Allow Admins to listen to live lessons and watch recordings from a phone.
- Enable Teachers to broadcast classroom audio (optionally video) with minimal friction.
- Respect tenant isolation and role-based access.

## Current State
- Local media capture exists: mic and camera via `getUserMedia` in `components/LiveTutor.tsx:31`, `components/Attendance.tsx:231-236`, `components/FaceEnrollmentModal.tsx:45`.
- No WebRTC/SFU provider or HLS/recording pipeline.
- RBAC/feature gating utilities exist: `utils/featureAccess.ts:16-34`, `utils/constants.ts:148-235`, platform permissions in `utils/permissions.ts:4-16,20-40`.
- Backend: Cloudflare Pages Functions under `functions/api/*`, Supabase for data/auth.

## Scope
- Live audio monitoring (baseline), optional video later.
- Server-side token issuance and session registry.
- Recording and mobile-friendly playback.
- Admin-only monitor UI; Teacher “Go Live” control.

## Architecture
- Provider: Integrate LiveKit Cloud for publish/subscribe and server egress to recordings (audio-only first; video-ready later).
- Signaling/Access: Cloudflare Function issues ephemeral JWT tokens per role (publisher vs subscriber).
- Storage: Supabase Storage bucket for finalized recordings and metadata (or LiveKit-hosted HLS URLs).
- Registry: Supabase tables track class sessions, status, and recording URLs.

## Data Model
- Table `class_sessions`: `id`, `tenant_id`, `teacher_id`, `class_name`, `room_name`, `status('live'|'ended')`, `started_at`, `ended_at`, `recording_urls(json)`, `is_audio_only(boolean)`.
- Table `session_participants` (optional): `session_id`, `user_id`, `role('publisher'|'subscriber')`, `joined_at`, `left_at`.

## Backend APIs (Cloudflare Pages Functions)
- `POST /api/monitoring/start-session` → create `class_sessions`, return `room_name`.
- `POST /api/monitoring/end-session` → mark session ended; finalize recording references.
- `GET /api/monitoring/live` → list live sessions for tenant.
- `GET /api/monitoring/recordings` → list recordings for tenant.
- `POST /api/monitoring/rtc-token` → issue LiveKit access token with role: Teacher→publisher; Admin→subscriber.
- RBAC guards use platform role keys and tenant checks (pattern aligns with `functions/api/*` and auth helpers).

## Live Streaming (Audio-first)
- Teacher UI adds “Go Live” toggle:
  - Reuse mic capture patterns from `components/LiveTutor.tsx:24-33,55-63`.
  - On start: call `start-session`, get `room_name`, request token, publish mic track via LiveKit client.
  - On stop: unpublish, call `end-session`.
- Admin Monitor UI:
  - List live sessions via `GET /api/monitoring/live`.
  - Tap to join: request subscriber token, play audio track (listen-only).
- Reliability:
  - Secure-context checks (pattern like `components/Attendance.tsx:230-236`).
  - Device selection and errors handled similarly to `LiveTutor`.

## Recording & Playback
- Primary: LiveKit Egress to HLS or MP4 (audio-only to begin). Store URLs in `recording_urls`.
- Fallback (no provider egress): Client-side `MediaRecorder` on Teacher mic to `audio/webm`, upload to Supabase Storage (`services/api.ts:182-206` shows storage usage pattern). Attach to session.
- Playback:
  - If HLS: use `hls.js` player; otherwise HTML5 `<audio>`.
  - Mobile-friendly page lists recordings by class and date.

## Frontend UI
- New Components:
  - `TeacherLiveControl` on Teacher dashboard: Go Live/Stop; status feedback.
  - `AdminMonitorView` (mobile-first): Live sessions list, join to listen, basic controls.
  - `AdminRecordingPlayer`: list recordings, play audio/HLS.
- Routing: add entries under Teacher/Admin views consistent with `utils/constants.ts:68-100,16-66`.
- Feature Flag: add `classroom-monitoring` to `CONTROLLABLE_FEATURES` and gate with `isFeatureEnabledForRole` (`utils/featureAccess.ts:16-34`).

## Permissions & Security
- Only `Admin`/`Super Admin` can monitor; `Teacher` can publish.
- Token TTL short; room scoped per session; tenant-bound room names.
- Audit logs on session start/stop and monitor joins.
- Consent banner for teachers before publishing.

## Mobile Support
- Ensure pages use existing mobile nav (`AdminBottomNavBar.tsx`, Teacher equivalents).
- PWA-friendly: keep audio playback controls simple; defer background audio until needed.

## Rollout & Testing
- Staging with audio-only; simulate provider with local mock room if needed.
- Unit tests: RBAC gating, API responses, session registry.
- Manual QA on iOS Safari and Android Chrome for mic permission and playback.

## Acceptance Criteria
- Teacher can start/stop a live audio session; status updates reflected in Admin Monitor.
- Admin can listen live from phone; latency acceptable (<1s typical with SFU).
- Session recorded and appears in recordings list; playback works on mobile.
- Access restricted to correct roles and tenant; no data leakage.

## Notes & References
- Mic capture and secure-context patterns: `components/LiveTutor.tsx:31`, `components/Attendance.tsx:231-236`.
- Feature gating utilities: `utils/featureAccess.ts:16-34`, features list `utils/constants.ts:148-235`.
- Platform permissions: `utils/permissions.ts:4-16,20-40`.
- Auth/tenant context: `contexts/AuthContext.tsx:47-66,132-179,266-286`.
