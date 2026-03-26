# SPEC-05: Pagos y Suscripciones (MercadoPago + WebPay)

## Contexto
Modelo de cobro: suscripción mensual por plan (Free/Pro/Club).

Dos modelos de billing:
- **Personal:** el physical_trainer paga y el plan cubre a los jugadores de sus equipos.
- **Organización (Club):** el club paga una membresía que cubre a todos los miembros de la organización (preparadores, entrenadores, jugadores). Los jugadores del club no necesitan pagar individualmente.

Proveedores:
- **MercadoPago** — suscripciones recurrentes automáticas (principal).
- **WebPay (Transbank)** — pago único manual con renovación mensual (alternativo, específico para Chile).

## Prompt para Claude Code

```
Implementa el sistema completo de pagos con MercadoPago y WebPay.

---

### DEPENDENCIAS

```bash
# apps/web
pnpm add mercadopago                  # MercadoPago SDK oficial
pnpm add transbank-sdk                # WebPay / Transbank
```

---

### PLANES Y PRECIOS

```typescript
// lib/subscription/plans.ts
export const PLANS = {
  free: {
    name: 'Free',
    price_clp: 0,
    players: 5,
    clubs: 1,
    excelUpload: false,
  },
  pro: {
    name: 'Pro',
    price_clp: 14900,       // CLP mensual
    players: 30,
    clubs: 3,
    excelUpload: true,
    mp_plan_id: process.env.MP_PLAN_ID_PRO,
  },
  club: {
    name: 'Club',
    price_clp: 44900,       // CLP mensual
    players: 9999,
    clubs: 99,
    excelUpload: true,
    mp_plan_id: process.env.MP_PLAN_ID_CLUB,
  },
} as const

export type PlanKey = keyof typeof PLANS
```

Agregar en `.env`:
```
MP_PLAN_ID_PRO=2c93808...      # ID del plan en MercadoPago
MP_PLAN_ID_CLUB=2c93808...
```

---

### CLIENTES DE PAGO

**`lib/payments/mercadopago.ts`:**
```typescript
import { MercadoPagoConfig, PreApproval, PreApprovalPlan, Payment } from 'mercadopago'

export const mp = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN!,
})

export const mpPreApproval = new PreApproval(mp)
export const mpPlan = new PreApprovalPlan(mp)
export const mpPayment = new Payment(mp)
```

**`lib/payments/webpay.ts`:**
```typescript
import { WebpayPlus, Options, IntegrationApiKeys, IntegrationCommerceCodes, Environment } from 'transbank-sdk'

const isProduction = process.env.WEBPAY_ENVIRONMENT === 'production'

export const webpay = new WebpayPlus.Transaction(
  new Options(
    isProduction ? process.env.WEBPAY_COMMERCE_CODE! : IntegrationCommerceCodes.WEBPAY_PLUS,
    isProduction ? process.env.WEBPAY_API_KEY! : IntegrationApiKeys.WEBPAY_PLUS,
    isProduction ? Environment.Production : Environment.Integration,
  )
)
```

---

### FLUJO MERCADOPAGO (Suscripciones recurrentes)

#### Configurar planes en MercadoPago (una sola vez)
```typescript
// script: scripts/create-mp-plans.ts
// Ejecutar una vez para crear los planes en MP y guardar los IDs en .env

