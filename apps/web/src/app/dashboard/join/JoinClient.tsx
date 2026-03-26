'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface Props {
  token: string
  email: string
  teamName: string
  orgName: string
  role: string
  isLoggedIn: boolean
  currentUserEmail: string | null
  alreadyMember: boolean
}

type Mode = 'create' | 'login'

export default function JoinClient({ token, email, teamName, orgName, role, isLoggedIn, currentUserEmail, alreadyMember }: Props) {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [mode, setMode] = useState<Mode>('create')

  const roleLabel = role === 'player' ? 'jugador' : 'entrenador'

  async function accept(userId: string) {
    const res = await fetch(`/api/invitations/${token}/accept`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    })
    const data = await res.json()
    if (!data.success) throw new Error(data.error ?? 'Error aceptando invitación')
  }

  async function handleAccept() {
    setLoading(true)
    setError(null)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setError('Debes iniciar sesión primero'); return }
      await accept(user.id)
      router.push('/dashboard')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error desconocido')
      setLoading(false)
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName, role },
          emailRedirectTo: `${window.location.origin}/api/auth/callback`,
        },
      })
      if (signUpError) throw new Error(signUpError.message)
      if (!signUpData.user) throw new Error('No se pudo crear la cuenta')

      await accept(signUpData.user.id)
      router.push(`/verify-email?email=${encodeURIComponent(email)}`)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error desconocido')
      setLoading(false)
    }
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({ email, password })
      if (signInError) throw new Error('Contraseña incorrecta')
      if (!signInData.user) throw new Error('No se pudo iniciar sesión')

      await accept(signInData.user.id)
      router.push('/dashboard')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error desconocido')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8f9fa] p-4">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 w-full max-w-sm p-8">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-14 h-14 bg-[#001e40] rounded-2xl flex items-center justify-center mx-auto mb-3">
            <span className="text-[#83fc8e] text-2xl font-bold">R</span>
          </div>
          <h1 className="font-bold text-[#001e40] text-xl">Invitación recibida</h1>
          <p className="text-gray-500 text-sm mt-1">
            Únete como <strong>{roleLabel}</strong> a <strong>{teamName}</strong> en <strong>{orgName}</strong>
          </p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-700 text-sm rounded-lg px-4 py-2 mb-4">{error}</div>
        )}

        {/* Ya es miembro */}
        {alreadyMember && (
          <div className="text-center py-4">
            <div className="text-3xl mb-3">✅</div>
            <p className="font-semibold text-[#001e40] mb-1">Ya eres miembro de esta categoría</p>
            <p className="text-gray-400 text-sm mb-5">Ya perteneces al equipo {teamName}.</p>
            <button
              onClick={() => router.push('/dashboard')}
              className="w-full bg-[#001e40] text-white rounded-xl py-3 text-sm font-semibold hover:bg-[#003366]"
            >
              Ir al dashboard
            </button>
          </div>
        )}

        {/* Sesión activa → aceptar directo */}
        {!alreadyMember && isLoggedIn && (
          <div>
            <p className="text-sm text-gray-500 mb-4 text-center">
              Sesión iniciada como <strong>{currentUserEmail}</strong>
            </p>
            <button
              onClick={handleAccept}
              disabled={loading}
              className="w-full bg-[#001e40] text-white rounded-xl py-3 text-sm font-semibold hover:bg-[#003366] disabled:opacity-50"
            >
              {loading ? 'Aceptando...' : 'Aceptar invitación'}
            </button>
          </div>
        )}

        {/* Sin sesión → crear cuenta o iniciar sesión */}
        {!alreadyMember && !isLoggedIn && (
          <>
            {/* Toggle */}
            <div className="flex gap-1 bg-[#f8f9fa] rounded-xl p-1 mb-5">
              {(['create', 'login'] as Mode[]).map(m => (
                <button
                  key={m}
                  type="button"
                  onClick={() => { setMode(m); setError(null); setPassword('') }}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition ${
                    mode === m ? 'bg-white text-[#001e40] shadow-sm' : 'text-gray-500 hover:text-[#001e40]'
                  }`}
                >
                  {m === 'create' ? 'Crear cuenta' : 'Ya tengo cuenta'}
                </button>
              ))}
            </div>

            {mode === 'create' ? (
              <form onSubmit={handleCreate} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nombre completo</label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    required
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0058bc]"
                    placeholder="Tu nombre"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input type="email" value={email} readOnly
                    className="w-full border border-gray-100 bg-gray-50 rounded-xl px-4 py-2.5 text-sm text-gray-400" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
                  <input
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    minLength={8}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0058bc]"
                    placeholder="Mínimo 8 caracteres"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#001e40] text-white rounded-xl py-3 text-sm font-semibold hover:bg-[#003366] disabled:opacity-50"
                >
                  {loading ? 'Creando cuenta...' : 'Crear cuenta y unirse'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input type="email" value={email} readOnly
                    className="w-full border border-gray-100 bg-gray-50 rounded-xl px-4 py-2.5 text-sm text-gray-400" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
                  <input
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0058bc]"
                    placeholder="••••••••"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#001e40] text-white rounded-xl py-3 text-sm font-semibold hover:bg-[#003366] disabled:opacity-50"
                >
                  {loading ? 'Iniciando sesión...' : 'Iniciar sesión y unirse'}
                </button>
              </form>
            )}
          </>
        )}
      </div>
    </div>
  )
}
