import { createAdminClient, createClient } from '@/lib/supabase/server'
import DashboardView, { type ClubData } from '@/components/dashboard/DashboardView'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const admin = await createAdminClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const a = admin as any

  const { data: profile } = await a
    .from('profiles').select('full_name').eq('id', user!.id).single() as
    { data: { full_name: string } | null }

  const { data: orgs } = await a
    .from('organizations').select('id, name, sport, country').eq('owner_id', user!.id) as
    { data: { id: string; name: string; sport: string; country: string | null }[] | null }

  const orgIds = orgs?.map(o => o.id) ?? []

  const { data: teams } = orgIds.length
    ? await a.from('teams').select('id, name, category, organization_id').in('organization_id', orgIds).eq('is_active', true)
    : { data: [] } as { data: { id: string; name: string; category: string | null; organization_id: string }[] | null }

  const clubs: ClubData[] = (orgs ?? []).map(org => ({
    id: org.id, name: org.name, sport: org.sport, country: org.country,
    teams: (teams ?? [])
      .filter((t: { organization_id: string }) => t.organization_id === org.id)
      .map((t: { id: string; name: string; category: string | null }) => ({ id: t.id, name: t.name, category: t.category })),
  }))

  const greeting = profile?.full_name?.split(' ')[0] ?? ''
  const today = new Date().toLocaleDateString('es-CL', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#001e40]">Hola, {greeting} 👋</h1>
        <p className="text-gray-500 text-sm mt-1">{today}</p>
      </div>
      <DashboardView clubs={clubs} />
    </div>
  )
}
