import { createAdminClient, createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { organizationId, name, category, season } = await req.json()

  // Verificar que el usuario es owner de la org (sin RLS recursivo)
  const admin = await createAdminClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: org } = await (admin as any)
    .from('organizations')
    .select('owner_id')
    .eq('id', organizationId)
    .single() as { data: { owner_id: string } | null }

  if (!org || org.owner_id !== user.id) {
    return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: team, error } = await (admin as any)
    .from('teams')
    .insert({ organization_id: organizationId, name, category, season })
    .select()
    .single() as { data: { id: string; name: string; category: string; season: string; organization_id: string; is_active: boolean; created_at: string } | null; error: { message: string } | null }

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ team })
}
