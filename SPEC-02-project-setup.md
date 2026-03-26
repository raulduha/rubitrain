# SPEC-02: Estructura del Proyecto + Auth

## Contexto
App de rugby CDUC. Monorepo con Expo (mobile) + Next.js (web dashboard) + paquetes compartidos.

## Prompt para Claude Code

```
Crea la estructura completa del monorepo y configura autenticación con Supabase.

### ESTRUCTURA DE CARPETAS

```
rugby-app/
├── apps/
│   ├── mobile/          # Expo (iOS + Android)
│   └── web/             # Next.js (dashboard preparador)
├── packages/
│   ├── db/              # Supabase client + types generados
│   ├── ui/              # Componentes compartidos (si aplica)
│   └── utils/           # Helpers compartidos (fechas, Excel parsing, etc.)
├── supabase/
│   ├── migrations/
│   └── seed.sql
├── package.json         # workspace root
└── turbo.json           # Turborepo config
```

---

### PASO 1: Inicializar monorepo con Turborepo

```bash
npx create-turbo@latest rugby-app --package-manager pnpm
```

Configurar `turbo.json`:
```json
{
  "pipeline": {
    "build": { "dependsOn": ["^build"], "outputs": [".next/**", "dist/**"] },
    "dev": { "cache": false, "persistent": true },
    "lint": {},
    "type-check": { "dependsOn": ["^build"] }
  }
}
```

---

### PASO 2: App Mobile - Expo

```bash
cd apps/mobile
npx create-expo-app . --template blank-typescript
```

Instalar dependencias:
```bash
pnpm add @supabase/supabase-js @supabase/auth-ui-react expo-secure-store
pnpm add expo-router expo-linking expo-constants expo-status-bar
pnpm add @react-navigation/native @react-navigation/bottom-tabs
pnpm add react-native-safe-area-context react-native-screens
pnpm add nativewind tailwindcss
pnpm add react-native-reanimated react-native-gesture-handler
pnpm add @shopify/flash-list
pnpm add lucide-react-native react-native-svg
```

Estructura de carpetas `apps/mobile/`:
```
src/
├── app/                    # Expo Router (file-based routing)
│   ├── (auth)/
│   │   ├── login.tsx
│   │   ├── register.tsx
│   │   └── forgot-password.tsx
│   ├── (tabs)/             # Bottom tab navigator
│   │   ├── index.tsx       # Dashboard
│   │   ├── roster.tsx      # Gestión de plantel
│   │   ├── training.tsx    # Planificador
│   │   ├── matches.tsx     # Análisis de partidos
│   │   └── profile.tsx     # Perfil
│   ├── player/
│   │   └── [id].tsx        # Perfil individual jugador
│   ├── session/
│   │   ├── [id].tsx        # Detalle de sesión
│   │   └── new.tsx         # Nueva sesión
│   └── _layout.tsx
├── components/
│   ├── ui/                 # Botones, inputs, cards genéricos
│   ├── player/             # PlayerCard, PlayerStats, etc.
│   ├── session/            # SessionCard, ExerciseCard, etc.
│   └── charts/             # Gráficos de progreso
├── hooks/
│   ├── useAuth.ts
│   ├── useTeam.ts
│   ├── usePlayer.ts
│   └── useSession.ts
├── lib/
│   ├── supabase.ts         # Cliente Supabase configurado
│   └── constants.ts
└── types/
    └── index.ts
