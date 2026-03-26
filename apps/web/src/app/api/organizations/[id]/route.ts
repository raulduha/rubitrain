import { createAdminClient, createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const admin = await createAdminClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const a = admin as any

  // Verificar ownership
  const { data: org } = await a
    .from('organizations')
    .select('owner_id')
    .eq('id', params.id)
    .single() as { data: { owner_id: string } | null }

  if (!org || org.owner_id !== user.id) {
    return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
  }

  // Obtener todos los teams del club
  const { data: teams } = await a
    .from('teams')
    .select('id')
    .eq('organization_id', params.id) as { data: { id: string }[] | null }

  const teamIds = teams?.map(t => t.id) ?? []

  if (teamIds.length > 0) {
    await a.from('performance_logs').delete().in('team_id', teamIds)
    await a.from('match_metrics').delete().in('team_id', teamIds)
    await a.from('training_sessions').delete().in('team_id', teamIds)
    await a.from('team_memberships').delete().in('team_id', teamIds)
    await a.from('invitations').delete().in('team_id', teamIds)
    await a.from('teams').delete().in('id', teamIds)
  }

  await a.from('subscriptions').delete().eq('organization_id', params.id)

  const { error } = await a.from('organizations').delete().eq('id', params.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
