'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function DeleteUploadButton({ uploadId, type }: { uploadId: string; type: 'training' | 'matches' }) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleDelete() {
    if (!confirm('¿Eliminar esta subida? Se borrarán todos los datos de esta sesión.')) return
    setLoading(true)
    await fetch(`/api/uploads/${uploadId}?type=${type}`, { method: 'DELETE' })
    setLoading(false)
    router.refresh()
  }

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      className="text-gray-300 hover:text-red-500 transition text-sm font-medium disabled:opacity-40"
    >
      {loading ? '...' : 'Eliminar'}
    </button>
  )
}
