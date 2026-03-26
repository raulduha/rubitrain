'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  plan: 'pro' | 'club'
  billingType?: 'personal' | 'organization'
  orgId?: string
  label?: string
  className?: string
}

export default function TrialButton({ plan, billingType = 'personal', orgId, label, className }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleTrial() {
    setLoading(true)
    setError(null)

    const res = await fetch('/api/billing/trial', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan, billingType, orgId }),
    })

    const data = await res.json()
    if (data.success) {
      router.refresh()
    } else {
      setError(data.error ?? 'Error activando el plan')
      setLoading(false)
    }
  }

  return (
    <div>
      <button
        onClick={handleTrial}
        disabled={loading}
        className={className ?? 'w-full bg-[#83fc8e] text-[#001e40] rounded-xl py-2 text-sm font-bold hover:opacity-90 transition disabled:opacity-50'}
      >
        {loading ? 'Activando...' : (label ?? `Probar ${plan} gratis`)}
      </button>
      {error && <p className="text-xs text-red-500 mt-1 text-center">{error}</p>}
    </div>
  )
}
