import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase-server';
import { verifySalaAccess, AppError } from '@/lib/sala-access';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { salaId: string; tarjetaId: string } },
) {
  try {
    const supabase = getSupabaseServerClient();
    await verifySalaAccess(supabase, request, params.salaId);

    // Get the tarjeta to verify it belongs to this sala
    const { data: tarjeta, error: tarjetaError } = await supabase
      .from('tarjetas')
      .select('id')
      .eq('id', params.tarjetaId)
      .eq('sala_id', params.salaId)
      .maybeSingle();

    if (tarjetaError || !tarjeta) {
      return NextResponse.json(
        { error: 'Tarjeta no encontrada' },
        { status: 404 },
      );
    }

    // Parse fields to update from request body
    const body = await request.json();
    const updates: Record<string, any> = {};

    if (body.columna_id !== undefined) {
      const colId = Number(body.columna_id);
      if (![1, 2, 3, 4].includes(colId)) {
        return NextResponse.json({ error: 'columna_id inválido' }, { status: 400 });
      }
      updates.columna_id = colId;
    }

    if (body.grupo_id !== undefined) {
      updates.grupo_id = body.grupo_id; // null is valid (removes from group)
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No hay campos para actualizar' }, { status: 400 });
    }

    const { data: updated, error: updateError } = await supabase
      .from('tarjetas')
      .update(updates)
      .eq('id', params.tarjetaId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating tarjeta:', updateError);
      return NextResponse.json(
        { error: 'Error al actualizar la tarjeta' },
        { status: 500 },
      );
    }

    return NextResponse.json({ tarjeta: updated });
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error('PATCH /api/salas/[salaId]/tarjetas/[tarjetaId] error:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { salaId: string; tarjetaId: string } },
) {
  try {
    const supabase = getSupabaseServerClient();
    await verifySalaAccess(supabase, request, params.salaId);

    // Verify tarjeta exists and belongs to this sala
    const { data: tarjeta, error: tarjetaError } = await supabase
      .from('tarjetas')
      .select('id')
      .eq('id', params.tarjetaId)
      .eq('sala_id', params.salaId)
      .maybeSingle();

    if (tarjetaError || !tarjeta) {
      return NextResponse.json({ error: 'Tarjeta no encontrada' }, { status: 404 });
    }

    const { error: deleteError } = await supabase
      .from('tarjetas')
      .delete()
      .eq('id', params.tarjetaId);

    if (deleteError) {
      console.error('Error deleting tarjeta:', deleteError);
      return NextResponse.json(
        { error: 'Error al eliminar la tarjeta' },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error('DELETE /api/salas/[salaId]/tarjetas/[tarjetaId] error:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 },
    );
  }
}
