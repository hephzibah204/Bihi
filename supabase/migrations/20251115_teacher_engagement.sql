create table if not exists public.teacher_ratings (
  id uuid primary key default gen_random_uuid(),
  teacher_id text not null,
  tenant_id text,
  score integer not null,
  attendance integer default 0,
  assignments integer default 0,
  grading integer default 0,
  bonus integer default 0,
  live_monitoring_usage integer default 0,
  lesson_planning_timeliness integer default 0,
  exam_marking_turnaround integer default 0,
  created_at timestamptz not null default now()
);

create index if not exists idx_teacher_ratings_teacher_created on public.teacher_ratings(teacher_id, created_at);

create table if not exists public.idle_class_alerts (
  id uuid primary key default gen_random_uuid(),
  class_name text not null,
  tenant_id text,
  reason text,
  teacher_id text,
  status text default 'new',
  created_at timestamptz not null default now()
);

create index if not exists idx_idle_class_alerts_class_created on public.idle_class_alerts(class_name, created_at);

create table if not exists public.teacher_announcements (
  id uuid primary key default gen_random_uuid(),
  teacher_id text not null,
  tenant_id text,
  type text default 'active_teacher',
  message text,
  created_at timestamptz not null default now()
);

create index if not exists idx_teacher_announcements_teacher_created on public.teacher_announcements(teacher_id, created_at);

alter table public.assignment_scores
  add column if not exists submitted_at timestamptz,
  add column if not exists graded_at timestamptz,
  add column if not exists created_at timestamptz default now(),
  add column if not exists updated_at timestamptz default now();
