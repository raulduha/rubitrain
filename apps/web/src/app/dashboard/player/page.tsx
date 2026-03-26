import { createAdminClient, createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

type Membership = {
  id: string
  position: string | null
  position_group: string | null
  jersey_number: number | null
  weight_kg: number | null
  height_cm: number | null
  team_id: string
  teams: { id: string; name: string; category: string | null; season: string | null; organizations: { name: string } }
}

type PerfLog = {
  squat_kg: number | null
  deadlift_kg: number | null
  bench_kg: number | null
  power_clean_kg: number | null
  log_date: string
  player_id: string
}

type MatchMetric = {
  max_speed_kmh: number | null
  total_distance_m: number | null
  sprint_count: number | null
  match_date: string
  player_id: string
}

function avg(nums: (number | null)[]): number | null {
  const vals = nums.filter((n): n is number => n !== null)
  return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null
}

function fmt(n: number | null, unit = ''): string {
  if (n === null) return '—'
  return `${Math.round(n * 10) / 10}${unit}`
}

function CompareBar({ label, mine, team, unit = '' }: { label: string; mine: number | null; team: number | null; unit?: string }) {
  const pct = mine !== null && team !== null && team > 0 ? Math.min((mine / team) * 100, 150) : null
  const above = mine !== null && team !== null && mine >= team

  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-gray-500">{label}</span>
        <span className="font-semibold text-[#001e40]">
          {fmt(mine, unit)} <span className="text-gray-400 font-normal">/ prom {fmt(team, unit)}</span>
        </span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        {pct !== null && (
          <div
            className={`h-full rounded-full transition-all ${above ? 'bg-[#0058bc]' : 'bg-orange-400'}`}
            style={{ width: `${Math.min(pct, 100)}%` }}
          />
        )}
      </div>
    </div>
  )
}

