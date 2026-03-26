'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import { useState, useEffect, Suspense } from 'react'
import { createClient } from '@/lib/supabase/client'

function VerifyEmailContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const supabase = createClient()
  const email = searchParams.get('email') ?? ''
  const [resendCooldown, setResendCooldown] = useState(0)
  const [checking, setChecking] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    if (resendCooldown <= 0) return
    const timer = setInterval(() => setResendCooldown(c => c - 1), 1000)
    return () => clearInterval(timer)
  }, [resendCooldown])

  async function handleResend() {
    if (resendCooldown > 0) return
    await supabase.auth.resend({ type: 'signup', email })
    setResendCooldown(60)
    setMessage('Correo reenviado.')
  }

  async function handleCheckVerified() {
    setChecking(true)
    const { data } = await supabase.auth.getUser()
    if (data.user?.email_confirmed_at) {
      router.push('/dashboard')
    } else {
      setMessage('Tu correo aún no ha sido verificado. Revisa tu bandeja de entrada.')
      setChecking(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8f9fa] px-4">
      <div className="w-full max-w-sm text-center">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <div className="w-16 h-16 bg-[#e8f5e9] rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>

          <h2 className="text-xl font-bold text-[#001e40] mb-2">Verifica tu correo</h2>
          <p className="text-gray-500 text-sm mb-1">
            Enviamos un enlace de verificación a
          </p>
          <p className="font-semibold text-[#0058bc] text-sm mb-6">{email}</p>
          <p className="text-gray-400 text-xs mb-6">
            Revisa tu bandeja de entrada y haz clic en el enlace para activar tu cuenta.
          </p>

          {message && (
            <div className="bg-blue-50 border border-blue-200 text-blue-700 rounded-lg px-4 py-2 text-sm mb-4">
              {message}
            </div>
          )}

          <button
            onClick={handleCheckVerified}
            disabled={checking}
            className="w-full bg-[#001e40] text-white rounded-xl px-4 py-3 text-sm font-semibold hover:bg-[#003366] transition disabled:opacity-50 mb-3"
          >
            {checking ? 'Verificando...' : 'Ya verifiqué → Continuar'}
          </button>

          <button
            onClick={handleResend}
            disabled={resendCooldown > 0}
            className="w-full border border-gray-200 text-gray-600 rounded-xl px-4 py-3 text-sm font-medium hover:bg-gray-50 transition disabled:opacity-50"
          >
            {resendCooldown > 0 ? `Reenviar en ${resendCooldown}s` : 'Reenviar correo'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function VerifyEmailPage() {
  return (
    <Suspense>
      <VerifyEmailContent />
    </Suspense>
  )
}
