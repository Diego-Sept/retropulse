import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase-server';
import { getAuthUser } from '@/lib/auth-middleware';

export async function GET(
  request: NextRequest,
  { params }: { params: { salaId: string } },
) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const supabase = getSupabaseServerClient();

    // Get sala and verify it belongs to user's empresa via equipo
    const { data: sala, error: salaError } = await supabase
      .from('salas')
      .select('*, equipos!inner(empresa_id)')
      .eq('id', params.salaId)
      .maybeSingle();

    if (salaError || !sala) {
      return NextResponse.json(
        { error: 'Sala no encontrada' },
        { status: 404 },
      );
    }

    // Tenant isolation
    const equipoData = sala.equipos as { empresa_id: string };
    if (equipoData.empresa_id !== authUser.empresa_id) {
      return NextResponse.json(
        { error: 'Sala no encontrada' },
        { status: 404 },
      );
    }

    // Verify user is member of the sala's equipo
    const isGlobalAdmin = authUser.rol_global === 'empresa_admin' || authUser.rol_global === 'super_admin';

    if (!isGlobalAdmin) {
      const { data: membership, error: memError } = await supabase
        .from('usuarios_equipo')
        .select('id')
        .eq('equipo_id', sala.equipo_id)
        .eq('usuario_id', authUser.id)
        .maybeSingle();

      if (memError || !membership) {
        return NextResponse.json(
          { error: 'No tienes acceso a esta sala' },
          { status: 403 },
        );
      }
    }

    // Optional filter by columna_id
    const { searchParams } = new URL(request.url);
    const columnaId = searchParams.get('columna_id');

    let query = supabase
      .from('tarjetas')
      .select('*, grupos!left(*), usuarios!created_by(nombre)')
      .eq('sala_id', params.salaId);

    if (columnaId) {
      const colId = parseInt(columnaId, 10);
      if (isNaN(colId) || colId < 1 || colId > 4) {
        return NextResponse.json(
          { error: 'columna_id debe ser un número entre 1 y 4' },
          { status: 400 },
        );
      }
      query = query.eq('columna_id', colId);
    }

    const { data: tarjetas, error: tarjetasError } = await query
      .order('created_at', { ascending: true });

    if (tarjetasError) {
      console.error('Error fetching tarjetas:', tarjetasError);
      return NextResponse.json(
        { error: 'Error al obtener las tarjetas' },
        { status: 500 },
      );
    }

    // Format tarjetas with grupo info
    const formatted = (tarjetas || []).map((t) => ({
      id: t.id,
      sala_id: t.sala_id,
      columna_id: t.columna_id,
      contenido: t.contenido,
      grupo_id: t.grupo_id,
      created_by: t.created_by,
      autor_nombre: (t.usuarios as any)?.nombre || null,
      created_at: t.created_at,
      updated_at: t.updated_at,
      grupo: t.grupos || null,
    }));

    return NextResponse.json({ tarjetas: formatted });
  } catch (error) {
    console.error('GET /api/salas/[salaId]/tarjetas error:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 },
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { salaId: string } },
) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const supabase = getSupabaseServerClient();

    // Get sala and verify it belongs to user's empresa via equipo
    const { data: sala, error: salaError } = await supabase
      .from('salas')
      .select('*, equipos!inner(empresa_id)')
      .eq('id', params.salaId)
      .maybeSingle();

    if (salaError || !sala) {
      return NextResponse.json(
        { error: 'Sala no encontrada' },
        { status: 404 },
      );
    }

    // Tenant isolation
    const equipoData = sala.equipos as { empresa_id: string };
    if (equipoData.empresa_id !== authUser.empresa_id) {
      return NextResponse.json(
        { error: 'Sala no encontrada' },
        { status: 404 },
      );
    }

    // Only allow tarjetas in active salas
    if (sala.estado !== 'activa') {
      return NextResponse.json(
        { error: 'No se pueden agregar tarjetas a una sala archivada' },
        { status: 400 },
      );
    }

    // Verify user is member of the sala's equipo
    const isGlobalAdmin = authUser.rol_global === 'empresa_admin' || authUser.rol_global === 'super_admin';

    if (!isGlobalAdmin) {
      const { data: membership, error: memError } = await supabase
        .from('usuarios_equipo')
        .select('id')
        .eq('equipo_id', sala.equipo_id)
        .eq('usuario_id', authUser.id)
        .maybeSingle();

      if (memError || !membership) {
        return NextResponse.json(
          { error: 'No tienes acceso a esta sala' },
          { status: 403 },
        );
      }
    }

    const body = await request.json();
    const { contenido, columna_id } = body;

    if (!contenido || typeof contenido !== 'string' || contenido.trim().length === 0) {
      return NextResponse.json(
        { error: 'El contenido de la tarjeta es requerido' },
        { status: 400 },
      );
    }

    const colId = parseInt(columna_id, 10);
    if (isNaN(colId) || colId < 1 || colId > 4) {
      return NextResponse.json(
        { error: 'columna_id debe ser un número entre 1 y 4' },
        { status: 400 },
      );
    }

    const { data: tarjeta, error: createError } = await supabase
      .from('tarjetas')
      .insert({
        sala_id: params.salaId,
        columna_id: colId,
        contenido: contenido.trim(),
        created_by: authUser.id,
      })
      .select('*, usuarios!created_by(nombre)')
      .single();

    if (createError) {
      console.error('Error creating tarjeta:', createError);
      return NextResponse.json(
        { error: 'Error al crear la tarjeta' },
        { status: 500 },
      );
    }

    return NextResponse.json({ tarjeta }, { status: 201 });
  } catch (error) {
    console.error('POST /api/salas/[salaId]/tarjetas error:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 },
    );
  }
}
