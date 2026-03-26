'use client'

import { useState } from 'react'
import Link from 'next/link'

export interface PlayerStat extends Record<string, unknown> {
  user_id: string
  name: string
  position: string | null
  position_group: 'forward' | 'back' | null
  // Fuerza
  squat_kg: number | null
  deadlift_kg: number | null
  bench_kg: number | null
  power_clean_kg: number | null
  tonnage_kg: number | null
  perf_date: string | null
  // Partido
  max_speed_kmh: number | null
  total_distance_m: number | null
  sprint_count: number | null
  hsr_distance_m: number | null
  match_date: string | null
}

type FuerzaKey = 'squat_kg' | 'deadlift_kg' | 'bench_kg' | 'power_clean_kg' | 'tonnage_kg'
type PartidoKey = 'max_speed_kmh' | 'total_distance_m' | 'sprint_count' | 'hsr_distance_m'

const FUERZA_COLS: { key: FuerzaKey; label: string; unit: string }[] = [
  { key: 'squat_kg', label: 'Squat', unit: 'kg' },
  { key: 'deadlift_kg', label: 'Peso Muerto', unit: 'kg' },
  { key: 'bench_kg', label: 'Banca', unit: 'kg' },
  { key: 'power_clean_kg', label: 'Power Clean', unit: 'kg' },
  { key: 'tonnage_kg', label: 'Tonelaje', unit: 'kg' },
]

const PARTIDO_COLS: { key: PartidoKey; label: string; unit: string }[] = [
  { key: 'max_speed_kmh', label: 'Vel. Máx', unit: 'km/h' },
  { key: 'total_distance_m', label: 'Distancia', unit: 'm' },
  { key: 'sprint_count', label: 'Sprints', unit: '' },
  { key: 'hsr_distance_m', label: 'HSR', unit: 'm' },
]

const RANK_STYLES: Record<number, string> = {
  1: 'bg-yellow-400 text-white',
  2: 'bg-gray-300 text-gray-700',
  3: 'bg-amber-600 text-white',
}

