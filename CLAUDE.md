# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**CDUC Rugby / RubiTrain** — A multi-platform sports management app for rugby coaches and physical trainers. Built as a Turborepo monorepo with:
- `apps/mobile` — Expo React Native (iOS + Android)
- `apps/web` — Next.js 14 (App Router)
- `packages/db` — Supabase-generated TypeScript types
- `packages/ui` — Shared UI components
- `packages/utils` — Shared utilities

**Backend:** Supabase (PostgreSQL + Auth + Storage + RLS)
**Payments:** MercadoPago (suscripciones recurrentes) + WebPay/Transbank (pagos manuales mensuales)
**Auth:** Email/password con verificación + Google OAuth (via Supabase)
**Email:** Resend
**Package manager:** pnpm with Turborepo

> **Status:** SPEC-01 through SPEC-04 are implemented. Migrations applied to Supabase. Web dashboard is fully built and builds cleanly. SPEC-03 (mobile), SPEC-05 (payments), and SPEC-06 (deploy) are pending.

---

## Implementation Order

1. ✅ **SPEC-01** — Supabase schema (4 migrations applied), storage buckets, seed data
2. ✅ **SPEC-02** — Monorepo scaffold, Next.js setup, Supabase auth (email + Google OAuth)
3. ⏳ **SPEC-03** — Mobile screens (Expo Router) — not started
4. ✅ **SPEC-04** — Web dashboard: clubs, roster, upload (Excel), player detail, billing UI, invitations, player dashboard
5. ⏳ **SPEC-05** — MercadoPago + WebPay payments — API keys pending (trial buttons active in the meantime)
6. ⏳ **SPEC-06** — EAS build config, Vercel deploy, GitHub Actions CI

---

## Commands

```bash
pnpm install               # Install all workspace dependencies
pnpm dev                   # Run mobile (Expo) + web (Next.js) concurrently
pnpm --filter web dev      # Run web only
pnpm --filter web build    # Build web only
pnpm type-check            # TypeScript validation across workspace
pnpm lint                  # ESLint across workspace

# Supabase
supabase gen types typescript   # Regenerate DB types into packages/db

# EAS (mobile builds)
eas build --platform ios --profile preview
eas build --platform android --profile preview
```

If the dev server gives "Cannot find module './XYZ.js'" errors, delete `.next` and restart:
```bash
rm -rf apps/web/.next && pnpm --filter web dev
```

---

## Architecture

### Authentication & Roles

Login page has a role selector (Entrenador/Jugador) as step 1 before the form. The selection determines the post-login redirect:
- **Entrenador/Preparador** → `/dashboard`
- **Jugador** → `/dashboard/player`

Roles in `profiles.role`: `physical_trainer`, `coach`, `player`. A user can hold any role in `profiles` while also having player memberships in teams — the login selector determines which view they see, not `profiles.role`. **Do not use `profiles.role` to gate dashboard routing.**

Players can only register via invitation link (`/join?token=...`). The invitation flow:
1. Coach sends invite → `invitations` table entry created, email via Resend
2. Player opens link → chooses "Crear cuenta" or "Ya tengo cuenta"
3. On accept → `team_memberships` row created, redirect to `/verify-email` (new account) or `/dashboard/player` (existing account)
4. `accept_invitation` RPC handles the DB work; it does NOT update `profiles.role`

### Critical: RLS bypass pattern

**All server components in `/dashboard/*` use `createAdminClient()` for DB reads.** The RLS policies have a recursive dependency (`teams` ↔ `team_memberships` ↔ `organizations`) that causes queries to silently return `null` when using the user client. Migration `004_fix_rls_recursion.sql` partially addresses this with a `SECURITY DEFINER` function, but the reliable fix is using the admin client for reads.

```typescript
// ✅ Correct — use in all dashboard server components
const admin = await createAdminClient()
const { data } = await (admin as any).from('teams').select('...')

// ❌ Avoid for dashboard DB reads — RLS recursion silently returns null
const supabase = await createClient()
const { data } = await supabase.from('teams').select('...')
```

