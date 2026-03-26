-- ============================================================
-- CDUC Rugby — Row Level Security
-- ============================================================

-- Habilitar RLS en todas las tablas
alter table public.profiles              enable row level security;
alter table public.organizations         enable row level security;
alter table public.teams                 enable row level security;
alter table public.team_memberships      enable row level security;
alter table public.invitations           enable row level security;
alter table public.training_sessions     enable row level security;
alter table public.session_exercises     enable row level security;
alter table public.performance_logs      enable row level security;
alter table public.match_metrics         enable row level security;
alter table public.physical_status       enable row level security;
alter table public.media_files           enable row level security;
alter table public.subscriptions         enable row level security;
alter table public.webpay_pending_payments enable row level security;

-- ─── PROFILES ────────────────────────────────────────────────
-- Un usuario puede ver su propio perfil
create policy "profiles: ver propio" on public.profiles
  for select using (auth.uid() = id);

-- Un usuario puede ver perfiles de miembros de sus equipos
create policy "profiles: ver miembros del equipo" on public.profiles
  for select using (
    exists (
      select 1 from public.team_memberships tm1
      join public.team_memberships tm2 on tm1.team_id = tm2.team_id
      where tm1.user_id = auth.uid() and tm2.user_id = profiles.id
    )
  );

-- Un usuario puede actualizar solo su propio perfil
create policy "profiles: actualizar propio" on public.profiles
  for update using (auth.uid() = id);

-- ─── ORGANIZATIONS ───────────────────────────────────────────
-- Owner puede ver y gestionar su organización
create policy "organizations: owner full access" on public.organizations
  for all using (owner_id = auth.uid());

-- Miembros de equipos de la org pueden ver la org
create policy "organizations: miembros pueden ver" on public.organizations
  for select using (
    exists (
      select 1 from public.teams t
      join public.team_memberships tm on tm.team_id = t.id
      where t.organization_id = organizations.id and tm.user_id = auth.uid()
    )
  );

-- ─── TEAMS ───────────────────────────────────────────────────
-- Owner de org puede gestionar equipos
create policy "teams: owner full access" on public.teams
  for all using (
    exists (
      select 1 from public.organizations o
      where o.id = teams.organization_id and o.owner_id = auth.uid()
    )
  );

-- Miembros pueden ver sus equipos
create policy "teams: miembros pueden ver" on public.teams
  for select using (
    exists (
      select 1 from public.team_memberships tm
      where tm.team_id = teams.id and tm.user_id = auth.uid()
    )
  );

-- ─── TEAM MEMBERSHIPS ────────────────────────────────────────
-- Cada usuario puede ver sus propias membresías
create policy "memberships: ver propias" on public.team_memberships
  for select using (user_id = auth.uid());

-- Owner y coaches del mismo equipo pueden ver todos los miembros
create policy "memberships: coaches y owner ven todo" on public.team_memberships
  for select using (
    exists (
      select 1 from public.team_memberships tm
      join public.profiles p on p.id = tm.user_id
      where tm.team_id = team_memberships.team_id
        and tm.user_id = auth.uid()
        and (tm.role = 'coach' or p.role in ('physical_trainer'))
    )
    or
    exists (
      select 1 from public.organizations o
      join public.teams t on t.organization_id = o.id
      where t.id = team_memberships.team_id and o.owner_id = auth.uid()
    )
  );

-- Solo owner y coaches pueden crear/editar membresías
create policy "memberships: coaches y owner pueden gestionar" on public.team_memberships
  for insert with check (
    exists (
      select 1 from public.organizations o
      join public.teams t on t.organization_id = o.id
      where t.id = team_memberships.team_id and o.owner_id = auth.uid()
    )
  );

create policy "memberships: coaches y owner pueden actualizar" on public.team_memberships
  for update using (
    exists (
      select 1 from public.organizations o
      join public.teams t on t.organization_id = o.id
      where t.id = team_memberships.team_id and o.owner_id = auth.uid()
    )
  );

create policy "memberships: owner puede eliminar" on public.team_memberships
  for delete using (
    exists (
      select 1 from public.organizations o
      join public.teams t on t.organization_id = o.id
      where t.id = team_memberships.team_id and o.owner_id = auth.uid()
    )
  );

-- ─── INVITATIONS ─────────────────────────────────────────────
create policy "invitations: invited_by puede ver" on public.invitations
  for select using (invited_by = auth.uid());

create policy "invitations: owner puede ver todas" on public.invitations
  for select using (
    exists (
      select 1 from public.organizations o
      join public.teams t on t.organization_id = o.id
      where t.id = invitations.team_id and o.owner_id = auth.uid()
    )
  );

create policy "invitations: owner puede crear" on public.invitations
  for insert with check (
    exists (
      select 1 from public.organizations o
      join public.teams t on t.organization_id = o.id
      where t.id = invitations.team_id and o.owner_id = auth.uid()
    )
  );

