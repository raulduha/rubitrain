# SPEC-04: Web Dashboard — Next.js (Preparador Físico)

## Contexto
Dashboard web en Next.js 14 (App Router) para preparadores físicos. Funciones clave: gestionar clubes/categorías, subir Excel, ver reportes, gestionar suscripción.

## Prompt para Claude Code

```
Implementa el dashboard web completo en Next.js para el rol physical_trainer.

### LAYOUT PRINCIPAL (`app/(dashboard)/layout.tsx`)

Sidebar fijo izquierdo (240px) + área de contenido:

**Sidebar:**
- Logo CDUC + nombre app arriba
- Navegación principal:
  - Dashboard (dashboard icon)
  - Mis Clubes (business icon)
  - Plantel (groups icon)
  - Subir Datos → submenu: Rutinas | Métricas de Partido
  - Reportes (bar_chart icon)
  - Facturación (credit_card icon)
- Usuario logueado + botón cerrar sesión abajo
- Colores: fondo #001e40, texto blanco, ítem activo bg #003366

**Header:**
- Título de la sección actual
- Notificaciones
- Avatar del usuario

---

### PÁGINA 1: Dashboard Overview (`app/(dashboard)/page.tsx`)

Bento grid con métricas globales del preparador:

**Fila 1 — KPIs:**
- Total jugadores activos (todos los clubes)
- Total sesiones este mes
- Mejora promedio de fuerza (%) este mes
- Alertas activas (physical_status = injured | limited)

**Fila 2 — Actividad reciente:**
- Últimas 5 sesiones creadas (tabla: club, categoría, fecha, jugadores)
- Gráfico de líneas: progreso promedio de squat por categoría (últimos 3 meses)
  Usar Recharts `LineChart`

**Fila 3 — Clubes:**
- Cards de cada club con: nombre, # categorías, # jugadores activos, última sesión

---

### PÁGINA 2: Mis Clubes (`app/(dashboard)/clubs/page.tsx`)

Lista de organizaciones del preparador:

- Botón "Crear Club" → dialog modal con form:
  - Nombre del club, país, subir logo (Supabase Storage)
  
- Grid de ClubCards:
  - Logo + nombre + país
  - Lista de categorías (teams) con # jugadores cada una
  - Botón "Gestionar" → navega a club/[id]
  - Botón "Nueva Categoría"

**Detalle Club (`app/(dashboard)/clubs/[id]/page.tsx`):**
- Nombre + logo + editar
- Tabs: Categorías | Entrenadores | Configuración

**Tab Categorías:**
- Lista de teams con: nombre, # jugadores, # sesiones, temporada
- Botón "Nueva Categoría" → form inline
- Click en categoría → navega a roster/[teamId]

**Tab Entrenadores:**
- Lista de coaches asignados al club con su categoría
- Botón "Invitar Entrenador" → form con email + seleccionar categoría(s)

---

### PÁGINA 3: Plantel (`app/(dashboard)/roster/[teamId]/page.tsx`)

Tabla completa de jugadores con filtros:

**Header:**
- Nombre del equipo + categoría + temporada
- Botón "Invitar Jugador" (abre modal)
- Botón "Exportar Excel" (descarga datos del plantel)

**Filtros:**
- Input búsqueda
- Toggle Forwards/Backs
- Selector estado (activo/inactivo)

**Tabla (usar @tanstack/react-table):**
Columnas: # | Avatar+Nombre | Posición | Peso | Altura | Edad | Estado Físico | Acciones

- Estado físico con badge de color
- Acciones: ver perfil | editar | desactivar

**Modal Invitar Jugador:**
```
Modo 1 - Por Email:
  - Input email
  - Seleccionar rol (jugador/entrenador)
  - Mensaje personalizado opcional
  - Al enviar: crear registro en invitations + enviar email con Resend

