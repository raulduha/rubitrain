-- ============================================================
-- CDUC Rugby — Funciones y Triggers
-- ============================================================

-- ─── 1. TRIGGER: crear profile al registrarse ────────────────
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.email),
    coalesce(new.raw_user_meta_data->>'role', 'player')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ─── 2. TRIGGER: actualizar updated_at automáticamente ───────
create or replace function public.update_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
  before update on public.profiles
  for each row execute procedure public.update_updated_at();

drop trigger if exists set_subscriptions_updated_at on public.subscriptions;
create trigger set_subscriptions_updated_at
  before update on public.subscriptions
  for each row execute procedure public.update_updated_at();

-- ─── 3. FUNCIÓN: contar jugadores activos de una org ─────────
create or replace function public.count_active_players(p_org_id uuid)
returns int
language sql
security definer
as $$
  select count(distinct tm.user_id)::int
  from public.team_memberships tm
  join public.teams t on t.id = tm.team_id
  where t.organization_id = p_org_id
    and tm.role = 'player'
    and tm.is_active = true;
$$;

-- ─── 4. FUNCIÓN: aceptar invitación ──────────────────────────
create or replace function public.accept_invitation(
  p_token   text,
  p_user_id uuid
)
returns jsonb
language plpgsql
security definer set search_path = public
as $$
declare
  v_inv public.invitations%rowtype;
begin
  -- Buscar invitación válida
  select * into v_inv
  from public.invitations
  where token = p_token
    and status = 'pending'
    and expires_at > now();

  if not found then
    return jsonb_build_object('success', false, 'error', 'Invitación inválida o expirada');
  end if;

  -- Crear membership
  insert into public.team_memberships (team_id, user_id, role)
  values (v_inv.team_id, p_user_id, v_inv.role)
  on conflict (team_id, user_id) do nothing;

  -- Marcar invitación como aceptada
  update public.invitations
  set status = 'accepted'
  where id = v_inv.id;

  return jsonb_build_object('success', true, 'team_id', v_inv.team_id, 'role', v_inv.role);
end;
$$;

-- ─── 5. FUNCIÓN: get_effective_plan ──────────────────────────
-- Retorna el plan efectivo del usuario:
-- Primero busca si pertenece a una org con plan de club activo.
-- Si no, retorna su plan personal. Por defecto 'free'.
create or replace function public.get_effective_plan(p_user_id uuid)
returns text
language plpgsql
security definer set search_path = public
as $$
declare
  v_plan text;
begin
  -- Paso 1: ¿El usuario pertenece a una org con plan de club activo?
  select s.plan into v_plan
  from public.subscriptions s
  where s.billing_type = 'organization'
    and s.status = 'active'
    and s.organization_id in (
      select t.organization_id
      from public.team_memberships tm
      join public.teams t on t.id = tm.team_id
      where tm.user_id = p_user_id
        and tm.is_active = true
    )
  limit 1;

  if found then
    return coalesce(v_plan, 'free');
  end if;

  -- Paso 2: ¿El usuario tiene suscripción personal activa?
  select plan into v_plan
  from public.subscriptions
  where payer_id = p_user_id
    and billing_type = 'personal'
    and status = 'active'
  limit 1;

  return coalesce(v_plan, 'free');
end;
$$;

-- ─── 6. FUNCIÓN: actualizar contador de jugadores ────────────
create or replace function public.refresh_player_count(p_org_id uuid)
returns void
language plpgsql
security definer set search_path = public
as $$
begin
  update public.subscriptions
  set active_players_count = public.count_active_players(p_org_id)
  where organization_id = p_org_id
     or payer_id in (
       select owner_id from public.organizations where id = p_org_id
     );
end;
$$;
