create or replace function list_tool_cache(p_tenant_id text, p_limit integer)
returns table(id uuid, name text, args_json text, result_json text, created_at timestamptz) language sql stable as $$
  select id, name, args_json, result_json, created_at from ai_tool_cache where tenant_id = p_tenant_id order by created_at desc limit p_limit;
$$;
create or replace function clear_tool_cache(p_tenant_id text, p_name text default null)
returns void language plpgsql as $$
begin
  if p_name is null then
    delete from ai_tool_cache where tenant_id = p_tenant_id;
  else
    delete from ai_tool_cache where tenant_id = p_tenant_id and name = p_name;
  end if;
end;$$;