'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell,
} from 'recharts'

export interface ClubData {
  id: string
  name: string
  sport: string
  country: string | null
  teams: { id: string; name: string; category: string | null }[]
}

interface TopPlayer { name: string; user_id: string; value: number }

interface TeamStats {
  playerCount: number
  fuerzaCount: number
  matchCount: number
  top: {
    squat: TopPlayer[]; deadlift: TopPlayer[]; bench: TopPlayer[]
    power_clean: TopPlayer[]; speed: TopPlayer[]; distance: TopPlayer[]; sprints: TopPlayer[]
  }
  avgs: {
    squat_kg: number | null; deadlift_kg: number | null; bench_kg: number | null
    max_speed_kmh: number | null; total_distance_m: number | null; sprint_count: number | null
  }
}

interface Session {
  upload_id: string
  date: string
  label: string
  player_count: number
  type: 'training' | 'matches'
}

const BAR_COLORS = ['#83fc8e', '#0058bc', '#001e40', '#94a3b8', '#cbd5e1']

const FUERZA_TABS = [
  { key: 'squat' as const,       label: 'Squat',       unit: 'kg' },
  { key: 'deadlift' as const,    label: 'Peso Muerto', unit: 'kg' },
  { key: 'bench' as const,       label: 'Banca',       unit: 'kg' },
  { key: 'power_clean' as const, label: 'Power Clean', unit: 'kg' },
]

const PARTIDO_TABS = [
  { key: 'speed' as const,    label: 'Velocidad', unit: 'km/h' },
  { key: 'distance' as const, label: 'Distancia', unit: 'm' },
  { key: 'sprints' as const,  label: 'Sprints',   unit: '' },
]

const CHAMPION_METRICS = [
  { key: 'squat',      label: 'Squat',       unit: 'kg',   icon: '🏋️', color: 'from-[#001e40] to-[#0058bc]' },
  { key: 'deadlift',   label: 'Peso Muerto', unit: 'kg',   icon: '💪', color: 'from-[#0058bc] to-[#0070d8]' },
  { key: 'bench',      label: 'Banca',       unit: 'kg',   icon: '🏗️', color: 'from-[#001e40] to-[#003366]' },
  { key: 'speed',      label: 'Vel. Máxima', unit: 'km/h', icon: '⚡', color: 'from-amber-500 to-yellow-400' },
  { key: 'distance',   label: 'Distancia',   unit: 'km',   icon: '📍', color: 'from-emerald-600 to-emerald-400' },
  { key: 'sprints',    label: 'Sprints',     unit: '',     icon: '🏃', color: 'from-violet-600 to-violet-400' },
] as const

function shortName(full: string) {
  const parts = full.trim().split(' ')
  if (parts.length === 1) return full
  return `${parts[0]} ${parts[parts.length - 1][0]}.`
}

function fmtDistance(m: number) {
  return m >= 1000 ? `${(m / 1000).toFixed(1)} km` : `${m} m`
}

function fmtVal(val: number, key: string): string {
  if (key === 'distance') return fmtDistance(val)
  if (key === 'speed') return `${val} km/h`
  if (key === 'sprints') return String(val)
  return `${val} kg`
}

function MetricChart({ data, unit }: { data: TopPlayer[]; unit: string }) {
  if (!data.length) {
    return <div className="flex items-center justify-center h-40 text-gray-300 text-sm">Sin datos</div>
  }
  const chartData = data.map(p => ({ name: shortName(p.name), value: p.value, user_id: p.user_id }))
  return (
    <ResponsiveContainer width="100%" height={Math.max(140, data.length * 44)}>
      <BarChart data={chartData} layout="vertical" margin={{ left: 0, right: 40, top: 4, bottom: 4 }}>
        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
        <XAxis type="number" tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
        <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#374151' }} width={88} axisLine={false} tickLine={false} />
        <Tooltip formatter={(v: number) => [`${v}${unit ? ' ' + unit : ''}`, 'Valor']} contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 12 }} />
        <Bar dataKey="value" radius={[0, 6, 6, 0]} maxBarSize={24}>
          {chartData.map((_, i) => <Cell key={i} fill={BAR_COLORS[i] ?? '#e5e7eb'} />)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}