`createClient()` is still used for `supabase.auth.getUser()` (session validation only).

### `createAdminClient` implementation

Uses `createClient` from `@supabase/supabase-js` (plain), NOT `createServerClient` from `@supabase/ssr`. The SSR package reads cookies and can override the auth header with the user's JWT, negating the service role key.

```typescript
// apps/web/src/lib/supabase/server.ts
export async function createAdminClient() {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  )
}
```

### Web Routing (Next.js App Router)

Under `apps/web/src/app/`:
- `(auth)/login`, `(auth)/register`, `(auth)/verify-email` — auth routes (route group, no shared layout)
- `/dashboard/` — protected routes: page, clubs, clubs/[id], roster/[teamId], player, player/[id], upload/training, upload/matches, billing
- `/dashboard/player` — player-specific dashboard (performance comparison with teammates)
- `/join` — public invitation acceptance page (`?token=...`)
- `middleware.ts` — guards `/dashboard/*`, redirects unauthenticated users to `/login`

### Sidebar nav

The sidebar shows different nav items based on the current route — not the user's `profiles.role`:
- Path starts with `/dashboard/player` → player nav (Mi rendimiento only)
- Everything else → coach nav (Dashboard, Mis Clubes, Subir Datos, Suscripción)

### Supabase TypeScript types

The generated types in `@rubitrain/db` often produce `never` on nested selects. Workaround used throughout:
```typescript
const { data } = await (admin as any)
  .from('table_name')
  .select('*')
  as { data: YourExplicitType | null }
```

### physical_status embed limitation

`physical_status` has a FK to `profiles(id)` via `player_id`, but no FK to `team_memberships`. Embedding it inside a `team_memberships` select (`physical_status(status, is_current)`) silently fails — the query returns `null`. Always fetch it separately:

```typescript
// ❌ Silently returns null — no FK between team_memberships and physical_status
.from('team_memberships').select('*, physical_status(status, is_current)')

// ✅ Fetch separately
const { data: statuses } = await admin.from('physical_status')
  .select('player_id, status').in('player_id', playerIds).eq('is_current', true)
```

### Excel Import Pipeline

`POST /api/upload/training` and `/api/upload/matches` receive Excel files, parse with `xlsx`, validate, and bulk-insert. Templates at `/api/templates/training` and `/api/templates/matches`.

### Billing

Three plans: Free (5 players), Pro ($14.900 CLP/mo, 30 players), Club ($44.900 CLP/mo, unlimited). Currently using trial buttons (`POST /api/billing/trial`) while MercadoPago/WebPay API keys are pending. SQL function `get_effective_plan(user_id)` returns the effective plan (personal or org-level).

### Invitations email

Resend `from` is `onboarding@resend.dev` (test domain) until `rubitrain.cl` is verified in Resend. When `emailError` is returned, the `/join` URL is displayed in the UI for manual sharing.

---

## Design System

Web uses **Tailwind CSS**. Key colors: `#001e40` (dark navy, primary), `#0058bc` (blue, accent), `#83fc8e` (green, logo accent), `#f8f9fa` (light gray, backgrounds).

Mobile uses **NativeWind** (Tailwind for React Native) + Lexend/Inter fonts.

---

## Known Gotchas

### Google OAuth setup
- Supabase callback URL in Google Cloud Console: `https://lxnaizgzhiutxallmbvf.supabase.co/auth/v1/callback`
- App callback: `/api/auth/callback` — supports `?next=` param for post-login redirect

### New Supabase key format
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` starts with `sb_publishable_...`
- `SUPABASE_SERVICE_ROLE_KEY` starts with `sb_secret_...`

### `APP_URL` in invitations
`/api/invitations/route.ts` uses `NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'` to build the join link. Make sure this env var is set correctly in production.
