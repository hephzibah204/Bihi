create table if not exists ai_embeddings_1k (
  id uuid default gen_random_uuid() primary key,
  tenant_id text not null,
  doc_id text not null,
  content text,
  embedding vector(1024),
  created_at timestamp with time zone default now()
);
create index if not exists idx_ai_embeddings_1k_tenant on ai_embeddings_1k(tenant_id);
alter table ai_embeddings_1k enable row level security;
create policy ai_embeddings_1k_tenant_isolation on ai_embeddings_1k for all using (tenant_id = current_setting('app.tenant_id', true));
create or replace function upsert_ai_embedding_1k(p_tenant_id text, p_doc_id text, p_content text, p_embedding double precision[])
returns void language plpgsql as $$
begin
  insert into ai_embeddings_1k(tenant_id, doc_id, content, embedding)
  values(p_tenant_id, p_doc_id, p_content, p_embedding::vector)
  on conflict (tenant_id, doc_id) do update set content = excluded.content, embedding = excluded.embedding;
end;$$;
create or replace function match_embeddings_1k(p_tenant_id text, p_query_embedding double precision[], p_top_k integer)
returns table(content text) language sql stable as $$
  select content from ai_embeddings_1k where tenant_id = p_tenant_id order by embedding <-> p_query_embedding::vector limit p_top_k;
$$;
