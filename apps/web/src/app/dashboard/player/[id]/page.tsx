import { createAdminClient, createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import PlayerTabs from '@/components/roster/PlayerTabs'
import RemovePlayerButton from '@/components/roster/RemovePlayerButton'

export default async function PlayerDetailPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const admin = await createAdminClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const s = admin as any

  const { data: profile } = await s
    .from('profiles')
    .select('*')
    .eq('id', params.id)
    .single() as { data: { id: string; full_name: string; avatar_url: string | null; role: string; phone: string | null } | null }

  if (!profile) notFound()

  // Verificar que el usuario tiene acceso a este jugador
  const { data: membership } = await s
    .from('team_memberships')
    .select('*, teams(*, organizations(owner_id, name))')
    .eq('user_id', params.id)
    .eq('role', 'player')
    .eq('is_active', true)
    .limit(1)
    .single() as { data: { id: string; team_id: string; position: string | null; position_group: string | null; jersey_number: number | null; weight_kg: number | null; height_cm: number | null; teams: { name: string; organizations: { owner_id: string; name: string } } } | null }

  const org = membership?.teams
  if (!membership || org?.organizations.owner_id !== user!.id) notFound()

  const { data: perfLogs } = await s
    .from('performance_logs')
    .select('*')
    .eq('player_id', params.id)
    .order('log_date', { ascending: false })
    .limit(50)

  const { data: matchMetrics } = await s
    .from('match_metrics')
    .select('*')
    .eq('player_id', params.id)
    .order('match_date', { ascending: false })
    .limit(30)

  const { data: physicalHistory } = await s
    .from('physical_status')
    .select('*')
    .eq('player_id', params.id)
    .order('status_date', { ascending: false })

  const currentStatus = physicalHistory?.find((ps: { is_current: boolean }) => ps.is_current)

  return (
    <div className="p-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-400 mb-6">
        <Link href="/dashboard/clubs" className="hover:text-[#001e40]">Clubes</Link>
        <span>/</span>
        <span className="text-[#001e40] font-medium">{profile.full_name}</span>
      </div>

      {/* Header jugador */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-6">
        <div className="flex items-start gap-6">
          <div className="w-20 h-20 bg-[#001e40] rounded-2xl flex items-center justify-center shrink-0">
            <span className="text-[#83fc8e] text-3xl font-bold">{profile.full_name[0]?.toUpperCase()}</span>
          </div>
          <div className="flex-1">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-2xl font-bold text-[#001e40]">{profile.full_name}</h1>
                <p className="text-gray-400 text-sm mt-0.5">
                  {membership.position ?? 'Sin posición'} · {membership.position_group === 'forward' ? 'Forward' : membership.position_group === 'back' ? 'Back' : '—'}
                </p>
              </div>
              <RemovePlayerButton
                membershipId={membership.id}
                playerName={profile.full_name}
                backHref={`/dashboard/roster/${membership.team_id}`}
              />
              {currentStatus && (
                <span className={`text-xs px-3 py-1.5 rounded-full font-medium ${
                  currentStatus.status === 'fit' ? 'bg-green-50 text-green-700' :
                  currentStatus.status === 'injured' ? 'bg-red-50 text-red-700' :
                  currentStatus.status === 'limited' ? 'bg-yellow-50 text-yellow-700' :
                  'bg-orange-50 text-orange-700'
                }`}>
                  {({ fit: 'Apto', injured: 'Lesionado', limited: 'Limitado', recovering: 'Recuperación' } as Record<string, string>)[currentStatus.status] ?? currentStatus.status}
                </span>
              )}
            </div>
            <div className="flex gap-6 mt-4">
              {[
                { label: 'Camiseta', value: membership.jersey_number ? `#${membership.jersey_number}` : '—' },
                { label: 'Peso', value: membership.weight_kg ? `${membership.weight_kg} kg` : '—' },
                { label: 'Altura', value: membership.height_cm ? `${membership.height_cm} cm` : '—' },
                { label: 'Equipo', value: membership.teams.name },
              ].map(({ label, value }) => (
                <div key={label}>
                  <p className="text-xs text-gray-400">{label}</p>
                  <p className="font-semibold text-[#001e40] text-sm">{value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <PlayerTabs
        perfLogs={perfLogs ?? []}
        matchMetrics={matchMetrics ?? []}
        physicalHistory={physicalHistory ?? []}
      />
    </div>
  )
}
