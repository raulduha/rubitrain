# SPEC-05: Pagos y Suscripciones (Stripe)

## Contexto
Modelo de cobro: suscripción mensual por plan (Free/Pro/Club). El physical_trainer es quien paga. Implementar con Stripe Billing + webhooks.

## Prompt para Claude Code

```
Implementa el sistema completo de pagos con Stripe.

### PRODUCTOS EN STRIPE (crear con Stripe CLI o dashboard)

```bash
# Crear productos
stripe products create --name="CDUC Free" --metadata="plan=free"
stripe products create --name="CDUC Pro" --metadata="plan=pro"  
stripe products create --name="CDUC Club" --metadata="plan=club"

# Crear precios mensuales (en CLP o USD - usar USD para App Store)
stripe prices create \
  --product=prod_XXX \
  --unit-amount=1500 \
  --currency=usd \
  --recurring[interval]=month \
  --nickname="Pro Monthly"

stripe prices create \
  --product=prod_YYY \
  --unit-amount=4500 \
  --currency=usd \
  --recurring[interval]=month \
  --nickname="Club Monthly"
```

Guardar los Price IDs en variables de entorno:
```
STRIPE_PRICE_PRO=price_xxx
STRIPE_PRICE_CLUB=price_yyy
```

---

### FLUJO DE SUSCRIPCIÓN

**1. Registro inicial:**
- Al crear cuenta como physical_trainer → plan Free automáticamente
- Crear customer en Stripe y guardar `stripe_customer_id` en subscriptions

**2. Upgrade:**
- Usuario en billing page → click "Actualizar Plan"
- Crear Stripe Checkout Session con:
  - customer: stripe_customer_id del usuario
  - mode: 'subscription'
  - line_items: [{ price: PRICE_ID, quantity: 1 }]
  - success_url, cancel_url
- Redirigir a Stripe Checkout

**3. Webhook procesa el pago:**
- `customer.subscription.created` → actualizar plan en subscriptions
- `customer.subscription.updated` → actualizar plan
- `customer.subscription.deleted` → degradar a Free
- `invoice.payment_failed` → marcar past_due, enviar email

---

### IMPLEMENTACIÓN

**`lib/stripe/client.ts`:**
```typescript
import Stripe from 'stripe'
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-04-10',
  typescript: true,
})
```

**`app/api/billing/create-checkout/route.ts`:**
```typescript
// POST body: { priceId, returnUrl }
// 1. Obtener usuario logueado (Supabase server client)
// 2. Obtener o crear stripe_customer_id:
//    - Si ya existe en subscriptions → usar ese
//    - Si no → stripe.customers.create({ email, name, metadata: { userId } })
//    → guardar en subscriptions
// 3. Crear checkout session:
const session = await stripe.checkout.sessions.create({
  customer: stripeCustomerId,
  mode: 'subscription',
  payment_method_types: ['card'],
  line_items: [{ price: priceId, quantity: 1 }],
  success_url: `${returnUrl}?success=true&session_id={CHECKOUT_SESSION_ID}`,
  cancel_url: `${returnUrl}?cancelled=true`,
  subscription_data: {
    metadata: { userId, supabaseUserId: userId }
  },
  allow_promotion_codes: true,
})
// 4. Retornar { url: session.url }
```

**`app/api/billing/portal/route.ts`:**
```typescript
// POST - crear Customer Portal session para gestionar suscripción
// (cambiar plan, cancelar, actualizar método de pago)
const session = await stripe.billingPortal.sessions.create({
  customer: stripeCustomerId,
  return_url: returnUrl,
})
return Response.json({ url: session.url })
```

**`app/api/webhooks/stripe/route.ts`:**
```typescript
// Verificar firma: stripe.webhooks.constructEvent(body, sig, WEBHOOK_SECRET)
// 
// Manejar eventos:
export async function POST(req: Request) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')!
  
  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch { return Response.json({ error: 'Invalid signature' }, { status: 400 }) }
  
  const supabase = createAdminClient() // Service role key
  
  switch (event.type) {
    case 'customer.subscription.created':
    case 'customer.subscription.updated': {
      const sub = event.data.object as Stripe.Subscription
      const userId = sub.metadata.supabaseUserId
      const plan = getPlanFromPriceId(sub.items.data[0].price.id)
      
      await supabase.from('subscriptions').upsert({
        owner_id: userId,
        stripe_subscription_id: sub.id,
        plan,
        status: sub.status,
        current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
        updated_at: new Date().toISOString(),
      }, { onConflict: 'owner_id' })
      break
    }
    
    case 'customer.subscription.deleted': {
      const sub = event.data.object as Stripe.Subscription
      const userId = sub.metadata.supabaseUserId
      await supabase.from('subscriptions').update({
        plan: 'free',
        status: 'cancelled',
        stripe_subscription_id: null,
      }).eq('owner_id', userId)
      break
    }
    
    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice
      // Notificar al usuario por email
      break
    }
  }
  
  return Response.json({ received: true })
}

