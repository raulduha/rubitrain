import { createAdminClient, createClient } from '@/lib/supabase/server'
import type { Tables } from '@rubitrain/db'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const admin = await createAdminClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: profile } = await (admin as any)
    .from('profiles')
    .select('*')
    .eq('id', user!.id)
    .single() as { data: Tables<'profiles'> | null }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: orgs } = await (admin as any)
    .from('organizations')
    .select('*')
    .eq('owner_id', user!.id) as { data: Tables<'organizations'>[] | null }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { count: teamCount } = await (admin as any)
    .from('teams')
    .select('*', { count: 'exact', head: true })
    .in('organization_id', orgs?.map(o => o.id) ?? [])

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#001e40]">
          Hola, {profile?.full_name?.split(' ')[0]} 👋
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          {new Date().toLocaleDateString('es-CL', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {/* Stats rápidas */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <StatCard label="Clubes" value={orgs?.length ?? 0} />
        <StatCard label="Equipos" value={teamCount ?? 0} />
        <StatCard label="Plan" value={profile?.role === 'physical_trainer' ? 'Free' : '-'} />
      </div>

      {/* Clubes */}
      {orgs && orgs.length > 0 ? (
        <div>
          <h2 className="text-lg font-semibold text-[#001e40] mb-4">Tus clubes</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {orgs.map(org => (
              <div key={org.id} className="bg-white rounded-xl border border-gray-100 p-6 hover:shadow-sm transition">
                <div className="w-10 h-10 bg-[#001e40] rounded-lg flex items-center justify-center mb-3">
                  <span className="text-[#83fc8e] font-bold text-lg">{org.name[0]}</span>
                </div>
                <h3 className="font-semibold text-[#001e40]">{org.name}</h3>
                <p className="text-gray-400 text-sm mt-1">{org.sport} · {org.country}</p>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-dashed border-gray-200 p-12 text-center">
          <p className="text-gray-400 text-sm mb-4">Aún no tienes ningún club creado</p>
          <a
            href="/dashboard/clubs/new"
            className="inline-flex items-center gap-2 bg-[#001e40] text-white rounded-xl px-6 py-3 text-sm font-semibold hover:bg-[#003366] transition"
          >
            + Crear primer club
          </a>
        </div>
      )}
    </div>
  )
}

function StatCard({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-6">
      <p className="text-gray-400 text-sm">{label}</p>
      <p className="text-3xl font-bold text-[#001e40] mt-1">{value}</p>
    </div>
  )
}
