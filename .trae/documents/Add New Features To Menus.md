## Changes
- Admin menu: add “Classroom Monitoring” under Tools.
- Teacher menu: add “Classroom Monitoring” under Teaching & AI.
- Keep mobile bottom nav unchanged for now to avoid overcrowding; sidebars are primary menus.

## Implementation
- Update `components/Sidebar.tsx` items to include `ADMIN_VIEWS.CLASSROOM_MONITORING` with a headset icon.
- Update `components/TeacherSidebar.tsx` items to include `TEACHER_VIEWS.CLASSROOM_MONITORING` with a headset icon.
- Leverage existing feature gating; disabled state will reflect school settings.

## Outcome
- Both Admin and Teacher dashboards display Classroom Monitoring in their menus, aligned with newly added views and feature flags.

## Next
- If you want CBT (Items/Exams/Exam Results) menu entries surfaced next, I will add view keys and routing to the existing `components/cbt/*` pages and insert them into the Academics/Teaching sections.