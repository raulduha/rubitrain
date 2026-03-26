# TASKS.md — Estado del Proyecto RubiTrain

Última actualización: 2026-03-26

---

## ✅ COMPLETADO

### SPEC-01 — Base de Datos
- [x] Migración `001_initial_schema.sql` — 13 tablas creadas
- [x] Migración `002_rls_policies.sql` — RLS en todas las tablas
- [x] Migración `003_functions_triggers.sql` — triggers, `get_effective_plan()`, `accept_invitation()`
- [x] `seed.sql` con datos de prueba
- [x] Tipos TypeScript en `packages/db/types/database.types.ts`
- [x] Las 3 migraciones aplicadas a Supabase (confirmado)

### SPEC-02 — Setup del Proyecto
- [x] Monorepo Turborepo con pnpm workspaces
- [x] Next.js 14 (App Router) en `apps/web`
- [x] Supabase client (browser + server + admin) en `apps/web/src/lib/supabase/`
- [x] Auth email/password con verificación de email
- [x] Auth Google OAuth (callback en `/api/auth/callback`)
- [x] Middleware de protección de rutas (`/dashboard/*`)
- [x] Variables de entorno configuradas en `.env.local`

### SPEC-04 — Web Dashboard (Next.js)
- [x] Landing page (`/`) con Hero, Features, Pricing en CLP, CTA
- [x] Login (`/login`) — email/password + Google OAuth
- [x] Register (`/register`) — con selector de rol
- [x] Verify email (`/verify-email`) — con reenvío y botón de verificación
- [x] Layout dashboard con Sidebar (colapso de submenú "Subir Datos")
- [x] Dashboard overview (`/dashboard`) — KPIs y actividad reciente
- [x] Mis Clubes (`/dashboard/clubs`) — lista con conteo de jugadores
- [x] Detalle Club (`/dashboard/clubs/[id]`) — tabs Categorías + Entrenadores
- [x] Plantel (`/dashboard/roster/[teamId]`) — tabla filtrable con búsqueda
- [x] Invitar jugador — modal con invite por email (Resend) o creación manual
- [x] Subir rutinas (`/dashboard/upload/training`) — flujo 3 pasos con Excel
- [x] Subir métricas partido (`/dashboard/upload/matches`) — flujo 3 pasos
- [x] Templates Excel descargables (`/api/templates/training`, `/api/templates/matches`)
- [x] API upload training (`/api/upload/training`) — parse → Supabase
- [x] API upload matches (`/api/upload/matches`) — lookup por email → Supabase
- [x] Perfil jugador (`/dashboard/player/[id]`) — tabs Rendimiento, Partidos, Estado Físico
- [x] Billing (`/dashboard/billing`) — plan actual, conteo jugadores, tabla de planes
- [x] Invitaciones API (`/api/invitations`) — crear token + enviar email Resend
- [x] Accept invitation (`/api/invitations/[token]/accept`) — llama RPC Supabase
- [x] Página join (`/join`) — aceptar invitación con token
- [x] Build limpio sin errores TypeScript ✅

---

## ⏳ PENDIENTE

### SPEC-03 — App Mobile (Expo)
- [ ] Setup Expo Router en `apps/mobile`
- [ ] Design system: colors.ts, typography.ts (Lexend + Inter)
- [ ] Componentes: `PlayerCard`, `StatCard`, `SectionHeader`, `ExerciseCard`
- [ ] Bottom tab bar
- [ ] Pantalla Dashboard (entrenador y jugador)
- [ ] Pantalla Plantel con búsqueda y filtros
- [ ] Pantalla Análisis de Partidos
- [ ] Pantalla Planificador de Entrenamiento
- [ ] Pantalla Perfil Jugador (`/player/[id]`)
- [ ] Pantalla Mi Perfil
- [ ] Zustand stores: `authStore`, `teamStore`
- [ ] Notificaciones push (expo-notifications)
- [ ] Skeletons y empty states

### SPEC-05 — Pagos
- [ ] Recibir keys de MercadoPago (ACCESS_TOKEN) y WebPay (Transbank)
- [ ] MercadoPago: crear PreApproval plan (Pro y Club)
- [ ] MercadoPago: checkout flow en billing page
- [ ] MercadoPago: webhook handler (`/api/webhooks/mercadopago`)
- [ ] WebPay: init transaction (`/api/billing/webpay-init`)
- [ ] WebPay: confirm transaction (`/api/billing/webpay-confirm`)
- [ ] Feature gating: verificar `get_effective_plan()` antes de acciones limitadas
- [ ] Club billing: UI para que el club active plan que cubre a sus jugadores

### SPEC-06 — Deploy
- [ ] EAS config para iOS y Android
- [ ] Vercel deploy para la web
- [ ] GitHub Actions CI (build + type-check)
- [ ] Assets: icon, splash screen
- [ ] Variables de entorno en producción

---

## 🔑 Keys Pendientes

| Servicio | Variable | Estado |
|---------|----------|--------|
| MercadoPago | `MERCADOPAGO_ACCESS_TOKEN` | ❌ Pendiente |
| WebPay Commerce Code | `WEBPAY_COMMERCE_CODE` | ❌ Pendiente |
| WebPay API Key | `WEBPAY_API_KEY` | ❌ Pendiente |

Keys ya configuradas: Supabase URL/Anon/Service Role, Resend, Google OAuth (Web + iOS + Android)

---

## 🐛 Issues Conocidos

- El build usa muchos `(supabase as any)` porque los tipos generados de Supabase retornan `never` en queries con relaciones nested. Funciona correctamente en runtime.
- Google OAuth requiere que `https://lxnaizgzhiutxallmbvf.supabase.co/auth/v1/callback` esté en Google Cloud Console como redirect URI autorizado.
- Mobile (`apps/mobile`) no tiene código aún — solo existe el directorio.
