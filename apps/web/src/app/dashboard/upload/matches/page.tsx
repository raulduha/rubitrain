'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import * as XLSX from 'xlsx'
import { useUserTeams } from '@/hooks/useUserTeams'

interface PreviewRow { [key: string]: string | number }
interface UploadResult {
  created: number
  errors: { row: number; message: string }[]
}

export default function UploadMatchesPage() {
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<PreviewRow[]>([])
  const [headers, setHeaders] = useState<string[]>([])
  const [teamId, setTeamId] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<UploadResult | null>(null)
  const { teams, loading: teamsLoading } = useUserTeams()

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const f = acceptedFiles[0]
    if (!f) return
    setFile(f)
    const reader = new FileReader()
    reader.onload = (e) => {
      const data = new Uint8Array(e.target?.result as ArrayBuffer)
      const wb = XLSX.read(data, { type: 'array' })
      const ws = wb.Sheets[wb.SheetNames[0]!]!
      const rows = XLSX.utils.sheet_to_json<PreviewRow>(ws)
      setHeaders(rows.length > 0 ? Object.keys(rows[0]!) : [])
      setPreview(rows.slice(0, 5))
      setStep(2)
    }
    reader.readAsArrayBuffer(f)
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'], 'text/csv': ['.csv'] },
    maxFiles: 1,
  })

  async function handleUpload() {
    if (!file || !teamId) return
    setLoading(true)
    const formData = new FormData()
    formData.append('file', file)
    formData.append('teamId', teamId)
    const res = await fetch('/api/upload/matches', { method: 'POST', body: formData })
    const data = await res.json()
    setResult(data)
    setStep(3)
    setLoading(false)
  }

  return (
    <div className="p-8 max-w-3xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#001e40]">Cargar Métricas de Partido</h1>
        <p className="text-gray-500 text-sm mt-1">Importa datos GPS y físicos de partido desde Excel</p>
      </div>

      {/* Steps */}
      <div className="flex items-center gap-2 mb-8">
        {[1, 2, 3].map(s => (
          <div key={s} className="flex items-center gap-2">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${step >= s ? 'bg-[#001e40] text-white' : 'bg-gray-100 text-gray-400'}`}>{s}</div>
            <span className={`text-sm ${step >= s ? 'text-[#001e40] font-medium' : 'text-gray-400'}`}>
              {s === 1 ? 'Template' : s === 2 ? 'Subir' : 'Confirmación'}
            </span>
            {s < 3 && <div className={`w-8 h-px ${step > s ? 'bg-[#001e40]' : 'bg-gray-200'}`} />}
          </div>
        ))}
      </div>

      {step === 1 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-8">
          <h2 className="font-semibold text-[#001e40] mb-2">Paso 1: Descarga el template</h2>
          <p className="text-gray-500 text-sm mb-6">El archivo debe contener una fila por jugador por partido.</p>
          <div className="bg-[#f8f9fa] rounded-xl p-4 mb-6 text-sm text-gray-600">
            <p className="font-medium text-[#001e40] mb-2">Columnas requeridas:</p>
            <p className="font-mono text-xs">Email_Jugador · Fecha_Partido · Rival · Vel_Max_kmh · Metros_Totales · Sprints · Metros_HSR · Estado</p>
            <p className="text-xs text-gray-400 mt-2">Estado: optimal | fatigue | alert (opcional, se calcula automáticamente)</p>
          </div>
          <div className="flex gap-3">
            <a href="/api/templates/matches" className="flex items-center gap-2 bg-[#001e40] text-white px-6 py-3 rounded-xl text-sm font-semibold hover:bg-[#003366] transition">
              ⬇ Descargar Template Excel
            </a>
            <button onClick={() => setStep(2)} className="border border-gray-200 text-gray-600 px-6 py-3 rounded-xl text-sm font-medium hover:bg-gray-50">
              Ya tengo el archivo →
            </button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-8">
          <h2 className="font-semibold text-[#001e40] mb-6">Paso 2: Sube tu archivo</h2>
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition mb-6 ${isDragActive ? 'border-[#0058bc] bg-blue-50' : 'border-gray-200 hover:border-[#0058bc] hover:bg-[#f8f9fa]'}`}
          >
            <input {...getInputProps()} />
            <div className="text-4xl mb-3">⚡</div>
            {file ? (
              <p className="font-medium text-[#001e40]">{file.name}</p>
            ) : (
              <>
                <p className="font-medium text-[#001e40]">Arrastra tu archivo aquí</p>
                <p className="text-gray-400 text-sm mt-1">o haz clic para seleccionar · .xlsx o .csv</p>
              </>
            )}
          </div>

          {preview.length > 0 && (
            <div className="mb-6 overflow-x-auto rounded-xl border border-gray-100">
              <table className="w-full text-xs">
                <thead className="bg-[#f8f9fa]">
                  <tr>{headers.map(h => <th key={h} className="text-left px-3 py-2 text-gray-500 font-semibold whitespace-nowrap">{h}</th>)}</tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {preview.map((row, i) => (
                    <tr key={i}>{headers.map(h => <td key={h} className="px-3 py-2 text-gray-600 whitespace-nowrap">{String(row[h] ?? '')}</td>)}</tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">Equipo</label>
            {teamsLoading ? (
              <div className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-400 bg-gray-50">Cargando equipos...</div>
            ) : teams.length === 0 ? (
              <p className="text-sm text-red-500">No tienes equipos creados aún. Crea uno en <a href="/dashboard/clubs" className="underline">Mis Clubes</a>.</p>
            ) : (
              <select
                value={teamId}
                onChange={e => setTeamId(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0058bc]"
              >
                <option value="">Selecciona un equipo...</option>
                {teams.map(t => (
                  <option key={t.id} value={t.id}>
                    {t.orgName} — {t.name}{t.category ? ` (${t.category})` : ''}
                  </option>
                ))}
              </select>
            )}
          </div>
          <div className="flex gap-3">
            <button onClick={() => setStep(1)} className="border border-gray-200 text-gray-600 px-5 py-2.5 rounded-xl text-sm hover:bg-gray-50">← Atrás</button>
            <button
              onClick={handleUpload}
              disabled={!file || !teamId || loading}
              className="bg-[#001e40] text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-[#003366] disabled:opacity-50 transition"
            >
              {loading ? 'Procesando...' : 'Procesar y Cargar'}
            </button>
          </div>
        </div>
      )}

      {step === 3 && result && (
        <div className="bg-white rounded-2xl border border-gray-100 p-8">
          <div className="text-4xl mb-4">{result.errors.length === 0 ? '✅' : '⚠️'}</div>
          <h2 className="font-bold text-[#001e40] text-lg mb-5">
            {result.errors.length === 0 ? 'Métricas cargadas correctamente' : 'Cargado con advertencias'}
          </h2>
          <div className="flex gap-4 mb-6">
            <div className="bg-[#f8f9fa] rounded-xl px-5 py-3 text-center">
              <p className="text-2xl font-bold text-[#001e40]">{result.created}</p>
              <p className="text-xs text-gray-400">registros creados</p>
            </div>
            <div className="bg-[#f8f9fa] rounded-xl px-5 py-3 text-center">
              <p className="text-2xl font-bold text-red-500">{result.errors.length}</p>
              <p className="text-xs text-gray-400">errores</p>
            </div>
          </div>
          {result.errors.length > 0 && (
            <div className="bg-red-50 rounded-xl p-4 mb-6">
              {result.errors.map((err, i) => (
                <p key={i} className="text-sm text-red-600">Fila {err.row}: {err.message}</p>
              ))}
            </div>
          )}
          <button onClick={() => { setStep(1); setFile(null); setPreview([]); setResult(null); setTeamId('') }}
            className="bg-[#001e40] text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-[#003366] transition">
            Cargar otro archivo
          </button>
        </div>
      )}
    </div>
  )
}
