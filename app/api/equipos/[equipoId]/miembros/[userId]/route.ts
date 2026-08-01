import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase-server';
import { getAuthUser } from '@/lib/auth-middleware';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { equipoId: string; userId: string } },
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
      return NextResponse.json({ error: 'Equipo no encontrado' }, { status: 404 });
    }

    // Only team_admin or global admin can remove members
    const isGlobalAdmin = authUser.rol_global === 'empresa_admin' || authUser.rol_global === 'super_admin';

    let isTeamAdmin = false;
    if (!isGlobalAdmin) {
      const { data: membership } = await supabase
        .from('usuarios_equipo')
        .select('rol')
        .eq('equipo_id', params.equipoId)
        .eq('usuario_id', authUser.id)
        .maybeSingle();

      if (!membership || membership.rol !== 'team_admin') {
        return NextResponse.json(
          { error: 'Solo los administradores pueden remover miembros' },
          { status: 403 },
        );
      }
      isTeamAdmin = true;
    }

    // Verify target user is a member of this equipo
    const { data: targetMember, error: memberError } = await supabase
      .from('usuarios_equipo')
      .select('id, rol')
      .eq('equipo_id', params.equipoId)
      .eq('usuario_id', params.userId)
      .maybeSingle();

    if (memberError || !targetMember) {
      return NextResponse.json(
        { error: 'El usuario no es miembro de este equipo' },
        { status: 404 },
      );
    }

    // Prevent removing the last admin
    if (targetMember.rol === 'team_admin') {
      const { count } = await supabase
        .from('usuarios_equipo')
        .select('*', { count: 'exact', head: true })
        .eq('equipo_id', params.equipoId)
        .eq('rol', 'team_admin');

      if ((count ?? 0) <= 1) {
        return NextResponse.json(
          { error: 'No puedes remover al único administrador del equipo' },
          { status: 400 },
        );
      }
    }

    const { error: deleteError } = await supabase
      .from('usuarios_equipo')
      .delete()
      .eq('id', targetMember.id);

    if (deleteError) {
      console.error('Error removing member:', deleteError);
      return NextResponse.json(
        { error: 'Error al remover el miembro' },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/equipos/[equipoId]/miembros/[userId] error:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 },
    );
  }
}
