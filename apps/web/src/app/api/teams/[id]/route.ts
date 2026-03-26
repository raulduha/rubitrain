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
  const { data: team } = await a
    .from('teams')
    .select('organization_id, organizations(owner_id)')
    .eq('id', params.id)
    .single() as { data: { organization_id: string; organizations: { owner_id: string } } | null }

  if (!team || team.organizations.owner_id !== user.id) {
    return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
  }

  // Borrar en orden para respetar FK constraints
  await a.from('performance_logs').delete().eq('team_id', params.id)
  await a.from('match_metrics').delete().eq('team_id', params.id)
  await a.from('training_sessions').delete().eq('team_id', params.id)
  await a.from('team_memberships').delete().eq('team_id', params.id)
  await a.from('invitations').delete().eq('team_id', params.id)

  const { error } = await a.from('teams').delete().eq('id', params.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
