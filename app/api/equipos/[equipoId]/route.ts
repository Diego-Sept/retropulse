import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase-server';
import { getAuthUser } from '@/lib/auth-middleware';

export async function GET(
  request: NextRequest,
  { params }: { params: { equipoId: string } },
) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const supabase = getSupabaseServerClient();

    const { data: equipo, error } = await supabase
      .from('equipos')
      .select('*')
      .eq('id', params.equipoId)
      .eq('empresa_id', authUser.empresa_id)
      .maybeSingle();

    if (error) {
      console.error('Error fetching equipo:', error);
      return NextResponse.json(
        { error: 'Error al obtener el equipo' },
        { status: 500 },
      );
    }

    if (!equipo) {
      return NextResponse.json(
        { error: 'Equipo no encontrado' },
        { status: 404 },
      );
    }

    return NextResponse.json({ equipo });
  } catch (error) {
    console.error('GET /api/equipos/[equipoId] error:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 },
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { equipoId: string } },
) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const supabase = getSupabaseServerClient();

    // Verify equipo belongs to user's empresa
    const { data: equipo, error: eqError } = await supabase
      .from('equipos')
      .select('*')
      .eq('id', params.equipoId)
      .eq('empresa_id', authUser.empresa_id)
      .maybeSingle();

    if (eqError || !equipo) {
      return NextResponse.json(
        { error: 'Equipo no encontrado' },
        { status: 404 },
      );
    }

    // Check user has team_admin role OR is empresa_admin/super_admin
    const isAdmin = authUser.rol_global === 'empresa_admin' || authUser.rol_global === 'super_admin';

    if (!isAdmin) {
      const { data: membership, error: memError } = await supabase
        .from('usuarios_equipo')
        .select('rol')
        .eq('equipo_id', params.equipoId)
        .eq('usuario_id', authUser.id)
        .maybeSingle();

      if (memError || !membership || membership.rol !== 'team_admin') {
        return NextResponse.json(
          { error: 'No tienes permisos para modificar este equipo' },
          { status: 403 },
        );
      }
    }

    const body = await request.json();
    const { nombre } = body;

    if (!nombre || typeof nombre !== 'string' || nombre.trim().length === 0) {
      return NextResponse.json(
        { error: 'El nombre del equipo es requerido' },
        { status: 400 },
      );
    }

    const { data: updatedEquipo, error: updateError } = await supabase
      .from('equipos')
      .update({ nombre: nombre.trim(), updated_at: new Date().toISOString() })
      .eq('id', params.equipoId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating equipo:', updateError);
      return NextResponse.json(
        { error: 'Error al actualizar el equipo' },
        { status: 500 },
      );
    }

    return NextResponse.json({ equipo: updatedEquipo });
  } catch (error) {
    console.error('PATCH /api/equipos/[equipoId] error:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { equipoId: string } },
) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const supabase = getSupabaseServerClient();

    // Verify equipo belongs to user's empresa
    const { data: equipo, error: eqError } = await supabase
      .from('equipos')
      .select('*')
      .eq('id', params.equipoId)
      .eq('empresa_id', authUser.empresa_id)
      .maybeSingle();

    if (eqError || !equipo) {
      return NextResponse.json(
        { error: 'Equipo no encontrado' },
        { status: 404 },
      );
    }

    // Check user is team_admin OR empresa_admin/super_admin
    const isAdmin = authUser.rol_global === 'empresa_admin' || authUser.rol_global === 'super_admin';

    if (!isAdmin) {
      const { data: membership, error: memError } = await supabase
        .from('usuarios_equipo')
        .select('rol')
        .eq('equipo_id', params.equipoId)
        .eq('usuario_id', authUser.id)
        .maybeSingle();

      if (memError || !membership || membership.rol !== 'team_admin') {
        return NextResponse.json(
          { error: 'No tienes permisos para eliminar este equipo' },
          { status: 403 },
        );
      }
    }

    // Delete the equipo (CASCADE will remove usuarios_equipo, salas, etc.)
    const { error: delError } = await supabase
      .from('equipos')
      .delete()
      .eq('id', params.equipoId);

    if (delError) {
      console.error('Error deleting equipo:', delError);
      return NextResponse.json(
        { error: 'Error al eliminar el equipo' },
        { status: 500 },
      );
    }

    return NextResponse.json({ message: 'Equipo eliminado correctamente' });
  } catch (error) {
    console.error('DELETE /api/equipos/[equipoId] error:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 },
    );
  }
}
