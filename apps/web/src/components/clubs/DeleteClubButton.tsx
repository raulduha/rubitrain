'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  orgId: string
  orgName: string
}

export default function DeleteClubButton({ orgId, orgName }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleDelete() {
    if (input !== orgName) return
    setLoading(true)
    setError(null)
    const res = await fetch(`/api/organizations/${orgId}`, { method: 'DELETE' })
    if (res.ok) {
      router.push('/dashboard/clubs')
    } else {
      const data = await res.json()
      setError(data.error ?? 'No se pudo eliminar el club')
      setLoading(false)
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="text-sm text-red-500 hover:text-red-700 border border-red-200 hover:border-red-400 rounded-xl px-4 py-2 transition"
      >
        Eliminar club
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => { setOpen(false); setInput('') }} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
            <h2 className="font-bold text-[#001e40] text-lg mb-2">Eliminar club</h2>
            <p className="text-gray-500 text-sm mb-1">
              Esta acción borrará el club, todas sus categorías y todos sus jugadores. No se puede deshacer.
            </p>
            <p className="text-sm text-gray-700 mb-4">
              Para confirmar, escribe <strong>{orgName}</strong>:
            </p>

            {error && (
              <div className="bg-red-50 text-red-700 text-sm rounded-lg px-4 py-2 mb-4">{error}</div>
            )}

            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder={orgName}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 mb-4"
            />

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => { setOpen(false); setInput('') }}
                className="flex-1 border border-gray-200 text-gray-600 rounded-xl py-2.5 text-sm font-medium hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                disabled={input !== orgName || loading}
                className="flex-1 bg-red-600 text-white rounded-xl py-2.5 text-sm font-semibold hover:bg-red-700 disabled:opacity-40 transition"
              >
                {loading ? 'Eliminando...' : 'Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
