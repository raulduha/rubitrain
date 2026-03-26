import { createAdminClient, createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const body = await req.json() as { position_group?: 'forward' | 'back' | null }

  const admin = await createAdminClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const a = admin as any

  const { data: membership } = await a
    .from('team_memberships')
    .select('team_id, teams(organizations(owner_id))')
    .eq('id', params.id)
    .single() as { data: { team_id: string; teams: { organizations: { owner_id: string } } } | null }

  if (!membership || membership.teams.organizations.owner_id !== user.id) {
    return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
  }

  const { error } = await a.from('team_memberships')
    .update({ position_group: body.position_group ?? null }).eq('id', params.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}

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

  // Verificar que el usuario es owner de la org del equipo de esta membership
  const { data: membership } = await a
    .from('team_memberships')
    .select('team_id, teams(organizations(owner_id))')
    .eq('id', params.id)
    .single() as { data: { team_id: string; teams: { organizations: { owner_id: string } } } | null }

  if (!membership || membership.teams.organizations.owner_id !== user.id) {
    return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
  }

  const { error } = await a.from('team_memberships').delete().eq('id', params.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
