import * as XLSX from 'xlsx'

export async function GET() {
  const wb = XLSX.utils.book_new()

  const headers = [
    'Fecha', 'Titulo_Sesion', 'Tipo_Sesion', 'Grupo_Objetivo',
    'Nombre_Ejercicio', 'Categoria_Ejercicio', 'Series', 'Reps',
    'Distancia_m', 'Descanso_s', 'Intensidad', 'Notas',
  ]

  const ejemplos = [
    ['2025-07-07', 'Fuerza Máxima Lunes', 'strength', 'forwards', 'Sentadilla Trasera', 'compound', 5, 5, '', 180, 'Pesado', ''],
    ['2025-07-07', 'Fuerza Máxima Lunes', 'strength', 'backs',    'Power Clean',        'compound', 6, 2, '', 120, 'Dinámico', 'Barra olímpica'],
    ['2025-07-07', 'Fuerza Máxima Lunes', 'strength', 'all',      'Peso Muerto',        'compound', 4, 4, '', 150, 'Pesado', ''],
  ]

  const ws = XLSX.utils.aoa_to_sheet([headers, ...ejemplos])
  ws['!cols'] = headers.map(() => ({ wch: 18 }))

  const ref = [
    ['Columna', 'Valores posibles'],
    ['Tipo_Sesion', 'strength | speed | technical | recovery | match_prep'],
    ['Grupo_Objetivo', 'all | forwards | backs'],
    ['Intensidad', 'Pesado | Máximo | Volumen | Dinámico | Altura | 100%'],
  ]
  const wsRef = XLSX.utils.aoa_to_sheet(ref)

  XLSX.utils.book_append_sheet(wb, ws, 'Rutina')
  XLSX.utils.book_append_sheet(wb, wsRef, 'Referencia')

  const rawBuf = XLSX.write(wb, { type: 'array', bookType: 'xlsx' }) as number[]
  const buf = new Uint8Array(rawBuf)

  return new Response(buf, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename="template_rutinas.xlsx"',
    },
  })
}
