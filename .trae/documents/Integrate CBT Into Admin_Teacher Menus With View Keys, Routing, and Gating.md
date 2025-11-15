## View Keys
- Add Admin view keys in `utils/constants.ts`: `CBT_ITEMS: 'cbt-items'`, `CBT_EXAMS: 'cbt-exams'`, `CBT_RESULTS: 'cbt-results'`.
- Add Teacher view keys in `utils/constants.ts`: same three keys aligned to teacher views.
- Optional feature flags in `CONTROLLABLE_FEATURES`: `cbt` (and sub-features `cbt_items`, `cbt_exams`, `cbt_results`) for role-based gating.

## Menus
- Admin (Academics section): update `components/Sidebar.tsx` to include items:
  - “CBT Items” → `ADMIN_VIEWS.CBT_ITEMS`
  - “CBT Exams” → `ADMIN_VIEWS.CBT_EXAMS`
  - “CBT Exam Results” → `ADMIN_VIEWS.CBT_RESULTS`
- Teacher (Teaching section): update `components/TeacherSidebar.tsx` similarly with teacher view keys.
- Keep existing pattern: clicking menu updates `view` in Dashboard URL search params.

## Routing and Rendering
- Admin content: `components/DashboardContent.tsx`
  - Switch cases for new view keys:
    - `CBT_ITEMS` → render `components/cbt/ItemBank`
    - `CBT_EXAMS` → render `components/cbt/ExamBuilder`
    - `CBT_RESULTS` → render `components/cbt/ExamResults` (lists `cbt_grades` with filters)
  - Use lazy imports consistent with current codebase.
- Teacher content: `components/TeacherDashboardContent.tsx` mirror the same mapping to CBT components.
- Keep `/cbt/*` route for direct navigation; internal dashboard uses view keys, not path changes.

## Gating
- Role gating: Admin/Teacher only (no Student menu entries).
- Feature gating: use `utils/featureAccess.isFeatureEnabledForRole(settings, 'cbt', role)` (and sub-feature checks if added) to conditionally render content and/or menu items.
- Tenant isolation: rely on Supabase RLS and endpoint auth; components call `/api/cbt/*` already tenant-aware via token.

## Exam Results Component
- Implement `components/cbt/ExamResults.tsx`:
  - Filters: `exam`, `class`, `date range` (optional)
  - Data: fetch `cbt_grades` joined with sessions/exams; show `totalScore`, subscores, mastery.
  - Export CSV/PDF as needed; reuse existing export utilities.

## Verification
- Type-checks and smoke tests for menu navigation and content rendering.
- Confirm feature gating toggles in platform settings hide/show CBT views appropriately.

## Next Steps
- After approval, add view keys, update sidebars and dashboard content switches, wire CBT components, and create `ExamResults` component.