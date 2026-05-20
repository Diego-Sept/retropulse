import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase-server';
import { getAuthUser } from '@/lib/auth-middleware';

export async function GET(
  request: NextRequest,
  { params }: { params: { token: string } },
) {
  try {
    const supabase = getSupabaseServerClient();

    const { data: invitacion, error } = await supabase
      .from('invitaciones')
      .select('*, equipos!inner(nombre, empresa_id)')
      .eq('token', params.token)
      .maybeSingle();

    if (error) {
      console.error('Error fetching invitacion:', error);
      return NextResponse.json(
        { error: 'Error al obtener la invitación' },
        { status: 500 },
      );
    }

    if (!invitacion) {
      return NextResponse.json(
        { error: 'Invitación no encontrada' },
        { status: 404 },
      );
    }

    if (invitacion.aceptada) {
      return NextResponse.json(
        { error: 'Esta invitación ya fue aceptada' },
        { status: 400 },
      );
    }

    // Check if expired
    const expiraEn = new Date(invitacion.expira_en);
    if (expiraEn < new Date()) {
      return NextResponse.json(
        { error: 'Esta invitación ha expirado' },
        { status: 400 },
      );
    }

    return NextResponse.json({
      invitacion: {
        id: invitacion.id,
        equipo_id: invitacion.equipo_id,
        equipo_nombre: (invitacion as any).equipos?.nombre || '',
        email: invitacion.email,
        rol: invitacion.rol,
        expira_en: invitacion.expira_en,
      },
    });
  } catch (error) {
    console.error('GET /api/invitaciones/[token] error:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 },
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { token: string } },
) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const supabase = getSupabaseServerClient();

    // Get the invitation
    const { data: invitacion, error: invError } = await supabase
      .from('invitaciones')
      .select('*, equipos!inner(nombre, empresa_id)')
      .eq('token', params.token)
      .maybeSingle();

    if (invError || !invitacion) {
      return NextResponse.json(
        { error: 'Invitación no encontrada' },
        { status: 404 },
      );
    }

    if (invitacion.aceptada) {
      return NextResponse.json(
        { error: 'Esta invitación ya fue aceptada' },
        { status: 400 },
      );
    }

    // Check if expired
    const expiraEn = new Date(invitacion.expira_en);
    if (expiraEn < new Date()) {
      return NextResponse.json(
        { error: 'Esta invitación ha expirado' },
        { status: 400 },
      );
    }

    // Get the authenticated user's email from DB to verify match
    const { data: usuario, error: usrError } = await supabase
      .from('usuarios')
      .select('id, email')
      .eq('id', authUser.id)
      .maybeSingle();

    if (usrError || !usuario) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 },
      );
    }

    // Verify the invitation email matches the authenticated user's email
    if (usuario.email.toLowerCase() !== invitacion.email.toLowerCase()) {
      return NextResponse.json(
        { error: 'Esta invitación no corresponde a tu email' },
        { status: 403 },
      );
    }

    // Check if already a member
    const { data: existingMember } = await supabase
      .from('usuarios_equipo')
      .select('id')
      .eq('equipo_id', invitacion.equipo_id)
      .eq('usuario_id', usuario.id)
      .maybeSingle();

    if (existingMember) {
      // Already a member, just mark as accepted
      await supabase
        .from('invitaciones')
        .update({ aceptada: true })
        .eq('id', invitacion.id);

      return NextResponse.json({ message: 'Ya eres miembro de este equipo' });
    }

    // Add user to equipo
    const { error: insertError } = await supabase
      .from('usuarios_equipo')
      .insert({
        equipo_id: invitacion.equipo_id,
        usuario_id: usuario.id,
        rol: invitacion.rol,
      });

    if (insertError) {
      console.error('Error adding user to equipo:', insertError);
      return NextResponse.json(
        { error: 'Error al aceptar la invitación' },
        { status: 500 },
      );
    }

    // Mark as accepted
    const { error: updateError } = await supabase
      .from('invitaciones')
      .update({ aceptada: true })
      .eq('id', invitacion.id);

    if (updateError) {
      console.error('Error updating invitacion:', updateError);
    }

    return NextResponse.json({ message: 'Invitación aceptada correctamente' });
  } catch (error) {
    console.error('POST /api/invitaciones/[token] error:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 },
    );
  }
}
