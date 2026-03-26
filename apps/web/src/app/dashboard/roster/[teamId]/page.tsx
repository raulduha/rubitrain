import { createAdminClient, createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import InvitePlayerButton from '@/components/roster/InvitePlayerButton'
import RosterPageView from '@/components/roster/RosterPageView'

export default async function RosterPage({ params }: { params: { teamId: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const admin = await createAdminClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const s = admin as any

  const { data: team } = await s
    .from('teams')
    .select('*, organizations(*)')
    .eq('id', params.teamId)
    .single() as { data: { id: string; name: string; category: string | null; season: string | null; organizations: { id: string; owner_id: string; name: string } } | null }

  if (!team) notFound()

  const org = team.organizations
  if (org?.owner_id !== user!.id) notFound()

  const { data: memberships } = await s
    .from('team_memberships')
    .select('*, profiles(*)')
    .eq('team_id', params.teamId)
    .eq('role', 'player')
    .order('jersey_number', { nullsFirst: false }) as {
      data: {
        id: string; user_id: string; team_id: string; role: 'coach' | 'player'
        position: string | null; position_group: 'forward' | 'back' | null
        jersey_number: number | null; weight_kg: number | null; height_cm: number | null
        birth_date: string | null; is_active: boolean; joined_at: string
        profiles: { id: string; full_name: string; avatar_url: string | null; role: 'physical_trainer' | 'coach' | 'player'; phone: string | null; created_at: string; updated_at: string } | null
      }[] | null
    }

  const playerIds = (memberships ?? []).map(m => m.user_id)

  const [statusRes, perfRes, matchRes] = await Promise.all([
    playerIds.length
      ? s.from('physical_status').select('player_id, status').in('player_id', playerIds).eq('is_current', true)
      : Promise.resolve({ data: [] }),
    playerIds.length
      ? s.from('performance_logs')
          .select('player_id, log_date, squat_kg, deadlift_kg, bench_kg, power_clean_kg, tonnage_kg')
          .in('player_id', playerIds)
          .order('log_date', { ascending: false })
      : Promise.resolve({ data: [] }),
    playerIds.length
      ? s.from('match_metrics')
          .select('player_id, match_date, max_speed_kmh, total_distance_m, sprint_count, hsr_distance_m')
          .in('player_id', playerIds)
          .order('match_date', { ascending: false })
      : Promise.resolve({ data: [] }),
  ])

  const statuses = statusRes.data as { player_id: string; status: string }[] | null
  const allPerfLogs = perfRes.data as { player_id: string; log_date: string; squat_kg: number | null; deadlift_kg: number | null; bench_kg: number | null; power_clean_kg: number | null; tonnage_kg: number | null }[] | null
  const allMatchLogs = matchRes.data as { player_id: string; match_date: string; max_speed_kmh: number | null; total_distance_m: number | null; sprint_count: number | null; hsr_distance_m: number | null }[] | null

  type PerfLog = { player_id: string; log_date: string; squat_kg: number | null; deadlift_kg: number | null; bench_kg: number | null; power_clean_kg: number | null; tonnage_kg: number | null }
  type MatchLog = { player_id: string; match_date: string; max_speed_kmh: number | null; total_distance_m: number | null; sprint_count: number | null; hsr_distance_m: number | null }

  const latestPerf = new Map<string, PerfLog>()
  for (const log of allPerfLogs ?? []) {
    if (!latestPerf.has(log.player_id)) latestPerf.set(log.player_id, log)
  }
  const latestMatch = new Map<string, MatchLog>()
  for (const log of allMatchLogs ?? []) {
    if (!latestMatch.has(log.player_id)) latestMatch.set(log.player_id, log)
  }

  const statusMap = new Map(statuses?.map(s => [s.player_id, s.status]) ?? [])

  const players = (memberships ?? []).map(m => {
    const currentPhysicalStatus = statusMap.get(m.user_id) ?? 'fit'
    const perf = latestPerf.get(m.user_id)
    const match = latestMatch.get(m.user_id)
    return {
      ...m,
      currentPhysicalStatus,
      squat_kg: perf?.squat_kg ?? null,
      deadlift_kg: perf?.deadlift_kg ?? null,
      bench_kg: perf?.bench_kg ?? null,
      power_clean_kg: perf?.power_clean_kg ?? null,
      tonnage_kg: perf?.tonnage_kg ?? null,
      perf_date: perf?.log_date ?? null,
      max_speed_kmh: match?.max_speed_kmh ?? null,
      total_distance_m: match?.total_distance_m ?? null,
      sprint_count: match?.sprint_count ?? null,
      hsr_distance_m: match?.hsr_distance_m ?? null,
      match_date: match?.match_date ?? null,
    }
  })

  return (
    <div className="p-8">
      <div className="flex items-center gap-2 text-sm text-gray-400 mb-6">
        <Link href="/dashboard/clubs" className="hover:text-[#001e40]">Clubes</Link>
        <span>/</span>
        <Link href={`/dashboard/clubs/${org?.id ?? ''}`} className="hover:text-[#001e40]">{org?.name}</Link>
        <span>/</span>
        <span className="text-[#001e40] font-medium">{team.name}</span>
      </div>

      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[#001e40]">{team.name}</h1>
          <p className="text-gray-400 text-sm mt-1">
            {team.category} · Temporada {team.season} · {players.length} jugadores
          </p>
        </div>
        <InvitePlayerButton teamId={params.teamId} teamName={team.name} />
      </div>

      <RosterPageView players={players} teamId={params.teamId} />
    </div>
  )
}
