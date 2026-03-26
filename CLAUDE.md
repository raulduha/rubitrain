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

> **Status:** SPEC-01 through SPEC-04 are implemented. Migrations applied to Supabase. Web dashboard is fully built and builds cleanly. SPEC-05 (payments) and SPEC-06 (deploy) are pending.

---

## Implementation Order

Execute specs strictly in order. Each spec builds on the previous:

1. ✅ **SPEC-01** — Supabase schema (3 migrations applied), storage buckets, seed data
2. ✅ **SPEC-02** — Monorepo scaffold, Next.js setup, Supabase auth (email + Google OAuth)
3. ⏳ **SPEC-03** — Mobile screens (Expo Router) — not started
4. ✅ **SPEC-04** — Web dashboard complete: clubs, roster, upload (Excel), player detail, billing UI, invitations
5. ⏳ **SPEC-05** — MercadoPago + WebPay payments — API keys pending
6. ⏳ **SPEC-06** — EAS build config, Vercel deploy, GitHub Actions CI

Recommended git workflow: create a branch per spec (`spec-01-database`, etc.), commit, merge to `main`.

---

## Commands (post-setup)

```bash
pnpm install          # Install all workspace dependencies
pnpm dev              # Run mobile (Expo) + web (Next.js) concurrently
pnpm build            # Build all apps
pnpm --filter web build    # Build web only
pnpm --filter mobile build # Build mobile only
pnpm type-check       # TypeScript validation across workspace
pnpm lint             # ESLint across workspace

# Supabase
supabase db reset                        # Apply migrations + seed
supabase gen types typescript            # Regenerate DB types into packages/db

# MercadoPago / WebPay (local dev)
# Webhooks: /api/webhooks/mercadopago  and  /api/billing/webpay-confirm
# Keys: MERCADOPAGO_ACCESS_TOKEN and WEBPAY_* vars in .env.local (pending)

# EAS (mobile builds)
eas build --platform ios --profile preview
eas build --platform android --profile preview
```

---

## Architecture

### Authentication & Roles
Supabase Auth is the identity layer. Supports two sign-in methods:
- **Email/password** — requires email verification before accessing the app. After signup, user lands on a `verify-email` screen until Supabase confirms the email.
- **Google OAuth** — via Supabase Google provider (`expo-web-browser` on mobile, standard redirect on web). No email verification step needed.

On signup, a database trigger creates a `profiles` record with role (`physical_trainer`, `coach`, `player`). Players can only register via invitation link. Route protection:
- **Mobile:** Zustand store + `useAuth` hook manage auth state; Expo Router handles redirects. If session exists but email unconfirmed → redirect to `(auth)/verify-email`.
- **Web:** `middleware.ts` checks session server-side; SSR Supabase client for protected pages.

### Data Access (RLS)
All 12 tables enforce Row Level Security. Key policies:
- Physical trainers: full access to their `organizations` and all downstream data
- Coaches: read/write access to their assigned teams only
- Players: read-only access to their own records

### Mobile Routing (Expo Router)
File-based routing under `apps/mobile/src/app/`:
- `(auth)/` — login, register, forgot-password (unauthenticated)
- `(tabs)/` — bottom tab nav: dashboard, roster, matches, training, profile
- `player/[id]`, `session/[id]` — dynamic detail screens

### Web Routing (Next.js App Router)
Under `apps/web/src/app/`:
- `/login`, `/register`, `/verify-email` — flat auth routes (NOT a route group)
- `/dashboard/` — all protected routes: clubs, clubs/[id], roster/[teamId], upload/training, upload/matches, player/[id], billing
- `/join` — public invitation acceptance page (`?token=...`)
- `/` — public landing page
- `middleware.ts` — guards `/dashboard/*`

> **Important:** Auth pages are flat routes, not `(auth)/` route groups. Dashboard is `/dashboard/` (real directory), not `(dashboard)/`. Using route groups caused a 404 bug — do not revert.

### Excel Import Pipeline
`POST /api/upload/training` and `/api/upload/matches` receive Excel files, parse with `xlsx`, validate, and bulk-insert into Supabase. Templates are generated server-side at `/api/templates/*`.

### Billing (MercadoPago + WebPay)
Three plans: Free (5 players), Pro ($14.900 CLP/mo, 30 players), Club ($44.900 CLP/mo, unlimited).

Two payment providers:
- **MercadoPago** — suscripciones recurrentes automáticas via PreApproval API. Webhook en `/api/webhooks/mercadopago`.
- **WebPay (Transbank)** — pago único manual que activa el plan por 30 días. Init en `/api/billing/webpay-init`, confirmación en `/api/billing/webpay-confirm`.

Two billing models:
- **Personal** (`billing_type='personal'`): el physical_trainer paga, cubre sus jugadores.
- **Organización** (`billing_type='organization'`): el club paga, todos los miembros de la org quedan cubiertos. Los jugadores no necesitan pagar. La función SQL `get_effective_plan(user_id)` devuelve el plan efectivo (personal o del club).

Feature gating llama a `get_effective_plan()` antes de verificar límites. Mobile no muestra pagos (App Store compliance) — redirige a la web.

### Invitations
`/api/invitations` creates signed tokens stored in the `invitations` table (7-day expiry) and sends emails via Resend. Acceptance creates the user + team membership.

---

## Design System

Mobile uses **NativeWind** (Tailwind for React Native) + **Lexend/Inter** fonts. Web uses **Tailwind CSS** + **shadcn/ui**. Color palette and typography are defined in SPEC-03 (mobile) and SPEC-04 (web) — follow them exactly.

---

## Known Patterns & Gotchas

### Supabase TypeScript types return `never` on nested selects
When using `.select('*, related_table(*)')` or inserting into tables, the generated types in `@rubitrain/db` often produce `never`. Workaround used throughout the codebase:
```typescript
const { data } = await (supabase as any)
  .from('table_name')
  .select('...')
  as { data: YourExplicitType | null }
```
This is intentional — do not remove the casts.

### Google OAuth setup
- Supabase callback URL must be added to Google Cloud Console authorized redirect URIs: `https://lxnaizgzhiutxallmbvf.supabase.co/auth/v1/callback`
- App callback is at `/api/auth/callback`

### New Supabase key format
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` starts with `sb_publishable_...`
- `SUPABASE_SERVICE_ROLE_KEY` starts with `sb_secret_...`
