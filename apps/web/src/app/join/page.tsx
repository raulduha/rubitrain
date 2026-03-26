import { createAdminClient } from '@/lib/supabase/server'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import JoinClient from './JoinClient'

export default async function JoinPage({ searchParams }: { searchParams: { token?: string } }) {
  const token = searchParams.token
  if (!token) redirect('/')

  const admin = await createAdminClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: invitation } = await (admin as any)
    .from('invitations')
    .select('*, teams(id, name, organizations(name))')
    .eq('token', token)
    .single() as { data: { id: string; email: string; role: string; status: string; expires_at: string; teams: { id: string; name: string; organizations: { name: string } } | null } | null }

  if (!invitation || invitation.status !== 'pending' || new Date(invitation.expires_at) < new Date()) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8f9fa]">
        <div className="bg-white rounded-2xl p-8 text-center max-w-sm w-full">
          <div className="text-4xl mb-4">❌</div>
          <h2 className="font-bold text-[#001e40] mb-2">Invitación inválida</h2>
          <p className="text-gray-400 text-sm">Este enlace ha expirado o ya fue utilizado.</p>
        </div>
      </div>
    )
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Verificar si ya es miembro de este equipo
  let alreadyMember = false
  if (user) {
    const { data: existing } = await (admin as any)
      .from('team_memberships')
      .select('id')
      .eq('team_id', invitation.teams?.id ?? '')
      .eq('user_id', user.id)
      .maybeSingle() as { data: { id: string } | null }
    alreadyMember = !!existing
  }

  const team = invitation.teams

  return (
    <JoinClient
      token={token}
      email={invitation.email}
      teamName={team?.name ?? ''}
      orgName={team?.organizations?.name ?? ''}
      role={invitation.role}
      isLoggedIn={!!user}
      currentUserEmail={user?.email ?? null}
      alreadyMember={alreadyMember}
    />
  )
}
