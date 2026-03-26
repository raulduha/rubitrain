import { createAdminClient, createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import RosterTable from '@/components/roster/RosterTable'
import InvitePlayerButton from '@/components/roster/InvitePlayerButton'

export default async function RosterPage({ params }: { params: { teamId: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const admin = await createAdminClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const s = admin as any

  const { data: team } = await s
    .from('teams')
    .select('*, organizations(*)')
    .eq('id', params.teamId)
    .single() as { data: { id: string; name: string; category: string | null; season: string | null; organizations: { id: string; owner_id: string; name: string } } | null }

  if (!team) notFound()

  // Verificar que el usuario es owner de la org
  const org = team.organizations
  if (org?.owner_id !== user!.id) notFound()

  const { data: memberships } = await s
    .from('team_memberships')
    .select('*, profiles(*)')
    .eq('team_id', params.teamId)
    .eq('role', 'player')
    .order('jersey_number', { nullsFirst: false }) as {
      data: {
        id: string; user_id: string; team_id: string; role: 'coach' | 'player'
        position: string | null; position_group: 'forward' | 'back' | null
        jersey_number: number | null; weight_kg: number | null; height_cm: number | null
        birth_date: string | null; is_active: boolean; joined_at: string
        profiles: { id: string; full_name: string; avatar_url: string | null; role: 'physical_trainer' | 'coach' | 'player'; phone: string | null; created_at: string; updated_at: string } | null
      }[] | null
    }

  // Obtener estados físicos actuales por separado
  const playerIds = (memberships ?? []).map(m => m.user_id)
  const { data: statuses } = playerIds.length
    ? await s
        .from('physical_status')
        .select('player_id, status, is_current')
        .in('player_id', playerIds)
        .eq('is_current', true) as { data: { player_id: string; status: string; is_current: boolean }[] | null }
    : { data: [] }

  const players = (memberships ?? []).map(m => {
    const currentStatus = statuses?.find(ps => ps.player_id === m.user_id)?.status ?? 'fit'
    return { ...m, currentPhysicalStatus: currentStatus }
  })

  return (
    <div className="p-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-400 mb-6">
        <Link href="/dashboard/clubs" className="hover:text-[#001e40]">Clubes</Link>
        <span>/</span>
        <Link href={`/dashboard/clubs/${org?.id ?? ''}`} className="hover:text-[#001e40]">
          {org?.name}
        </Link>
        <span>/</span>
        <span className="text-[#001e40] font-medium">{team.name}</span>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[#001e40]">{team.name}</h1>
          <p className="text-gray-400 text-sm mt-1">
            {team.category} · Temporada {team.season} · {players.length} jugadores
          </p>
        </div>
        <InvitePlayerButton teamId={params.teamId} teamName={team.name} />
      </div>

      <RosterTable players={players} teamId={params.teamId} />
    </div>
  )
}
