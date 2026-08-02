import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase-server';
import { getAuthUser } from '@/lib/auth-middleware';

export async function GET(request: NextRequest) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const equipoId = searchParams.get('equipo_id');

    const supabase = getSupabaseServerClient();
    const isGlobalAdmin = authUser.rol_global === 'empresa_admin' || authUser.rol_global === 'super_admin';

    if (equipoId) {
      // Filter by specific equipo — existing behavior
      const { data: equipo, error: eqError } = await supabase
        .from('equipos')
        .select('id')
        .eq('id', equipoId)
        .eq('empresa_id', authUser.empresa_id)
        .maybeSingle();

      if (eqError || !equipo) {
        return NextResponse.json({ error: 'Equipo no encontrado' }, { status: 404 });
      }

      if (!isGlobalAdmin) {
        const { data: membership, error: memError } = await supabase
          .from('usuarios_equipo')
          .select('id')
          .eq('equipo_id', equipoId)
          .eq('usuario_id', authUser.id)
          .maybeSingle();

        if (memError || !membership) {
          return NextResponse.json({ error: 'No tienes acceso a este equipo' }, { status: 403 });
        }
      }

      const { data: salas, error: salasError } = await supabase
        .from('salas')
        .select('*, equipos!inner(nombre)')
        .eq('equipo_id', equipoId)
        .order('created_at', { ascending: false });

      if (salasError) {
        console.error('Error fetching salas:', salasError);
        return NextResponse.json({ error: 'Error al obtener las salas' }, { status: 500 });
      }

      const formatted = (salas || []).map((s) => ({
        ...s,
        equipo_nombre: (s.equipos as any)?.nombre || '',
      }));

      return NextResponse.json({ salas: formatted });
    }

    // No equipo_id — return all salas from teams the user belongs to
    // Get teams where user is member (directly via usuarios_equipo, regardless of empresa)
    const { data: membresias } = await supabase
      .from('usuarios_equipo')
      .select('equipo_id')
      .eq('usuario_id', authUser.id);

    const directEquipoIds = (membresias || []).map((m) => m.equipo_id);

    // Also get teams from user's own empresa (if admin)
    let empresaEquipoIds: string[] = [];
    if (isGlobalAdmin) {
      const { data: empresaEquipos } = await supabase
        .from('equipos')
        .select('id')
        .eq('empresa_id', authUser.empresa_id);
      empresaEquipoIds = (empresaEquipos || []).map((e) => e.id);
    }

    // Merge unique
    const allEquipoIds = [...new Set([...directEquipoIds, ...empresaEquipoIds])];

    if (allEquipoIds.length === 0) {
      return NextResponse.json({ salas: [] });
    }

    // Get equipo names for display
    const { data: equipos } = await supabase
      .from('equipos')
      .select('id, nombre')
      .in('id', allEquipoIds);

    const equipoMap = new Map((equipos || []).map((e) => [e.id, e.nombre]));

    const { data: salas, error: salasError } = await supabase
      .from('salas')
      .select('*')
      .in('equipo_id', allEquipoIds)
      .order('created_at', { ascending: false });

    if (salasError) {
      console.error('Error fetching salas:', salasError);
      return NextResponse.json({ error: 'Error al obtener las salas' }, { status: 500 });
    }

    const formatted = (salas || []).map((s) => ({
      ...s,
      equipo_nombre: equipoMap.get(s.equipo_id) || '',
    }));

    return NextResponse.json({ salas: formatted });
  } catch (error) {
    console.error('GET /api/salas error:', error);
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

    const body = await request.json();
    const { equipo_id, nombre } = body;

    if (!equipo_id || !nombre || typeof nombre !== 'string' || nombre.trim().length === 0) {
      return NextResponse.json(
        { error: 'equipo_id y nombre son requeridos' },
        { status: 400 },
      );
    }

    const supabase = getSupabaseServerClient();

    // Verify equipo belongs to user's empresa
    const { data: equipo, error: eqError } = await supabase
      .from('equipos')
      .select('id')
      .eq('id', equipo_id)
      .eq('empresa_id', authUser.empresa_id)
      .maybeSingle();

    if (eqError || !equipo) {
      return NextResponse.json(
        { error: 'Equipo no encontrado' },
        { status: 404 },
      );
    }

    // Verify user is member of the equipo
    const isGlobalAdmin = authUser.rol_global === 'empresa_admin' || authUser.rol_global === 'super_admin';

    if (!isGlobalAdmin) {
      const { data: membership, error: memError } = await supabase
        .from('usuarios_equipo')
        .select('id')
        .eq('equipo_id', equipo_id)
        .eq('usuario_id', authUser.id)
        .maybeSingle();

      if (memError || !membership) {
        return NextResponse.json(
          { error: 'No tienes acceso a este equipo' },
          { status: 403 },
        );
      }
    }

    // Create the sala
    const { data: sala, error: createError } = await supabase
      .from('salas')
      .insert({
        equipo_id,
        nombre: nombre.trim(),
        estado: 'activa',
      })
      .select()
      .single();

    if (createError) {
      console.error('Error creating sala:', createError);
      return NextResponse.json(
        { error: 'Error al crear la sala' },
        { status: 500 },
      );
    }

    return NextResponse.json({ sala }, { status: 201 });
  } catch (error) {
    console.error('POST /api/salas error:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 },
    );
  }
}