export default async function PlayerDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const admin = await createAdminClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const a = admin as any

  const { data: profile } = await a
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single() as { data: { id: string; full_name: string; role: string } | null }

  if (!profile) redirect('/login')

  // Equipos del jugador
  const { data: memberships } = await a
    .from('team_memberships')
    .select('*, teams(id, name, category, season, organizations(name))')
    .eq('user_id', user.id)
    .eq('role', 'player')
    .eq('is_active', true) as { data: Membership[] | null }

  const teamIds = memberships?.map(m => m.team_id) ?? []

  // Performance logs de todos los jugadores en esos equipos (para comparar)
  const { data: allPerf } = await a
    .from('performance_logs')
    .select('squat_kg, deadlift_kg, bench_kg, power_clean_kg, log_date, player_id, team_id')
    .in('team_id', teamIds)
    .order('log_date', { ascending: false }) as { data: (PerfLog & { team_id: string })[] | null }

  // Match metrics de todos los jugadores en esos equipos
  const { data: allMatch } = await a
    .from('match_metrics')
    .select('max_speed_kmh, total_distance_m, sprint_count, match_date, player_id, team_id')
    .in('team_id', teamIds)
    .order('match_date', { ascending: false }) as { data: (MatchMetric & { team_id: string })[] | null }

  return (
    <div className="p-8 max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#001e40]">
          Hola, {profile.full_name.split(' ')[0]}
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          {new Date().toLocaleDateString('es-CL', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {memberships && memberships.length > 0 ? (
        <div className="space-y-6">
          {memberships.map(m => {
            const myPerf = (allPerf ?? []).filter(p => p.player_id === user.id && (p as any).team_id === m.team_id)
            const teamPerf = (allPerf ?? []).filter(p => (p as any).team_id === m.team_id)
            const myMatch = (allMatch ?? []).filter(p => p.player_id === user.id && (p as any).team_id === m.team_id)
            const teamMatch = (allMatch ?? []).filter(p => (p as any).team_id === m.team_id)

            const myAvgSquat = avg(myPerf.map(p => p.squat_kg))
            const teamAvgSquat = avg(teamPerf.map(p => p.squat_kg))
            const myAvgDead = avg(myPerf.map(p => p.deadlift_kg))
            const teamAvgDead = avg(teamPerf.map(p => p.deadlift_kg))
            const myAvgBench = avg(myPerf.map(p => p.bench_kg))
            const teamAvgBench = avg(teamPerf.map(p => p.bench_kg))
            const myAvgPower = avg(myPerf.map(p => p.power_clean_kg))
            const teamAvgPower = avg(teamPerf.map(p => p.power_clean_kg))

            const myAvgSpeed = avg(myMatch.map(p => p.max_speed_kmh))
            const teamAvgSpeed = avg(teamMatch.map(p => p.max_speed_kmh))
            const myAvgDist = avg(myMatch.map(p => p.total_distance_m))
            const teamAvgDist = avg(teamMatch.map(p => p.total_distance_m))
            const myAvgSprints = avg(myMatch.map(p => p.sprint_count))
            const teamAvgSprints = avg(teamMatch.map(p => p.sprint_count))

            const hasPerf = myAvgSquat !== null || myAvgDead !== null || myAvgBench !== null
            const hasMatch = myAvgSpeed !== null || myAvgDist !== null

            return (
              <div key={m.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                {/* Team header */}
                <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between">
                  <div>
                    <h2 className="font-bold text-[#001e40]">{m.teams.name}</h2>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {m.teams.organizations.name} · {m.teams.category} · Temporada {m.teams.season}
                    </p>
                  </div>
                  <div className="flex gap-4 text-sm text-right">
                    {m.jersey_number && (
                      <div>
                        <p className="text-xs text-gray-400">Camiseta</p>
                        <p className="font-bold text-[#001e40]">#{m.jersey_number}</p>
                      </div>
                    )}
                    {m.position && (
                      <div>
                        <p className="text-xs text-gray-400">Posición</p>
                        <p className="font-semibold text-[#001e40]">{m.position}</p>
                      </div>
                    )}
                    {m.weight_kg && (
                      <div>
                        <p className="text-xs text-gray-400">Peso</p>
                        <p className="font-semibold text-[#001e40]">{m.weight_kg} kg</p>
                      </div>
                    )}
                    {m.height_cm && (
                      <div>
                        <p className="text-xs text-gray-400">Altura</p>
                        <p className="font-semibold text-[#001e40]">{m.height_cm} cm</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="p-6 space-y-6">
                  {/* Fuerza */}
                  {hasPerf ? (
                    <div>
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Fuerza vs equipo</p>
                      <div className="space-y-3">
                        <CompareBar label="Squat" mine={myAvgSquat} team={teamAvgSquat} unit=" kg" />
                        <CompareBar label="Deadlift" mine={myAvgDead} team={teamAvgDead} unit=" kg" />
                        <CompareBar label="Bench" mine={myAvgBench} team={teamAvgBench} unit=" kg" />
                        {myAvgPower !== null && <CompareBar label="Power Clean" mine={myAvgPower} team={teamAvgPower} unit=" kg" />}
                      </div>
                    </div>
                  ) : (
                    <p className="text-gray-400 text-sm text-center py-2">Sin datos de fuerza aún</p>
                  )}

                  {/* Partido */}
                  {hasMatch && (
                    <div>
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Partido vs equipo</p>
                      <div className="space-y-3">
                        <CompareBar label="Vel. máx." mine={myAvgSpeed} team={teamAvgSpeed} unit=" km/h" />
                        <CompareBar label="Distancia" mine={myAvgDist ? myAvgDist / 1000 : null} team={teamAvgDist ? teamAvgDist / 1000 : null} unit=" km" />
                        <CompareBar label="Sprints" mine={myAvgSprints} team={teamAvgSprints} />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <div className="w-14 h-14 bg-[#f0f7ff] rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-[#0058bc]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <p className="font-semibold text-[#001e40] mb-1">Aún no estás en ningún equipo</p>
          <p className="text-gray-400 text-sm leading-relaxed max-w-xs mx-auto">
            Para acceder, pide a tu entrenador o preparador físico que te invite desde la plataforma. Recibirás un link por email.
          </p>
        </div>
      )}
    </div>
  )
}
