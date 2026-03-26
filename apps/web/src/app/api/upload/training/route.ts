import { createAdminClient, createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import * as XLSX from 'xlsx'

interface ExcelRow {
  Fecha?: string
  Titulo_Sesion?: string
  Tipo_Sesion?: string
  Grupo_Objetivo?: string
  Nombre_Ejercicio?: string
  Categoria_Ejercicio?: string
  Series?: number
  Reps?: number
  Distancia_m?: number
  Descanso_s?: number
  Intensidad?: string
  Notas?: string
  [key: string]: unknown
}

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const formData = await req.formData()
  const file = formData.get('file') as File | null
  const teamId = formData.get('teamId') as string | null

  if (!file || !teamId) {
    return NextResponse.json({ error: 'Faltan archivo o teamId' }, { status: 400 })
  }

  // Verificar acceso al equipo
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const teamQuery = await (supabase as any)
    .from('teams').select('*, organizations(owner_id)').eq('id', teamId).single()
  const team = teamQuery.data as { id: string; organizations: { owner_id: string } } | null

  const org = team?.organizations
  if (!team || org?.owner_id !== user.id) {
    return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
  }

  // Parsear Excel
  const buffer = await file.arrayBuffer()
  const wb = XLSX.read(new Uint8Array(buffer), { type: 'array' })
  const ws = wb.Sheets[wb.SheetNames[0]!]!
  const rows = XLSX.utils.sheet_to_json<ExcelRow>(ws)

  const errors: { row: number; message: string }[] = []
  let createdSessions = 0
  let createdExercises = 0

  // Agrupar por Fecha + Titulo_Sesion
  const sessionsMap = new Map<string, { session: ExcelRow; exercises: ExcelRow[] }>()

  rows.forEach((row, i) => {
    const fecha = row.Fecha ?? row['Fecha']
    const titulo = row.Titulo_Sesion ?? row['Titulo_Sesion']

    if (!fecha || !titulo) {
      errors.push({ row: i + 2, message: 'Faltan columnas Fecha o Titulo_Sesion' })
      return
    }

    const key = `${fecha}__${titulo}`
    if (!sessionsMap.has(key)) {
      sessionsMap.set(key, { session: row, exercises: [] })
    }
    sessionsMap.get(key)!.exercises.push(row)
  })

  const admin = await createAdminClient()

  for (const [, { session, exercises }] of sessionsMap) {
    // Crear sesión
    const { data: newSession, error: sessionError } = await (admin as any)
      .from('training_sessions')
      .insert({
        team_id: teamId,
        created_by: user.id,
        title: String(session.Titulo_Sesion ?? ''),
        session_date: String(session.Fecha ?? ''),
        session_type: (['strength','speed','technical','recovery','match_prep'].includes(String(session.Tipo_Sesion))
          ? String(session.Tipo_Sesion) : null) as 'strength' | null,
        status: 'planned',
      })
      .select()
      .single()

    if (sessionError || !newSession) {
      errors.push({ row: 0, message: `Error creando sesión "${session.Titulo_Sesion}": ${sessionError?.message}` })
      continue
    }

    createdSessions++

    // Crear ejercicios
    const exercisesToInsert = exercises.map((ex, idx) => ({
      session_id: newSession.id,
      exercise_name: String(ex.Nombre_Ejercicio ?? ''),
      exercise_category: ex.Categoria_Ejercicio ? String(ex.Categoria_Ejercicio) : null,
      target_group: (['all','forwards','backs'].includes(String(ex.Grupo_Objetivo))
        ? String(ex.Grupo_Objetivo) : 'all') as 'all',
      sets: ex.Series ? Number(ex.Series) : null,
      reps: ex.Reps ? Number(ex.Reps) : null,
      distance_m: ex.Distancia_m ? Number(ex.Distancia_m) : null,
      rest_seconds: ex.Descanso_s ? Number(ex.Descanso_s) : null,
      intensity_label: ex.Intensidad ? String(ex.Intensidad) : null,
      order_index: idx + 1,
      notes: ex.Notas ? String(ex.Notas) : null,
    }))

    const { error: exError } = await (admin as any).from('session_exercises').insert(exercisesToInsert)
    if (!exError) createdExercises += exercisesToInsert.length
  }

  return NextResponse.json({ created: createdSessions, exercises: createdExercises, errors })
}
