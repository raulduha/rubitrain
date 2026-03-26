-- Fix infinite recursion in RLS policies between teams <-> team_memberships
-- The cycle: subscriptions policy → teams → team_memberships → teams (loop)

-- Step 1: create a SECURITY DEFINER helper that bypasses RLS
create or replace function public.is_member_of_org(org_id uuid)
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1
    from public.team_memberships tm
    join public.teams t on t.id = tm.team_id
    where t.organization_id = org_id
      and tm.user_id = auth.uid()
  );
$$;

-- Step 2: drop the recursive policy on teams
drop policy if exists "teams: miembros pueden ver" on public.teams;

-- Re-create it using the security definer function (no direct query to team_memberships)
create policy "teams: miembros pueden ver" on public.teams
  for select using (
    public.is_member_of_org(teams.organization_id)
  );

-- Step 3: drop the subscriptions policy that caused the chain
drop policy if exists "subscriptions: miembro ve plan del club" on public.subscriptions;

-- Re-create it using the same helper
create policy "subscriptions: miembro ve plan del club" on public.subscriptions
  for select using (
    billing_type = 'organization'
    and public.is_member_of_org(subscriptions.organization_id)
  );
