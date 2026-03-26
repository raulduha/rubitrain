import { createAdminClient, createClient } from '@/lib/supabase/server'
import * as XLSX from 'xlsx'
import { NextResponse } from 'next/server'

const PARAM_COLS: Record<string, string> = {
  squat: 'Squat_kg',
  deadlift: 'Deadlift_kg',
  bench: 'Bench_kg',
  power_clean: 'Power_Clean_kg',
  tonnage: 'Tonnage_kg',
  notas: 'Notas',
}

export async function GET(req: Request) {
  const url = new URL(req.url)
  const teamId = url.searchParams.get('teamId')
  const selectedParams = url.searchParams.getAll('p')

  if (!teamId) return NextResponse.json({ error: 'teamId requerido' }, { status: 400 })

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const admin = await createAdminClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const a = admin as any

  const { data: team } = await a
    .from('teams')
    .select('name, category, organizations(owner_id)')
    .eq('id', teamId)
    .single() as { data: { name: string; category: string | null; organizations: { owner_id: string } } | null }

  if (!team || team.organizations.owner_id !== user.id) {
    return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
  }

  const { data: memberships } = await a
    .from('team_memberships')
    .select('user_id, profiles(full_name)')
    .eq('team_id', teamId)
    .eq('role', 'player')
    .eq('is_active', true) as {
      data: { user_id: string; profiles: { full_name: string } | null }[] | null
    }

  const players = (memberships ?? [])
    .filter(m => m.profiles?.full_name)
    .map(m => ({ id: m.user_id, name: m.profiles!.full_name }))

  const paramCols = selectedParams.filter(p => PARAM_COLS[p]).map(p => PARAM_COLS[p]!)
  const headers = ['Jugador_ID', 'Nombre_Jugador', 'Fecha', ...paramCols]

  const today = new Date().toISOString().slice(0, 10)

  const rows = players.map(p => {
    const row: (string | null)[] = [p.id, p.name, today]
    paramCols.forEach(() => row.push(''))
    return row
  })

  const wb = XLSX.utils.book_new()
  const ws = XLSX.utils.aoa_to_sheet([headers, ...rows])
  ws['!cols'] = headers.map(h => ({ wch: h === 'Jugador_ID' ? 38 : 20 }))

  const wsRef = XLSX.utils.aoa_to_sheet([
    ['Instrucciones'],
    [''],
    ['- No modifiques Jugador_ID ni Nombre_Jugador'],
    ['- Fecha: formato YYYY-MM-DD (ej: 2025-07-14)'],
    ['- Deja en blanco las celdas sin dato'],
    ['- Guarda como .xlsx antes de subir'],
  ])

  XLSX.utils.book_append_sheet(wb, ws, 'Rendimiento')
  XLSX.utils.book_append_sheet(wb, wsRef, 'Instrucciones')

  const label = team.category ? `${team.name}_${team.category}` : team.name
  const rawBuf = XLSX.write(wb, { type: 'array', bookType: 'xlsx' }) as number[]

  return new Response(new Uint8Array(rawBuf), {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="rendimiento_${label}.xlsx"`,
    },
  })
}