Modo 2 - Manual:
  - Form completo: nombre, email, posición, número, peso, altura, fecha nacimiento
  - Crea user en Supabase Auth + profile + membership directamente
  - Envía email de bienvenida con link para setear password
```

---

### PÁGINA 4: Subir Rutinas (`app/(dashboard)/upload/training/page.tsx`)

Flujo de 3 pasos:

**Paso 1 — Descargar Template:**
- Botón grande "Descargar Template Excel"
  → genera y descarga `template_rutinas.xlsx` con:
    - Hoja "Rutina": columnas fijas (descripción en primera fila como header)
    - Columnas: Fecha | Título Sesión | Tipo | Grupo (forwards/backs/all) | Ejercicio | Series | Reps | Distancia_m | Descanso_s | Intensidad | Notas
    - 3 filas de ejemplo pre-llenadas
    - Segunda hoja "Referencia": lista de posibles valores por columna

**Paso 2 — Subir Excel:**
- Drop zone (react-dropzone): arrastra o selecciona .xlsx / .csv
- Preview: tabla con las primeras 5 filas del archivo
- Selector: ¿A qué equipo/categoría aplica esta rutina?
- Selector: Semana de la fase de entrenamiento
- Botón "Procesar y Cargar"

**Paso 3 — Confirmación:**
- Resumen: X sesiones creadas, Y ejercicios importados, Z errores/advertencias
- Lista de errores si los hay (fila # → descripción del error)
- Botón "Ver en Planificador"

**API Route (`app/api/upload/training/route.ts`):**
```typescript
// POST con FormData
// 1. Parsear Excel con xlsx library
// 2. Validar columnas obligatorias
// 3. Agrupar filas por sesión (Fecha + Título)
// 4. Insertar training_sessions
// 5. Insertar session_exercises para cada sesión
// 6. Retornar resumen { created, errors }
```

---

### PÁGINA 5: Subir Métricas de Partido (`app/(dashboard)/upload/matches/page.tsx`)

Mismo patrón de 3 pasos que rutinas.

**Template Excel métricas (`template_metricas_partido.xlsx`):**
Columnas: Email_Jugador | Fecha_Partido | Rival | Vel_Max_kmh | Metros_Totales | Sprints | Metros_HSR | Estado

**Lógica especial:**
- Buscar jugador por email en la org (si no existe → error con nombre de la columna)
- Si jugador existe en múltiples categorías → usar la primera activa
- Calcular `status` automáticamente si no se provee:
  - status = 'alert' si metros_totales < 5000
  - status = 'fatigue' si metros_totales < 7000 y sprints < 15
  - status = 'optimal' en otro caso

**API Route (`app/api/upload/matches/route.ts`):**
```typescript
// Similar a training, pero inserta en match_metrics
// Buscar player_id por email dentro de la organización
```

---

### PÁGINA 6: Perfil Detallado Jugador (`app/(dashboard)/player/[id]/page.tsx`)

Vista web del perfil del jugador (más completa que mobile):

**Header con foto grande + datos básicos**

**Tabs:**
1. **Rendimiento** — Gráficos Recharts:
   - LineChart: squat/deadlift/bench últimos 12 meses
   - BarChart: tonelaje por sesión
   
2. **Partidos** — Tabla de match_metrics + gráficos velocidad/metros

3. **Historial Sesiones** — Tabla completa con filtros de fecha

4. **Estado Físico** — Timeline de lesiones/estados

**Inline editable:**
- Editar peso, altura, posición, número directamente en la página

---

### PÁGINA 7: Facturación (`app/(dashboard)/billing/page.tsx`)

- Plan actual con badge
- Contador: X/Y jugadores activos
- Si está en free: banner de upgrade
- Tabla de características por plan (Free | Pro | Club)
- Botón "Actualizar Plan" → Stripe Checkout Session
- Historial de facturas (via Stripe API)

**Planes:**
```
Free:    hasta 5 jugadores, 1 club, sin upload Excel
Pro:     hasta 30 jugadores, 3 clubs, $15/mes
Club:    ilimitado, clubs ilimitados, $45/mes
```

---

### TEMPLATES EXCEL (generar con xlsx library)

**`app/api/templates/training.xlsx/route.ts`:**
```typescript
import * as XLSX from 'xlsx'

