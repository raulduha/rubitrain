import { createAdminClient, createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function DELETE(
  req: Request,
  { params }: { params: { uploadId: string } }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const url = new URL(req.url)
  const type = url.searchParams.get('type') as 'training' | 'matches' | null
  const table = type === 'matches' ? 'match_metrics' : 'performance_logs'

  const admin = await createAdminClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const a = admin as any

  // Find the team_id to verify ownership
  const { data: sample } = await a
    .from(table).select('team_id').eq('upload_id', params.uploadId).limit(1).single() as
    { data: { team_id: string } | null }

  if (!sample) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })

  const { data: team } = await a
    .from('teams').select('organizations(owner_id)').eq('id', sample.team_id).single() as
    { data: { organizations: { owner_id: string } } | null }

  if (!team || team.organizations.owner_id !== user.id) {
    return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
  }

  const { error } = await a.from(table).delete().eq('upload_id', params.uploadId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
