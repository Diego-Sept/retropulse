import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth-middleware';
import { checkClusterLimit, incrementClusterUsage } from '@/lib/planes';
import { getSupabaseServerClient } from '@/lib/supabase-server';
import { clusterCards } from '@/lib/cluster';

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { sala_id, columna_id, tarjetas } = body;

    if (!sala_id) {
      return NextResponse.json({ error: 'sala_id requerido' }, { status: 400 });
    }
    if (!columna_id) {
      return NextResponse.json({ error: 'columna_id requerido' }, { status: 400 });
    }
    if (!Array.isArray(tarjetas)) {
      return NextResponse.json({ error: `tarjetas debe ser un array, recibido: ${typeof tarjetas}` }, { status: 400 });
    }
    if (tarjetas.length === 0) {
      return NextResponse.json({ error: 'No hay tarjetas en esta columna para agrupar' }, { status: 400 });
    }

    // Check cluster limit
    const limitCheck = await checkClusterLimit(user.empresa_id);
    if (!limitCheck.allowed) {
      return NextResponse.json({ error: limitCheck.reason || 'Límite de clusters alcanzado' }, { status: 429 });
    }

    // Call OpenCode Zen
    const result = await clusterCards(tarjetas.map((t: any) => ({ id: t.id, contenido: t.contenido })));

    // Start a Supabase transaction to persist groups and update cards
    const supabase = getSupabaseServerClient();
    const createdGroups: any[] = [];

    for (const grupo of result.grupos) {
      const { data: newGroup, error: groupError } = await supabase
        .from('grupos')
        .insert({
          sala_id,
          columna_id,
          nombre: grupo.nombre_grupo,
        })
        .select()
        .single();

      if (groupError) {
        console.error('Error creating group:', groupError);
        continue;
      }

      // Update tarjetas with grupo_id
      const { error: updateError } = await supabase
        .from('tarjetas')
        .update({ grupo_id: newGroup.id })
        .in('id', grupo.tarjetas);

      if (updateError) {
        console.error('Error updating cards with group:', updateError);
      }

      createdGroups.push({
        id: newGroup.id,
        nombre: newGroup.nombre,
        tarjetas: grupo.tarjetas,
      });
    }

    // Increment usage
    await incrementClusterUsage(user.empresa_id);

    return NextResponse.json({ grupos: createdGroups });
  } catch (error: any) {
    console.error('Cluster error:', error);
    const message = error.message || 'Error al procesar clustering';
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