function getPlanFromPriceId(priceId: string): 'free' | 'pro' | 'club' {
  if (priceId === process.env.STRIPE_PRICE_PRO) return 'pro'
  if (priceId === process.env.STRIPE_PRICE_CLUB) return 'club'
  return 'free'
}
```

---

### GUARDIA DE LÍMITES (Feature Gating)

**`lib/subscription/limits.ts`:**
```typescript
export const PLAN_LIMITS = {
  free:  { players: 5,   clubs: 1, excelUpload: false },
  pro:   { players: 30,  clubs: 3, excelUpload: true  },
  club:  { players: 9999, clubs: 99, excelUpload: true },
}

export async function checkPlayerLimit(userId: string, supabase: SupabaseClient) {
  const { data: sub } = await supabase
    .from('subscriptions')
    .select('plan, active_players_count')
    .eq('owner_id', userId)
    .single()
  
  const plan = sub?.plan ?? 'free'
  const current = sub?.active_players_count ?? 0
  const limit = PLAN_LIMITS[plan].players
  
  return { allowed: current < limit, current, limit, plan }
}
```

**Usar en API routes:**
```typescript
// En /api/invitations/route.ts antes de crear invitación:
const check = await checkPlayerLimit(userId, supabase)
if (!check.allowed) {
  return Response.json({
    error: 'PLAYER_LIMIT_REACHED',
    message: `Tu plan ${check.plan} permite máximo ${check.limit} jugadores.`,
    upgradeUrl: '/dashboard/billing'
  }, { status: 403 })
}
```

**UI de límites:**
- Progress bar en sidebar: "12/30 jugadores"
- Banner amarillo cuando está al 80%: "Te quedan X jugadores disponibles"
- Modal de upgrade cuando intenta pasar el límite

---

### PÁGINA DE BILLING ACTUALIZADA

```typescript
// app/(dashboard)/billing/page.tsx
// 
// Cargar:
// - subscriptions del usuario (plan, status, current_period_end)
// - active_players_count (query a team_memberships)
// 
// Mostrar:
// - Plan actual con badge de color
// - Período actual y próxima renovación
// - Uso: X/Y jugadores (progress bar)
// - Tabla de planes con checkmarks de features
// - Si plan = free: botones "Upgrade a Pro" / "Upgrade a Club"
// - Si plan = pro/club: botón "Gestionar suscripción" → Customer Portal
// - Historial de facturas (via stripe.invoices.list({ customer }))
```

---

### CONFIGURAR STRIPE EN LOCAL

```bash
# Instalar Stripe CLI
brew install stripe/stripe-cli/stripe

# Login
stripe login

# Escuchar webhooks en local
stripe listen --forward-to localhost:3000/api/webhooks/stripe

# El CLI muestra el webhook secret para .env.local
```

---

### MOBILE: IMPORTANTE (App Store / Google Play)

⚠️ Apple y Google cobran 30% de comisión en pagos in-app.
Para evitar esto, los pagos se hacen SOLO en la web.
En la app mobile:
- NO mostrar precios ni botones de pago
- Si el usuario está en free y llega al límite → mostrar:
  "Para más jugadores, actualiza tu plan en cduc.app/billing"
- Link que abre el browser del dispositivo
- Esto cumple con las políticas de App Store
```

## Output esperado
- Checkout de Stripe funcionando (modo test)
- Webhook procesando eventos correctamente
- Feature gating funcionando (bloquear upload Excel en Free)
- Página de billing mostrando plan y uso actual
- Customer Portal para gestionar suscripción

## Validación
- Completar checkout con tarjeta test (4242 4242 4242 4242)
- Verificar que plan cambia a Pro en Supabase
- Intentar agregar jugador 31 en plan Pro → error con mensaje de upgrade
- Cancelar suscripción → vuelve a Free
