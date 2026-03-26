'use client'

import { useState } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts'
import type { Tables } from '@rubitrain/db'

interface Props {
  perfLogs: Tables<'performance_logs'>[]
  matchMetrics: Tables<'match_metrics'>[]
  physicalHistory: Tables<'physical_status'>[]
}

export default function PlayerTabs({ perfLogs, matchMetrics, physicalHistory }: Props) {
  const [tab, setTab] = useState<'perf' | 'matches' | 'physical'>('perf')

  const TABS = [
    { key: 'perf', label: 'Rendimiento' },
    { key: 'matches', label: 'Partidos' },
    { key: 'physical', label: 'Estado Físico' },
  ] as const

  const perfChartData = [...perfLogs].reverse().slice(-12).map(l => ({
    fecha: l.log_date,
    Squat: l.squat_kg ?? 0,
    Deadlift: l.deadlift_kg ?? 0,
    Bench: l.bench_kg ?? 0,
  }))

  const matchChartData = [...matchMetrics].reverse().slice(-10).map(m => ({
    fecha: m.match_date,
    Velocidad: m.max_speed_kmh ?? 0,
    Metros: Math.round((m.total_distance_m ?? 0) / 100) / 10,
  }))

  const STATUS_LABELS: Record<string, string> = {
    fit: 'Apto', limited: 'Limitado', injured: 'Lesionado', recovering: 'Recuperación',
  }
  const STATUS_COLORS: Record<string, string> = {
    fit: 'bg-green-50 text-green-700',
    limited: 'bg-yellow-50 text-yellow-700',
    injured: 'bg-red-50 text-red-700',
    recovering: 'bg-orange-50 text-orange-700',
  }

  return (
    <div>
      <div className="flex gap-1 bg-[#f8f9fa] rounded-xl p-1 w-fit mb-6">
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition ${tab === t.key ? 'bg-white text-[#001e40] shadow-sm' : 'text-gray-500 hover:text-[#001e40]'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Rendimiento */}
      {tab === 'perf' && (
        <div className="space-y-6">
          {perfChartData.length > 0 ? (
            <>
              <div className="bg-white rounded-2xl border border-gray-100 p-6">
                <h3 className="font-semibold text-[#001e40] mb-4">Progresión de fuerza (kg)</h3>
                <ResponsiveContainer width="100%" height={260}>
                  <LineChart data={perfChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="fecha" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Line type="monotone" dataKey="Squat" stroke="#001e40" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="Deadlift" stroke="#0058bc" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="Bench" stroke="#83fc8e" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
                <div className="flex gap-4 mt-3">
                  {[['#001e40','Squat'],['#0058bc','Deadlift'],['#83fc8e','Bench']].map(([color, label]) => (
                    <div key={label} className="flex items-center gap-1.5">
                      <div className="w-3 h-0.5 rounded" style={{ backgroundColor: color }} />
                      <span className="text-xs text-gray-500">{label}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-gray-100 p-6">
                <h3 className="font-semibold text-[#001e40] mb-4">Historial ({perfLogs.length} registros)</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-[#f8f9fa]">
                      <tr>
                        {['Fecha','Squat','Deadlift','Bench','Power Clean','Tonelaje','Notas'].map(h => (
                          <th key={h} className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {perfLogs.map(l => (
                        <tr key={l.id} className="hover:bg-[#f8f9fa]">
                          <td className="px-4 py-2.5 text-gray-600">{l.log_date}</td>
                          <td className="px-4 py-2.5 font-medium text-[#001e40]">{l.squat_kg ? `${l.squat_kg}` : '—'}</td>
                          <td className="px-4 py-2.5 font-medium text-[#001e40]">{l.deadlift_kg ? `${l.deadlift_kg}` : '—'}</td>
                          <td className="px-4 py-2.5 font-medium text-[#001e40]">{l.bench_kg ? `${l.bench_kg}` : '—'}</td>
                          <td className="px-4 py-2.5 text-gray-600">{l.power_clean_kg ?? '—'}</td>
                          <td className="px-4 py-2.5 text-gray-600">{l.tonnage_kg ?? '—'}</td>
                          <td className="px-4 py-2.5 text-gray-400 text-xs">{l.notes ?? ''}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : (
            <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-12 text-center">
              <p className="text-gray-400 text-sm">Sin datos de rendimiento. Carga un Excel de rutinas.</p>
            </div>
          )}
        </div>
      )}

      {/* Partidos */}
      {tab === 'matches' && (
        <div className="space-y-6">
          {matchChartData.length > 0 ? (
            <>
              <div className="bg-white rounded-2xl border border-gray-100 p-6">
                <h3 className="font-semibold text-[#001e40] mb-4">Velocidad máxima por partido (km/h)</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={matchChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="fecha" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="Velocidad" fill="#0058bc" radius={[4,4,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-white rounded-2xl border border-gray-100 p-6 overflow-x-auto">
                <h3 className="font-semibold text-[#001e40] mb-4">Historial de partidos</h3>
                <table className="w-full text-sm">
                  <thead className="bg-[#f8f9fa]">
                    <tr>
                      {['Fecha','Rival','Vel. Máx','Distancia','Sprints','HSR','Estado'].map(h => (
                        <th key={h} className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {matchMetrics.map(m => (
                      <tr key={m.id} className="hover:bg-[#f8f9fa]">
                        <td className="px-4 py-2.5 text-gray-600 whitespace-nowrap">{m.match_date}</td>
                        <td className="px-4 py-2.5 font-medium text-[#001e40]">{m.opponent ?? '—'}</td>
                        <td className="px-4 py-2.5 text-gray-600">{m.max_speed_kmh ? `${m.max_speed_kmh} km/h` : '—'}</td>
                        <td className="px-4 py-2.5 text-gray-600">{m.total_distance_m ? `${(m.total_distance_m/1000).toFixed(1)} km` : '—'}</td>
                        <td className="px-4 py-2.5 text-gray-600">{m.sprint_count ?? '—'}</td>
                        <td className="px-4 py-2.5 text-gray-600">{m.hsr_distance_m ? `${m.hsr_distance_m} m` : '—'}</td>
                        <td className="px-4 py-2.5">
                          <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                            m.status === 'optimal' ? 'bg-green-50 text-green-700' :
                            m.status === 'fatigue' ? 'bg-yellow-50 text-yellow-700' :
                            'bg-red-50 text-red-700'
                          }`}>
                            {m.status === 'optimal' ? 'Óptimo' : m.status === 'fatigue' ? 'Fatiga' : 'Alerta'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-12 text-center">
              <p className="text-gray-400 text-sm">Sin métricas de partido. Carga un Excel de partidos.</p>
            </div>
          )}
        </div>
      )}

      {/* Estado físico */}
      {tab === 'physical' && (
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h3 className="font-semibold text-[#001e40] mb-4">Historial de estado físico</h3>
          {physicalHistory.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-8">Sin registros de estado físico.</p>
          ) : (
            <div className="space-y-3">
              {physicalHistory.map(s => (
                <div key={s.id} className="flex items-start gap-4 p-4 rounded-xl bg-[#f8f9fa]">
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium shrink-0 mt-0.5 ${STATUS_COLORS[s.status] ?? ''}`}>
                    {STATUS_LABELS[s.status] ?? s.status}
                  </span>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-[#001e40]">{s.status_date}</p>
                    {s.injury_description && <p className="text-sm text-gray-500 mt-0.5">{s.injury_description}</p>}
                    {s.body_area && <p className="text-xs text-gray-400">{s.body_area}</p>}
                    {s.expected_return && <p className="text-xs text-gray-400 mt-1">Retorno estimado: {s.expected_return}</p>}
                  </div>
                  {s.is_current && <span className="text-xs bg-[#001e40] text-white px-2 py-0.5 rounded-full">Actual</span>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
