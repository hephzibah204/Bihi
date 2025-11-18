create table if not exists ai_documents (
  id uuid default gen_random_uuid() primary key,
  tenant_id text not null,
  content text,
  created_at timestamp with time zone default now()
);
create index if not exists idx_ai_documents_tenant on ai_documents(tenant_id);
alter table ai_documents enable row level security;
create policy ai_documents_tenant_isolation on ai_documents for all using (tenant_id = current_setting('app.tenant_id', true));
create or replace function match_documents(p_tenant_id text, p_query text, p_top_k integer)
returns table(content text) language sql stable as $$
  select content from ai_documents where tenant_id = p_tenant_id and content ilike '%'||p_query||'%' limit p_top_k;
$$;