-- ─── TRAINING SESSIONS ───────────────────────────────────────
create policy "sessions: miembros del equipo pueden ver" on public.training_sessions
  for select using (
    exists (
      select 1 from public.team_memberships tm
      where tm.team_id = training_sessions.team_id and tm.user_id = auth.uid()
    )
  );

create policy "sessions: owner y coaches pueden gestionar" on public.training_sessions
  for all using (
    exists (
      select 1 from public.organizations o
      join public.teams t on t.organization_id = o.id
      where t.id = training_sessions.team_id and o.owner_id = auth.uid()
    )
    or created_by = auth.uid()
  );

-- ─── SESSION EXERCISES ───────────────────────────────────────
create policy "exercises: acceso via sesión" on public.session_exercises
  for select using (
    exists (
      select 1 from public.training_sessions ts
      join public.team_memberships tm on tm.team_id = ts.team_id
      where ts.id = session_exercises.session_id and tm.user_id = auth.uid()
    )
  );

create policy "exercises: gestionar via sesión" on public.session_exercises
  for all using (
    exists (
      select 1 from public.training_sessions ts
      join public.organizations o on exists (
        select 1 from public.teams t
        where t.id = ts.team_id and t.organization_id = o.id
      )
      where ts.id = session_exercises.session_id and o.owner_id = auth.uid()
    )
  );

-- ─── PERFORMANCE LOGS ────────────────────────────────────────
create policy "perf_logs: jugador ve los propios" on public.performance_logs
  for select using (player_id = auth.uid());

create policy "perf_logs: coaches y owner ven del equipo" on public.performance_logs
  for select using (
    exists (
      select 1 from public.organizations o
      join public.teams t on t.organization_id = o.id
      where t.id = performance_logs.team_id and o.owner_id = auth.uid()
    )
  );

create policy "perf_logs: coaches y owner pueden insertar" on public.performance_logs
  for insert with check (
    exists (
      select 1 from public.organizations o
      join public.teams t on t.organization_id = o.id
      where t.id = performance_logs.team_id and o.owner_id = auth.uid()
    )
  );

-- ─── MATCH METRICS ───────────────────────────────────────────
create policy "match_metrics: jugador ve los propios" on public.match_metrics
  for select using (player_id = auth.uid());

create policy "match_metrics: owner ve del equipo" on public.match_metrics
  for select using (
    exists (
      select 1 from public.organizations o
      join public.teams t on t.organization_id = o.id
      where t.id = match_metrics.team_id and o.owner_id = auth.uid()
    )
  );

create policy "match_metrics: owner puede gestionar" on public.match_metrics
  for all using (
    exists (
      select 1 from public.organizations o
      join public.teams t on t.organization_id = o.id
      where t.id = match_metrics.team_id and o.owner_id = auth.uid()
    )
  );

-- ─── PHYSICAL STATUS ─────────────────────────────────────────
create policy "physical_status: jugador ve el propio" on public.physical_status
  for select using (player_id = auth.uid());

create policy "physical_status: owner ve del equipo" on public.physical_status
  for select using (
    exists (
      select 1 from public.organizations o
      join public.teams t on t.organization_id = o.id
      where t.id = physical_status.team_id and o.owner_id = auth.uid()
    )
  );

create policy "physical_status: owner puede gestionar" on public.physical_status
  for all using (
    exists (
      select 1 from public.organizations o
      join public.teams t on t.organization_id = o.id
      where t.id = physical_status.team_id and o.owner_id = auth.uid()
    )
  );

-- ─── MEDIA FILES ─────────────────────────────────────────────
create policy "media: miembros del equipo pueden ver" on public.media_files
  for select using (
    exists (
      select 1 from public.team_memberships tm
      where tm.team_id = media_files.team_id and tm.user_id = auth.uid()
    )
  );

create policy "media: owner puede gestionar" on public.media_files
  for all using (
    exists (
      select 1 from public.organizations o
      join public.teams t on t.organization_id = o.id
      where t.id = media_files.team_id and o.owner_id = auth.uid()
    )
  );

-- ─── SUBSCRIPTIONS ───────────────────────────────────────────
-- El payer ve su propia suscripción
create policy "subscriptions: payer ve la propia" on public.subscriptions
  for select using (payer_id = auth.uid());

-- Un usuario ve la suscripción del club si pertenece a esa org
create policy "subscriptions: miembro ve plan del club" on public.subscriptions
  for select using (
    billing_type = 'organization'
    and exists (
      select 1 from public.teams t
      join public.team_memberships tm on tm.team_id = t.id
      where t.organization_id = subscriptions.organization_id
        and tm.user_id = auth.uid()
    )
  );

-- Solo el payer puede modificar su suscripción (o service_role vía webhooks)
create policy "subscriptions: payer puede actualizar" on public.subscriptions
  for update using (payer_id = auth.uid());

create policy "subscriptions: payer puede insertar" on public.subscriptions
  for insert with check (payer_id = auth.uid());

-- ─── WEBPAY PENDING ──────────────────────────────────────────
-- Solo el service_role puede gestionar esta tabla (webhooks backend)
-- No crear políticas para usuarios normales
