import { createAdminClient, createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const admin = await createAdminClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const a = admin as any

  const { data: team } = await a
    .from('teams').select('id, organizations(owner_id)').eq('id', params.id).single() as
    { data: { id: string; organizations: { owner_id: string } } | null }

  if (!team || team.organizations.owner_id !== user.id) {
    return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
  }

  const [perfRes, matchRes] = await Promise.all([
    a.from('performance_logs')
      .select('upload_id, log_date, player_id, created_at')
      .eq('team_id', params.id)
      .not('upload_id', 'is', null) as
      { data: { upload_id: string; log_date: string; player_id: string; created_at: string }[] | null },
    a.from('match_metrics')
      .select('upload_id, match_date, player_id, created_at')
      .eq('team_id', params.id)
      .not('upload_id', 'is', null) as
      { data: { upload_id: string; match_date: string; player_id: string; created_at: string }[] | null },
  ])

  type RawSession = {
    upload_id: string; date: string; player_ids: Set<string>
    created_at: string; type: 'training' | 'matches'
  }
  const map = new Map<string, RawSession>()

  for (const row of (perfRes.data ?? [])) {
    if (!map.has(row.upload_id)) {
      map.set(row.upload_id, { upload_id: row.upload_id, date: row.log_date, player_ids: new Set(), created_at: row.created_at, type: 'training' })
    }
    map.get(row.upload_id)!.player_ids.add(row.player_id)
  }
  for (const row of (matchRes.data ?? [])) {
    if (!map.has(row.upload_id)) {
      map.set(row.upload_id, { upload_id: row.upload_id, date: row.match_date, player_ids: new Set(), created_at: row.created_at, type: 'matches' })
    }
    map.get(row.upload_id)!.player_ids.add(row.player_id)
  }

  // Sort newest first
  const sessions = [...map.values()].sort((a, b) => b.created_at.localeCompare(a.created_at))

  // Label duplicate dates within the same type (oldest gets (1), next (2), etc.)
  const dateCounts = new Map<string, number>()
  for (const s of sessions) {
    const k = `${s.type}-${s.date}`
    dateCounts.set(k, (dateCounts.get(k) ?? 0) + 1)
  }
  const dateIdx = new Map<string, number>()
  // Assign index in reverse (oldest = index 0)
  for (const s of [...sessions].reverse()) {
    const k = `${s.type}-${s.date}`
    dateIdx.set(s.upload_id, dateIdx.size ? (dateIdx.get(s.upload_id) ?? 0) : 0)
    // re-count per key
  }
  // Simpler approach: group by key, assign index by creation order (ascending)
  const keyGroups = new Map<string, string[]>()
  for (const s of [...sessions].reverse()) {
    const k = `${s.type}-${s.date}`
    if (!keyGroups.has(k)) keyGroups.set(k, [])
    keyGroups.get(k)!.push(s.upload_id)
  }
  const uploadIdx = new Map<string, number>()
  for (const ids of keyGroups.values()) {
    ids.forEach((id, i) => uploadIdx.set(id, i))
  }

  const fmt = (d: string) => {
    try { return new Date(d + 'T00:00:00').toLocaleDateString('es-CL', { day: 'numeric', month: 'short' }) }
    catch { return d }
  }

  const result = sessions.map(s => {
    const count = dateCounts.get(`${s.type}-${s.date}`) ?? 1
    const idx = uploadIdx.get(s.upload_id) ?? 0
    const dateLabel = fmt(s.date)
    return {
      upload_id: s.upload_id,
      date: s.date,
      label: count > 1 ? `${dateLabel} (${idx + 1})` : dateLabel,
      player_count: s.player_ids.size,
      type: s.type,
    }
  })

  return NextResponse.json({ sessions: result })
}
