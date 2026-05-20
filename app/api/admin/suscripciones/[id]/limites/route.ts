import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth-middleware';
import { getSupabaseServerClient } from '@/lib/supabase-server';
import { UpdateSuscripcionLimitesRequest } from '@/types';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    // 1. Auth check: only super_admin
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    if (user.rol_global !== 'super_admin') {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
    }

    const suscripcionId = params.id;
    if (!suscripcionId) {
      return NextResponse.json({ error: 'ID de suscripción requerido' }, { status: 400 });
    }

    const supabase = getSupabaseServerClient();

    // 2. Verify suscripcion exists
    const { data: existing, error: findError } = await supabase
      .from('suscripciones')
      .select('id')
      .eq('id', suscripcionId)
      .single();

    if (findError || !existing) {
      return NextResponse.json({ error: 'Suscripción no encontrada' }, { status: 404 });
    }

    // 3. Parse body — only update provided fields
    const body: UpdateSuscripcionLimitesRequest = await request.json();
    const updateData: Record<string, any> = { updated_at: new Date().toISOString() };

    if (body.equipos_max !== undefined) {
      updateData.equipos_max = body.equipos_max;
    }
    if (body.clusters_ia_mes !== undefined) {
      updateData.clusters_ia_mes = body.clusters_ia_mes;
    }

    if (Object.keys(updateData).length <= 1) {
      return NextResponse.json(
        { error: 'No se proporcionaron campos para actualizar (equipos_max, clusters_ia_mes)' },
        { status: 400 },
      );
    }

    // 4. Update suscripcion
    const { data: updated, error: updateError } = await supabase
      .from('suscripciones')
      .update(updateData)
      .eq('id', suscripcionId)
      .select('id, equipos_max, clusters_ia_mes')
      .single();

    if (updateError || !updated) {
      console.error('Error updating suscripcion limits:', updateError);
      return NextResponse.json({ error: 'Error al actualizar límites de la suscripción' }, { status: 500 });
    }

    // 5. Return updated suscripcion
    return NextResponse.json({
      ok: true,
      suscripcion_id: updated.id,
      equipos_max: updated.equipos_max,
      clusters_ia_mes: updated.clusters_ia_mes,
    });
  } catch (error) {
    console.error('Error en POST /api/admin/suscripciones/[id]/limites:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 },
    );
  }
}
