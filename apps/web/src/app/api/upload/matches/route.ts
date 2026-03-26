import { createAdminClient, createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import * as XLSX from 'xlsx'

interface ExcelRow {
  Email_Jugador?: string
  Fecha_Partido?: string
  Rival?: string
  Vel_Max_kmh?: number
  Metros_Totales?: number
  Sprints?: number
  Metros_HSR?: number
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

  if (!file || !teamId) {
    return NextResponse.json({ error: 'Faltan archivo o teamId' }, { status: 400 })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const teamQuery = await (supabase as any)
    .from('teams').select('*, organizations(owner_id)').eq('id', teamId).single()
  const team = teamQuery.data as { id: string; organizations: { owner_id: string } } | null

  const org = team?.organizations
  if (!team || org?.owner_id !== user.id) {
    return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
  }

  const buffer = await file.arrayBuffer()
  const wb = XLSX.read(new Uint8Array(buffer), { type: 'array' })
  const ws = wb.Sheets[wb.SheetNames[0]!]!
  const rows = XLSX.utils.sheet_to_json<ExcelRow>(ws)

  const errors: { row: number; message: string }[] = []
  let created = 0

  const admin = await createAdminClient()

  // Precargar jugadores del equipo indexados por email
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: memberships } = await (admin as any)
    .from('team_memberships')
    .select('user_id')
    .eq('team_id', teamId)
    .eq('role', 'player') as { data: { user_id: string }[] | null }

  const userIds = memberships?.map(m => m.user_id) ?? []

  // Para obtener emails necesitamos auth.users — usamos admin
  const emailToUserId = new Map<string, string>()
  for (const uid of userIds) {
    const { data: { user: authUser } } = await admin.auth.admin.getUserById(uid)
    if (authUser?.email) emailToUserId.set(authUser.email.toLowerCase(), uid)
  }

  for (const [i, row] of rows.entries()) {
    const email = String(row.Email_Jugador ?? '').toLowerCase().trim()
    const fecha = row.Fecha_Partido

    if (!email || !fecha) {
      errors.push({ row: i + 2, message: 'Faltan Email_Jugador o Fecha_Partido' })
      continue
    }

    const playerId = emailToUserId.get(email)
    if (!playerId) {
      errors.push({ row: i + 2, message: `Jugador con email "${email}" no encontrado en este equipo` })
      continue
    }

    const metros = Number(row.Metros_Totales ?? 0)
    const sprints = Number(row.Sprints ?? 0)
    let status: 'optimal' | 'fatigue' | 'alert' = 'optimal'
    if (row.Estado && ['optimal','fatigue','alert'].includes(String(row.Estado))) {
      status = String(row.Estado) as 'optimal' | 'fatigue' | 'alert'
    } else {
      if (metros < 5000) status = 'alert'
      else if (metros < 7000 && sprints < 15) status = 'fatigue'
    }

    const { error } = await (admin as any).from('match_metrics').insert({
      player_id: playerId,
      team_id: teamId,
      match_date: String(fecha),
      opponent: row.Rival ? String(row.Rival) : null,
      max_speed_kmh: row.Vel_Max_kmh ? Number(row.Vel_Max_kmh) : null,
      total_distance_m: metros || null,
      sprint_count: sprints || null,
      hsr_distance_m: row.Metros_HSR ? Number(row.Metros_HSR) : null,
      status,
      raw_data: row as Record<string, unknown>,
      created_by: user.id,
    })

    if (error) {
      errors.push({ row: i + 2, message: error.message })
    } else {
      created++
    }
  }

  return NextResponse.json({ created, errors })
}
