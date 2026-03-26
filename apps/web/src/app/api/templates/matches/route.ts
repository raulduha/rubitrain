import * as XLSX from 'xlsx'

export async function GET() {
  const wb = XLSX.utils.book_new()

  const headers = ['Email_Jugador', 'Fecha_Partido', 'Rival', 'Vel_Max_kmh', 'Metros_Totales', 'Sprints', 'Metros_HSR', 'Estado']

  const ejemplos = [
    ['juan@ejemplo.com', '2025-07-14', 'Old Boys RC', 31.2, 7200, 18, 1250, 'optimal'],
    ['pedro@ejemplo.com', '2025-07-14', 'Old Boys RC', 28.5, 6800, 12, 980,  'optimal'],
    ['carlos@ejemplo.com', '2025-07-14', 'Old Boys RC', 25.0, 4800, 8,  600,  'alert'],
  ]

  const ws = XLSX.utils.aoa_to_sheet([headers, ...ejemplos])
  ws['!cols'] = headers.map(() => ({ wch: 18 }))

  const ref = [
    ['Columna', 'Descripción'],
    ['Email_Jugador', 'Email del jugador registrado en la plataforma'],
    ['Estado', 'optimal | fatigue | alert (opcional, se calcula auto)'],
    ['', 'alert si Metros_Totales < 5000'],
    ['', 'fatigue si Metros_Totales < 7000 y Sprints < 15'],
    ['', 'optimal en cualquier otro caso'],
  ]
  const wsRef = XLSX.utils.aoa_to_sheet(ref)

  XLSX.utils.book_append_sheet(wb, ws, 'Métricas')
  XLSX.utils.book_append_sheet(wb, wsRef, 'Referencia')

  const rawBuf = XLSX.write(wb, { type: 'array', bookType: 'xlsx' }) as number[]
  const buf = new Uint8Array(rawBuf)

  return new Response(buf, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename="template_metricas_partido.xlsx"',
    },
  })
}
