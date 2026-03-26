'use client'

import { useState } from 'react'

interface Props {
  teamId: string
  teamName: string
}

export default function InvitePlayerButton({ teamId, teamName }: Props) {
  const [open, setOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<'player' | 'coach'>('player')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ success?: boolean; error?: string; joinUrl?: string; emailError?: string } | null>(null)

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setResult(null)

    const res = await fetch('/api/invitations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ teamId, email, role }),
    })

    const data = await res.json()
    if (res.ok) {
      setResult({ success: true, joinUrl: data.joinUrl, emailError: data.emailError })
      setEmail('')
    } else {
      setResult({ error: data.error ?? 'No se pudo enviar la invitación' })
    }
    setLoading(false)
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="bg-[#001e40] text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-[#003366] transition"
      >
        + Invitar jugador
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => { setOpen(false); setResult(null) }} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
            <h2 className="font-bold text-[#001e40] text-lg mb-1">Invitar a {teamName}</h2>
            <p className="text-gray-400 text-sm mb-5">Se enviará un email con un link de invitación.</p>

            {result?.success ? (
              <div className="py-2">
                <div className="text-center mb-4">
                  <div className="text-4xl mb-2">{result.emailError ? '⚠️' : '✉️'}</div>
                  <p className="font-semibold text-[#001e40] mb-1">
                    {result.emailError ? 'Invitación creada' : 'Invitación enviada'}
                  </p>
                  {result.emailError ? (
                    <p className="text-yellow-600 text-xs mb-3">
                      El email no se pudo enviar (dominio no verificado en Resend). Comparte el link manualmente:
                    </p>
                  ) : (
                    <p className="text-gray-400 text-sm mb-3">Se envió el link a <strong>{email}</strong></p>
                  )}
                </div>

                <div className="bg-[#f8f9fa] rounded-xl p-3 mb-4">
                  <p className="text-xs text-gray-500 mb-1">Link de invitación:</p>
                  <div className="flex items-center gap-2">
                    <input
                      readOnly
                      value={result.joinUrl ?? ''}
                      className="flex-1 text-xs bg-white border border-gray-200 rounded-lg px-2 py-1.5 text-gray-700 truncate"
                    />
                    <button
                      onClick={() => result.joinUrl && navigator.clipboard.writeText(result.joinUrl)}
                      className="text-xs bg-[#001e40] text-white px-3 py-1.5 rounded-lg font-medium shrink-0"
                    >
                      Copiar
                    </button>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setResult(null)}
                    className="flex-1 border border-gray-200 rounded-xl py-2.5 text-sm font-medium hover:bg-gray-50"
                  >
                    Invitar otro
                  </button>
                  <button
                    onClick={() => { setOpen(false); setResult(null) }}
                    className="flex-1 bg-[#001e40] text-white rounded-xl py-2.5 text-sm font-semibold"
                  >
                    Cerrar
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleInvite} className="space-y-4">
                {result?.error && (
                  <div className="bg-red-50 text-red-700 text-sm rounded-lg px-4 py-2">{result.error}</div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0058bc]"
                    placeholder="jugador@email.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Rol</label>
                  <div className="flex gap-2">
                    {(['player', 'coach'] as const).map(r => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setRole(r)}
                        className={`flex-1 py-2 rounded-xl text-sm font-medium border transition ${
                          role === r ? 'bg-[#001e40] text-white border-[#001e40]' : 'border-gray-200 text-gray-600 hover:border-gray-300'
                        }`}
                      >
                        {r === 'player' ? 'Jugador' : 'Entrenador'}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="flex-1 border border-gray-200 text-gray-600 rounded-xl py-2.5 text-sm font-medium hover:bg-gray-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-[#001e40] text-white rounded-xl py-2.5 text-sm font-semibold disabled:opacity-50"
                  >
                    {loading ? 'Enviando...' : 'Enviar invitación'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  )
}
