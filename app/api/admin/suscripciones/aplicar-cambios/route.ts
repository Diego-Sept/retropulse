import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth-middleware';
import { getSupabaseServerClient } from '@/lib/supabase-server';

export async function POST(request: NextRequest) {
  try {
    // 1. Auth check: only super_admin
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    if (user.rol_global !== 'super_admin') {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
    }

    const supabase = getSupabaseServerClient();

    // 2. Apply all scheduled price changes where fecha_efectiva_proximo_cambio <= today
    const { data, error } = await supabase.rpc('apply_scheduled_price_changes');

    if (error) {
      console.error('Error applying scheduled price changes:', error);
      return NextResponse.json(
        { error: 'Error al aplicar cambios de precio programados' },
        { status: 500 },
      );
    }

    const actualizadas = data?.[0]?.actualizadas ?? 0;

    return NextResponse.json({
      ok: true,
      suscripciones_actualizadas: actualizadas,
    });
  } catch (error) {
    console.error('Error en POST /api/admin/suscripciones/aplicar-cambios:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 },
    );
  }
}
