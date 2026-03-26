import { createAdminClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(
  req: Request,
  { params }: { params: { token: string } }
) {
  const { userId } = await req.json()
  if (!userId) return NextResponse.json({ error: 'userId requerido' }, { status: 400 })

  const admin = await createAdminClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (admin as any).rpc('accept_invitation', {
    p_token: params.token,
    p_user_id: userId,
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!data?.success) return NextResponse.json({ error: data?.error ?? 'Error desconocido' }, { status: 400 })

  return NextResponse.json(data)
}
