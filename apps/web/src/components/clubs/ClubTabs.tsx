'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import type { Tables } from '@rubitrain/db'

type Team = Tables<'teams'> & { team_memberships: { count: number }[] }
type CoachRow = { id: string; profiles: Tables<'profiles'> | null; teams: { name: string } | null }

interface Props {
  org: Tables<'organizations'>
  teams: Team[]
  coaches: CoachRow[]
}

export default function ClubTabs({ org, teams: initialTeams, coaches }: Props) {
  const [tab, setTab] = useState<'teams' | 'coaches'>('teams')
  const [teams, setTeams] = useState<Team[]>(initialTeams)
  const [newTeamName, setNewTeamName] = useState('')
  const [newTeamCategory, setNewTeamCategory] = useState('primera')
  const [creating, setCreating] = useState(false)
  const [showNewTeam, setShowNewTeam] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)
  const router = useRouter()

  async function handleCreateTeam(e: React.FormEvent) {
    e.preventDefault()
    setCreating(true)
    setCreateError(null)

    const res = await fetch('/api/teams', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        organizationId: org.id,
        name: newTeamName,
        category: newTeamCategory,
        season: new Date().getFullYear().toString(),
      }),
    })

    const data = await res.json()
    if (!res.ok) {
      setCreateError(data.error ?? 'No se pudo crear la categoría')
      setCreating(false)
      return
    }

    setTeams(prev => [...prev, { ...data.team, team_memberships: [] }])
    setNewTeamName('')
    setShowNewTeam(false)
    setCreating(false)
  }

  const TABS = [
    { key: 'teams', label: 'Categorías' },
    { key: 'coaches', label: 'Entrenadores' },
  ] as const

  return (
    <div>
      {/* Tabs */}
      <div className="flex gap-1 bg-[#f8f9fa] rounded-xl p-1 w-fit mb-6">
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition ${
              tab === t.key ? 'bg-white text-[#001e40] shadow-sm' : 'text-gray-500 hover:text-[#001e40]'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Categorías */}
      {tab === 'teams' && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <p className="text-sm text-gray-500">{teams.length} categorías</p>
            <button
              onClick={() => setShowNewTeam(o => !o)}
              className="text-sm bg-[#001e40] text-white px-4 py-2 rounded-xl hover:bg-[#003366] transition"
            >
              + Nueva categoría
            </button>
          </div>

          {showNewTeam && (
            <form onSubmit={handleCreateTeam} className="bg-[#f8f9fa] rounded-xl p-4 mb-4 flex gap-3 flex-wrap items-end">
              {createError && (
                <div className="w-full bg-red-50 text-red-700 text-xs rounded-lg px-3 py-2">{createError}</div>
              )}
              <div className="flex-1 min-w-[160px]">
                <label className="block text-xs font-medium text-gray-500 mb-1">Nombre</label>
                <input
                  value={newTeamName}
                  onChange={e => setNewTeamName(e.target.value)}
                  required
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0058bc]"
                  placeholder="Primera División"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Categoría</label>
                <select
                  value={newTeamCategory}
                  onChange={e => setNewTeamCategory(e.target.value)}
                  className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0058bc]"
                >
                  {['primera', 'intermedia', 'm18', 'm16', 'm14'].map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <button
                type="submit"
                disabled={creating}
                className="bg-[#001e40] text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
              >
                {creating ? '...' : 'Crear'}
              </button>
            </form>
          )}

          <div className="space-y-2">
            {teams.map(team => (
              <Link
                key={team.id}
                href={`/dashboard/roster/${team.id}`}
                className="flex items-center justify-between bg-white border border-gray-100 rounded-xl px-5 py-4 hover:shadow-sm transition group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-9 h-9 bg-[#f8f9fa] rounded-lg flex items-center justify-center">
                    <span className="text-[#001e40] font-bold text-sm">{team.category?.toUpperCase().slice(0, 2)}</span>
                  </div>
                  <div>
                    <p className="font-semibold text-[#001e40]">{team.name}</p>
                    <p className="text-xs text-gray-400">{team.category} · Temporada {team.season}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-gray-400">
                    {(team.team_memberships as unknown as { count: number }[])?.[0]?.count ?? 0} jugadores
                  </span>
                  <span className="text-gray-300 group-hover:text-[#0058bc]">→</span>
                </div>
              </Link>
            ))}
            {teams.length === 0 && (
              <p className="text-gray-400 text-sm text-center py-8">Sin categorías. Crea la primera.</p>
            )}
          </div>
        </div>
      )}

      {/* Entrenadores */}
      {tab === 'coaches' && (
        <div>
          {coaches.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-8">Sin entrenadores asignados aún.</p>
          ) : (
            <div className="space-y-2">
              {coaches.map(c => (
                <div key={c.id} className="flex items-center justify-between bg-white border border-gray-100 rounded-xl px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-[#0058bc] rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-bold">
                        {c.profiles?.full_name?.[0]?.toUpperCase() ?? '?'}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-[#001e40] text-sm">{c.profiles?.full_name}</p>
                      <p className="text-xs text-gray-400">{c.teams?.name}</p>
                    </div>
                  </div>
                  <span className="text-xs bg-blue-50 text-blue-700 px-3 py-1 rounded-full font-medium">Entrenador</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