```

---

### PASO 3: App Web - Next.js

```bash
cd apps/web
npx create-next-app . --typescript --tailwind --app --src-dir
```

Instalar dependencias:
```bash
pnpm add @supabase/supabase-js @supabase/ssr
pnpm add xlsx                    # Excel parsing
pnpm add react-dropzone          # Upload de archivos
pnpm add recharts                # Gráficos dashboard
pnpm add @tanstack/react-table   # Tabla de jugadores
pnpm add react-hook-form zod @hookform/resolvers
pnpm add stripe @stripe/stripe-js
pnpm add resend                  # Emails de invitación
pnpm add lucide-react
```

Estructura `apps/web/src/`:
```
app/
├── (auth)/
│   ├── login/page.tsx
│   └── register/page.tsx
├── (dashboard)/
│   ├── layout.tsx             # Sidebar + header
│   ├── page.tsx               # Dashboard overview
│   ├── clubs/
│   │   ├── page.tsx           # Lista de clubes
│   │   └── [id]/page.tsx      # Detalle club + categorías
│   ├── roster/
│   │   └── [teamId]/page.tsx  # Plantel de una categoría
│   ├── upload/
│   │   ├── training/page.tsx  # Subir Excel rutinas
│   │   └── matches/page.tsx   # Subir Excel métricas partido
│   ├── player/
│   │   └── [id]/page.tsx      # Perfil detallado jugador
│   └── billing/page.tsx       # Gestión suscripción
├── api/
│   ├── invitations/route.ts   # Enviar invitaciones email
│   ├── upload/
│   │   ├── training/route.ts  # Procesar Excel rutinas
│   │   └── matches/route.ts   # Procesar Excel métricas
│   ├── webhooks/
│   │   └── stripe/route.ts    # Webhook Stripe
│   └── templates/
│       ├── training.xlsx/route.ts  # Descargar template Excel
│       └── matches.xlsx/route.ts
components/
├── ui/                        # shadcn/ui components
├── dashboard/
├── roster/
├── upload/
└── charts/
lib/
├── supabase/
│   ├── client.ts              # Browser client
│   └── server.ts              # Server client (SSR)
├── excel/
│   ├── parser.ts              # Parsear Excel a objetos
│   ├── validator.ts           # Validar columnas
│   └── templates.ts           # Generar templates
├── stripe/
│   └── client.ts
└── email/
    └── invitations.ts
```

---

### PASO 4: Package compartido - DB Types

```bash
cd packages/db
```

Crear `packages/db/index.ts`:
- Exportar tipos generados por Supabase (`supabase gen types typescript`)
- Exportar cliente Supabase base
- Exportar helpers de queries comunes

```bash
# Generar tipos desde Supabase
supabase gen types typescript --project-id TU_PROJECT_ID > packages/db/types/database.types.ts
```

---

### PASO 5: Configurar Auth

#### Mobile (`packages/db/supabase.ts`):
```typescript
import AsyncStorage from '@react-native-async-storage/async-storage'
import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL!,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  }
)
```

#### Web (`apps/web/lib/supabase/server.ts`):
```typescript
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export function createClient() {
  const cookieStore = cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll() }, setAll(...) { ... } } }
  )
}
```

---

### PASO 6: Hook de Auth Mobile

Crear `apps/mobile/src/hooks/useAuth.ts`:
```typescript
// Debe manejar:
// - Estado: session, user, profile, loading
// - signIn(email, password)
// - signInWithGoogle()  ← OAuth via Supabase + expo-web-browser
// - signUp(email, password, fullName, role) → retorna { needsEmailVerification: true }
// - signOut()
// - updateProfile(data)
// - Escuchar cambios con supabase.auth.onAuthStateChange
// - Al hacer signIn, cargar perfil desde tabla profiles
// - Redirigir según rol:
//   physical_trainer/coach → (tabs)/index
//   player → (tabs)/profile
// - Si session existe pero email no confirmado → redirigir a (auth)/verify-email
```

---

### PASO 7: Middleware Next.js

Crear `apps/web/middleware.ts`:
```typescript
// Proteger rutas (dashboard) - redirigir a /login si no hay sesión
// Redirigir / hacia /dashboard si hay sesión activa
// Refreshar token automáticamente
```

---

### PASO 8: Variables de entorno

Crear archivos `.env.example`:

**apps/mobile/.env.example:**
```
EXPO_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJxxx
```

**apps/web/.env.example:**
```
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx
SUPABASE_SERVICE_ROLE_KEY=eyJxxx
# MercadoPago
MP_ACCESS_TOKEN=APP_USR-xxx
MP_PUBLIC_KEY=APP_USR-xxx
MP_WEBHOOK_SECRET=xxx
# WebPay (Transbank)
WEBPAY_COMMERCE_CODE=xxx
WEBPAY_API_KEY=xxx
WEBPAY_ENVIRONMENT=integration   # o 'production'
# Emails
RESEND_API_KEY=re_xxx
# Google OAuth (configurar también en Supabase dashboard)
NEXT_PUBLIC_GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**apps/mobile/.env.example:**
```
EXPO_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJxxx
EXPO_PUBLIC_GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
```

