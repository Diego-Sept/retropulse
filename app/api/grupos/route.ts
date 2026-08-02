import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase-server';
import { verifySalaAccess, AppError } from '@/lib/sala-access';

export async function POST(request: NextRequest) {
  try {
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
    await verifySalaAccess(supabase, request, sala_id);

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
    if (error instanceof AppError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error('POST /api/grupos error:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
