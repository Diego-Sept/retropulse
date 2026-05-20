import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth-middleware';
import { getSupabaseServerClient } from '@/lib/supabase-server';

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { sala_id, columna_id, nombre, tarjetas_ids } = body;

    if (!sala_id) {
      return NextResponse.json({ error: 'sala_id requerido' }, { status: 400 });
    }
    if (!columna_id || ![1, 2, 3, 4].includes(Number(columna_id))) {
      return NextResponse.json({ error: 'columna_id inválido (1-4)' }, { status: 400 });
    }
    if (!nombre || typeof nombre !== 'string' || nombre.trim().length === 0) {
      return NextResponse.json({ error: 'nombre requerido' }, { status: 400 });
    }
    if (!Array.isArray(tarjetas_ids) || tarjetas_ids.length < 2) {
      return NextResponse.json({ error: 'Se necesitan al menos 2 tarjetas' }, { status: 400 });
    }

    const supabase = getSupabaseServerClient();

    // Verify sala access
    const { data: sala, error: salaError } = await supabase
      .from('salas')
      .select('*, equipos!inner(empresa_id)')
      .eq('id', sala_id)
      .maybeSingle();

    if (salaError || !sala) {
      return NextResponse.json({ error: 'Sala no encontrada' }, { status: 404 });
    }

    const equipoData = sala.equipos as { empresa_id: string };
    if (equipoData.empresa_id !== user.empresa_id) {
      return NextResponse.json({ error: 'Sala no encontrada' }, { status: 404 });
    }

    // Verify user is member
    const isGlobalAdmin = user.rol_global === 'empresa_admin' || user.rol_global === 'super_admin';
    if (!isGlobalAdmin) {
      const { data: membership } = await supabase
        .from('usuarios_equipo')
        .select('id')
        .eq('equipo_id', sala.equipo_id)
        .eq('usuario_id', user.id)
        .maybeSingle();

      if (!membership) {
        return NextResponse.json({ error: 'No tienes acceso a esta sala' }, { status: 403 });
      }
    }

    // Verify all tarjetas belong to this sala
    const { data: tarjetas, error: tarjetasError } = await supabase
      .from('tarjetas')
      .select('id')
      .in('id', tarjetas_ids)
      .eq('sala_id', sala_id);

    if (tarjetasError || !tarjetas || tarjetas.length !== tarjetas_ids.length) {
      return NextResponse.json({ error: 'Alguna tarjeta no existe en esta sala' }, { status: 400 });
    }

    // Create group
    const { data: grupo, error: groupError } = await supabase
      .from('grupos')
      .insert({
        sala_id,
        columna_id: Number(columna_id),
        nombre: nombre.trim(),
      })
      .select()
      .single();

    if (groupError || !grupo) {
      return NextResponse.json({ error: 'Error al crear el grupo' }, { status: 500 });
    }

    // Assign tarjetas to group
    const { error: updateError } = await supabase
      .from('tarjetas')
      .update({ grupo_id: grupo.id })
      .in('id', tarjetas_ids);

    if (updateError) {
      // Rollback group creation
      await supabase.from('grupos').delete().eq('id', grupo.id);
      return NextResponse.json({ error: 'Error al asignar tarjetas al grupo' }, { status: 500 });
    }

    return NextResponse.json({ grupo }, { status: 201 });
  } catch (error: any) {
    console.error('POST /api/grupos error:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
