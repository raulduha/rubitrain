-- ============================================================
-- CDUC Rugby — Seed data (datos de prueba)
-- IMPORTANTE: Ejecutar DESPUÉS de crear usuarios en Supabase Auth
-- Los UUIDs de usuarios deben coincidir con auth.users
-- ============================================================

-- Usar UUIDs fijos para facilitar el testing
-- Crear estos usuarios primero en Supabase Auth (o usar los que crees en el dashboard)

do $$
declare
  v_trainer_id  uuid := 'a1a1a1a1-0000-0000-0000-000000000001';
  v_coach_id    uuid := 'a2a2a2a2-0000-0000-0000-000000000002';
  v_player1_id  uuid := 'a3a3a3a3-0000-0000-0000-000000000003';
  v_player2_id  uuid := 'a4a4a4a4-0000-0000-0000-000000000004';
  v_player3_id  uuid := 'a5a5a5a5-0000-0000-0000-000000000005';
  v_org_id      uuid;
  v_team1_id    uuid;
  v_team2_id    uuid;
begin

  -- ─── Profiles ───────────────────────────────────────────────
  insert into public.profiles (id, full_name, role, phone) values
    (v_trainer_id, 'Carlos Preparador', 'physical_trainer', '+56912345678'),
    (v_coach_id,   'Ana Entrenadora',   'coach',            '+56987654321'),
    (v_player1_id, 'Juan García',       'player',           null),
    (v_player2_id, 'Pedro Martínez',    'player',           null),
    (v_player3_id, 'Diego López',       'player',           null)
  on conflict (id) do nothing;

  -- ─── Organization ───────────────────────────────────────────
  insert into public.organizations (id, name, country, owner_id)
  values (gen_random_uuid(), 'Club Deportivo CDUC', 'CL', v_trainer_id)
  returning id into v_org_id;

  -- ─── Teams ──────────────────────────────────────────────────
  insert into public.teams (id, organization_id, name, category, season)
  values
    (gen_random_uuid(), v_org_id, 'Primera División', 'primera', '2025'),
    (gen_random_uuid(), v_org_id, 'M18 Elite',        'm18',     '2025')
  returning id into v_team1_id;

  -- Obtener el segundo equipo
  select id into v_team2_id
  from public.teams
  where organization_id = v_org_id and category = 'm18';

  -- ─── Team memberships ───────────────────────────────────────
  insert into public.team_memberships
    (team_id, user_id, role, jersey_number, position, position_group, weight_kg, height_cm)
  values
    (v_team1_id, v_coach_id,   'coach',  null, null,              null,      null,  null),
    (v_team1_id, v_player1_id, 'player', 2,    'Hooker',          'forward', 102.0, 182.0),
    (v_team1_id, v_player2_id, 'player', 10,   'Apertura',        'back',    85.0,  178.0),
    (v_team1_id, v_player3_id, 'player', 15,   'Fullback',        'back',    88.0,  180.0),
    (v_team2_id, v_player1_id, 'player', 2,    'Hooker',          'forward', 102.0, 182.0)
  on conflict (team_id, user_id) do nothing;

  -- ─── Training sessions ──────────────────────────────────────
  insert into public.training_sessions
    (team_id, created_by, title, session_date, session_time, duration_minutes, session_type, status)
  values
    (v_team1_id, v_trainer_id, 'Fuerza + Potencia',    current_date - 7, '08:00', 90,  'strength',  'completed'),
    (v_team1_id, v_trainer_id, 'Velocidad y Agilidad', current_date - 3, '08:00', 75,  'speed',     'completed'),
    (v_team1_id, v_trainer_id, 'Prep. Partido',        current_date + 2, '16:00', 60,  'match_prep', 'planned');

  -- ─── Performance logs ───────────────────────────────────────
  insert into public.performance_logs
    (player_id, team_id, log_date, squat_kg, deadlift_kg, bench_kg, power_clean_kg, tonnage_kg, created_by)
  values
    (v_player1_id, v_team1_id, current_date - 7, 160, 180, 120, 100, 4800, v_trainer_id),
    (v_player2_id, v_team1_id, current_date - 7, 140, 155, 105, 90,  4200, v_trainer_id),
    (v_player3_id, v_team1_id, current_date - 7, 145, 160, 110, 92,  4350, v_trainer_id);

  -- ─── Match metrics ───────────────────────────────────────────
  insert into public.match_metrics
    (player_id, team_id, match_date, opponent, max_speed_kmh, total_distance_m, sprint_count, hsr_distance_m, status, created_by)
  values
    (v_player1_id, v_team1_id, current_date - 14, 'Old Boys RC',   28.5, 6800, 12, 980,  'optimal', v_trainer_id),
    (v_player2_id, v_team1_id, current_date - 14, 'Old Boys RC',   31.2, 7200, 18, 1250, 'optimal', v_trainer_id),
    (v_player3_id, v_team1_id, current_date - 14, 'Old Boys RC',   32.1, 7500, 20, 1400, 'fatigue', v_trainer_id);

  -- ─── Physical status ────────────────────────────────────────
  insert into public.physical_status
    (player_id, team_id, reported_by, status, is_current)
  values
    (v_player1_id, v_team1_id, v_trainer_id, 'fit',      true),
    (v_player2_id, v_team1_id, v_trainer_id, 'fit',      true),
    (v_player3_id, v_team1_id, v_trainer_id, 'limited',  true);

  -- ─── Subscription (plan Free por defecto) ────────────────────
  insert into public.subscriptions (payer_id, organization_id, billing_type, plan, status)
  values (v_trainer_id, v_org_id, 'personal', 'free', 'active')
  on conflict (payer_id) do nothing;

  raise notice 'Seed completado. Org ID: %', v_org_id;
end;
$$;
