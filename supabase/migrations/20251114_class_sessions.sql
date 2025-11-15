create table if not exists public.class_sessions (
  id uuid default gen_random_uuid() primary key,
  tenant_id text,
  teacher_id text,
  class_name text not null,
  room_name text not null,
  status text not null check (status in ('live','ended')),
  is_audio_only boolean default true,
  recording_urls jsonb default '[]'::jsonb,
  started_at timestamptz default now(),
  ended_at timestamptz
);

create index if not exists idx_class_sessions_status on public.class_sessions(status);
create index if not exists idx_class_sessions_tenant on public.class_sessions(tenant_id);

alter table public.class_sessions enable row level security;
drop policy if exists class_sessions_tenant_isolation on public.class_sessions;
create policy class_sessions_tenant_isolation on public.class_sessions
as permissive
for select
to authenticated
using (tenant_id is not null);
