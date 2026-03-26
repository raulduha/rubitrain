import { createAdminClient, createClient } from '@/lib/supabase/server'
import { Resend } from 'resend'
import { NextResponse } from 'next/server'

const resend = new Resend(process.env.RESEND_API_KEY)
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { teamId, email, role } = await req.json()
  if (!teamId || !email || !role) {
    return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 })
  }

  // Verificar que el usuario es owner del equipo
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: team } = await (supabase as any)
    .from('teams')
    .select('*, organizations(name, owner_id)')
    .eq('id', teamId)
    .single() as { data: { id: string; name: string; organizations: { name: string; owner_id: string } } | null }

  const org = team?.organizations
  if (!team || org?.owner_id !== user.id) {
    return NextResponse.json({ error: 'Sin permisos para este equipo' }, { status: 403 })
  }

  // Crear invitación
  const admin = await createAdminClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: invitation, error } = await (admin as any)
    .from('invitations')
    .insert({ team_id: teamId, invited_by: user.id, email, role })
    .select()
    .single() as { data: { id: string; token: string } | null; error: { message: string } | null }

  if (error || !invitation) {
    return NextResponse.json({ error: 'No se pudo crear la invitación' }, { status: 500 })
  }

  // Enviar email
  const joinUrl = `${APP_URL}/join?token=${invitation.token}`
  const roleLabel = role === 'player' ? 'jugador' : 'entrenador'

  const { data: emailData, error: emailError } = await resend.emails.send({
    from: 'RubiTrain <onboarding@resend.dev>',
    to: email,
    subject: `Te invitaron a unirte a ${team.name} en ${org?.name}`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;">
        <div style="background:#001e40;padding:24px;border-radius:12px;text-align:center;margin-bottom:24px;">
          <span style="color:#83fc8e;font-size:28px;font-weight:900;">R</span>
          <span style="color:white;font-weight:700;font-size:18px;margin-left:8px;">RubiTrain</span>
        </div>
        <h2 style="color:#001e40;margin-bottom:8px;">Tienes una invitación</h2>
        <p style="color:#555;margin-bottom:24px;">
          Te invitaron a unirte como <strong>${roleLabel}</strong> al equipo
          <strong> ${team.name}</strong> en <strong>${org?.name}</strong>.
        </p>
        <a href="${joinUrl}"
           style="display:block;background:#001e40;color:white;text-align:center;padding:14px 24px;border-radius:12px;font-weight:600;text-decoration:none;margin-bottom:16px;">
          Aceptar invitación
        </a>
        <p style="color:#999;font-size:12px;text-align:center;">
          Este enlace expira en 7 días. Si no esperabas esta invitación, ignora este email.
        </p>
      </div>
    `,
  })

  if (emailError) {
    console.error('Resend error:', emailError)
    // La invitación se creó igual — devolvemos el link para que pueda copiarlo manualmente
    return NextResponse.json({
      success: true,
      invitationId: invitation.id,
      emailError: emailError.message,
      joinUrl,
    })
  }

  console.log('Email sent:', emailData)
  return NextResponse.json({ success: true, invitationId: invitation.id, joinUrl })
}
