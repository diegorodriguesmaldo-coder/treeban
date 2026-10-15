-- The Brisa workspace is shared by every registered user, with equal permissions.
-- The versioned document preserves board ordering and makes multi-entity moves atomic.
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 100),
  color text not null default '#c9d9ef' check (color ~ '^#[a-fA-F0-9]{6}$'),
  created_at timestamptz not null default now()
);

create table public.workspaces (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  document jsonb not null default '{}'::jsonb,
  revision bigint not null default 0 check (revision >= 0),
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id) on delete set null,
  constraint document_is_object check (jsonb_typeof(document) = 'object'),
  constraint document_size_limit check (octet_length(document::text) <= 8000000)
);

create table public.workspace_members (
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (workspace_id, user_id)
);
create index workspace_members_user_id_idx on public.workspace_members(user_id, workspace_id);
create index workspaces_updated_by_idx on public.workspaces(updated_by);

insert into public.workspaces (id,slug) values ('e08fdbd5-c9a1-4d42-9a74-f3d94868a274','brisa');

alter table public.profiles enable row level security;
alter table public.workspaces enable row level security;
alter table public.workspace_members enable row level security;
revoke all on public.profiles, public.workspaces, public.workspace_members from anon, authenticated;
grant select on public.profiles, public.workspaces, public.workspace_members to authenticated;
grant update(name,color) on public.profiles to authenticated;
grant update(document,revision,updated_at,updated_by) on public.workspaces to authenticated;

create policy members_read_self on public.workspace_members for select to authenticated
  using (user_id = (select auth.uid()));
create policy profiles_read_team on public.profiles for select to authenticated
  using (exists(select 1 from public.workspace_members m where m.workspace_id = 'e08fdbd5-c9a1-4d42-9a74-f3d94868a274' and m.user_id = (select auth.uid())));
create policy profiles_update_self on public.profiles for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));
create policy workspaces_read_member on public.workspaces for select to authenticated
  using (exists(select 1 from public.workspace_members m where m.workspace_id = workspaces.id and m.user_id = (select auth.uid())));
create policy workspaces_update_member on public.workspaces for update to authenticated
  using (exists(select 1 from public.workspace_members m where m.workspace_id = workspaces.id and m.user_id = (select auth.uid())))
  with check (exists(select 1 from public.workspace_members m where m.workspace_id = workspaces.id and m.user_id = (select auth.uid())));

-- This trigger is private and cannot be invoked through the Data API.
create function private.handle_new_user() returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if tg_table_schema <> 'auth' or tg_table_name <> 'users' or tg_op <> 'INSERT' then
    raise exception 'Invalid trigger context';
  end if;
  insert into public.profiles(id,name) values(new.id, left(coalesce(nullif(trim(new.raw_user_meta_data->>'name'),''),split_part(new.email,'@',1),'Nova pessoa'),100));
  insert into public.workspace_members(workspace_id,user_id) values('e08fdbd5-c9a1-4d42-9a74-f3d94868a274',new.id);
  return new;
end;
$$;
revoke all on function private.handle_new_user() from public, anon, authenticated;
create trigger on_auth_user_created after insert on auth.users for each row execute function private.handle_new_user();

-- Compare-and-swap prevents an older browser from overwriting a newer revision.
create function public.save_workspace_document(expected_revision bigint, next_document jsonb)
returns setof public.workspaces language plpgsql security invoker set search_path = '' as $$
begin
  if (select auth.uid()) is null then raise exception 'Authentication required' using errcode = '42501'; end if;
  if jsonb_typeof(next_document->'boards') <> 'array' or jsonb_array_length(next_document->'boards') < 1
    or next_document->>'version' <> '1' or jsonb_typeof(next_document->'labels') <> 'array'
    or jsonb_typeof(next_document->'members') <> 'array' or coalesce(next_document->>'workspace','') = '' then
    raise exception 'Invalid workspace document' using errcode = '22023';
  end if;
  return query update public.workspaces set document = next_document, revision = revision+1,
    updated_at = now(), updated_by = (select auth.uid())
    where id = 'e08fdbd5-c9a1-4d42-9a74-f3d94868a274' and revision = expected_revision returning *;
end;
$$;
revoke all on function public.save_workspace_document(bigint,jsonb) from public, anon;
grant execute on function public.save_workspace_document(bigint,jsonb) to authenticated;

-- Queryable relational projections. security_invoker preserves the base table's RLS.
create view public.boards with (security_invoker=true) as
  select w.id as workspace_id, b->>'id' as id,b->>'name' as name,b->>'description' as description,b as data
  from public.workspaces w cross join lateral jsonb_array_elements(w.document->'boards') b;
create view public.board_columns with (security_invoker=true) as
  select b.workspace_id,b.id as board_id,c->>'id' as id,c->>'name' as name,c as data
  from public.boards b cross join lateral jsonb_array_elements(b.data->'columns') c;
create view public.cards with (security_invoker=true) as
  select c.workspace_id,c.board_id,c.id as column_id,k->>'id' as id,k->>'title' as title,k->>'due' as due,k as data
  from public.board_columns c cross join lateral jsonb_array_elements(c.data->'cards') k;
create view public.checklist_items with (security_invoker=true) as
  select k.workspace_id,k.id as card_id,i->>'id' as id,i->>'text' as text,(i->>'done')::boolean as done
  from public.cards k cross join lateral jsonb_array_elements(k.data->'checklist') i;
create view public.card_comments with (security_invoker=true) as
  select k.workspace_id,k.id as card_id,i->>'id' as id,i->>'memberId' as member_id,i->>'text' as text,i->>'at' as created_at
  from public.cards k cross join lateral jsonb_array_elements(k.data->'comments') i;
create view public.card_attachments with (security_invoker=true) as
  select k.workspace_id,k.id as card_id,i->>'id' as id,i->>'name' as name,i->>'url' as url
  from public.cards k cross join lateral jsonb_array_elements(k.data->'attachments') i;
create view public.labels with (security_invoker=true) as
  select w.id as workspace_id,l->>'id' as id,l->>'name' as name,l->>'color' as color
  from public.workspaces w cross join lateral jsonb_array_elements(w.document->'labels') l;
grant select on public.boards,public.board_columns,public.cards,public.checklist_items,public.card_comments,public.card_attachments,public.labels to authenticated;
revoke all on public.boards,public.board_columns,public.cards,public.checklist_items,public.card_comments,public.card_attachments,public.labels from anon;

alter publication supabase_realtime add table public.workspaces, public.profiles;
