-- supabase/migrations/20251027_backups_and_security.sql

create table if not exists public.backup_records (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  tenant_id text null,
  scope text not null default 'platform',
  type text not null default 'database',
  storage_path text not null,
  size_bytes bigint null,
  status text not null default 'completed',
  meta jsonb null
);

create index if not exists backup_records_created_at_idx on public.backup_records (created_at desc);

create table if not exists public.security_findings (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  category text not null,
  severity text not null,
  message text not null,
  details jsonb null
);

create index if not exists security_findings_created_at_idx on public.security_findings (created_at desc);

-- Create private storage bucket for backups (no public read)
-- This will no-op if bucket already exists
select storage.create_bucket('backups', public := false);