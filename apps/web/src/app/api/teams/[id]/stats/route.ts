import { createAdminClient, createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const url = new URL(req.url)
  const trainingUploadId = url.searchParams.get('trainingUploadId')
  const matchUploadId    = url.searchParams.get('matchUploadId')
  const group            = url.searchParams.get('group') // 'all' | 'forward' | 'back'

  const admin = await createAdminClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const a = admin as any

  const { data: team } = await a
    .from('teams').select('id, organizations(owner_id)').eq('id', params.id).single() as
    { data: { id: string; organizations: { owner_id: string } } | null }

  if (!team || team.organizations.owner_id !== user.id) {
    return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
  }

  const { data: memberships } = await a
    .from('team_memberships')
    .select('user_id, profiles(full_name), position_group')
    .eq('team_id', params.id)
    .eq('role', 'player')
    .eq('is_active', true) as {
      data: { user_id: string; profiles: { full_name: string } | null; position_group: string | null }[] | null
    }

  const allPlayerIds = memberships?.map(m => m.user_id) ?? []
  const nameMap = new Map(memberships?.map(m => [m.user_id, m.profiles?.full_name ?? '?']) ?? [])

  // Filter by position group
  const playerIds = (group && group !== 'all')
    ? (memberships?.filter(m => m.position_group === group).map(m => m.user_id) ?? [])
    : allPlayerIds

  const empty = {
    playerCount: playerIds.length,
    fuerzaCount: 0,
    matchCount: 0,
    top: { squat: [], deadlift: [], bench: [], power_clean: [], speed: [], distance: [], sprints: [] },
    avgs: { squat_kg: null, deadlift_kg: null, bench_kg: null, max_speed_kmh: null, total_distance_m: null, sprint_count: null },
  }

  if (playerIds.length === 0) return NextResponse.json(empty)

  type PerfLog = { player_id: string; squat_kg: number | null; deadlift_kg: number | null; bench_kg: number | null; power_clean_kg: number | null }
  type MatchLog = { player_id: string; max_speed_kmh: number | null; total_distance_m: number | null; sprint_count: number | null }

  // Fetch performance data
  let perfData: PerfLog[] = []
  if (trainingUploadId) {
    const { data } = await a.from('performance_logs')
      .select('player_id, squat_kg, deadlift_kg, bench_kg, power_clean_kg')
      .eq('upload_id', trainingUploadId)
      .in('player_id', playerIds) as { data: PerfLog[] | null }
    perfData = data ?? []
  } else {
    const { data } = await a.from('performance_logs')
      .select('player_id, squat_kg, deadlift_kg, bench_kg, power_clean_kg, log_date')
      .in('player_id', playerIds)
      .order('log_date', { ascending: false }) as { data: (PerfLog & { log_date: string })[] | null }
    // Latest per player
    const latest = new Map<string, PerfLog>()
    for (const log of (data ?? [])) {
      if (!latest.has(log.player_id)) latest.set(log.player_id, log)
    }
    perfData = [...latest.values()]
  }

  // Fetch match data
  let matchData: MatchLog[] = []
  if (matchUploadId) {
    const { data } = await a.from('match_metrics')
      .select('player_id, max_speed_kmh, total_distance_m, sprint_count')
      .eq('upload_id', matchUploadId)
      .in('player_id', playerIds) as { data: MatchLog[] | null }
    matchData = data ?? []
  } else {
    const { data } = await a.from('match_metrics')
      .select('player_id, max_speed_kmh, total_distance_m, sprint_count, match_date')
      .in('player_id', playerIds)
      .order('match_date', { ascending: false }) as { data: (MatchLog & { match_date: string })[] | null }
    const latest = new Map<string, MatchLog>()
    for (const log of (data ?? [])) {
      if (!latest.has(log.player_id)) latest.set(log.player_id, log)
    }
    matchData = [...latest.values()]
  }

  interface PlayerRow {
    user_id: string; name: string
    squat_kg: number | null; deadlift_kg: number | null; bench_kg: number | null; power_clean_kg: number | null
    max_speed_kmh: number | null; total_distance_m: number | null; sprint_count: number | null
  }

  const perfMap = new Map(perfData.map(p => [p.player_id, p]))
  const matchMap = new Map(matchData.map(m => [m.player_id, m]))

  const players: PlayerRow[] = playerIds.map(uid => {
    const p = perfMap.get(uid)
    const m = matchMap.get(uid)
    return {
      user_id: uid,
      name: nameMap.get(uid) ?? '?',
      squat_kg: p?.squat_kg ?? null,
      deadlift_kg: p?.deadlift_kg ?? null,
      bench_kg: p?.bench_kg ?? null,
      power_clean_kg: p?.power_clean_kg ?? null,
      max_speed_kmh: m?.max_speed_kmh ?? null,
      total_distance_m: m?.total_distance_m ?? null,
      sprint_count: m?.sprint_count ?? null,
    }
  })

  const fuerzaCount = players.filter(p => p.squat_kg ?? p.deadlift_kg ?? p.bench_kg).length
  const matchCount  = players.filter(p => p.max_speed_kmh ?? p.total_distance_m).length

  function top(key: keyof PlayerRow, n = 5) {
    return players
      .filter(p => p[key] != null)
      .sort((a, b) => (b[key] as number) - (a[key] as number))
      .slice(0, n)
      .map(p => ({ name: p.name, user_id: p.user_id, value: p[key] as number }))
  }

  function avg(key: keyof PlayerRow) {
    const vals = players.map(p => p[key]).filter((v): v is number => v != null)
    if (!vals.length) return null
    return Math.round(vals.reduce((s, v) => s + v, 0) / vals.length * 10) / 10
  }

  return NextResponse.json({
    playerCount: playerIds.length,
    fuerzaCount,
    matchCount,
    top: {
      squat: top('squat_kg'),
      deadlift: top('deadlift_kg'),
      bench: top('bench_kg'),
      power_clean: top('power_clean_kg'),
      speed: top('max_speed_kmh'),
      distance: top('total_distance_m'),
      sprints: top('sprint_count'),
    },
    avgs: {
      squat_kg: avg('squat_kg'),
      deadlift_kg: avg('deadlift_kg'),
      bench_kg: avg('bench_kg'),
      max_speed_kmh: avg('max_speed_kmh'),
      total_distance_m: avg('total_distance_m'),
      sprint_count: avg('sprint_count'),
    },
  })
}
