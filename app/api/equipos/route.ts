import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase-server';
import { getAuthUser } from '@/lib/auth-middleware';
import { checkTeamLimit } from '@/lib/planes';

export async function GET(request: NextRequest) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const supabase = getSupabaseServerClient();

    // Get teams where user is a direct member (regardless of empresa)
    const { data: membresias } = await supabase
      .from('usuarios_equipo')
      .select('equipo_id')
      .eq('usuario_id', authUser.id);

    const directEquipoIds = (membresias || []).map((m) => m.equipo_id);

    // Build query: always include teams from user's empresa + direct memberships
    const equipoIds = new Set(directEquipoIds);

    // For global admins, also include all teams from their own empresa
    const isGlobalAdmin = authUser.rol_global === 'empresa_admin' || authUser.rol_global === 'super_admin';
    if (isGlobalAdmin) {
      const { data: empresaEquipos } = await supabase
        .from('equipos')
        .select('id')
        .eq('empresa_id', authUser.empresa_id);
      (empresaEquipos || []).forEach((e) => equipoIds.add(e.id));
    }

    if (equipoIds.size === 0) {
      return NextResponse.json({ equipos: [] });
    }

    const { data: equipos, error } = await supabase
      .from('equipos')
      .select('id, nombre, created_at, updated_at, empresa_id')
      .in('id', Array.from(equipoIds))
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching equipos:', error);
      return NextResponse.json(
        { error: 'Error al obtener equipos' },
        { status: 500 },
      );
    }

    // Get member count for each equipo
    const equiposConConteo = await Promise.all(
      (equipos || []).map(async (equipo) => {
        const { count, error: countError } = await supabase
          .from('usuarios_equipo')
          .select('*', { count: 'exact', head: true })
          .eq('equipo_id', equipo.id);

        return {
          id: equipo.id,
          nombre: equipo.nombre,
          created_at: equipo.created_at,
          miembros_count: countError ? 0 : (count ?? 0),
        };
      }),
    );

    return NextResponse.json({ equipos: equiposConConteo });
  } catch (error) {
    console.error('GET /api/equipos error:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    // Only empresa_admin or super_admin can create equipos
    if (authUser.rol_global !== 'empresa_admin' && authUser.rol_global !== 'super_admin') {
      return NextResponse.json(
        { error: 'Solo los administradores pueden crear equipos' },
        { status: 403 },
      );
    }

    const body = await request.json();
    const { nombre } = body;

    if (!nombre || typeof nombre !== 'string' || nombre.trim().length === 0) {
      return NextResponse.json(
        { error: 'El nombre del equipo es requerido' },
        { status: 400 },
      );
    }

    // Check team limit
    const limitResult = await checkTeamLimit(authUser.empresa_id);
    if (!limitResult.allowed) {
      return NextResponse.json(
        { error: 'Límite de equipos alcanzado para tu plan' },
        { status: 403 },
      );
    }

    const supabase = getSupabaseServerClient();

    // Insert equipo
    const { data: equipo, error: eqError } = await supabase
      .from('equipos')
      .insert({
        empresa_id: authUser.empresa_id,
        nombre: nombre.trim(),
      })
      .select()
      .single();

    if (eqError) {
      console.error('Error creating equipo:', eqError);
      return NextResponse.json(
        { error: 'Error al crear el equipo' },
        { status: 500 },
      );
    }

    // Add creator as team_admin in usuarios_equipo
    const { error: ueError } = await supabase.from('usuarios_equipo').insert({
      equipo_id: equipo.id,
      usuario_id: authUser.id,
      rol: 'team_admin',
    });

    if (ueError) {
      console.error('Error adding creator to equipo:', ueError);
      // Rollback: delete the equipo
      await supabase.from('equipos').delete().eq('id', equipo.id);
      return NextResponse.json(
        { error: 'Error al asignar administrador del equipo' },
        { status: 500 },
      );
    }

    return NextResponse.json(
      { equipo: { id: equipo.id, nombre: equipo.nombre, created_at: equipo.created_at } },
      { status: 201 },
    );
  } catch (error) {
    console.error('POST /api/equipos error:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 },
    );
  }
}
