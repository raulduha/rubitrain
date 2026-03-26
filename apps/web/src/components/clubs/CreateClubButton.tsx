'use client'

import { useState } from 'react'

export default function CreateClubButton({ userId: _ }: { userId: string }) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [country, setCountry] = useState('CL')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const res = await fetch('/api/organizations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, country }),
    })

    const data = await res.json()
    if (!res.ok) {
      setError(data.error ?? 'No se pudo crear el club')
      setLoading(false)
      return
    }

    setOpen(false)
    setName('')
    setLoading(false)
    window.location.reload()
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="bg-[#001e40] text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-[#003366] transition"
      >
        + Crear Club
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
            <h2 className="font-bold text-[#001e40] text-lg mb-5">Crear nuevo club</h2>

            {error && (
              <div className="bg-red-50 text-red-700 text-sm rounded-lg px-4 py-2 mb-4">{error}</div>
            )}

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del club</label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0058bc]"
                  placeholder="Club Deportivo CDUC"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">País</label>
                <select
                  value={country}
                  onChange={e => setCountry(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0058bc]"
                >
                  <option value="CL">Chile</option>
                  <option value="AR">Argentina</option>
                  <option value="UY">Uruguay</option>
                  <option value="BR">Brasil</option>
                  <option value="PE">Perú</option>
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="flex-1 border border-gray-200 text-gray-600 rounded-xl py-2.5 text-sm font-medium hover:bg-gray-50 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-[#001e40] text-white rounded-xl py-2.5 text-sm font-semibold hover:bg-[#003366] transition disabled:opacity-50"
                >
                  {loading ? 'Creando...' : 'Crear club'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
