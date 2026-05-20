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

    // Verify equipo belongs to user's empresa
    const { data: equipo, error: eqError } = await supabase
      .from('equipos')
      .select('id')
      .eq('id', params.equipoId)
      .eq('empresa_id', authUser.empresa_id)
      .maybeSingle();

    if (eqError || !equipo) {
      return NextResponse.json(
        { error: 'Equipo no encontrado' },
        { status: 404 },
      );
    }

    // Check user has access: either team_admin/member of the equipo, or empresa_admin/super_admin
    const isGlobalAdmin = authUser.rol_global === 'empresa_admin' || authUser.rol_global === 'super_admin';

    if (!isGlobalAdmin) {
      const { data: membership, error: memError } = await supabase
        .from('usuarios_equipo')
        .select('id')
        .eq('equipo_id', params.equipoId)
        .eq('usuario_id', authUser.id)
        .maybeSingle();

      if (memError || !membership) {
        return NextResponse.json(
          { error: 'No tienes acceso a este equipo' },
          { status: 403 },
        );
      }
    }

    // Get members with user details
    const { data: miembros, error: miemError } = await supabase
      .from('usuarios_equipo')
      .select(`
        id,
        usuario_id,
        rol,
        usuarios!inner (
          email,
          nombre
        )
      `)
      .eq('equipo_id', params.equipoId);

    if (miemError) {
      console.error('Error fetching miembros:', miemError);
      return NextResponse.json(
        { error: 'Error al obtener los miembros' },
        { status: 500 },
      );
    }

    const formatted = (miembros || []).map((m) => ({
      id: m.id,
      usuario_id: m.usuario_id,
      email: (m.usuarios as any).email,
      nombre: (m.usuarios as any).nombre,
      rol: m.rol,
    }));

    return NextResponse.json({ miembros: formatted });
  } catch (error) {
    console.error('GET /api/equipos/[equipoId]/miembros error:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 },
    );
  }
}
