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
      .from('invitaciones_empresa')
      .select('*, empresas!inner(nombre)')
      .eq('token', params.token)
      .maybeSingle();

    if (error || !invitacion) {
      return NextResponse.json({ error: 'Invitación no encontrada' }, { status: 404 });
    }

    if (invitacion.aceptada) {
      return NextResponse.json({ error: 'Esta invitación ya fue aceptada' }, { status: 400 });
    }

    if (new Date(invitacion.expira_en) < new Date()) {
      return NextResponse.json({ error: 'Esta invitación expiró' }, { status: 400 });
    }

    return NextResponse.json({
      invitacion: {
        token: invitacion.token,
        empresa_nombre: (invitacion as any).empresas?.nombre || '',
        email: invitacion.email,
      },
    });
  } catch (error) {
    console.error('GET /api/invitaciones/empresa/[token] error:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { token: string } },
) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser) {
      return NextResponse.json({ error: 'Debés iniciar sesión primero' }, { status: 401 });
    }

    const supabase = getSupabaseServerClient();

    const { data: invitacion, error } = await supabase
      .from('invitaciones_empresa')
      .select('*, empresas!inner(nombre)')
      .eq('token', params.token)
      .maybeSingle();

    if (error || !invitacion) {
      return NextResponse.json({ error: 'Invitación no encontrada' }, { status: 404 });
    }

    if (invitacion.aceptada) {
      return NextResponse.json({ error: 'Ya aceptada' }, { status: 400 });
    }

    if (new Date(invitacion.expira_en) < new Date()) {
      return NextResponse.json({ error: 'Expirada' }, { status: 400 });
    }

    // Verify email matches
    if (authUser.email.toLowerCase() !== invitacion.email.toLowerCase()) {
      return NextResponse.json(
        { error: 'Esta invitación no corresponde a tu email' },
        { status: 403 },
      );
    }

    // Update user: change empresa and role
    const { error: updateError } = await supabase
      .from('usuarios')
      .update({
        empresa_id: invitacion.empresa_id,
        rol_global: invitacion.rol,
      })
      .eq('id', authUser.id);

    if (updateError) {
      console.error('Error updating user:', updateError);
      return NextResponse.json({ error: 'Error al aceptar invitación' }, { status: 500 });
    }

    // Mark as accepted
    await supabase
      .from('invitaciones_empresa')
      .update({ aceptada: true })
      .eq('id', invitacion.id);

    return NextResponse.json({
      message: `Te uniste a ${(invitacion as any).empresas?.nombre}`,
    });
  } catch (error) {
    console.error('POST /api/invitaciones/empresa/[token] error:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
