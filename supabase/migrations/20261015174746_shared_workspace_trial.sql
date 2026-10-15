-- A shared workspace has one trial, regardless of how many accounts join it.
create table public.workspace_trials (
  workspace_id uuid primary key references public.workspaces(id) on delete cascade,
  started_at timestamptz not null default now(),
  ends_at timestamptz not null default (now() + interval '15 days'),
  constraint workspace_trial_dates check (ends_at > started_at)
);

insert into public.workspace_trials (workspace_id, started_at, ends_at)
select w.id,
  coalesce(min(p.trial_started_at), now()),
  coalesce(min(p.trial_ends_at), now() + interval '15 days')
from public.workspaces w
left join public.workspace_members m on m.workspace_id = w.id
left join public.profiles p on p.id = m.user_id
group by w.id;

alter table public.workspace_trials enable row level security;
revoke all on public.workspace_trials from public, anon, authenticated;
grant select on public.workspace_trials to authenticated;
create policy workspace_trials_read_member on public.workspace_trials for select to authenticated
using (exists (
  select 1 from public.workspace_members m
  where m.workspace_id = workspace_trials.workspace_id and m.user_id = (select auth.uid())
));

create or replace function public.get_trial_status()
returns table(started_at timestamptz, ends_at timestamptz, server_time timestamptz, is_active boolean, days_remaining integer)
language sql stable security invoker set search_path = '' as $$
  select t.started_at, t.ends_at, now(), t.ends_at > now(),
    greatest(0, ceil(extract(epoch from (t.ends_at - now())) / 86400))::integer
  from public.workspace_trials t
  join public.workspace_members m on m.workspace_id = t.workspace_id
  where m.user_id = (select auth.uid());
$$;

drop policy workspaces_read_member on public.workspaces;
create policy workspaces_read_member on public.workspaces for select to authenticated
using (
  exists (select 1 from public.workspace_trials t where t.workspace_id = workspaces.id and t.ends_at > now())
  and exists (select 1 from public.workspace_members m where m.workspace_id = workspaces.id and m.user_id = (select auth.uid()))
);

drop policy workspaces_update_member on public.workspaces;
create policy workspaces_update_member on public.workspaces for update to authenticated
using (
  exists (select 1 from public.workspace_trials t where t.workspace_id = workspaces.id and t.ends_at > now())
  and exists (select 1 from public.workspace_members m where m.workspace_id = workspaces.id and m.user_id = (select auth.uid()))
)
with check (
  exists (select 1 from public.workspace_trials t where t.workspace_id = workspaces.id and t.ends_at > now())
  and exists (select 1 from public.workspace_members m where m.workspace_id = workspaces.id and m.user_id = (select auth.uid()))
);

alter table public.profiles drop column trial_started_at, drop column trial_ends_at;
alter publication supabase_realtime add table public.workspace_trials;
