import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase-server';
import { getAuthUser } from '@/lib/auth-middleware';
import { checkTeamLimit } from '@/lib/planes';
import { sendEmail, buildInvitationEmail } from '@/lib/email';
import crypto from 'crypto';

export async function POST(
  request: NextRequest,
  { params }: { params: { equipoId: string } },
) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const supabase = getSupabaseServerClient();

    // Verify equipo belongs to user's empresa
    const { data: equipo, error: eqError } = await supabase
      .from('equipos')
      .select('id, nombre')
      .eq('id', params.equipoId)
      .eq('empresa_id', authUser.empresa_id)
      .maybeSingle();

    if (eqError || !equipo) {
      return NextResponse.json(
        { error: 'Equipo no encontrado' },
        { status: 404 },
      );
    }

    // Check inviter is team_admin or empresa_admin/super_admin
    const isGlobalAdmin = authUser.rol_global === 'empresa_admin' || authUser.rol_global === 'super_admin';

    if (!isGlobalAdmin) {
      const { data: membership, error: memError } = await supabase
        .from('usuarios_equipo')
        .select('rol')
        .eq('equipo_id', params.equipoId)
        .eq('usuario_id', authUser.id)
        .maybeSingle();

      if (memError || !membership || membership.rol !== 'team_admin') {
        return NextResponse.json(
          { error: 'No tienes permisos para invitar miembros' },
          { status: 403 },
        );
      }
    }

    const body = await request.json();
    const { email, rol } = body;

    if (!email || typeof email !== 'string' || email.trim().length === 0) {
      return NextResponse.json(
        { error: 'El email es requerido' },
        { status: 400 },
      );
    }

    const targetRol = rol === 'team_admin' ? 'team_admin' : 'member';

    // Check if user already exists in the sistema with that email
    const { data: existingUser, error: userError } = await supabase
      .from('usuarios')
      .select('id, email')
      .eq('email', email.trim().toLowerCase())
      .maybeSingle();

    if (userError) {
      console.error('Error looking up user:', userError);
      return NextResponse.json(
        { error: 'Error al verificar el usuario' },
        { status: 500 },
      );
    }

    if (existingUser) {
      // User exists — check team limit before adding
      const limitResult = await checkTeamLimit(authUser.empresa_id);
      if (!limitResult.allowed) {
        return NextResponse.json(
          { error: 'Límite de equipos alcanzado para tu plan' },
          { status: 403 },
        );
      }

      // Check if already a member
      const { data: existingMember } = await supabase
        .from('usuarios_equipo')
        .select('id')
        .eq('equipo_id', params.equipoId)
        .eq('usuario_id', existingUser.id)
        .maybeSingle();

      if (existingMember) {
        return NextResponse.json(
          { message: 'El usuario ya es miembro del equipo' },
        );
      }

      // Add directly to usuarios_equipo
      const { error: insertError } = await supabase
        .from('usuarios_equipo')
        .insert({
          equipo_id: params.equipoId,
          usuario_id: existingUser.id,
          rol: targetRol,
        });

      if (insertError) {
        console.error('Error adding user to equipo:', insertError);
        return NextResponse.json(
          { error: 'Error al agregar usuario al equipo' },
          { status: 500 },
        );
      }

      return NextResponse.json({
        message: 'Usuario agregado al equipo',
      });
    }

    // User does not exist — create invitation
    const token = crypto.randomBytes(16).toString('hex');
    const expiraEn = new Date();
    expiraEn.setDate(expiraEn.getDate() + 7); // Expires in 7 days

    const { data: invitacion, error: invError } = await supabase
      .from('invitaciones')
      .insert({
        equipo_id: params.equipoId,
        email: email.trim().toLowerCase(),
        token,
        rol: targetRol,
        aceptada: false,
        expira_en: expiraEn.toISOString(),
      })
      .select()
      .single();

    if (invError) {
      console.error('Error creating invitation:', invError);
      return NextResponse.json(
        { error: 'Error al crear la invitación' },
        { status: 500 },
      );
    }

    // Send invitation email
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const invitationLink = `${appUrl}/invitaciones/${token}`;
    const html = buildInvitationEmail(equipo.nombre, invitationLink);

    const emailResult = await sendEmail({
      to: email.trim().toLowerCase(),
      subject: `Invitación a unirte a ${equipo.nombre} — RetroPulse`,
      html,
    });

    if (!emailResult.success) {
      console.warn('Failed to send invitation email:', emailResult.error);
      // Still return success — invitation exists, user can share link manually
    }

    return NextResponse.json(
      {
        message: 'Invitación enviada',
        invitacion_id: invitacion.id,
        token: invitacion.token,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error('POST /api/equipos/[equipoId]/invitar error:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 },
    );
  }
}
