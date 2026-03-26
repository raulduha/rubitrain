import { createAdminClient, createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import CreateClubButton from '@/components/clubs/CreateClubButton'

export default async function ClubsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const admin = await createAdminClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const s = admin as any
  type OrgRow = { id: string; name: string; sport: string; country: string | null; logo_url: string | null; owner_id: string; created_at: string }
  type TeamRow = { id: string; name: string; organization_id: string; is_active: boolean; team_memberships: { count: number }[] }

  const { data: orgs } = await s
    .from('organizations')
    .select('*')
    .eq('owner_id', user!.id)
    .order('created_at') as { data: OrgRow[] | null }

  const orgIds = orgs?.map(o => o.id) ?? []

  // Para cada org, traer sus equipos con conteo de jugadores
  const { data: teams } = orgIds.length
    ? await s
        .from('teams')
        .select('*, team_memberships(count)')
        .in('organization_id', orgIds)
        .eq('is_active', true) as { data: TeamRow[] | null }
    : { data: [] as TeamRow[] }

  const teamsByOrg = (teams ?? []).reduce<Record<string, TeamRow[]>>((acc, t) => {
    if (!acc[t.organization_id]) acc[t.organization_id] = []
    acc[t.organization_id]!.push(t)
    return acc
  }, {})

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[#001e40]">Mis Clubes</h1>
          <p className="text-gray-500 text-sm mt-1">Gestiona tus organizaciones y categorías</p>
        </div>
        <CreateClubButton userId={user!.id} />
      </div>

      {!orgs || orgs.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-16 text-center">
          <div className="text-5xl mb-4">🏟️</div>
          <p className="text-gray-500 mb-6">Aún no tienes ningún club. Crea el primero.</p>
          <CreateClubButton userId={user!.id} />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {orgs.map(org => {
            const orgTeams = teamsByOrg[org.id] ?? []
            const totalPlayers = orgTeams.reduce((sum, t) => {
              const count = (t.team_memberships as unknown as { count: number }[])?.[0]?.count ?? 0
              return sum + Number(count)
            }, 0)

            return (
              <div key={org.id} className="bg-white rounded-2xl border border-gray-100 p-6 hover:shadow-sm transition">
                {/* Header */}
                <div className="flex items-start justify-between mb-5">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-[#001e40] rounded-xl flex items-center justify-center shrink-0">
                      <span className="text-[#83fc8e] font-bold text-xl">{org.name[0]}</span>
                    </div>
                    <div>
                      <h2 className="font-bold text-[#001e40] text-lg">{org.name}</h2>
                      <p className="text-gray-400 text-sm">{org.sport} · {org.country}</p>
                    </div>
                  </div>
                  <Link
                    href={`/dashboard/clubs/${org.id}`}
                    className="text-sm text-[#0058bc] hover:underline font-medium"
                  >
                    Gestionar →
                  </Link>
                </div>

                {/* Stats */}
                <div className="flex gap-4 mb-5">
                  <div className="bg-[#f8f9fa] rounded-xl px-4 py-3 flex-1 text-center">
                    <p className="text-2xl font-bold text-[#001e40]">{orgTeams.length}</p>
                    <p className="text-xs text-gray-400 mt-0.5">Categorías</p>
                  </div>
                  <div className="bg-[#f8f9fa] rounded-xl px-4 py-3 flex-1 text-center">
                    <p className="text-2xl font-bold text-[#001e40]">{totalPlayers}</p>
                    <p className="text-xs text-gray-400 mt-0.5">Jugadores</p>
                  </div>
                </div>

              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
