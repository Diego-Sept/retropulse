import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase-server';
import { getAuthUser } from '@/lib/auth-middleware';

export async function GET(request: NextRequest) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 },
      );
    }

    // Fetch full user from DB
    const supabase = getSupabaseServerClient();
    const { data: usuario, error } = await supabase
      .from('usuarios')
      .select('id, email, nombre, rol_global, empresa_id, created_at')
      .eq('id', authUser.id)
      .maybeSingle();

    if (error || !usuario) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 },
      );
    }

    // Get suscripcion info
    const { data: suscripcion } = await supabase
      .from('suscripciones')
      .select('id, estado, equipos_max, clusters_ia_mes, plan_id')
      .eq('empresa_id', usuario.empresa_id)
      .eq('estado', 'activa')
      .maybeSingle();

    return NextResponse.json({
      ...usuario,
      suscripcion_id: suscripcion?.id || authUser.suscripcion_id,
      suscripcion_estado: suscripcion?.estado || null,
      password_hash: undefined,
    });
  } catch (error) {
    console.error('Me error:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 },
    );
  }
}
