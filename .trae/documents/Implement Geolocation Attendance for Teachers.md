## Goal
- Allow teachers to mark their own attendance only when physically inside school premises.
- Use browser geolocation with geofence validation; store location and audit data.

## Key Decisions
- Identity: Use existing Supabase session (teacher profile) from `contexts/AuthContext.tsx`.
- Geofence v1: Circular radius around one or more school site centers; optional polygons in v2.
- Storage: New `teacher_attendance` table in Supabase; keep student attendance untouched.
- UX: Single-button flow with live location capture, accuracy display, and clear pass/fail messaging.

## Data Model & API
- New table `teacher_attendance` (Supabase):
  - `id`, `tenant_id`, `teacher_id`, `timestamp`, `status` (`present`/`absent`), `lat`, `lng`, `accuracy_m`, `method` (`geofence`), `user_agent`, `notes`, `created_at`.
- Types:
  - Add `Geofence` type (`{ type: 'circle' | 'polygon'; center?: {lat,lng}; radius_m?: number; polygon?: Array<{lat,lng}> }`).
  - Add `TeacherAttendanceRecord` type.
- API (`services/api.ts`):
  - `apiSaveTeacherAttendance(record)` to insert.
  - `apiGetTeacherAttendance({ teacherId, from, to })` for history/reporting.

## Geofence Configuration
- Tenant settings (`types/school.ts`, loaded via `contexts/TenantContext.tsx`):
  - `premisesGeofences: Geofence[]` and `geofenceRules`: `{ minAccuracy_m: number; graceRadius_m: number }`.
- Admin UI (extend `components/IntegrationSettings.tsx` or new settings panel):
  - Configure one or more site centers and radius; optional map preview later (uses stored Google Maps API key when enabled).

## Frontend Flow (Teacher)
- Route: `/teacher/attendance` or a card on dashboard.
- Component: `components/TeacherAttendance.tsx` (new) using auth tenant and geofence settings.
- Flow:
  - Show "Mark my attendance" button.
  - On click: capture location; validate against geofences; show status with accuracy.
  - If inside: enable "Confirm present"; save via API; log audit fields.
  - If outside or accuracy too low: present clear error and guidance.

## Location Capture & Validation
- New hook `hooks/useGeolocationFence.ts`:
  - `getCurrentLocation({ timeout, maxAge })` using `navigator.geolocation.getCurrentPosition`.
  - Compute distance using Haversine; polygon check (v2) via point-in-polygon utility.
  - `isInsideGeofence(location, geofences, rules)` returns pass/fail and nearest site info.
  - Provide accuracy handling and retry suggestions.
- UX details:
  - Display `accuracy_m`, timestamp, nearest site name/distance.
  - Retry and "Improve accuracy" tips (enable GPS/Wi‑Fi, step outside, wait a few seconds).

## Security & Anti‑Spoofing
- Require HTTPS secure context; block if insecure.
- Minimum accuracy threshold (e.g., `<= 70m`) and max distance (`<= radius + grace`).
- Double capture: take two readings over ~3–5s and require both inside.
- Optionally combine with QR (existing QR signing/verify) for stronger assurance.
- Store `user_agent` and IP (server-side) for audit; avoid fingerprinting beyond this.

## Offline & Reliability
- If network offline: cache a pending attendance in `localStorage`/IndexedDB with location + timestamp; background sync when online.
- Guard rails: debounce submissions, idempotency (one present per day per teacher).
- Error handling and clear messaging for permission denied, timeout, or GPS unavailable.

## Admin & Reporting
- Admin view to list teacher attendance with filters (date range, site).
- Dashboard widget: Today’s teacher attendance percentage (similar to `components/SchoolVitals.tsx`).
- Export CSV from `apiGetTeacherAttendance`.

## Testing
- Unit tests: Haversine distance, geofence inclusion, accuracy thresholds.
- Integration tests: Mock geolocation API, validate UI flow, API insert.
- Edge cases: Permission denied, high inaccuracy, multiple sites, DST/timezone.

## Files to Touch
- `types.ts`: Add `TeacherAttendanceRecord` and `Geofence`.
- `types/school.ts`: Add `premisesGeofences` and `geofenceRules` to tenant settings.
- `services/api.ts`: Add `apiSaveTeacherAttendance`, `apiGetTeacherAttendance`.
- `contexts/TenantContext.tsx`: Expose new settings.
- `components/TeacherAttendance.tsx`: New component.
- `hooks/useGeolocationFence.ts`: New hook.
- `components/IntegrationSettings.tsx`: Extend with geofence config UI.
- `App.tsx`: Add route and nav entry (feature‑flagged).

## Rollout & Flags
- Feature flag in `PlanFeaturesContext` (e.g., `teacher_geofence_attendance`).
- Gradual enable per tenant; default off until geofences configured.

## Milestones
1) Data/types + geofence hook and simple UI with single site center.
2) API insert + dashboard widget; basic admin listing.
3) Multiple sites + double capture; offline queue.
4) Optional polygon geofences + map preview using stored Google Maps key.