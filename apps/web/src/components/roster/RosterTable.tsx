'use client'

import { useState } from 'react'
import Link from 'next/link'
import type { Tables } from '@rubitrain/db'

type Player = Tables<'team_memberships'> & {
  profiles: Tables<'profiles'> | null
  currentPhysicalStatus: string
}

const STATUS_STYLES: Record<string, string> = {
  fit:        'bg-green-50 text-green-700',
  limited:    'bg-yellow-50 text-yellow-700',
  injured:    'bg-red-50 text-red-700',
  recovering: 'bg-orange-50 text-orange-700',
}

const STATUS_LABELS: Record<string, string> = {
  fit: 'Apto', limited: 'Limitado', injured: 'Lesionado', recovering: 'Recuperación',
}

export default function RosterTable({ players: initialPlayers, teamId }: { players: Player[]; teamId: string }) {
  const [players, setPlayers] = useState(initialPlayers)
  const [search, setSearch] = useState('')
  const [groupFilter, setGroupFilter] = useState<'all' | 'forward' | 'back'>('all')
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [updatingGroup, setUpdatingGroup] = useState<string | null>(null)

  async function handleSetGroup(membershipId: string, group: 'forward' | 'back' | null) {
    setUpdatingGroup(membershipId)
    const res = await fetch(`/api/memberships/${membershipId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ position_group: group }),
    })
    if (res.ok) {
      setPlayers(prev => prev.map(p => p.id === membershipId ? { ...p, position_group: group } : p))
    }
    setUpdatingGroup(null)
  }

  async function handleRemovePlayer(membershipId: string, name: string) {
    if (!confirm(`¿Quitar a ${name} del equipo?`)) return
    setDeletingId(membershipId)
    const res = await fetch(`/api/memberships/${membershipId}`, { method: 'DELETE' })
    if (res.ok) setPlayers(prev => prev.filter(p => p.id !== membershipId))
    setDeletingId(null)
  }

  const filtered = players.filter(p => {
    const name = p.profiles?.full_name?.toLowerCase() ?? ''
    const pos = p.position?.toLowerCase() ?? ''
    const matchesSearch = name.includes(search.toLowerCase()) || pos.includes(search.toLowerCase())
    const matchesGroup = groupFilter === 'all' || p.position_group === groupFilter
    return matchesSearch && matchesGroup
  })

  function calcAge(birthDate: string | null) {
    if (!birthDate) return '-'
    const diff = Date.now() - new Date(birthDate).getTime()
    return Math.floor(diff / (1000 * 60 * 60 * 24 * 365))
  }

  return (
    <div>
      {/* Filters */}
      <div className="flex gap-3 mb-5 flex-wrap">
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar jugador o posición..."
          className="border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0058bc] w-64"
        />
        <div className="flex gap-1 bg-[#f8f9fa] rounded-xl p-1">
          {(['all', 'forward', 'back'] as const).map(g => (
            <button
              key={g}
              onClick={() => setGroupFilter(g)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition ${
                groupFilter === g ? 'bg-white text-[#001e40] shadow-sm' : 'text-gray-500 hover:text-[#001e40]'
              }`}
            >
              {g === 'all' ? 'Todos' : g === 'forward' ? 'Forwards' : 'Backs'}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-dashed border-gray-200 p-12 text-center">
          <p className="text-gray-400 text-sm">
            {players.length === 0
              ? 'Sin jugadores en este equipo. Invita al primero.'
              : 'No hay jugadores que coincidan con los filtros.'}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-[#f8f9fa]">
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">#</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Jugador</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Posición</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Peso</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Altura</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Edad</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Estado</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map(p => (
                <tr key={p.id} className="hover:bg-[#f8f9fa] transition">
                  <td className="px-5 py-3.5 font-bold text-gray-300 text-lg">{p.jersey_number ?? '—'}</td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-[#001e40] rounded-full flex items-center justify-center shrink-0">
                        <span className="text-[#83fc8e] text-xs font-bold">
                          {p.profiles?.full_name?.[0]?.toUpperCase() ?? '?'}
                        </span>
                      </div>
                      <span className="font-medium text-[#001e40]">{p.profiles?.full_name ?? '—'}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex flex-col gap-1">
                      {p.position && (
                        <span className="text-xs text-gray-500">{p.position}</span>
                      )}
                      <div className={`flex gap-0.5 ${updatingGroup === p.id ? 'opacity-50' : ''}`}>
                        {(['forward', 'back', null] as const).map(g => (
                          <button
                            key={String(g)}
                            onClick={() => handleSetGroup(p.id, g)}
                            disabled={updatingGroup === p.id}
                            className={`px-2 py-0.5 rounded text-xs font-medium transition ${
                              p.position_group === g
                                ? g === 'forward' ? 'bg-blue-100 text-blue-700' : g === 'back' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-500'
                                : 'text-gray-300 hover:text-gray-500'
                            }`}
                          >
                            {g === 'forward' ? 'FW' : g === 'back' ? 'BK' : '—'}
                          </button>
                        ))}
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-gray-600">{p.weight_kg ? `${p.weight_kg} kg` : '—'}</td>
                  <td className="px-5 py-3.5 text-gray-600">{p.height_cm ? `${p.height_cm} cm` : '—'}</td>
                  <td className="px-5 py-3.5 text-gray-600">{calcAge(p.birth_date)}</td>
                  <td className="px-5 py-3.5">
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${STATUS_STYLES[p.currentPhysicalStatus] ?? STATUS_STYLES.fit}`}>
                      {STATUS_LABELS[p.currentPhysicalStatus] ?? 'Apto'}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <div className="flex items-center justify-end gap-3">
                      <Link
                        href={`/dashboard/player/${p.user_id}`}
                        className="text-xs text-[#0058bc] hover:underline font-medium"
                      >
                        Ver perfil →
                      </Link>
                      <button
                        onClick={() => handleRemovePlayer(p.id, p.profiles?.full_name ?? 'jugador')}
                        disabled={deletingId === p.id}
                        className="text-gray-300 hover:text-red-500 transition disabled:opacity-40 text-lg leading-none"
                        title="Quitar del equipo"
                      >
                        {deletingId === p.id ? '...' : '×'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