export async function GET() {
  const wb = XLSX.utils.book_new()
  
  // Hoja principal
  const headers = ['Fecha','Titulo_Sesion','Tipo_Sesion','Grupo_Objetivo',
                   'Nombre_Ejercicio','Categoria_Ejercicio','Series','Reps',
                   'Distancia_m','Descanso_s','Intensidad','Notas']
  
  const ejemplos = [
    ['2025-07-07','Fuerza Máxima Lunes','strength','forwards',
     'Sentadilla Trasera','compound','5','5','','180','Pesado',''],
    ['2025-07-07','Fuerza Máxima Lunes','strength','backs',
     'Power Clean','compound','6','2','','120','Dinámico','Barra olímpica'],
  ]
  
  const ws = XLSX.utils.aoa_to_sheet([headers, ...ejemplos])
  
  // Hoja de referencia
  const ref = [
    ['Tipo_Sesion', 'strength | speed | technical | recovery | match_prep'],
    ['Grupo_Objetivo', 'all | forwards | backs'],
    ['Intensidad', 'Pesado | Máximo | Volumen | Dinámico | Altura | 100%'],
  ]
  const wsRef = XLSX.utils.aoa_to_sheet(ref)
  
  XLSX.utils.book_append_sheet(wb, ws, 'Rutina')
  XLSX.utils.book_append_sheet(wb, wsRef, 'Referencia')
  
  const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })
  
  return new Response(buf, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename="template_rutinas.xlsx"'
    }
  })
}
```

---

### SISTEMA DE INVITACIONES (`app/api/invitations/route.ts`)

```typescript
// POST /api/invitations
// Body: { teamId, email, role, message? }
// 
// 1. Verificar que quien invita tiene acceso al team
// 2. Crear registro en invitations con token único
// 3. Enviar email con Resend:
//    - Si es jugador: "Te invitaron a unirte a [Team] en [Club]"
//    - Link: https://app.cduc.cl/join?token=XXX
//    - Botón Aceptar + Botón Rechazar
// 4. Retornar { success: true, invitationId }

// GET /api/invitations/[token]
// - Verificar token válido y no expirado
// - Retornar datos de la invitación (club, equipo, rol)
// - Si token expirado: { expired: true }

// POST /api/invitations/[token]/accept
// - user_id del usuario logueado (o crear cuenta nueva)
// - Llamar función accept_invitation(token, user_id) en Supabase
// - Retornar { success: true, teamId }
```

---

### EMAIL TEMPLATES (Resend)

Crear componentes React Email en `packages/emails/`:
- `InvitationEmail.tsx` — invitación a equipo
- `WelcomeEmail.tsx` — bienvenida nuevo usuario
- `SessionPublishedEmail.tsx` — nueva sesión disponible (opcional)

Diseño: usar los colores CDUC (#001e40, #003366), limpio y profesional.

---

### MIDDLEWARE Y GUARDS

```typescript
// middleware.ts
// - Rutas /dashboard/* → requieren sesión
// - Rutas /dashboard/upload/* → requieren rol physical_trainer  
// - Rutas /dashboard/billing → requieren rol physical_trainer
// - /join?token=* → pública (para aceptar invitaciones)
```
```

## Output esperado
- Dashboard web completo y funcional
- Upload de Excel → datos en Supabase funcionando
- Templates Excel descargables
- Sistema de invitaciones con emails reales (Resend)
- Facturación básica con Stripe (sin pago real, solo UI)

## Validación
- Subir Excel de ejemplo → verificar datos en Supabase
- Invitar jugador → llega email con link
- Aceptar invitación → jugador aparece en plantel
- Tabla de plantel con filtros funcionando
