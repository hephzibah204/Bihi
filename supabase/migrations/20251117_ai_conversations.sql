create table if not exists ai_conversations (
  id uuid default gen_random_uuid() primary key,
  tenant_id text not null,
  user_id text not null,
  title text,
  type text default 'text_chat',
  metadata jsonb default '{}'::jsonb,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  last_message_at timestamp with time zone default now()
);
create table if not exists ai_messages (
  id uuid default gen_random_uuid() primary key,
  tenant_id text not null,
  conversation_id uuid not null references ai_conversations(id) on delete cascade,
  role text not null,
  content text not null,
  source text,
  is_fallback boolean default false,
  metadata jsonb default '{}'::jsonb,
  created_at timestamp with time zone default now()
);
alter table ai_conversations enable row level security;
alter table ai_messages enable row level security;
create policy ai_conversations_tenant_isolation on ai_conversations for all using (tenant_id = current_setting('app.tenant_id', true));
create policy ai_messages_tenant_isolation on ai_messages for all using (tenant_id = current_setting('app.tenant_id', true));
create or replace function get_user_conversations(p_user_id text, p_limit integer, p_offset integer)
returns table(id uuid, user_id text, title text, type text, metadata jsonb, created_at timestamptz, updated_at timestamptz, last_message_at timestamptz, message_count bigint) language sql stable as $$
  select c.id, c.user_id, c.title, c.type, c.metadata, c.created_at, c.updated_at, c.last_message_at,
         (select count(*) from ai_messages m where m.conversation_id = c.id) as message_count
  from ai_conversations c
  where c.user_id = p_user_id and c.tenant_id = current_setting('app.tenant_id', true)
  order by c.last_message_at desc
  limit p_limit offset p_offset;
$$;
create or replace function get_conversation_messages(p_conversation_id uuid)
returns table(id uuid, conversation_id uuid, role text, content text, source text, is_fallback boolean, metadata jsonb, created_at timestamptz) language sql stable as $$
  select id, conversation_id, role, content, source, is_fallback, metadata, created_at
  from ai_messages where conversation_id = p_conversation_id and tenant_id = current_setting('app.tenant_id', true)
  order by created_at asc;
$$;
