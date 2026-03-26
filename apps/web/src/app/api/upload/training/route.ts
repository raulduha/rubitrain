import { createAdminClient, createClient } from '@/lib/supabase/server'
import { toNum } from '@/lib/toNum'
import { NextResponse } from 'next/server'
import * as XLSX from 'xlsx'

interface ExcelRow {
  Jugador_ID?: string
  Nombre_Jugador?: string
  Fecha?: string
  Squat_kg?: number | string
  Deadlift_kg?: number | string
  Bench_kg?: number | string
  Power_Clean_kg?: number | string
  Tonnage_kg?: number | string
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

  if (!file || !teamId) return NextResponse.json({ error: 'Faltan archivo o teamId' }, { status: 400 })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const teamQuery = await (supabase as any)
    .from('teams').select('*, organizations(owner_id)').eq('id', teamId).single()
  const team = teamQuery.data as { id: string; organizations: { owner_id: string } } | null

  if (!team || team.organizations.owner_id !== user.id) {
    return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
  }

  const buffer = await file.arrayBuffer()
  const wb = XLSX.read(new Uint8Array(buffer), { type: 'array' })
  const ws = wb.Sheets[wb.SheetNames[0]!]!
  const rows = XLSX.utils.sheet_to_json<ExcelRow>(ws)

  const admin = await createAdminClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const a = admin as any

  const { data: memberships } = await a
    .from('team_memberships')
    .select('user_id')
    .eq('team_id', teamId)
    .eq('role', 'player') as { data: { user_id: string }[] | null }

  const validPlayerIds = new Set(memberships?.map(m => m.user_id) ?? [])

  const uploadId = crypto.randomUUID()
  const errors: { row: number; message: string }[] = []
  const toInsert: object[] = []

  // Validate all rows first
  for (const [i, row] of rows.entries()) {
    const playerId = String(row.Jugador_ID ?? '').trim()
    const fecha = String(row.Fecha ?? '').trim()

    if (!playerId || !fecha) {
      errors.push({ row: i + 2, message: 'Faltan Jugador_ID o Fecha' })
      continue
    }
    if (!validPlayerIds.has(playerId)) {
      errors.push({ row: i + 2, message: `Jugador "${row.Nombre_Jugador ?? playerId}" no pertenece a este equipo` })
      continue
    }

    toInsert.push({
      player_id: playerId,
      team_id: teamId,
      upload_id: uploadId,
      log_date: fecha,
      squat_kg: toNum(row.Squat_kg),
      deadlift_kg: toNum(row.Deadlift_kg),
      bench_kg: toNum(row.Bench_kg),
      power_clean_kg: toNum(row.Power_Clean_kg),
      tonnage_kg: toNum(row.Tonnage_kg),
      notes: row.Notas ? String(row.Notas) : null,
      created_by: user.id,
    })
  }

  let created = 0
  if (toInsert.length > 0) {
    const { error } = await a.from('performance_logs').insert(toInsert)
    if (error) {
      errors.push({ row: 0, message: `Error al guardar: ${error.message}` })
    } else {
      created = toInsert.length
    }
  }

  return NextResponse.json({ created, errors })
}