const proPlan = await mpPlan.create({
  body: {
    reason: 'CDUC Pro',
    auto_recurring: {
      frequency: 1,
      frequency_type: 'months',
      transaction_amount: 14900,
      currency_id: 'CLP',
    },
    back_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/billing`,
  }
})
// Guardar proPlan.id → MP_PLAN_ID_PRO en .env
```

#### API Route: Crear suscripción MercadoPago
**`app/api/billing/mp-subscribe/route.ts`:**
```typescript
// POST body: { planKey: 'pro' | 'club', billingType: 'personal' | 'organization', organizationId?: string }
//
// 1. Verificar usuario y rol (solo physical_trainer puede iniciar pagos)
// 2. Verificar límites si billingType = 'organization' (debe ser owner de la org)
// 3. Crear PreApproval (suscripción) en MP:
const sub = await mpPreApproval.create({
  body: {
    preapproval_plan_id: PLANS[planKey].mp_plan_id,
    reason: `CDUC ${PLANS[planKey].name}`,
    payer_email: user.email,
    back_url: `${APP_URL}/dashboard/billing?mp_result=success`,
    // Metadata para identificar en webhook
    external_reference: JSON.stringify({
      userId: user.id,
      billingType,
      organizationId: organizationId ?? null,
      plan: planKey,
    }),
  }
})
// 4. Retornar { init_point: sub.init_point } → redirigir al usuario ahí
```

#### Webhook MercadoPago
**`app/api/webhooks/mercadopago/route.ts`:**
```typescript
// MP envía POST con { type, data: { id } }
// Verificar firma con header 'x-signature' y MP_WEBHOOK_SECRET
//
// Manejar:
// - type === 'subscription_preapproval':
//   - Obtener detalles: await mpPreApproval.get({ id })
//   - Parsear external_reference para obtener userId, billingType, organizationId, plan
//   - Según status:
//     - 'authorized' → upsert en subscriptions con status='active'
//     - 'paused' | 'cancelled' → actualizar status, degradar a free si cancelled
//     - 'pending' → actualizar status

export async function POST(req: Request) {
  const body = await req.json()
  const xSignature = req.headers.get('x-signature')
  // Validar firma...

  if (body.type === 'subscription_preapproval') {
    const preapproval = await mpPreApproval.get({ id: body.data.id })
    const ref = JSON.parse(preapproval.external_reference!)
    const supabase = createAdminClient()

    const plan = preapproval.status === 'authorized' ? ref.plan : 'free'
    const status = preapproval.status === 'authorized' ? 'active'
      : preapproval.status === 'paused' ? 'past_due' : 'cancelled'

    await supabase.from('subscriptions').upsert({
      payer_id: ref.userId,
      organization_id: ref.organizationId ?? null,
      billing_type: ref.billingType,
      payment_provider: 'mercadopago',
      mp_preapproval_id: preapproval.id,
      plan,
      status,
      current_period_end: preapproval.next_payment_date
        ? new Date(preapproval.next_payment_date).toISOString()
        : null,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'payer_id' })
  }

  return Response.json({ received: true })
}
```

---

### FLUJO WEBPAY (Pago manual mensual — alternativa)

WebPay no soporta suscripciones automáticas nativas. Implementar como "pago mensual manual": el usuario paga cada mes y se le activa el plan por 30 días.

#### API Route: Iniciar pago WebPay
**`app/api/billing/webpay-init/route.ts`:**
```typescript
// POST body: { planKey: 'pro' | 'club', billingType: 'personal' | 'organization', organizationId?: string }
//
const buyOrder = `CDUC-${userId}-${Date.now()}`
const sessionId = `session-${userId}`
const amount = PLANS[planKey].price_clp
const returnUrl = `${APP_URL}/api/billing/webpay-confirm`

const response = await webpay.create(buyOrder, sessionId, amount, returnUrl)
// Guardar en tabla temporal webpay_pending_payments:
//   { token: response.token, user_id, plan, billing_type, organization_id }
// Retornar { url: response.url, token: response.token }
// Frontend redirige a response.url con POST del token
```

#### API Route: Confirmar pago WebPay
**`app/api/billing/webpay-confirm/route.ts`:**
```typescript
// GET con query param ?token_ws=xxx (WebPay redirige aquí)
// 1. Confirmar transacción: const result = await webpay.commit(token)
// 2. Si result.status === 'AUTHORIZED':
//    - Leer datos de webpay_pending_payments con ese token
//    - Upsert en subscriptions con plan, status='active'
//    - current_period_end = ahora + 30 días
//    - payment_provider = 'webpay'
//    - Redirigir a /dashboard/billing?webpay_result=success
// 3. Si no → redirigir con error
```

Crear tabla auxiliar (agregar en SPEC-01 migrations):
```sql
-- supabase/migrations/004_webpay_pending.sql
create table webpay_pending_payments (
  token text primary key,
  user_id uuid references profiles(id),
  plan text,
  billing_type text,
  organization_id uuid references organizations(id),
  created_at timestamptz default now()
);
-- RLS: solo service_role puede leer/escribir
```

---

### MODELO CLUB: ORGANIZACIÓN PAGA POR SUS MIEMBROS

#### En la página de billing — nueva sección "Plan del Club"

```typescript
// app/(dashboard)/billing/page.tsx
//
// Mostrar dos secciones:
//
// 1. "Mi plan personal" — suscripción donde billing_type = 'personal'
//    (el preparador paga, cubre sus jugadores)
//
// 2. "Plan del Club" — suscripción donde billing_type = 'organization'
//    - Toggle: "Activar plan para toda la organización [nombre]"
//    - Descripción: "El club paga la membresía y todos los miembros quedan cubiertos
//      automáticamente. Los jugadores y entrenadores no necesitan pagar."
//    - Mismos planes Pro/Club con precio igual
//    - Si ya existe plan de club activo para esa org: mostrar estado y botón "Gestionar"

// Si un usuario (jugador o coach) pertenece a una org con plan de club activo,
// mostrar en su billing page:
// "Tu club [nombre] tiene plan [Pro/Club] activo. Estás cubierto por el club."
```

#### Feature gating — usar función de BD

```typescript
// lib/subscription/limits.ts

export async function getEffectivePlan(
  userId: string,
  supabase: SupabaseClient
): Promise<PlanKey> {
  // Llama a la función SQL get_effective_plan(userId) de SPEC-01
  const { data } = await supabase.rpc('get_effective_plan', { p_user_id: userId })
  return (data as PlanKey) ?? 'free'
}

export async function checkPlayerLimit(userId: string, supabase: SupabaseClient) {
  const plan = await getEffectivePlan(userId, supabase)
  const { data: sub } = await supabase
    .from('subscriptions')
    .select('active_players_count')
    .or(`payer_id.eq.${userId},organization_id.in.(
      select organization_id from team_memberships
      join teams on teams.id = team_memberships.team_id
      where team_memberships.user_id = '${userId}'
    )`)
    .single()

  const current = sub?.active_players_count ?? 0
  const limit = PLANS[plan].players
  return { allowed: current < limit, current, limit, plan }
}
```

---

### PÁGINA DE BILLING

```typescript
// app/(dashboard)/billing/page.tsx
//
// Cargar:
// - subscripción personal del usuario (payer_id = userId, billing_type = 'personal')
// - subscripción de club si el usuario es owner de una org (billing_type = 'organization')
// - plan efectivo del usuario (puede venir del club)
// - active_players_count
//
// Mostrar:
// SECCIÓN 1 — Plan personal
// - Plan actual, estado, próxima renovación
// - Uso: X/Y jugadores (progress bar)
// - Tabla comparativa de planes con botones de upgrade
// - Selector de proveedor: "Pagar con MercadoPago" | "Pagar con WebPay"
// - Si tiene suscripción MP activa: botón "Cancelar suscripción" → mpPreApproval.updateStatus('cancelled')
//
// SECCIÓN 2 — Plan del Club (solo si es owner de una org)
// - Toggle para activar/desactivar plan de club
// - Si activo: badge con plan, fecha renovación
// - Mismos botones de upgrade y selector de proveedor
// - Nota: "Al activar el plan del club, todos los miembros de [org] quedan cubiertos"
//
// SECCIÓN 3 — Si el usuario NO es owner y pertenece a un club con plan activo:
// - Banner: "Cubierto por [Nombre del Club] — Plan [Pro/Club]"
```

---

### MOBILE: Sin pagos en la app

⚠️ Apple y Google cobran 30% de comisión en pagos in-app.
Los pagos se realizan SOLO en la web.

En mobile:
- NO mostrar precios ni botones de pago
- Si el usuario llega al límite → mostrar:
  "Para más jugadores, actualiza tu plan en cduc.app/billing"
- Link que abre el browser del dispositivo
- Si el usuario está cubierto por su club: mostrar badge "Plan Pro — Club [nombre]" en pantalla de perfil

---

### CONFIGURACIÓN LOCAL

```bash
# Escuchar webhooks MercadoPago en local (usar ngrok o similar)
ngrok http 3000
# Configurar la URL de ngrok en MercadoPago dashboard → Notificaciones

# WebPay usa el entorno de integración automáticamente si WEBPAY_ENVIRONMENT=integration
# No requiere configuración adicional en local
```

---

### VARIABLES DE ENTORNO ADICIONALES

```
# MercadoPago
MP_ACCESS_TOKEN=APP_USR-xxx
MP_PUBLIC_KEY=APP_USR-xxx
MP_WEBHOOK_SECRET=xxx
MP_PLAN_ID_PRO=2c93808...
MP_PLAN_ID_CLUB=2c93808...

# WebPay
WEBPAY_COMMERCE_CODE=597055555532   # código de integración por defecto
WEBPAY_API_KEY=579B532A7440BB0C9079DED94D31EA1615BACEB56610332264630D42D0A36B1C
WEBPAY_ENVIRONMENT=integration
```
```

## Output esperado
- Suscripción MercadoPago funcionando (modo sandbox)
- Pago manual WebPay funcionando (ambiente de integración)
- Feature gating funcionando (bloquear upload Excel en Free)
- Página de billing con sección personal y sección de club
- Jugadores cubiertos por su club pueden usar features sin pagar

## Validación
- Completar suscripción MP en sandbox → plan cambia a Pro en Supabase
- Completar pago WebPay en integración → plan activo por 30 días
- Activar plan de club → jugador del club accede a features sin suscripción propia
- Jugador intenta agregar jugador 31 en plan Pro → error con mensaje de upgrade
- Cancelar suscripción MP → vuelve a Free
