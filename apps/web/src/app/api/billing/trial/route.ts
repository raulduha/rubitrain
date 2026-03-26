import { createAdminClient, createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { plan, billingType = 'personal', orgId } = await req.json() as {
    plan: 'pro' | 'club'
    billingType?: 'personal' | 'organization'
    orgId?: string
  }

  if (!['pro', 'club'].includes(plan)) {
    return NextResponse.json({ error: 'Plan inválido' }, { status: 400 })
  }

  if (billingType === 'organization' && !orgId) {
    return NextResponse.json({ error: 'Falta orgId' }, { status: 400 })
  }

  // Si es plan de organización, verificar que el usuario es owner
  if (billingType === 'organization' && orgId) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: org } = await (supabase as any)
      .from('organizations')
      .select('owner_id')
      .eq('id', orgId)
      .single() as { data: { owner_id: string } | null }

    if (!org || org.owner_id !== user.id) {
      return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
    }
  }

  const admin = await createAdminClient()
  const periodEnd = new Date()
  periodEnd.setDate(periodEnd.getDate() + 30)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (admin as any)
    .from('subscriptions')
    .upsert({
      payer_id: user.id,
      organization_id: billingType === 'organization' ? orgId : null,
      plan,
      billing_type: billingType,
      status: 'active',
      payment_provider: null,
      current_period_end: periodEnd.toISOString(),
    }, { onConflict: 'payer_id' })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true, plan, billingType })
}
