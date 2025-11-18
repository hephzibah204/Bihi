create table if not exists ai_tool_cache (
  id uuid default gen_random_uuid() primary key,
  tenant_id text not null,
  name text not null,
  args_json text not null,
  result_json text not null,
  created_at timestamptz default now()
);
create index if not exists idx_ai_tool_cache_tenant on ai_tool_cache(tenant_id);
alter table ai_tool_cache enable row level security;
create policy ai_tool_cache_tenant_isolation on ai_tool_cache for all using (tenant_id = current_setting('app.tenant_id', true));
create unique index if not exists uniq_ai_tool_cache on ai_tool_cache(tenant_id, name, args_json);
create or replace function get_tool_cache(p_tenant_id text, p_name text, p_args text)
returns table(result_json text) language sql stable as $$
  select result_json from ai_tool_cache where tenant_id = p_tenant_id and name = p_name and args_json = p_args;
$$;
create or replace function upsert_tool_cache(p_tenant_id text, p_name text, p_args text, p_result_json text)
returns void language sql as $$
begin
  insert into ai_tool_cache(tenant_id, name, args_json, result_json) values(p_tenant_id, p_name, p_args, p_result_json)
  on conflict (tenant_id, name, args_json) do update set result_json = excluded.result_json, created_at = now();
end;$$;
