# SPEC-03: App Mobile — Pantallas Core

## Contexto
App Expo (React Native + NativeWind). Implementar las 5 pantallas principales del tab navigator + pantalla de perfil de jugador individual.

Los diseños HTML de referencia están en el proyecto (ver `/reference-designs/`). Respetar EXACTAMENTE el design system.

## Prompt para Claude Code

```
Implementa las pantallas core de la app mobile en Expo Router con NativeWind.

### DESIGN SYSTEM (obligatorio en todos los componentes)

```typescript
// lib/constants/colors.ts
export const Colors = {
  primary: '#001e40',
  secondary: '#0058bc',
  primaryContainer: '#003366',
  onPrimary: '#ffffff',
  onPrimaryContainer: '#799dd6',
  surface: '#f8f9fa',
  surfaceContainer: '#edeeef',
  surfaceContainerHigh: '#e7e8e9',
  surfaceContainerHighest: '#e1e3e4',
  surfaceContainerLowest: '#ffffff',
  outline: '#737780',
  outlineVariant: '#c3c6d1',
  onSurface: '#191c1d',
  onSurfaceVariant: '#43474f',
  tertiary: '#83fc8e',   // verde acento
  tertiaryFixed: '#83fc8e',
  onTertiary: '#002106',
  secondaryFixed: '#d8e2ff',
  onSecondaryFixed: '#001a41',
  error: '#ba1a1a',
  errorContainer: '#ffdad6',
}

// lib/constants/typography.ts  
// Fuentes: Lexend (headlines) + Inter (body)
// Instalar: expo-font + @expo-google-fonts/lexend + @expo-google-fonts/inter
```

---

### COMPONENTES BASE (crear primero en components/ui/)

**1. PlayerCard** (`components/player/PlayerCard.tsx`):
```
Props: player { id, fullName, jerseyNumber, position, positionGroup, weightKg, heightCm, avatarUrl }
Props: onPress?: () => void

