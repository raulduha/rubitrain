'use client'

export default function JoinError({ error }: { error: Error }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8f9fa] p-4">
      <div className="bg-white rounded-2xl p-8 text-center max-w-sm w-full">
        <div className="text-4xl mb-4">❌</div>
        <h2 className="font-bold text-[#001e40] mb-2">Error al cargar</h2>
        <p className="text-red-600 text-sm font-mono break-all">{error.message}</p>
      </div>
    </div>
  )
}
