create table if not exists public.monitoring_consent (
  id uuid default gen_random_uuid() primary key,
  tenant_id text,
  teacher_id text,
  class_name text,
  consent boolean default false,
  updated_at timestamptz default now()
);
create index if not exists idx_monitoring_consent_teacher on public.monitoring_consent(teacher_id);
create index if not exists idx_monitoring_consent_tenant on public.monitoring_consent(tenant_id);
alter table public.monitoring_consent enable row level security;