Visual (según diseño HTML):
- Card blanca con sombra suave (surfaceContainerLowest)
- Foto cuadrada 96x96px con fondo rotado (rotate-3) en color primaryContainer o secondaryContainer
- Nombre en Lexend extrabold
- Badge de posición (verde para forwards, azul para backs)
- Número de camiseta grande opaco en esquina superior derecha
- Peso y Altura con separador vertical
- Hover: fondo rotado vuelve a 0
```

**2. StatCard** (`components/ui/StatCard.tsx`):
```
Props: label, value, unit?, icon?, variant?: 'default' | 'primary' | 'error'
Visual: card compacta con label arriba en mayúsculas tiny, valor grande en Lexend
```

**3. SectionHeader** (`components/ui/SectionHeader.tsx`):
```
Props: title, subtitle?, rightLabel?, rightAction?
```

**4. BottomTabBar** (configurar en _layout.tsx):
```
Tabs: Dashboard | Plantel | Partidos | Entrenar | Perfil
Íconos: dashboard | groups | sports_rugby | event_note | person
Tab activo: bg primaryContainer, texto blanco, rounded-xl
Tab inactivo: texto primary
Fondo: blanco/80 con blur, sombra superior suave
```

---

### PANTALLA 1: Dashboard (`app/(tabs)/index.tsx`)

Según diseño "Dashboard Entrenador":

**Para physical_trainer / coach:**
- Header: "DASHBOARD DEL ENTRENADOR"
- Bento grid con:
  - Card grande "Líder de Progreso" (bg primaryContainer): nombre, posición, incremento %, Scout Score
  - Card "El más Fuerte": nombre + kg en squat
  - Card roja "Alerta Bajo Rendimiento": nombre + % negativo
- Gráfico de barras "Frecuencia de Entrenamiento" (6 columnas, últimas 6 semanas)
  - Usar datos reales de training_sessions agrupados por semana
- Card "Índice de Fuerza": % promedio de mejora del plantel
- Lista "Tendencias de Ejercicios": más y menos usado
- Card "Próxima Sesión": fecha, hora, título, avatares del plantel

**Para player:**
- Header: "MI RENDIMIENTO"
- Cards: último squat, deadlift, bench (propios)
- Gráfico de progreso últimos 3 meses
- Próxima sesión asignada

**Data fetching:**
```typescript
// hooks/useDashboard.ts
// Consultas con react-query o SWR:
// - Próxima sesión (training_sessions donde session_date >= hoy)
// - Top performer (mejor progreso en squat últimas 4 semanas)  
// - Alerta (peor recovery o bajada de rendimiento)
// - Frecuencia semanal (count sessions por semana últimos 2 meses)
// - Índice fuerza (avg % change en squat del equipo)
```

---

### PANTALLA 2: Plantel (`app/(tabs)/roster.tsx`)

Según diseño "Gestión de Plantel":

- Buscador con ícono search
- Selector de categorías (scroll horizontal): Primera | Intermedia | M18 | M16 | M14
  - Mostrar solo categorías donde el usuario tiene membresía/acceso
- Toggle Forwards / Backs
- Contador "X Jugadores Activos"
- Lista de PlayerCards (componente creado arriba)
- FAB (botón flotante): ícono person_add, gradient primary→secondary
  - Al presionar: sheet modal con opciones "Invitar por email" / "Agregar manualmente"

**Data fetching:**
```typescript
// hooks/useRoster.ts
// - Cargar team_memberships con join a profiles
// - Filtrar por team_id seleccionado y position_group
// - Búsqueda local por nombre/posición/número
```

---

### PANTALLA 3: Análisis de Partidos (`app/(tabs)/matches.tsx`)

Según diseño "Análisis de Partidos":

- Header "Análisis de Partidos"
- Selector categoría (dropdown)
- 4 cards de métricas top (grid 2x2):
  - Top Velocidad (bolt icon, borde secundario)
  - Metros Recorridos (straighten icon, borde primary)
  - Sprints Realizados (speed icon)
  - Metros Alta Velocidad (rocket_launch icon)
  - Cada card: top 3 jugadores con ranking número italic

- Tabla scrollable horizontal con todos los jugadores:
  Columnas: Jugador | Posición | Vel.Máx | Metros | Sprints | HSR | Estado
  Estados con badges: Óptimo (verde) | Fatiga (amarillo) | Alerta (rojo)

**Data fetching:**
```typescript
// hooks/useMatchMetrics.ts
// - Cargar match_metrics del último partido (max match_date) por team
// - Si no hay datos: empty state con botón "Cargar datos desde Excel"
//   → navegar a pantalla de upload (solo disponible en web, mostrar QR o link)
```

---

### PANTALLA 4: Planificador (`app/(tabs)/training.tsx`)

Según diseño "Planificador de Entrenamiento":

- Header "Planificador de Entrenamiento"  
- Selector semana: "SEMANA 04" + tabs Lunes/Martes/Jueves
- Layout en 2 columnas (en tablet) o scroll vertical (en móvil):

  **Sección Forwards (fitness_center icon, primaryContainer):**
  - Lista de ExerciseCards
  
  **Sección Backs (bolt icon, secondary):**
  - Lista de ExerciseCards

**ExerciseCard** (`components/session/ExerciseCard.tsx`):
```
Props: exercise { name, category, targetGroup, sets, reps, distanceM, restSeconds, intensityLabel }
Visual:
- Número grande opaco en fondo (01, 02, 03...)
- Nombre + categoría
- Badge de intensidad (Pesado/Máximo/Volumen/Dinámico)
- 3 mini-cards: Series | Reps/Dist | Descanso
- Si targetGroup === 'backs': fondo primaryContainer (oscuro con texto blanco)
- Si targetGroup === 'forwards': fondo surfaceContainerLowest
```

- Botón inferior "Enviar al Equipo" (gradient, ancho completo)
  → Crea notificaciones push para todos los jugadores del equipo

**Para player:**
- Solo ver las sesiones asignadas a su equipo
- No puede crear ni editar

---

### PANTALLA 5: Perfil Jugador Individual (`app/player/[id].tsx`)

Según diseño "Perfil del Jugador":

- Hero section 480px: foto full-width con overlay gradient
  - Número grande transparente en esquina
  - Badges de categoría y posición
  - Nombre en Lexend black 48px uppercase
- Stats bar flotante: Peso | Altura | Edad (gradient primaryContainer)
- Sección "Progreso de Fuerza":
  - Label "Métricas de Rendimiento" + "Últimos 6 Meses"
  - Card Sentadilla: valor actual + % vs período anterior + gráfico de barras 6 meses
  - Grid 2 cols: Peso Muerto (dark) + Press de Banca (light)
- Sección "Historial de Sesiones":
  - Lista de sesiones con ícono, nombre, fecha, duración, tonelaje
  - Badge de estado: Progresado (azul) | Nuevo 1RM (azul) | Mantenido (gris) | Técnico (gris)

**Data fetching:**
```typescript
// hooks/usePlayerProfile.ts
// - profile + membership para el jugador
// - performance_logs últimos 6 meses (agrupar por mes para gráfico)
// - physical_status.is_current = true
// - training_sessions donde aparece el player (vía team)
//   ordenadas por session_date desc, limit 10
```

---

### PANTALLA 6: Mi Perfil (`app/(tabs)/profile.tsx`)

Para el usuario logueado:
- Avatar + nombre + rol
- Si es jugador: mostrar perfil completo (igual a player/[id].tsx pero propio)
- Si es coach/trainer: estadísticas generales + acceso a configuración
- Botón cerrar sesión
- Link a billing (solo trainer)

---

### GESTIÓN DE ESTADO GLOBAL

Usar Zustand:
```bash
pnpm add zustand
```

```typescript
// store/authStore.ts: { session, user, profile, setProfile }
// store/teamStore.ts: { selectedTeamId, selectedCategory, setTeam }
```

---

### NOTIFICACIONES PUSH

```bash
pnpm add expo-notifications expo-device
```

- Registrar token en tabla `profiles.push_token` al hacer login
- Enviar notificación cuando entrenador publica sesión nueva

---

### MANEJO DE ERRORES Y LOADING

- Skeleton screens mientras carga (no spinners genéricos)
- Empty states con ilustración + texto + CTA
- Toast notifications con `react-native-toast-message`
- Error boundaries en cada pantalla principal
```

## Output esperado
- Las 6 pantallas funcionando con datos reales de Supabase
- Navegación entre pantallas (player card → player profile)
- Bottom tab bar funcionando
- Skeletons y empty states implementados
- Filtros de categoría y posición funcionando

## Validación
- Login como coach → ver plantel de su categoría
- Login como jugador → solo ver su propio perfil
- Login como physical_trainer → ver todos los equipos de su org
- Navegación fluida sin crashes
