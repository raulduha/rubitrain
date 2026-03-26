'use client'

import { useState, useEffect } from 'react'

interface Session {
  upload_id: string
  date: string
  label: string
  player_count: number
  type: 'training' | 'matches'
}

interface TeamStats {
  avgs: {
    squat_kg: number | null; deadlift_kg: number | null; bench_kg: number | null
    power_clean_kg?: number | null; max_speed_kmh: number | null
    total_distance_m: number | null; sprint_count: number | null
  }
  top: {
    squat: { user_id: string; value: number }[]
    deadlift: { user_id: string; value: number }[]
    bench: { user_id: string; value: number }[]
    power_clean: { user_id: string; value: number }[]
    speed: { user_id: string; value: number }[]
    distance: { user_id: string; value: number }[]
    sprints: { user_id: string; value: number }[]
  }
  playerCount: number
}

interface Membership {
  id: string
  team_id: string
  position: string | null
  position_group: 'forward' | 'back' | null
  jersey_number: number | null
  weight_kg: number | null
  height_cm: number | null
  teams: { id: string; name: string; category: string | null; season: string | null; organizations: { name: string } }
}

function fmt(n: number | null, unit = ''): string {
  if (n === null) return '—'
  if (unit === 'km') return `${(n / 1000).toFixed(1)} km`
  return `${Math.round(n * 10) / 10}${unit}`
}

function CompareBar({ label, mine, avg, unit = '' }: { label: string; mine: number | null; avg: number | null; unit?: string }) {
  const pct = mine !== null && avg !== null && avg > 0 ? Math.min((mine / avg) * 100, 150) : null
  const above = mine !== null && avg !== null && mine >= avg
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-gray-500">{label}</span>
        <span className="font-semibold text-[#001e40]">
          {fmt(mine, unit)} <span className="text-gray-400 font-normal">/ prom {fmt(avg, unit)}</span>
        </span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        {pct !== null && (
          <div className={`h-full rounded-full transition-all ${above ? 'bg-[#0058bc]' : 'bg-orange-400'}`}
            style={{ width: `${Math.min(pct, 100)}%` }} />
        )}
      </div>
    </div>
  )
}

function getRank(top: { user_id: string; value: number }[], userId: string): number | null {
  const idx = top.findIndex(p => p.user_id === userId)
  return idx >= 0 ? idx + 1 : null
}

