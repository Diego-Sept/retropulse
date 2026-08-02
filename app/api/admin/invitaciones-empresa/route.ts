import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase-server';
import { getAuthUser } from '@/lib/auth-middleware';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    if (authUser.rol_global !== 'empresa_admin' && authUser.rol_global !== 'super_admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const body = await request.json();
    const { email, rol } = body;

    if (!email || typeof email !== 'string' || email.trim().length === 0) {
      return NextResponse.json({ error: 'Email requerido' }, { status: 400 });
    }

    const targetRol = rol === 'empresa_admin' ? 'empresa_admin' : 'member';
    const token = crypto.randomBytes(16).toString('hex');
    const expiraEn = new Date();
    expiraEn.setDate(expiraEn.getDate() + 7);

    const supabase = getSupabaseServerClient();

    const { data: invitacion, error } = await supabase
      .from('invitaciones_empresa')
      .insert({
        empresa_id: authUser.empresa_id,
        email: email.trim().toLowerCase(),
        token,
        rol: targetRol,
        aceptada: false,
        expira_en: expiraEn.toISOString(),
        created_by: authUser.id,
      })
      .select('id, token')
      .single();

    if (error) {
      console.error('Error creating invitacion:', error);
      return NextResponse.json({ error: 'Error al crear invitación' }, { status: 500 });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const link = `${appUrl}/invitaciones/empresa/${token}`;

    return NextResponse.json({ link, token: invitacion.token }, { status: 201 });
  } catch (error) {
    console.error('POST /api/admin/invitaciones-empresa error:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
