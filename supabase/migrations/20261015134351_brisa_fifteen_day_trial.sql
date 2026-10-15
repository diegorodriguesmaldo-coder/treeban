-- Every account gets the same 15-day trial. Existing accounts start at rollout.
alter table public.profiles
  add column trial_started_at timestamptz not null default now(),
  add column trial_ends_at timestamptz not null default (now() + interval '15 days');

-- Profile UPDATE grants remain limited to name/color. Clients cannot extend a trial.
create function public.get_trial_status()
returns table(started_at timestamptz,ends_at timestamptz,server_time timestamptz,is_active boolean,days_remaining integer)
language sql stable security invoker set search_path = '' as $$
  select p.trial_started_at,p.trial_ends_at,now(),p.trial_ends_at>now(),
    greatest(0,ceil(extract(epoch from (p.trial_ends_at-now()))/86400))::integer
  from public.profiles p where p.id=(select auth.uid());
$$;
revoke all on function public.get_trial_status() from public,anon;
grant execute on function public.get_trial_status() to authenticated;

drop policy workspaces_read_member on public.workspaces;
create policy workspaces_read_member on public.workspaces for select to authenticated
using (
  (select exists(select 1 from public.profiles p where p.id=(select auth.uid()) and p.trial_ends_at>now()))
  and exists(select 1 from public.workspace_members m where m.workspace_id=workspaces.id and m.user_id=(select auth.uid()))
);

drop policy workspaces_update_member on public.workspaces;
create policy workspaces_update_member on public.workspaces for update to authenticated
using (
  (select exists(select 1 from public.profiles p where p.id=(select auth.uid()) and p.trial_ends_at>now()))
  and exists(select 1 from public.workspace_members m where m.workspace_id=workspaces.id and m.user_id=(select auth.uid()))
)
with check (
  (select exists(select 1 from public.profiles p where p.id=(select auth.uid()) and p.trial_ends_at>now()))
  and exists(select 1 from public.workspace_members m where m.workspace_id=workspaces.id and m.user_id=(select auth.uid()))
);