function RankBadge({ rank }: { rank: number }) {
  const style = RANK_STYLES[rank] ?? 'bg-gray-100 text-gray-400'
  return (
    <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${style}`}>
      {rank}
    </span>
  )
}

function formatVal(val: number | null, key: string): string {
  if (val === null) return '—'
  if (key === 'total_distance_m' || key === 'hsr_distance_m') {
    return val >= 1000 ? `${(val / 1000).toFixed(1)} km` : `${val} m`
  }
  if (key === 'max_speed_kmh') return `${val} km/h`
  return String(val)
}

export default function TeamStatsTable({ players }: { players: PlayerStat[] }) {
  const [view, setView] = useState<'fuerza' | 'partidos'>('fuerza')
  const [sortKey, setSortKey] = useState<string>('squat_kg')
  const [sortDir, setSortDir] = useState<'desc' | 'asc'>('desc')
  const [groupFilter, setGroupFilter] = useState<'all' | 'forward' | 'back'>('all')

  function handleSort(key: string) {
    if (sortKey === key) {
      setSortDir(d => d === 'desc' ? 'asc' : 'desc')
    } else {
      setSortKey(key)
      setSortDir('desc')
    }
  }

  const filtered = players.filter(p =>
    groupFilter === 'all' || p.position_group === groupFilter
  )

  // Sort: nulls always last
  const sorted = [...filtered].sort((a, b) => {
    const av = (a as Record<string, unknown>)[sortKey] as number | null
    const bv = (b as Record<string, unknown>)[sortKey] as number | null
    if (av === null && bv === null) return 0
    if (av === null) return 1
    if (bv === null) return -1
    return sortDir === 'desc' ? bv - av : av - bv
  })

  const cols = view === 'fuerza' ? FUERZA_COLS : PARTIDO_COLS

  const hasFuerzaData = players.some(p => p.squat_kg || p.deadlift_kg || p.bench_kg)
  const hasMatchData = players.some(p => p.max_speed_kmh || p.total_distance_m)

  function SortIcon({ col }: { col: string }) {
    if (sortKey !== col) return <span className="text-gray-200 ml-1">↕</span>
    return <span className="text-[#0058bc] ml-1">{sortDir === 'desc' ? '↓' : '↑'}</span>
  }

  return (
    <div>
      {/* Sub-tabs + group filter */}
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <div className="flex gap-1 bg-[#f8f9fa] rounded-xl p-1">
          <button
            onClick={() => { setView('fuerza'); setSortKey('squat_kg') }}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition ${view === 'fuerza' ? 'bg-white text-[#001e40] shadow-sm' : 'text-gray-500 hover:text-[#001e40]'}`}
          >
            Fuerza
          </button>
          <button
            onClick={() => { setView('partidos'); setSortKey('max_speed_kmh') }}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition ${view === 'partidos' ? 'bg-white text-[#001e40] shadow-sm' : 'text-gray-500 hover:text-[#001e40]'}`}
          >
            Partidos
          </button>
        </div>

        <div className="flex gap-1 bg-[#f8f9fa] rounded-xl p-1">
          {(['all', 'forward', 'back'] as const).map(g => (
            <button
              key={g}
              onClick={() => setGroupFilter(g)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition ${groupFilter === g ? 'bg-white text-[#001e40] shadow-sm' : 'text-gray-500 hover:text-[#001e40]'}`}
            >
              {g === 'all' ? 'Todos' : g === 'forward' ? 'Forwards' : 'Backs'}
            </button>
          ))}
        </div>
      </div>

      {(view === 'fuerza' && !hasFuerzaData) || (view === 'partidos' && !hasMatchData) ? (
        <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-12 text-center">
          <p className="text-gray-400 text-sm">
            Sin datos de {view === 'fuerza' ? 'fuerza' : 'partido'} aún.
            Carga un Excel desde <a href="/dashboard/upload/training" className="underline text-[#0058bc]">Subir Datos</a>.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-[#f8f9fa]">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase w-10">#</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Jugador</th>
                {cols.map(col => (
                  <th
                    key={col.key}
                    onClick={() => handleSort(col.key)}
                    className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide cursor-pointer hover:text-[#001e40] select-none whitespace-nowrap"
                  >
                    {col.label}
                    {col.unit && <span className="font-normal text-gray-300 ml-0.5">({col.unit})</span>}
                    <SortIcon col={col.key} />
                  </th>
                ))}
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-400 uppercase whitespace-nowrap">
                  {view === 'fuerza' ? 'Fecha' : 'Último partido'}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {sorted.map((p, i) => {
                const rank = i + 1
                const hasSortVal = (p as Record<string, unknown>)[sortKey] !== null
                return (
                  <tr key={p.user_id} className={`transition ${rank === 1 ? 'bg-yellow-50/40' : 'hover:bg-[#f8f9fa]'}`}>
                    <td className="px-4 py-3.5">
                      {hasSortVal ? <RankBadge rank={rank} /> : <span className="text-gray-200 text-xs">—</span>}
                    </td>
                    <td className="px-4 py-3.5">
                      <Link href={`/dashboard/player/${p.user_id}`} className="flex items-center gap-3 group">
                        <div className="w-8 h-8 bg-[#001e40] rounded-full flex items-center justify-center shrink-0">
                          <span className="text-[#83fc8e] text-xs font-bold">{p.name[0]?.toUpperCase()}</span>
                        </div>
                        <div>
                          <p className="font-medium text-[#001e40] group-hover:underline">{p.name}</p>
                          {p.position && <p className="text-xs text-gray-400">{p.position}</p>}
                        </div>
                      </Link>
                    </td>
                    {cols.map(col => {
                      const val = (p as Record<string, unknown>)[col.key] as number | null
                      const isTopSort = sortKey === col.key && hasSortVal
                      const isFirst = isTopSort && rank === 1
                      const isLast = isTopSort && rank === sorted.filter(x => (x as Record<string, unknown>)[col.key] !== null).length
                      return (
                        <td key={col.key} className="px-4 py-3.5">
                          <span className={`font-semibold ${
                            isFirst ? 'text-yellow-600' :
                            isLast && rank > 3 ? 'text-red-400' :
                            val !== null ? 'text-[#001e40]' : 'text-gray-200'
                          }`}>
                            {formatVal(val, col.key)}
                          </span>
                        </td>
                      )
                    })}
                    <td className="px-4 py-3.5 text-right text-xs text-gray-400">
                      {view === 'fuerza' ? (p.perf_date ?? '—') : (p.match_date ?? '—')}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