---

### PASO 9: Pantallas de Auth Mobile

Instalar dependencias adicionales para OAuth:
```bash
pnpm add expo-web-browser expo-auth-session
```

Configurar Google OAuth en Supabase:
- Dashboard → Authentication → Providers → Google → habilitar
- Agregar `EXPO_PUBLIC_GOOGLE_CLIENT_ID` al .env

Crear pantallas en `apps/mobile/src/app/(auth)/`:

**login.tsx:**
- Input email + password
- Botón "Iniciar Sesión"
- Separador "— o continuar con —"
- Botón "Continuar con Google" (ícono Google + texto, fondo blanco)
- Link "¿Olvidaste tu contraseña?"
- Link "Registrarse"
- Manejo de error con toast/alert
- Loading state en botón
- Diseño siguiendo el design system del HTML adjunto (colores #001e40, #003366, #0058bc)

**register.tsx:**
- Input nombre completo, email, password, confirm password
- Selector de rol: "Soy Preparador Físico" / "Soy Entrenador"
  (los jugadores se registran solo por invitación)
- Botón "Registrarme con Google" (crea cuenta con rol a seleccionar antes)
- Validación con Zod
- Al registrarse con email → redirigir a verify-email.tsx

**verify-email.tsx:**
- Pantalla intermedia: "Verifica tu correo"
- Texto: "Enviamos un enlace a [email]. Revisa tu bandeja de entrada."
- Botón "Reenviar correo" (con cooldown de 60 segundos)
- Botón "Ya verifiqué → Continuar" (refresca sesión y redirige si está confirmado)
- Link "Cambiar email" → vuelve a register

**forgot-password.tsx:**
- Input email
- Botón "Enviar link de recuperación"
- Usa `supabase.auth.resetPasswordForEmail`
- Mensaje de éxito: "Revisa tu correo"

#### Páginas web de Auth (`apps/web/src/app/(auth)/`):

**login/page.tsx:**
- Formulario email + password
- Botón "Iniciar sesión con Google"
- Link a register
- Redirect a /dashboard si hay sesión activa

**register/page.tsx:**
- Formulario nombre, email, password, confirm password, rol
- Botón "Registrarse con Google"
- Tras registro por email → mostrar banner "Revisa tu correo para confirmar tu cuenta"

**verify-email/page.tsx:**
- Página que Supabase carga al confirmar email (configurar como redirect URL)
- Extrae token de la URL → confirma con Supabase → redirige a /dashboard

---

### Colores del Design System (para referencia en todos los componentes):
```typescript
export const colors = {
  primary: '#001e40',
  secondary: '#0058bc', 
  primaryContainer: '#003366',
  surface: '#f8f9fa',
  surfaceContainer: '#edeeef',
  surfaceContainerLowest: '#ffffff',
  outline: '#737780',
  onPrimary: '#ffffff',
  tertiary: '#83fc8e',  // acento verde
  error: '#ba1a1a',
}
```
```

## Output esperado
- Monorepo funcional con `pnpm install` sin errores
- `pnpm dev` levanta mobile (Expo) y web (Next.js) simultáneamente
- Login/Register funcionales conectados a Supabase
- Redirección por rol funcionando
- Types de Supabase generados y exportados

## Validación
- `pnpm build` sin errores TypeScript
- Login con usuario de seed funciona
- RLS: jugador no puede ver datos de otro jugador
