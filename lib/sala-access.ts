import { getAuthUser } from '@/lib/auth-middleware';
import { NextRequest } from 'next/server';
import type { SupabaseClient } from '@supabase/supabase-js';

interface SalaAccess {
  sala: any;
  equipoId: string;
}

/**
 * Verifies a user has access to a sala.
 * Returns sala + equipoId on success, throws AppError on failure.
 */
export async function verifySalaAccess(
  supabase: SupabaseClient,
  request: NextRequest,
  salaId: string,
): Promise<SalaAccess> {
  const authUser = await getAuthUser(request);
  if (!authUser) throw new AppError('No autenticado', 401);

  // Get sala with equipo info
  const { data: sala, error: salaError } = await supabase
    .from('salas')
    .select('*, equipos!inner(id, empresa_id)')
    .eq('id', salaId)
    .maybeSingle();

  if (salaError || !sala) throw new AppError('Sala no encontrada', 404);

  const equipoData = sala.equipos as { id: string; empresa_id: string };

  // Check: is user from the same empresa?
  if (equipoData.empresa_id === authUser.empresa_id) {
    // Same empresa — verify membership if not admin
    const isGlobalAdmin =
      authUser.rol_global === 'empresa_admin' || authUser.rol_global === 'super_admin';
    if (!isGlobalAdmin) {
      const { data: membership } = await supabase
        .from('usuarios_equipo')
        .select('id')
        .eq('equipo_id', equipoData.id)
        .eq('usuario_id', authUser.id)
        .maybeSingle();
      if (!membership) throw new AppError('No tienes acceso a esta sala', 403);
    }
    return { sala, equipoId: equipoData.id };
  }

  // Different empresa — must be a direct member of the equipo (invited user)
  const { data: membership } = await supabase
    .from('usuarios_equipo')
    .select('id')
    .eq('equipo_id', equipoData.id)
    .eq('usuario_id', authUser.id)
    .maybeSingle();

  if (!membership) throw new AppError('Sala no encontrada', 404);

  return { sala, equipoId: equipoData.id };
}

export class AppError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}
