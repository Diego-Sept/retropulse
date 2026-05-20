import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth-middleware';
import { getSuscripcionLimits } from '@/lib/planes';
import { getSupabaseServerClient } from '@/lib/supabase-server';
import { UsoIaResponse } from '@/types';

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const limits = await getSuscripcionLimits(user.empresa_id);
    if (!limits) {
      return NextResponse.json({ error: 'Suscripción no encontrada' }, { status: 404 });
    }

    const supabase = getSupabaseServerClient();
    const mes = new Date().toISOString().slice(0, 7);

    const { data: uso } = await supabase
      .from('uso_ia')
      .select('mes, clusters_usados')
      .eq('empresa_id', user.empresa_id)
      .eq('mes', mes)
      .maybeSingle();

    const { count } = await supabase
      .from('equipos')
      .select('*', { count: 'exact', head: true })
      .eq('empresa_id', user.empresa_id);

    const response: UsoIaResponse = {
      suscripcion: {
        id: limits.suscripcionId,
        plan: { id: '', nombre: limits.planNombre },
        equipos_max: limits.equiposMax,
        clusters_ia_mes: limits.clustersIaMes,
        precio: limits.precio,
        estado: limits.estado,
        precio_proximo: limits.precioProximo,
        fecha_efectiva_proximo_cambio: limits.fechaEfectivaProximoCambio,
      },
      uso_ia: uso ? { mes: uso.mes, clusters_usados: uso.clusters_usados } : null,
      equipos_count: count ?? 0,
      dentro_limite_clusters: limits.clustersIaMes === null || (uso?.clusters_usados ?? 0) < limits.clustersIaMes,
      dentro_limite_equipos: limits.equiposMax === null || (count ?? 0) < limits.equiposMax,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error en GET /api/uso-ia:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 },
    );
  }
}
