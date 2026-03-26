import { createAdminClient, createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import ClubTabs from '@/components/clubs/ClubTabs'

export default async function ClubDetailPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const admin = await createAdminClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const a = admin as any

  const { data: org } = await a
    .from('organizations')
    .select('*')
    .eq('id', params.id)
    .eq('owner_id', user!.id)
    .single() as { data: { id: string; name: string; sport: string; logo_url: string | null; country: string | null; owner_id: string; created_at: string } | null }

  if (!org) notFound()

  const { data: teams } = await a
    .from('teams')
    .select('*, team_memberships(count)')
    .eq('organization_id', org.id)
    .order('name') as { data: { id: string; name: string; season: string | null; category: string | null; organization_id: string; is_active: boolean; created_at: string; team_memberships: { count: number }[] }[] | null }

  const { data: coaches } = await a
    .from('team_memberships')
    .select('*, profiles(*), teams(name)')
    .eq('role', 'coach')
    .in('team_id', teams?.map((t: { id: string }) => t.id) ?? []) as { data: { id: string; profiles: { id: string; full_name: string; avatar_url: string | null; role: 'physical_trainer' | 'coach' | 'player'; phone: string | null; created_at: string; updated_at: string } | null; teams: { name: string } | null }[] | null }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link href="/dashboard/clubs" className="text-gray-400 hover:text-[#001e40] text-sm">
          ← Clubes
        </Link>
        <span className="text-gray-200">/</span>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#001e40] rounded-xl flex items-center justify-center">
            <span className="text-[#83fc8e] font-bold">{org.name[0]}</span>
          </div>
          <div>
            <h1 className="text-xl font-bold text-[#001e40]">{org.name}</h1>
            <p className="text-gray-400 text-sm">{org.sport} · {org.country}</p>
          </div>
        </div>
      </div>

      <ClubTabs org={org} teams={teams ?? []} coaches={coaches ?? []} />
    </div>
  )
}
