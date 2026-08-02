import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase-server';
import { getAuthUser } from '@/lib/auth-middleware';
import { verifySalaAccess, AppError } from '@/lib/sala-access';

export async function GET(
  request: NextRequest,
  { params }: { params: { salaId: string } },
) {
  try {
    const supabase = getSupabaseServerClient();
    const { sala } = await verifySalaAccess(supabase, request, params.salaId);

    const { equipos: _, ...salaData } = sala;
    return NextResponse.json({ sala: salaData });
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error('GET /api/salas/[salaId] error:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 },
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { salaId: string } },
) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const supabase = getSupabaseServerClient();

    // Get sala with equipo info
    const { data: sala, error: salaError } = await supabase
      .from('salas')
      .select('*, equipos!inner(id, empresa_id, nombre)')
      .eq('id', params.salaId)
      .maybeSingle();

    if (salaError || !sala) {
      return NextResponse.json({ error: 'Sala no encontrada' }, { status: 404 });
    }

    const equipoData = sala.equipos as { id: string; empresa_id: string };

    // Access check: same empresa or direct member
    const isGlobalAdmin = authUser.rol_global === 'empresa_admin' || authUser.rol_global === 'super_admin';
    const isSameEmpresa = equipoData.empresa_id === authUser.empresa_id;

    if (!isSameEmpresa) {
      // Cross-empresa — must be a direct member
      const { data: crossMembership } = await supabase
        .from('usuarios_equipo')
        .select('id, rol')
        .eq('equipo_id', equipoData.id)
        .eq('usuario_id', authUser.id)
        .maybeSingle();

      if (!crossMembership || crossMembership.rol !== 'team_admin') {
        return NextResponse.json({ error: 'No tienes permisos para modificar esta sala' }, { status: 403 });
      }
    } else if (!isGlobalAdmin) {
      // Same empresa but not admin — check team_admin role
      const { data: membership } = await supabase
        .from('usuarios_equipo')
        .select('rol')
        .eq('equipo_id', equipoData.id)
        .eq('usuario_id', authUser.id)
        .maybeSingle();

      if (!membership || membership.rol !== 'team_admin') {
        return NextResponse.json({ error: 'No tienes permisos para modificar esta sala' }, { status: 403 });
      }
    }

    const body = await request.json();
    const updateData: Record<string, string> = {};

    if (body.nombre !== undefined) {
      if (typeof body.nombre !== 'string' || body.nombre.trim().length === 0) {
        return NextResponse.json(
          { error: 'El nombre no puede estar vacío' },
          { status: 400 },
        );
      }
      updateData.nombre = body.nombre.trim();
    }

    if (body.estado !== undefined) {
      if (!['activa', 'archivada'].includes(body.estado)) {
        return NextResponse.json(
          { error: 'Estado inválido. Use "activa" o "archivada"' },
          { status: 400 },
        );
      }
      updateData.estado = body.estado;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'No hay campos para actualizar' },
        { status: 400 },
      );
    }

    updateData.updated_at = new Date().toISOString();

    const { data: updatedSala, error: updateError } = await supabase
      .from('salas')
      .update(updateData)
      .eq('id', params.salaId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating sala:', updateError);
      return NextResponse.json(
        { error: 'Error al actualizar la sala' },
        { status: 500 },
      );
    }

    return NextResponse.json({ sala: updatedSala });
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error('PATCH /api/salas/[salaId] error:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { salaId: string } },
) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const supabase = getSupabaseServerClient();

    // Get sala with equipo info
    const { data: sala, error: salaError } = await supabase
      .from('salas')
      .select('*, equipos!inner(id, empresa_id)')
      .eq('id', params.salaId)
      .maybeSingle();

    if (salaError || !sala) {
      return NextResponse.json({ error: 'Sala no encontrada' }, { status: 404 });
    }

    const equipoData = sala.equipos as { id: string; empresa_id: string };
    const isGlobalAdmin = authUser.rol_global === 'empresa_admin' || authUser.rol_global === 'super_admin';
    const isSameEmpresa = equipoData.empresa_id === authUser.empresa_id;

    if (!isSameEmpresa) {
      const { data: crossMembership } = await supabase
        .from('usuarios_equipo')
        .select('id, rol')
        .eq('equipo_id', equipoData.id)
        .eq('usuario_id', authUser.id)
        .maybeSingle();

      if (!crossMembership || crossMembership.rol !== 'team_admin') {
        return NextResponse.json({ error: 'No tienes permisos para archivar esta sala' }, { status: 403 });
      }
    } else if (!isGlobalAdmin) {
      const { data: membership } = await supabase
        .from('usuarios_equipo')
        .select('rol')
        .eq('equipo_id', equipoData.id)
        .eq('usuario_id', authUser.id)
        .maybeSingle();

      if (!membership || membership.rol !== 'team_admin') {
        return NextResponse.json({ error: 'No tienes permisos para archivar esta sala' }, { status: 403 });
      }
    }

    // Archive the sala instead of deleting
    const { data: archivedSala, error: archiveError } = await supabase
      .from('salas')
      .update({ estado: 'archivada', updated_at: new Date().toISOString() })
      .eq('id', params.salaId)
      .select()
      .single();

    if (archiveError) {
      console.error('Error archiving sala:', archiveError);
      return NextResponse.json(
        { error: 'Error al archivar la sala' },
        { status: 500 },
      );
    }

    return NextResponse.json({ sala: archivedSala });
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error('DELETE /api/salas/[salaId] error:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 },
    );
  }
}
