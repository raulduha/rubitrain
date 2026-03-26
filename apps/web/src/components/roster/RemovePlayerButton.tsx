'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  membershipId: string
  playerName: string
  backHref: string
}

export default function RemovePlayerButton({ membershipId, playerName, backHref }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleRemove() {
    if (!confirm(`¿Quitar a ${playerName} del equipo? Esta acción no elimina su cuenta.`)) return
    setLoading(true)
    const res = await fetch(`/api/memberships/${membershipId}`, { method: 'DELETE' })
    if (res.ok) {
      router.push(backHref)
    } else {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleRemove}
      disabled={loading}
      className="text-sm text-red-500 hover:text-red-700 border border-red-200 hover:border-red-400 rounded-xl px-4 py-2.5 transition disabled:opacity-50"
    >
      {loading ? 'Quitando...' : 'Quitar del equipo'}
    </button>
  )
}
