import { createAdminClient, createClient } from '@/lib/supabase/server'
import { toNum } from '@/lib/toNum'
import { NextResponse } from 'next/server'
import * as XLSX from 'xlsx'

interface ExcelRow {
  Jugador_ID?: string
  Nombre_Jugador?: string
  Fecha_Partido?: string
  Rival?: string
  Vel_Max_kmh?: number | string
  Metros_Totales?: number | string
  Sprints?: number | string
  Metros_HSR?: number | string
  Estado?: string
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

  for (const [i, row] of rows.entries()) {
    const playerId = String(row.Jugador_ID ?? '').trim()
    const fecha = row.Fecha_Partido

    if (!playerId || !fecha) {
      errors.push({ row: i + 2, message: 'Faltan Jugador_ID o Fecha_Partido' })
      continue
    }
    if (!validPlayerIds.has(playerId)) {
      errors.push({ row: i + 2, message: `Jugador "${row.Nombre_Jugador ?? playerId}" no pertenece a este equipo` })
      continue
    }

    const metros = toNum(row.Metros_Totales) ?? 0
    const sprints = toNum(row.Sprints) ?? 0
    let status: 'optimal' | 'fatigue' | 'alert' = 'optimal'
    if (row.Estado && ['optimal', 'fatigue', 'alert'].includes(String(row.Estado))) {
      status = String(row.Estado) as 'optimal' | 'fatigue' | 'alert'
    } else if (metros > 0 && metros < 5000) {
      status = 'alert'
    } else if (metros > 0 && metros < 7000 && sprints < 15) {
      status = 'fatigue'
    }

    toInsert.push({
      player_id: playerId,
      team_id: teamId,
      upload_id: uploadId,
      match_date: String(fecha),
      opponent: row.Rival ? String(row.Rival) : null,
      max_speed_kmh: toNum(row.Vel_Max_kmh),
      total_distance_m: metros || null,
      sprint_count: sprints || null,
      hsr_distance_m: toNum(row.Metros_HSR),
      status,
      raw_data: row as Record<string, unknown>,
      created_by: user.id,
    })
  }

  let created = 0
  if (toInsert.length > 0) {
    const { error } = await a.from('match_metrics').insert(toInsert)
    if (error) {
      errors.push({ row: 0, message: `Error al guardar: ${error.message}` })
    } else {
      created = toInsert.length
    }
  }

  return NextResponse.json({ created, errors })
}
