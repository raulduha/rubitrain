import { createAdminClient, createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import DeleteUploadButton from '@/components/uploads/DeleteUploadButton'

export default async function UploadsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const admin = await createAdminClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const a = admin as any

  const { data: orgs } = await a
    .from('organizations').select('id').eq('owner_id', user!.id) as
    { data: { id: string }[] | null }

  const { data: teams } = orgs?.length
    ? await a.from('teams').select('id, name, organizations(name)').in('organization_id', orgs.map((o: { id: string }) => o.id))
    : { data: [] } as { data: { id: string; name: string; organizations: { name: string } }[] | null }

  type PerfRow  = { upload_id: string; team_id: string; player_id: string; log_date: string; created_at: string }
  type MatchRow = { upload_id: string; team_id: string; player_id: string; match_date: string; created_at: string }

  const teamIds = (teams ?? []).map((t: { id: string }) => t.id)

  if (!teamIds.length) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold text-[#001e40] mb-4">Archivos subidos</h1>
        <p className="text-gray-400 text-sm">No tienes equipos aún.</p>
      </div>
    )
  }

  const [perfRes, matchRes] = await Promise.all([
    a.from('performance_logs')
      .select('upload_id, team_id, player_id, log_date, created_at')
      .in('team_id', teamIds)
      .not('upload_id', 'is', null) as { data: PerfRow[] | null },
    a.from('match_metrics')
      .select('upload_id, team_id, player_id, match_date, created_at')
      .in('team_id', teamIds)
      .not('upload_id', 'is', null) as { data: MatchRow[] | null },
  ])

  type SessionEntry = {
    upload_id: string; team_id: string; team_name: string; org_name: string
    date: string; type: 'training' | 'matches'; player_count: number; created_at: string
    player_ids: Set<string>
  }

  const map = new Map<string, SessionEntry>()

  for (const row of (perfRes.data ?? [])) {
    if (!map.has(row.upload_id)) {
      const team = (teams ?? []).find((t: { id: string; name: string; organizations: { name: string } }) => t.id === row.team_id)
      map.set(row.upload_id, {
        upload_id: row.upload_id, team_id: row.team_id,
        team_name: team?.name ?? '?', org_name: team?.organizations?.name ?? '?',
        date: row.log_date, type: 'training',
        player_count: 0, created_at: row.created_at, player_ids: new Set(),
      })
    }
    map.get(row.upload_id)!.player_ids.add(row.player_id)
  }
  for (const row of (matchRes.data ?? [])) {
    if (!map.has(row.upload_id)) {
      const team = (teams ?? []).find((t: { id: string; name: string; organizations: { name: string } }) => t.id === row.team_id)
      map.set(row.upload_id, {
        upload_id: row.upload_id, team_id: row.team_id,
        team_name: team?.name ?? '?', org_name: team?.organizations?.name ?? '?',
        date: row.match_date, type: 'matches',
        player_count: 0, created_at: row.created_at, player_ids: new Set(),
      })
    }
    map.get(row.upload_id)!.player_ids.add(row.player_id)
  }

  const sessions = [...map.values()]
    .map(s => ({ ...s, player_count: s.player_ids.size }))
    .sort((a, b) => b.created_at.localeCompare(a.created_at))

  const fmtDate = (d: string) => {
    try { return new Date(d + 'T00:00:00').toLocaleDateString('es-CL', { day: 'numeric', month: 'short', year: 'numeric' }) }
    catch { return d }
  }

  return (
    <div className="p-8 max-w-4xl">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#001e40]">Archivos subidos</h1>
          <p className="text-gray-400 text-sm mt-1">Todas las sesiones cargadas via Excel</p>
        </div>
        <div className="flex gap-3">
          <Link href="/dashboard/upload/training" className="text-sm bg-[#001e40] text-white px-4 py-2 rounded-xl font-medium hover:bg-[#003366] transition">
            + Subir Rutina
          </Link>
          <Link href="/dashboard/upload/matches" className="text-sm bg-[#0058bc] text-white px-4 py-2 rounded-xl font-medium hover:bg-[#0046a0] transition">
            + Subir Partido
          </Link>
        </div>
      </div>

      {sessions.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-16 text-center">
          <p className="text-gray-400 mb-3">No has subido ningún archivo aún.</p>
          <Link href="/dashboard/upload/training" className="text-sm text-[#0058bc] hover:underline">
            Subir primer archivo →
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {sessions.map(s => (
            <div key={s.upload_id} className="bg-white rounded-2xl border border-gray-100 p-5 flex items-center gap-4">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0 ${
                s.type === 'training' ? 'bg-[#001e40]' : 'bg-[#0058bc]'
              }`}>
                {s.type === 'training' ? '💪' : '⚡'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-[#001e40] text-sm">
                  {s.type === 'training' ? 'Fuerza' : 'Partido'} · {s.team_name}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {s.org_name} · {fmtDate(s.date)} · {s.player_count} jugadores
                </p>
              </div>
              <DeleteUploadButton uploadId={s.upload_id} type={s.type} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
