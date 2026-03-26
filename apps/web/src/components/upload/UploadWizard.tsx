'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { useUserClubs } from '@/hooks/useUserClubs'

export interface WizardParam { key: string; label: string }

interface Props {
  title: string
  subtitle: string
  params: WizardParam[]
  templateBase: string   // e.g. 'training' | 'matches'
  uploadEndpoint: string // e.g. '/api/upload/training'
  createdLabel: string   // e.g. 'registros creados'
}

type Step = 1 | 2 | 3 | 4 | 5
const STEP_LABELS = ['Club', 'Categoría', 'Parámetros', 'Cargar']

export default function UploadWizard({ title, subtitle, params, templateBase, uploadEndpoint, createdLabel }: Props) {
  const [step, setStep] = useState<Step>(1)
  const [selectedClub, setSelectedClub] = useState<string | null>(null)
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null)
  const [selectedParams, setSelectedParams] = useState<string[]>(params.map(p => p.key))
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ created: number; errors: { row: number; message: string }[] } | null>(null)
  const { clubs, loading: clubsLoading } = useUserClubs()

  const selectedClubData = clubs.find(c => c.id === selectedClub)
  const selectedTeamData = selectedClubData?.teams.find(t => t.id === selectedTeam)

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const f = acceptedFiles[0]
    if (f) setFile(f)
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'] },
    maxFiles: 1,
  })

  function toggleParam(key: string) {
    setSelectedParams(prev => prev.includes(key) ? prev.filter(p => p !== key) : [...prev, key])
  }

  function buildTemplateUrl() {
    const url = new URL(`/api/templates/${templateBase}`, window.location.origin)
    url.searchParams.set('teamId', selectedTeam!)
    selectedParams.forEach(p => url.searchParams.append('p', p))
    return url.toString()
  }

  async function handleUpload() {
    if (!file || !selectedTeam) return
    setLoading(true)
    const formData = new FormData()
    formData.append('file', file)
    formData.append('teamId', selectedTeam)
    const res = await fetch(uploadEndpoint, { method: 'POST', body: formData })
    const data = await res.json()
    setResult(data)
    setStep(5)
    setLoading(false)
  }

  function reset() {
    setStep(1)
    setSelectedClub(null)
    setSelectedTeam(null)
    setSelectedParams(params.map(p => p.key))
    setFile(null)
    setResult(null)
  }

  return (
    <div className="p-8 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#001e40]">{title}</h1>
        <p className="text-gray-500 text-sm mt-1">{subtitle}</p>
      </div>

      {step < 5 && (
        <div className="flex items-center gap-2 mb-8">
          {STEP_LABELS.map((label, i) => {
            const s = (i + 1) as Step
            return (
              <div key={s} className="flex items-center gap-2">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${step >= s ? 'bg-[#001e40] text-white' : 'bg-gray-100 text-gray-400'}`}>{s}</div>
                <span className={`text-sm ${step >= s ? 'text-[#001e40] font-medium' : 'text-gray-400'}`}>{label}</span>
                {s < 4 && <div className={`w-8 h-px ${step > s ? 'bg-[#001e40]' : 'bg-gray-200'}`} />}
              </div>
            )
          })}
        </div>
      )}

      {step === 1 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-8">
          <h2 className="font-semibold text-[#001e40] mb-5">Selecciona el club</h2>
          {clubsLoading ? (
            <p className="text-gray-400 text-sm">Cargando clubes...</p>
          ) : clubs.length === 0 ? (
            <p className="text-sm text-red-500">No tienes clubes. Crea uno en <a href="/dashboard/clubs" className="underline">Mis Clubes</a>.</p>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {clubs.map(club => (
                <button key={club.id} onClick={() => { setSelectedClub(club.id); setSelectedTeam(null); setStep(2) }}
                  className="text-left p-4 rounded-xl border-2 border-gray-100 hover:border-[#001e40] hover:bg-[#f8f9fa] transition">
                  <div className="w-8 h-8 bg-[#001e40] rounded-lg flex items-center justify-center mb-2">
                    <span className="text-[#83fc8e] text-sm font-bold">{club.name[0]}</span>
                  </div>
                  <p className="font-semibold text-[#001e40] text-sm">{club.name}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{club.teams.length} categoría{club.teams.length !== 1 ? 's' : ''}</p>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {step === 2 && selectedClubData && (
        <div className="bg-white rounded-2xl border border-gray-100 p-8">
          <h2 className="font-semibold text-[#001e40] mb-1">Selecciona la categoría</h2>
          <p className="text-gray-400 text-sm mb-5">{selectedClubData.name}</p>
          {selectedClubData.teams.length === 0 ? (
            <p className="text-sm text-red-500">Este club no tiene categorías activas.</p>
          ) : (
            <div className="grid grid-cols-2 gap-3 mb-6">
              {selectedClubData.teams.map(team => (
                <button key={team.id} onClick={() => { setSelectedTeam(team.id); setStep(3) }}
                  className="text-left p-4 rounded-xl border-2 border-gray-100 hover:border-[#001e40] hover:bg-[#f8f9fa] transition">
                  <p className="font-semibold text-[#001e40] text-sm">{team.name}</p>
                  {team.category && <p className="text-xs text-gray-400 mt-0.5">{team.category}</p>}
                </button>
              ))}
            </div>
          )}
          <button onClick={() => setStep(1)} className="text-sm text-gray-400 hover:text-[#001e40] transition">← Atrás</button>
        </div>
      )}

      {step === 3 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-8">
          <h2 className="font-semibold text-[#001e40] mb-1">Selecciona los parámetros</h2>
          <p className="text-gray-400 text-sm mb-5">{selectedClubData?.name} · {selectedTeamData?.name}</p>
          <div className="space-y-1 mb-6">
            {params.map(p => (
              <label key={p.key} className="flex items-center gap-3 p-3 rounded-xl hover:bg-[#f8f9fa] cursor-pointer">
                <input type="checkbox" checked={selectedParams.includes(p.key)} onChange={() => toggleParam(p.key)} className="w-4 h-4 accent-[#001e40]" />
                <span className="text-sm text-[#001e40] font-medium">{p.label}</span>
              </label>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => setStep(2)} className="text-sm text-gray-400 hover:text-[#001e40] transition">← Atrás</button>
            <button onClick={() => setStep(4)} disabled={selectedParams.length === 0}
              className="bg-[#001e40] text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-[#003366] disabled:opacity-50 transition">
              Continuar →
            </button>
          </div>
        </div>
      )}

      {step === 4 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-8">
          <h2 className="font-semibold text-[#001e40] mb-1">Descarga, completa y sube</h2>
          <p className="text-gray-400 text-sm mb-6">{selectedClubData?.name} · {selectedTeamData?.name}</p>
          <div className="bg-[#f8f9fa] rounded-xl p-5 mb-6">
            <p className="text-sm font-semibold text-[#001e40] mb-1">1. Descarga el template</p>
            <p className="text-xs text-gray-400 mb-3">Los nombres de los jugadores ya están pre-cargados. Solo rellena los datos.</p>
            <a href={buildTemplateUrl()}
              className="inline-flex items-center gap-2 bg-[#001e40] text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-[#003366] transition">
              Descargar Template Excel
            </a>
          </div>
          <div className="mb-6">
            <p className="text-sm font-semibold text-[#001e40] mb-3">2. Sube el archivo completado</p>
            <div {...getRootProps()}
              className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition ${isDragActive ? 'border-[#0058bc] bg-blue-50' : 'border-gray-200 hover:border-[#0058bc] hover:bg-[#f8f9fa]'}`}>
              <input {...getInputProps()} />
              {file ? (
                <p className="font-medium text-[#001e40] text-sm">{file.name}</p>
              ) : (
                <>
                  <p className="font-medium text-[#001e40] text-sm">Arrastra el archivo aquí</p>
                  <p className="text-gray-400 text-xs mt-1">o haz clic para seleccionar · .xlsx</p>
                </>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => setStep(3)} className="text-sm text-gray-400 hover:text-[#001e40] transition">← Atrás</button>
            <button onClick={handleUpload} disabled={!file || loading}
              className="bg-[#001e40] text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-[#003366] disabled:opacity-50 transition">
              {loading ? 'Procesando...' : 'Procesar y Cargar'}
            </button>
          </div>
        </div>
      )}

      {step === 5 && result && (
        <div className="bg-white rounded-2xl border border-gray-100 p-8">
          <div className="text-4xl mb-4">{result.errors.length === 0 ? '✅' : '⚠️'}</div>
          <h2 className="font-bold text-[#001e40] text-lg mb-5">
            {result.errors.length === 0 ? 'Datos cargados correctamente' : 'Cargado con advertencias'}
          </h2>
          <div className="flex gap-4 mb-6">
            <div className="bg-[#f8f9fa] rounded-xl px-5 py-3 text-center">
              <p className="text-2xl font-bold text-[#001e40]">{result.created}</p>
              <p className="text-xs text-gray-400">{createdLabel}</p>
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
          <button onClick={reset} className="bg-[#001e40] text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-[#003366] transition">
            Cargar otro archivo
          </button>
        </div>
      )}
    </div>
  )
}