function TeamCard({ membership, userId }: { membership: Membership; userId: string }) {
  const [sessions, setSessions] = useState<Session[]>([])
  const [trainingId, setTrainingId] = useState('')
  const [matchId, setMatchId] = useState('')
  const [group, setGroup] = useState<'all' | 'forward' | 'back'>('all')
  const [stats, setStats] = useState<TeamStats | null>(null)
  const [loading, setLoading] = useState(true)

  const posGroup = membership.position_group
  // Available group filters based on player's position group
  const availableGroups: ('all' | 'forward' | 'back')[] =
    posGroup ? ['all', posGroup] : ['all']

  useEffect(() => {
    fetch(`/api/teams/${membership.team_id}/sessions`)
      .then(r => r.json())
      .then(d => {
        const list: Session[] = d.sessions ?? []
        setSessions(list)
        const latestTraining = list.find(s => s.type === 'training')
        const latestMatch    = list.find(s => s.type === 'matches')
        if (latestTraining) setTrainingId(latestTraining.upload_id)
        if (latestMatch)    setMatchId(latestMatch.upload_id)
      })
  }, [membership.team_id])

  useEffect(() => {
    setLoading(true)
    setStats(null)
    const params = new URLSearchParams()
    if (trainingId) params.set('trainingUploadId', trainingId)
    if (matchId)    params.set('matchUploadId', matchId)
    if (group !== 'all') params.set('group', group)
    fetch(`/api/teams/${membership.team_id}/stats?${params}`)
      .then(r => r.json())
      .then(d => { setStats(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [membership.team_id, trainingId, matchId, group])

  const trainingSessions = sessions.filter(s => s.type === 'training')
  const matchSessions    = sessions.filter(s => s.type === 'matches')

  // Find player's own values in the top lists
  const mySquat      = stats?.top?.squat?.find(p => p.user_id === userId)?.value ?? null
  const myDead       = stats?.top?.deadlift?.find(p => p.user_id === userId)?.value ?? null
  const myBench      = stats?.top?.bench?.find(p => p.user_id === userId)?.value ?? null
  const myPower      = stats?.top?.power_clean?.find(p => p.user_id === userId)?.value ?? null
  const mySpeed      = stats?.top?.speed?.find(p => p.user_id === userId)?.value ?? null
  const myDist       = stats?.top?.distance?.find(p => p.user_id === userId)?.value ?? null
  const mySprints    = stats?.top?.sprints?.find(p => p.user_id === userId)?.value ?? null

  const squat_rank   = stats ? getRank(stats.top?.squat ?? [], userId) : null
  const speed_rank   = stats ? getRank(stats.top?.speed ?? [], userId) : null

  const hasPerf  = mySquat !== null || myDead !== null || myBench !== null
  const hasMatch = mySpeed !== null || myDist !== null

  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="font-bold text-[#001e40]">{membership.teams.name}</h2>
          <p className="text-xs text-gray-400 mt-0.5">
            {membership.teams.organizations.name} · {membership.teams.category} · Temporada {membership.teams.season}
          </p>
        </div>
        <div className="flex gap-4 text-sm text-right flex-wrap">
          {membership.jersey_number && (
            <div><p className="text-xs text-gray-400">Camiseta</p><p className="font-bold text-[#001e40]">#{membership.jersey_number}</p></div>
          )}
          {membership.position && (
            <div><p className="text-xs text-gray-400">Posición</p><p className="font-semibold text-[#001e40]">{membership.position}</p></div>
          )}
          {posGroup && (
            <div>
              <p className="text-xs text-gray-400">Grupo</p>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${posGroup === 'forward' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>
                {posGroup === 'forward' ? 'Forward' : 'Back'}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Session + group filters */}
      <div className="px-6 py-3 bg-[#f8f9fa] border-b border-gray-100 flex flex-wrap gap-3 items-center">
        {trainingSessions.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400">Fuerza</span>
            <select value={trainingId} onChange={e => setTrainingId(e.target.value)}
              className="text-xs border border-gray-200 rounded-lg px-2 py-1 bg-white focus:outline-none focus:ring-1 focus:ring-[#0058bc]">
              {trainingSessions.map(s => (
                <option key={s.upload_id} value={s.upload_id}>{s.label}</option>
              ))}
            </select>
          </div>
        )}
        {matchSessions.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400">Partido</span>
            <select value={matchId} onChange={e => setMatchId(e.target.value)}
              className="text-xs border border-gray-200 rounded-lg px-2 py-1 bg-white focus:outline-none focus:ring-1 focus:ring-[#0058bc]">
              {matchSessions.map(s => (
                <option key={s.upload_id} value={s.upload_id}>{s.label}</option>
              ))}
            </select>
          </div>
        )}
        {availableGroups.length > 1 && (
          <div className="flex gap-1 bg-white rounded-lg p-0.5 border border-gray-200 ml-auto">
            {availableGroups.map(g => (
              <button key={g} onClick={() => setGroup(g)}
                className={`px-3 py-1 rounded-md text-xs font-medium transition ${group === g ? 'bg-[#001e40] text-white' : 'text-gray-400 hover:text-[#001e40]'}`}>
                {g === 'all' ? 'Plantel' : g === 'forward' ? 'Forwards' : 'Backs'}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-6">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="w-6 h-6 border-2 border-[#001e40] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Rank badges */}
            {(squat_rank !== null || speed_rank !== null) && (
              <div className="flex gap-3 flex-wrap">
                {squat_rank !== null && squat_rank <= 3 && (
                  <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-2 flex items-center gap-2">
                    <span className="text-lg">{squat_rank === 1 ? '🥇' : squat_rank === 2 ? '🥈' : '🥉'}</span>
                    <span className="text-xs font-semibold text-amber-700">#{squat_rank} en Squat</span>
                  </div>
                )}
                {speed_rank !== null && speed_rank <= 3 && (
                  <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-2 flex items-center gap-2">
                    <span className="text-lg">{speed_rank === 1 ? '🥇' : speed_rank === 2 ? '🥈' : '🥉'}</span>
                    <span className="text-xs font-semibold text-amber-700">#{speed_rank} en Velocidad</span>
                  </div>
                )}
              </div>
            )}

            {hasPerf ? (
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
                  Fuerza vs {group === 'all' ? 'equipo' : group === 'forward' ? 'forwards' : 'backs'}
                </p>
                <div className="space-y-3">
                  <CompareBar label="Squat"       mine={mySquat}  avg={stats?.avgs.squat_kg ?? null}    unit=" kg" />
                  <CompareBar label="Peso Muerto" mine={myDead}   avg={stats?.avgs.deadlift_kg ?? null} unit=" kg" />
                  <CompareBar label="Banca"       mine={myBench}  avg={stats?.avgs.bench_kg ?? null}    unit=" kg" />
                  {myPower !== null && <CompareBar label="Power Clean" mine={myPower} avg={null} unit=" kg" />}
                </div>
              </div>
            ) : (
              <p className="text-gray-400 text-sm text-center py-2">Sin datos de fuerza</p>
            )}

            {hasMatch && (
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
                  Partido vs {group === 'all' ? 'equipo' : group === 'forward' ? 'forwards' : 'backs'}
                </p>
                <div className="space-y-3">
                  <CompareBar label="Vel. máx."  mine={mySpeed}   avg={stats?.avgs.max_speed_kmh ?? null}    unit=" km/h" />
                  <CompareBar label="Distancia"  mine={myDist}    avg={stats?.avgs.total_distance_m ?? null} unit="km" />
                  <CompareBar label="Sprints"    mine={mySprints} avg={stats?.avgs.sprint_count ?? null} />
                </div>
              </div>
            )}

            {!hasPerf && !hasMatch && (
              <p className="text-gray-400 text-sm text-center py-4">Sin datos en esta sesión</p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default function PlayerDashboardView({
  memberships,
  userId,
}: {
  memberships: Membership[]
  userId: string
}) {
  if (memberships.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
        <div className="w-14 h-14 bg-[#f0f7ff] rounded-2xl flex items-center justify-center mx-auto mb-4">
          <svg className="w-7 h-7 text-[#0058bc]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>
        <p className="font-semibold text-[#001e40] mb-1">Aún no estás en ningún equipo</p>
        <p className="text-gray-400 text-sm leading-relaxed max-w-xs mx-auto">
          Pide a tu entrenador o preparador que te invite desde la plataforma.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {memberships.map(m => (
        <TeamCard key={m.id} membership={m} userId={userId} />
      ))}
    </div>
  )
}
