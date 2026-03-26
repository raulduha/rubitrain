'use client'

import { useState } from 'react'
import RosterTable from './RosterTable'
import TeamStatsTable, { type PlayerStat } from './TeamStatsTable'
import type { Tables } from '@rubitrain/db'

type MembershipWithProfile = Tables<'team_memberships'> & {
  profiles: Tables<'profiles'> | null
  currentPhysicalStatus: string
  // Stats
  squat_kg: number | null
  deadlift_kg: number | null
  bench_kg: number | null
  power_clean_kg: number | null
  tonnage_kg: number | null
  perf_date: string | null
  max_speed_kmh: number | null
  total_distance_m: number | null
  sprint_count: number | null
  hsr_distance_m: number | null
  match_date: string | null
}

interface Props {
  players: MembershipWithProfile[]
  teamId: string
}

const TABS = [
  { key: 'roster', label: 'Plantilla' },
  { key: 'stats', label: 'Estadísticas' },
] as const

export default function RosterPageView({ players, teamId }: Props) {
  const [tab, setTab] = useState<'roster' | 'stats'>('roster')

  const playerStats: PlayerStat[] = players.map(p => ({
    user_id: p.user_id,
    name: p.profiles?.full_name ?? '—',
    position: p.position,
    position_group: p.position_group,
    squat_kg: p.squat_kg,
    deadlift_kg: p.deadlift_kg,
    bench_kg: p.bench_kg,
    power_clean_kg: p.power_clean_kg,
    tonnage_kg: p.tonnage_kg,
    perf_date: p.perf_date,
    max_speed_kmh: p.max_speed_kmh,
    total_distance_m: p.total_distance_m,
    sprint_count: p.sprint_count,
    hsr_distance_m: p.hsr_distance_m,
    match_date: p.match_date,
  }))

  return (
    <div>
      <div className="flex gap-1 bg-[#f8f9fa] rounded-xl p-1 w-fit mb-6">
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition ${tab === t.key ? 'bg-white text-[#001e40] shadow-sm' : 'text-gray-500 hover:text-[#001e40]'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'roster' && <RosterTable players={players} teamId={teamId} />}
      {tab === 'stats' && <TeamStatsTable players={playerStats} />}
    </div>
  )
}
