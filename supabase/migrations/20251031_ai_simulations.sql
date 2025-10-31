-- Enable UUID + vectors
create extension if not exists "pgcrypto";
create extension if not exists "vector";

-- Core table: PhET sims your AI can “see”
create table if not exists public.ai_simulations (
  id text primary key,                 -- phet sim id, e.g. "ohms-law"
  title text not null,
  subject text,                        -- physics, chemistry, etc.
  description text,
  keywords text[] default '{}',
  url text not null,                   -- embeddable HTML5 url
  image_url text,                      -- screenshot/thumbnail
  languages text[] default '{}',
  provider text default 'PhET',
  updated_at timestamptz default now()
);

-- Optional semantic search (pgvector)
create table if not exists public.ai_simulation_embeddings (
  id uuid primary key default gen_random_uuid(),
  sim_id text references public.ai_simulations(id) on delete cascade,
  content text not null,               -- concatenated title+desc+keywords
  embedding vector(1536)               -- adjust to your model dimension
);

-- Helpful indexes
create index if not exists idx_ai_sims_title on public.ai_simulations using gin (to_tsvector('simple', title));
create index if not exists idx_ai_sims_keywords on public.ai_simulations using gin (keywords);

-- (RLS) Let everyone read, only service role writes
alter table public.ai_simulations enable row level security;
create policy if not exists "read sims" on public.ai_simulations for select using (true);

alter table public.ai_simulation_embeddings enable row level security;
create policy if not exists "read sim embeddings" on public.ai_simulation_embeddings for select using (true);

-- Note: writes should be performed with service role via Edge Functions or server-side context.