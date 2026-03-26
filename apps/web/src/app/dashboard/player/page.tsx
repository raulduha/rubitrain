import { createAdminClient, createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import PlayerDashboardView from '@/components/player/PlayerDashboardView'

export default async function PlayerDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const admin = await createAdminClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const a = admin as any

  const { data: profile } = await a
    .from('profiles').select('full_name').eq('id', user.id).single() as
    { data: { full_name: string } | null }

  if (!profile) redirect('/login')

  const { data: memberships } = await a
    .from('team_memberships')
    .select('id, team_id, position, position_group, jersey_number, weight_kg, height_cm, teams(id, name, category, season, organizations(name))')
    .eq('user_id', user.id)
    .eq('role', 'player')
    .eq('is_active', true) as {
      data: {
        id: string; team_id: string; position: string | null; position_group: 'forward' | 'back' | null
        jersey_number: number | null; weight_kg: number | null; height_cm: number | null
        teams: { id: string; name: string; category: string | null; season: string | null; organizations: { name: string } }
      }[] | null
    }

  return (
    <div className="p-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#001e40]">Hola, {profile.full_name.split(' ')[0]}</h1>
        <p className="text-gray-500 text-sm mt-1">
          {new Date().toLocaleDateString('es-CL', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>
      <PlayerDashboardView memberships={memberships ?? []} userId={user.id} />
    </div>
  )
}
