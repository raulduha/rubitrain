-- ============================================================
-- CDUC Rugby — Schema inicial
-- Ejecutar en: Supabase Dashboard > SQL Editor
-- ============================================================

-- ─── 1. PROFILES ─────────────────────────────────────────────
create table if not exists public.profiles (
  id          uuid references auth.users on delete cascade primary key,
  full_name   text not null,
  avatar_url  text,
  role        text not null check (role in ('physical_trainer', 'coach', 'player')),
  phone       text,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

-- ─── 2. ORGANIZATIONS ────────────────────────────────────────
create table if not exists public.organizations (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  sport       text not null default 'rugby',
  logo_url    text,
  country     text default 'CL',
  owner_id    uuid references public.profiles(id) not null,
  created_at  timestamptz default now()
);

-- ─── 3. TEAMS ────────────────────────────────────────────────
create table if not exists public.teams (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete cascade,
  name            text not null,
  category        text,
  season          text,
  is_active       boolean default true,
  created_at      timestamptz default now()
);

-- ─── 4. TEAM MEMBERSHIPS ────────────────────────────────────
create table if not exists public.team_memberships (
  id              uuid primary key default gen_random_uuid(),
  team_id         uuid references public.teams(id) on delete cascade,
  user_id         uuid references public.profiles(id) on delete cascade,
  role            text not null check (role in ('coach', 'player')),
  jersey_number   int,
  position        text,
  position_group  text check (position_group in ('forward', 'back')),
  weight_kg       numeric,
  height_cm       numeric,
  birth_date      date,
  is_active       boolean default true,
  joined_at       timestamptz default now(),
  unique(team_id, user_id)
);

-- ─── 5. INVITATIONS ──────────────────────────────────────────
create table if not exists public.invitations (
  id          uuid primary key default gen_random_uuid(),
  team_id     uuid references public.teams(id) on delete cascade,
  invited_by  uuid references public.profiles(id),
  email       text not null,
  role        text not null check (role in ('coach', 'player')),
  token       text unique not null default gen_random_uuid()::text,
  status      text default 'pending' check (status in ('pending', 'accepted', 'rejected', 'expired')),
  expires_at  timestamptz default now() + interval '7 days',
  created_at  timestamptz default now()
);

-- ─── 6. TRAINING SESSIONS ────────────────────────────────────
create table if not exists public.training_sessions (
  id                uuid primary key default gen_random_uuid(),
  team_id           uuid references public.teams(id) on delete cascade,
  created_by        uuid references public.profiles(id),
  title             text not null,
  session_date      date not null,
  session_time      time,
  duration_minutes  int,
  session_type      text check (session_type in ('strength', 'speed', 'technical', 'recovery', 'match_prep')),
  notes             text,
  status            text default 'planned' check (status in ('planned', 'completed', 'cancelled')),
  created_at        timestamptz default now()
);

-- ─── 7. SESSION EXERCISES ────────────────────────────────────
create table if not exists public.session_exercises (
  id                uuid primary key default gen_random_uuid(),
  session_id        uuid references public.training_sessions(id) on delete cascade,
  exercise_name     text not null,
  exercise_category text,
  target_group      text check (target_group in ('all', 'forwards', 'backs')),
  sets              int,
  reps              int,
  distance_m        numeric,
  rest_seconds      int,
  intensity_label   text,
  order_index       int not null,
  notes             text,
  video_url         text
);

-- ─── 8. PERFORMANCE LOGS ─────────────────────────────────────
create table if not exists public.performance_logs (
  id                    uuid primary key default gen_random_uuid(),
  player_id             uuid references public.profiles(id),
  team_id               uuid references public.teams(id),
  session_id            uuid references public.training_sessions(id),
  log_date              date not null,
  squat_kg              numeric,
  deadlift_kg           numeric,
  bench_kg              numeric,
  power_clean_kg        numeric,
  custom_metric_name    text,
  custom_metric_value   numeric,
  tonnage_kg            numeric,
  notes                 text,
  created_by            uuid references public.profiles(id),
  created_at            timestamptz default now()
);

-- ─── 9. MATCH METRICS ────────────────────────────────────────
create table if not exists public.match_metrics (
  id                uuid primary key default gen_random_uuid(),
  player_id         uuid references public.profiles(id),
  team_id           uuid references public.teams(id),
  match_date        date not null,
  opponent          text,
  max_speed_kmh     numeric,
  total_distance_m  numeric,
  sprint_count      int,
  hsr_distance_m    numeric,
  status            text default 'optimal' check (status in ('optimal', 'fatigue', 'alert')),
  raw_data          jsonb,
  created_by        uuid references public.profiles(id),
  created_at        timestamptz default now()
);

-- ─── 10. PHYSICAL STATUS ─────────────────────────────────────
create table if not exists public.physical_status (
  id                    uuid primary key default gen_random_uuid(),
  player_id             uuid references public.profiles(id),
  team_id               uuid references public.teams(id),
  reported_by           uuid references public.profiles(id),
  status_date           date not null default current_date,
  status                text not null check (status in ('fit', 'limited', 'injured', 'recovering')),
  injury_description    text,
  body_area             text,
  expected_return       date,
  is_current            boolean default true,
  created_at            timestamptz default now()
);

-- ─── 11. MEDIA FILES ─────────────────────────────────────────
create table if not exists public.media_files (
  id            uuid primary key default gen_random_uuid(),
  uploaded_by   uuid references public.profiles(id),
  team_id       uuid references public.teams(id),
  session_id    uuid references public.training_sessions(id),
  exercise_name text,
  file_url      text not null,
  file_type     text check (file_type in ('photo', 'video')),
  title         text,
  created_at    timestamptz default now()
);

-- ─── 12. SUBSCRIPTIONS ───────────────────────────────────────
create table if not exists public.subscriptions (
  id                    uuid primary key default gen_random_uuid(),
  payer_id              uuid references public.profiles(id) not null,
  organization_id       uuid references public.organizations(id),
  billing_type          text default 'personal' check (billing_type in ('personal', 'organization')),
  payment_provider      text check (payment_provider in ('mercadopago', 'webpay')),
  mp_preapproval_id     text unique,
  mp_customer_id        text,
  webpay_token          text,
  plan                  text default 'free' check (plan in ('free', 'pro', 'club')),
  status                text default 'active' check (status in ('active', 'past_due', 'cancelled', 'trialing')),
  active_players_count  int default 0,
  current_period_end    timestamptz,
  created_at            timestamptz default now(),
  updated_at            timestamptz default now(),
  unique(payer_id),
  unique(organization_id)
);

-- ─── 13. WEBPAY PENDING PAYMENTS (auxiliar) ──────────────────
create table if not exists public.webpay_pending_payments (
  token           text primary key,
  user_id         uuid references public.profiles(id),
  plan            text,
  billing_type    text,
  organization_id uuid references public.organizations(id),
  created_at      timestamptz default now()
);

-- ─── ÍNDICES ─────────────────────────────────────────────────
create index if not exists idx_team_memberships_team_id   on public.team_memberships(team_id);
create index if not exists idx_team_memberships_user_id   on public.team_memberships(user_id);
create index if not exists idx_performance_logs_player    on public.performance_logs(player_id, log_date);
create index if not exists idx_match_metrics_player       on public.match_metrics(player_id, match_date);
create index if not exists idx_physical_status_current    on public.physical_status(player_id, is_current);
create index if not exists idx_invitations_token          on public.invitations(token);
create index if not exists idx_invitations_email          on public.invitations(email, status);
create index if not exists idx_subscriptions_org          on public.subscriptions(organization_id);
