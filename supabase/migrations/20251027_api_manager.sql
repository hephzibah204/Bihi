-- supabase/migrations/20251027_api_manager.sql

create table if not exists public.api_keys (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  key text not null,
  environment text not null check (environment in ('production','development')),
  permissions jsonb not null default '[]'::jsonb,
  rate_limit integer not null default 1000,
  status text not null default 'active' check (status in ('active','revoked')),
  last_used timestamptz null,
  created_at timestamptz not null default now()
);
create index if not exists api_keys_created_at_idx on public.api_keys (created_at desc);

create table if not exists public.webhooks (
  id uuid primary key default gen_random_uuid(),
  url text not null,
  events text[] not null default '{}',
  status text not null default 'active' check (status in ('active','inactive')),
  last_triggered timestamptz null,
  created_at timestamptz not null default now()
);
create index if not exists webhooks_created_at_idx on public.webhooks (created_at desc);

create table if not exists public.webhook_logs (
  id uuid primary key default gen_random_uuid(),
  webhook_id uuid references public.webhooks(id) on delete cascade,
  event text not null,
  payload jsonb not null,
  status text not null,
  created_at timestamptz not null default now()
);
create index if not exists webhook_logs_created_at_idx on public.webhook_logs (created_at desc);