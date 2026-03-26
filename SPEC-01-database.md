# SPEC-01: Database Schema (Supabase / PostgreSQL)

## Contexto
App de gestión de rendimiento deportivo para rugby (CDUC). Stack: Supabase + Expo + Next.js.

## Prompt para Claude Code

```
Configura el esquema completo de base de datos en Supabase para una app de gestión de plantel de rugby.

STACK: Supabase (PostgreSQL + RLS + Auth)

### TABLAS A CREAR (en orden de dependencias):

---

#### 1. profiles
Extiende auth.users de Supabase.
```sql
id uuid references auth.users primary key
full_name text not null
avatar_url text
role text not null check (role in ('physical_trainer', 'coach', 'player'))
phone text
created_at timestamptz default now()
updated_at timestamptz default now()
```

---

#### 2. organizations
Un club deportivo. Lo crea un physical_trainer.
```sql
id uuid primary key default gen_random_uuid()
name text not null
sport text not null default 'rugby'
logo_url text
country text default 'CL'
owner_id uuid references profiles(id) not null
created_at timestamptz default now()
```

---

#### 3. teams
Categoría dentro de un club (Primera, M18, M16, etc.)
```sql
id uuid primary key default gen_random_uuid()
organization_id uuid references organizations(id) on delete cascade
name text not null  -- ej: "Primera División", "M18 Elite"
category text       -- ej: "primera", "intermedia", "m18", "m16", "m14"
season text         -- ej: "2025"
is_active boolean default true
created_at timestamptz default now()
```

---

#### 4. team_memberships
Relación many-to-many entre profiles y teams.
```sql
id uuid primary key default gen_random_uuid()
team_id uuid references teams(id) on delete cascade
user_id uuid references profiles(id) on delete cascade
role text not null check (role in ('coach', 'player'))
jersey_number int
position text       -- ej: "Hooker", "Segunda Línea", "Wing"
position_group text check (position_group in ('forward', 'back'))
weight_kg numeric
height_cm numeric
birth_date date
is_active boolean default true
joined_at timestamptz default now()
unique(team_id, user_id)
```

---

#### 5. invitations
Invitaciones por email para unirse a un equipo.
```sql
id uuid primary key default gen_random_uuid()
team_id uuid references teams(id) on delete cascade
invited_by uuid references profiles(id)
email text not null
role text not null check (role in ('coach', 'player'))
token text unique not null default gen_random_uuid()::text
status text default 'pending' check (status in ('pending', 'accepted', 'rejected', 'expired'))
expires_at timestamptz default now() + interval '7 days'
created_at timestamptz default now()
```

---

#### 6. training_sessions
Sesiones de entrenamiento planificadas por el entrenador/preparador.
```sql
id uuid primary key default gen_random_uuid()
team_id uuid references teams(id) on delete cascade
created_by uuid references profiles(id)
title text not null
session_date date not null
session_time time
duration_minutes int
session_type text check (session_type in ('strength', 'speed', 'technical', 'recovery', 'match_prep'))
notes text
status text default 'planned' check (status in ('planned', 'completed', 'cancelled'))
created_at timestamptz default now()
```

---

#### 7. session_exercises
Ejercicios dentro de una sesión. Aplica a todos o a un grupo (forwards/backs).
```sql
id uuid primary key default gen_random_uuid()
session_id uuid references training_sessions(id) on delete cascade
exercise_name text not null
exercise_category text  -- ej: "compound", "plyometric", "sprint", "auxiliary"
target_group text check (target_group in ('all', 'forwards', 'backs'))
sets int
reps int
distance_m numeric      -- para sprints
rest_seconds int
intensity_label text    -- ej: "Pesado", "Máximo", "Dinámico", "Volumen"
order_index int not null
notes text
video_url text          -- referencia a storage
```

---

#### 8. performance_logs
Registro de rendimiento individual por jugador por sesión.
Datos subidos vía Excel o manualmente.
```sql
id uuid primary key default gen_random_uuid()
player_id uuid references profiles(id)
team_id uuid references teams(id)
session_id uuid references training_sessions(id)
log_date date not null
squat_kg numeric
deadlift_kg numeric
bench_kg numeric
power_clean_kg numeric
custom_metric_name text   -- para métricas personalizadas
custom_metric_value numeric
tonnage_kg numeric        -- calculado: sum(weight * sets * reps)
notes text
created_by uuid references profiles(id)
created_at timestamptz default now()
```

---

#### 9. match_metrics
Métricas GPS/físicas de partido. Subidas vía Excel.
```sql
id uuid primary key default gen_random_uuid()
player_id uuid references profiles(id)
team_id uuid references teams(id)
match_date date not null
opponent text
max_speed_kmh numeric
total_distance_m numeric
sprint_count int
hsr_distance_m numeric    -- High Speed Running (>21 km/h)
status text default 'optimal' check (status in ('optimal', 'fatigue', 'alert'))
raw_data jsonb            -- guarda fila completa del Excel por si acaso
created_by uuid references profiles(id)
created_at timestamptz default now()
```

---

#### 10. physical_status
Estado físico y lesiones del jugador.
```sql
id uuid primary key default gen_random_uuid()
player_id uuid references profiles(id)
team_id uuid references teams(id)
reported_by uuid references profiles(id)
status_date date not null default current_date
status text not null check (status in ('fit', 'limited', 'injured', 'recovering'))
injury_description text
body_area text      -- ej: "rodilla derecha", "isquiotibial izquierdo"
expected_return date
is_current boolean default true
created_at timestamptz default now()
```

---

#### 11. media_files
Fotos y videos de ejercicios o sesiones.
```sql
id uuid primary key default gen_random_uuid()
uploaded_by uuid references profiles(id)
team_id uuid references teams(id)
session_id uuid references training_sessions(id)
exercise_name text
file_url text not null      -- Supabase Storage URL
file_type text check (file_type in ('photo', 'video'))
title text
created_at timestamptz default now()
```

---

#### 12. subscriptions
Estado de suscripción Stripe por physical_trainer.
```sql
id uuid primary key default gen_random_uuid()
owner_id uuid references profiles(id) unique
stripe_customer_id text unique
stripe_subscription_id text
plan text default 'free' check (plan in ('free', 'pro', 'club'))
status text default 'active' check (status in ('active', 'past_due', 'cancelled', 'trialing'))
active_players_count int default 0
current_period_end timestamptz
created_at timestamptz default now()
updated_at timestamptz default now()
```

---

### ROW LEVEL SECURITY (RLS)

Habilitar RLS en TODAS las tablas. Políticas principales:

**profiles:**
- SELECT: usuario puede ver su propio perfil + perfiles de jugadores en sus equipos
- UPDATE: solo el propio usuario

**organizations:**
- SELECT: owner + coaches/players de equipos de esa org
- INSERT/UPDATE/DELETE: solo el owner

**teams:**
- SELECT: miembros del equipo + owner de la org
- INSERT/UPDATE: physical_trainer owner de la org

**team_memberships:**
- SELECT: el propio jugador + coaches + owner
- INSERT: coaches y owner
- UPDATE/DELETE: owner y coaches

**performance_logs / match_metrics:**
- SELECT: el propio jugador (solo sus datos) + coaches del equipo + owner
- INSERT/UPDATE: coaches y owner (no el jugador)

**physical_status:**
- SELECT: el propio jugador + coaches + owner
- INSERT/UPDATE: coaches y owner

**invitations:**
- SELECT: el invited_by + el dueño de la org
- INSERT: coaches (con permiso) y owner

---

### FUNCIONES Y TRIGGERS

1. `handle_new_user()` - trigger en auth.users para crear automáticamente un profile
2. `update_updated_at()` - trigger genérico para updated_at
3. `count_active_players(org_id)` - función para contar jugadores activos (billing)
4. `accept_invitation(token, user_id)` - función que acepta invitación y crea membership

---

### ÍNDICES

Crear índices en:
- team_memberships(team_id), team_memberships(user_id)
- performance_logs(player_id, log_date)
- match_metrics(player_id, match_date)
- physical_status(player_id, is_current)
- invitations(token), invitations(email, status)

---

### STORAGE BUCKETS

Crear en Supabase Storage:
- `avatars` - fotos de perfil (público)
- `team-media` - fotos y videos de ejercicios (privado, autenticado)
- `excel-uploads` - archivos Excel temporales (privado)

---

### TIPOS Y ENUMS UTILES

Crear tipo para posiciones de rugby:
```sql
-- Forwards (1-8)
'Pilier Izquierdo', 'Hooker', 'Pilier Derecho',
'Segunda Línea Izquierda', 'Segunda Línea Derecha',
'Ala Izquierdo', 'Ala Derecho', 'Número 8'

-- Backs (9-15)
'Medio Scrum', 'Apertura', 'Centro Izquierdo', 'Centro Derecho',
'Wing Izquierdo', 'Wing Derecho', 'Fullback'
```
```

## Output esperado
- Archivo `supabase/migrations/001_initial_schema.sql` con todo el DDL
- Archivo `supabase/migrations/002_rls_policies.sql` con todas las políticas RLS
- Archivo `supabase/migrations/003_functions_triggers.sql` con funciones y triggers
- Archivo `supabase/seed.sql` con datos de prueba (1 org, 2 teams, 5 jugadores, 3 sesiones)

## Validación
- Correr `supabase db reset` y verificar que no hay errores
- Verificar que el trigger de new user funciona
- Verificar que RLS bloquea correctamente con un usuario de prueba
