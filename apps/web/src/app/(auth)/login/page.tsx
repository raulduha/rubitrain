'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

type UserType = 'coach' | 'player'

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()
  const [userType, setUserType] = useState<UserType | null>(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError('Credenciales incorrectas. Verifica tu email y contraseña.')
      setLoading(false)
      return
    }

    router.refresh()
    router.push(userType === 'player' ? '/dashboard/player' : '/dashboard')
  }

  async function handleGoogleLogin() {
    setGoogleLoading(true)
    setError(null)

    const redirectTo = userType === 'player'
      ? `${window.location.origin}/api/auth/callback?next=/dashboard/player`
      : `${window.location.origin}/api/auth/callback`

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo,
        queryParams: { access_type: 'offline', prompt: 'consent' },
      },
    })

    if (error) {
      setError('Error al conectar con Google. Intenta de nuevo.')
      setGoogleLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8f9fa] px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-[#001e40] rounded-2xl mb-4">
            <span className="text-[#83fc8e] text-2xl font-bold">R</span>
          </div>
          <h1 className="text-2xl font-bold text-[#001e40]">RubiTrain</h1>
          <p className="text-gray-500 text-sm mt-1">Gestión deportiva CDUC Rugby</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">

          {!userType ? (
            /* Paso 1: ¿Quién eres? */
            <>
              <h2 className="text-lg font-semibold text-[#001e40] mb-2 text-center">¿Cómo quieres ingresar?</h2>
              <p className="text-gray-400 text-sm text-center mb-6">Selecciona tu rol para continuar</p>
              <div className="space-y-3">
                <button
                  onClick={() => setUserType('coach')}
                  className="w-full flex items-center gap-4 border border-gray-200 rounded-xl px-5 py-4 hover:border-[#0058bc] hover:bg-blue-50 transition text-left group"
                >
                  <div className="w-10 h-10 bg-[#001e40] rounded-xl flex items-center justify-center shrink-0">
                    <span className="text-[#83fc8e] text-lg">🏋️</span>
                  </div>
                  <div>
                    <p className="font-semibold text-[#001e40] text-sm">Entrenador / Preparador</p>
                    <p className="text-gray-400 text-xs">Gestiona equipos, jugadores y datos</p>
                  </div>
                </button>
                <button
                  onClick={() => setUserType('player')}
                  className="w-full flex items-center gap-4 border border-gray-200 rounded-xl px-5 py-4 hover:border-[#0058bc] hover:bg-blue-50 transition text-left group"
                >
                  <div className="w-10 h-10 bg-[#0058bc] rounded-xl flex items-center justify-center shrink-0">
                    <span className="text-white text-lg">🏉</span>
                  </div>
                  <div>
                    <p className="font-semibold text-[#001e40] text-sm">Jugador</p>
                    <p className="text-gray-400 text-xs">Ve tu rendimiento y comparativa de equipo</p>
                  </div>
                </button>
              </div>
              <p className="text-center text-sm text-gray-500 mt-5">
                ¿No tienes cuenta?{' '}
                <Link href="/register" className="text-[#0058bc] hover:underline font-medium">
                  Registrarse
                </Link>
              </p>
            </>
          ) : (
            /* Paso 2: Formulario de login */
            <>
              <div className="flex items-center gap-3 mb-6">
                <button
                  onClick={() => { setUserType(null); setError(null) }}
                  className="text-gray-400 hover:text-[#001e40] text-sm"
                >
                  ←
                </button>
                <div>
                  <h2 className="text-base font-semibold text-[#001e40]">
                    {userType === 'player' ? 'Ingresar como jugador' : 'Ingresar como entrenador'}
                  </h2>
                  {userType === 'player' && (
                    <p className="text-xs text-gray-400 mt-0.5">Usa el email con el que te registraste al aceptar la invitación</p>
                  )}
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm mb-4">
                  {error}
                </div>
              )}

              {/* Google */}
              <button
                onClick={handleGoogleLogin}
                disabled={googleLoading || loading}
                className="w-full flex items-center justify-center gap-3 border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition disabled:opacity-50"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                {googleLoading ? 'Conectando...' : 'Continuar con Google'}
              </button>

              <div className="flex items-center gap-3 my-5">
                <div className="flex-1 h-px bg-gray-200" />
                <span className="text-xs text-gray-400">o con email</span>
                <div className="flex-1 h-px bg-gray-200" />
              </div>

              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#0058bc] focus:border-transparent"
                    placeholder="tu@email.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
                  <input
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#0058bc] focus:border-transparent"
                    placeholder="••••••••"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading || googleLoading}
                  className="w-full bg-[#001e40] text-white rounded-xl px-4 py-3 text-sm font-semibold hover:bg-[#003366] transition disabled:opacity-50"
                >
                  {loading ? 'Ingresando...' : 'Iniciar sesión'}
                </button>
              </form>

              <div className="flex justify-between mt-4 text-sm">
                <Link href="/register" className="text-[#0058bc] hover:underline">
                  Crear cuenta
                </Link>
                <button
                  onClick={async () => {
                    if (!email) { setError('Ingresa tu email primero'); return }
                    await supabase.auth.resetPasswordForEmail(email, {
                      redirectTo: `${window.location.origin}/api/auth/callback`,
                    })
                    setError(null)
                    alert('Revisa tu correo para recuperar tu contraseña')
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ¿Olvidaste tu contraseña?
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