function ChampionCard({ metric, player, avg }: {
  metric: typeof CHAMPION_METRICS[number]
  player: TopPlayer | undefined
  avg: number | null
}) {
  if (!player) return null
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-4 flex flex-col gap-2 min-w-0">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{metric.label}</span>
        <span className="text-lg">{metric.icon}</span>
      </div>
      <Link href={`/dashboard/player/${player.user_id}`} className="group">
        <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${metric.color} flex items-center justify-center mb-2`}>
          <span className="text-white text-sm font-bold">{player.name[0]?.toUpperCase()}</span>
        </div>
        <p className="font-bold text-[#001e40] text-sm leading-tight group-hover:underline truncate">{shortName(player.name)}</p>
      </Link>
      <p className={`text-2xl font-extrabold bg-gradient-to-r ${metric.color} bg-clip-text text-transparent`}>
        {fmtVal(player.value, metric.key)}
      </p>
      {avg !== null && <p className="text-xs text-gray-400">Promedio: {fmtVal(avg, metric.key)}</p>}
    </div>
  )
}

function SessionSelect({ sessions, value, onChange, placeholder }: {
  sessions: Session[]; value: string; onChange: (v: string) => void; placeholder: string
}) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 text-[#001e40] bg-white focus:outline-none focus:ring-1 focus:ring-[#0058bc]"
    >
      <option value="">{placeholder}</option>
      {sessions.map(s => (
        <option key={s.upload_id} value={s.upload_id}>
          {s.label} ({s.player_count} jug.)
        </option>
      ))}
    </select>
  )
}

function TeamDashboard({ teamId, teamName }: { teamId: string; teamName: string }) {
  const [sessions, setSessions] = useState<Session[]>([])
  const [trainingId, setTrainingId] = useState('')
  const [matchId, setMatchId] = useState('')
  const [group, setGroup] = useState<'all' | 'forward' | 'back'>('all')
  const [stats, setStats] = useState<TeamStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [fuerzaTab, setFuerzaTab] = useState<typeof FUERZA_TABS[number]['key']>('squat')
  const [partidoTab, setPartidoTab] = useState<typeof PARTIDO_TABS[number]['key']>('speed')

  // Load sessions list
  useEffect(() => {
    fetch(`/api/teams/${teamId}/sessions`)
      .then(r => r.json())
      .then(d => {
        const list: Session[] = d.sessions ?? []
        setSessions(list)
        // Pre-select latest session of each type
        const latestTraining = list.find(s => s.type === 'training')
        const latestMatch = list.find(s => s.type === 'matches')
        if (latestTraining) setTrainingId(latestTraining.upload_id)
        if (latestMatch) setMatchId(latestMatch.upload_id)
      })
  }, [teamId])

  // Load stats when filters change
  useEffect(() => {
    setLoading(true)
    setStats(null)
    const params = new URLSearchParams()
    if (trainingId) params.set('trainingUploadId', trainingId)
    if (matchId)    params.set('matchUploadId', matchId)
    if (group !== 'all') params.set('group', group)
    fetch(`/api/teams/${teamId}/stats?${params}`)
      .then(r => r.json())
      .then(d => { setStats(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [teamId, trainingId, matchId, group])

  const trainingSessions = sessions.filter(s => s.type === 'training')
  const matchSessions    = sessions.filter(s => s.type === 'matches')

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-[#001e40] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!stats) return <p className="text-gray-400 text-sm py-8">Error al cargar estadísticas.</p>

  const avgMap: Record<string, number | null> = {
    squat: stats.avgs.squat_kg, deadlift: stats.avgs.deadlift_kg, bench: stats.avgs.bench_kg,
    power_clean: null, speed: stats.avgs.max_speed_kmh,
    distance: stats.avgs.total_distance_m, sprints: stats.avgs.sprint_count,
  }
  const topMap: Record<string, TopPlayer[]> = stats.top as unknown as Record<string, TopPlayer[]>
  const championsWithData = CHAMPION_METRICS.filter(m => topMap[m.key]?.length > 0)
  const fuerzaData = topMap[fuerzaTab] ?? []
  const fuerzaUnit = FUERZA_TABS.find(t => t.key === fuerzaTab)?.unit ?? ''
  const partidoData = topMap[partidoTab] ?? []
  const partidoUnit = PARTIDO_TABS.find(t => t.key === partidoTab)?.unit ?? ''

  return (
    <div className="space-y-6">
      {/* Filters bar */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4 flex flex-wrap gap-4 items-center">
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400 font-medium">Sesión fuerza</span>
          <SessionSelect
            sessions={trainingSessions}
            value={trainingId}
            onChange={setTrainingId}
            placeholder="Última sesión"
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400 font-medium">Sesión partido</span>
          <SessionSelect
            sessions={matchSessions}
            value={matchId}
            onChange={setMatchId}
            placeholder="Última sesión"
          />
        </div>
        <div className="ml-auto flex gap-1 bg-[#f8f9fa] rounded-xl p-1">
          {(['all', 'forward', 'back'] as const).map(g => (
            <button
              key={g}
              onClick={() => setGroup(g)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition ${
                group === g ? 'bg-white text-[#001e40] shadow-sm' : 'text-gray-400 hover:text-[#001e40]'
              }`}
            >
              {g === 'all' ? 'Todos' : g === 'forward' ? 'Forwards' : 'Backs'}
            </button>
          ))}
        </div>
      </div>

      {/* Overview strip */}
      <div className="flex gap-4 flex-wrap">
        {[
          { label: 'Jugadores', value: stats.playerCount },
          { label: 'Con datos fuerza', value: stats.fuerzaCount },
          { label: 'Con datos partido', value: stats.matchCount },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-100 px-5 py-3 flex items-center gap-3">
            <p className="text-2xl font-extrabold text-[#001e40]">{s.value}</p>
            <p className="text-xs text-gray-400 leading-tight max-w-[80px]">{s.label}</p>
          </div>
        ))}
        <Link href={`/dashboard/roster/${teamId}`} className="ml-auto text-sm text-[#0058bc] hover:underline font-medium self-center">
          Ver plantilla completa →
        </Link>
      </div>

      {/* Champion cards */}
      {championsWithData.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3">Mejores de la categoría</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {championsWithData.map(m => (
              <ChampionCard key={m.key} metric={m} player={topMap[m.key]?.[0]} avg={avgMap[m.key] ?? null} />
            ))}
          </div>
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <h3 className="font-semibold text-[#001e40]">Ranking Fuerza</h3>
            <div className="flex gap-1 bg-[#f8f9fa] rounded-xl p-1">
              {FUERZA_TABS.map(t => (
                <button key={t.key} onClick={() => setFuerzaTab(t.key)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${fuerzaTab === t.key ? 'bg-white text-[#001e40] shadow-sm' : 'text-gray-400 hover:text-[#001e40]'}`}>
                  {t.label}
                </button>
              ))}
            </div>
          </div>
          {stats.fuerzaCount === 0
            ? <div className="flex items-center justify-center h-40 text-gray-300 text-sm">Sin datos · Carga un Excel de rutinas</div>
            : <MetricChart data={fuerzaData} unit={fuerzaUnit} />
          }
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <h3 className="font-semibold text-[#001e40]">Ranking Partido</h3>
            <div className="flex gap-1 bg-[#f8f9fa] rounded-xl p-1">
              {PARTIDO_TABS.map(t => (
                <button key={t.key} onClick={() => setPartidoTab(t.key)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${partidoTab === t.key ? 'bg-white text-[#001e40] shadow-sm' : 'text-gray-400 hover:text-[#001e40]'}`}>
                  {t.label}
                </button>
              ))}
            </div>
          </div>
          {stats.matchCount === 0
            ? <div className="flex items-center justify-center h-40 text-gray-300 text-sm">Sin datos · Carga un Excel de partidos</div>
            : <MetricChart data={partidoData} unit={partidoUnit} />
          }
        </div>
      </div>

      {/* Promedios */}
      {(stats.fuerzaCount > 0 || stats.matchCount > 0) && (
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <h3 className="font-semibold text-[#001e40] mb-4">Promedios del equipo</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {[
              { label: 'Squat',       val: stats.avgs.squat_kg,        unit: 'kg' },
              { label: 'Peso Muerto', val: stats.avgs.deadlift_kg,     unit: 'kg' },
              { label: 'Banca',       val: stats.avgs.bench_kg,        unit: 'kg' },
              { label: 'Vel. Máx',    val: stats.avgs.max_speed_kmh,   unit: 'km/h' },
              { label: 'Distancia',   val: stats.avgs.total_distance_m, unit: null },
              { label: 'Sprints',     val: stats.avgs.sprint_count,    unit: '' },
            ].map(({ label, val, unit }) => (
              <div key={label} className="bg-[#f8f9fa] rounded-xl p-3 text-center">
                <p className="text-xs text-gray-400 mb-1">{label}</p>
                <p className="font-bold text-[#001e40] text-sm">
                  {val === null ? '—' : unit === null ? fmtDistance(val) : `${val}${unit ? ' ' + unit : ''}`}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default function DashboardView({ clubs }: { clubs: ClubData[] }) {
  const [selectedClub, setSelectedClub] = useState<ClubData | null>(null)
  const [selectedTeam, setSelectedTeam] = useState<{ id: string; name: string; category: string | null } | null>(null)

  if (selectedClub && selectedTeam) {
    return (
      <div>
        <div className="flex items-center gap-2 text-sm mb-6 flex-wrap">
          <button onClick={() => { setSelectedClub(null); setSelectedTeam(null) }} className="text-gray-400 hover:text-[#001e40] transition">Clubes</button>
          <span className="text-gray-300">/</span>
          <button onClick={() => setSelectedTeam(null)} className="text-gray-400 hover:text-[#001e40] transition">{selectedClub.name}</button>
          <span className="text-gray-300">/</span>
          <span className="text-[#001e40] font-semibold">{selectedTeam.name}</span>
        </div>
        <div className="mb-6">
          <h2 className="text-xl font-bold text-[#001e40]">{selectedTeam.name}</h2>
          {selectedTeam.category && <p className="text-gray-400 text-sm mt-0.5">{selectedTeam.category} · {selectedClub.name}</p>}
        </div>
        <TeamDashboard key={selectedTeam.id} teamId={selectedTeam.id} teamName={selectedTeam.name} />
      </div>
    )
  }

  if (selectedClub) {
    return (
      <div>
        <div className="flex items-center gap-2 text-sm mb-6">
          <button onClick={() => setSelectedClub(null)} className="text-gray-400 hover:text-[#001e40] transition">Clubes</button>
          <span className="text-gray-300">/</span>
          <span className="text-[#001e40] font-semibold">{selectedClub.name}</span>
        </div>
        <h2 className="text-xl font-bold text-[#001e40] mb-5">Selecciona la categoría</h2>
        {selectedClub.teams.length === 0 ? (
          <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-12 text-center">
            <p className="text-gray-400 text-sm">Este club no tiene categorías activas.</p>
            <Link href={`/dashboard/clubs/${selectedClub.id}`} className="text-sm text-[#0058bc] hover:underline mt-2 inline-block">Gestionar club →</Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {selectedClub.teams.map(team => (
              <button key={team.id} onClick={() => setSelectedTeam(team)}
                className="text-left bg-white rounded-2xl border-2 border-gray-100 p-5 hover:border-[#001e40] hover:shadow-md transition group">
                <div className="w-10 h-10 bg-[#f8f9fa] rounded-xl flex items-center justify-center mb-3 group-hover:bg-[#001e40] transition">
                  <span className="text-[#001e40] group-hover:text-[#83fc8e] font-bold text-sm transition">
                    {team.category?.toUpperCase().slice(0, 2) ?? '—'}
                  </span>
                </div>
                <h3 className="font-semibold text-[#001e40]">{team.name}</h3>
                {team.category && <p className="text-xs text-gray-400 mt-0.5">{team.category}</p>}
                <p className="text-xs text-[#0058bc] mt-3 opacity-0 group-hover:opacity-100 transition">Ver estadísticas →</p>
              </button>
            ))}
          </div>
        )}
      </div>
    )
  }

  if (clubs.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-dashed border-gray-200 p-12 text-center">
        <p className="text-gray-400 text-sm mb-4">Aún no tienes ningún club creado</p>
        <Link href="/dashboard/clubs/new" className="inline-flex items-center gap-2 bg-[#001e40] text-white rounded-xl px-6 py-3 text-sm font-semibold hover:bg-[#003366] transition">
          + Crear primer club
        </Link>
      </div>
    )
  }

  return (
    <div>
      <h2 className="text-lg font-semibold text-[#001e40] mb-4">Tus clubes</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {clubs.map(club => (
          <button key={club.id} onClick={() => setSelectedClub(club)}
            className="text-left bg-white rounded-2xl border-2 border-gray-100 p-6 hover:border-[#001e40] hover:shadow-md transition group">
            <div className="w-10 h-10 bg-[#001e40] rounded-xl flex items-center justify-center mb-3">
              <span className="text-[#83fc8e] font-bold text-lg">{club.name[0]}</span>
            </div>
            <h3 className="font-semibold text-[#001e40]">{club.name}</h3>
            <p className="text-gray-400 text-sm mt-1">{club.sport} · {club.country}</p>
            <p className="text-xs text-gray-300 mt-1">{club.teams.length} categoría{club.teams.length !== 1 ? 's' : ''}</p>
            <p className="text-xs text-[#0058bc] mt-3 opacity-0 group-hover:opacity-100 transition">Ver categorías →</p>
          </button>
        ))}
      </div>
    </div>
  )
}
