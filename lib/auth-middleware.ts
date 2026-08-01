import { NextRequest } from 'next/server';
import { verifyJwt } from './auth';
import { AuthUser } from '@/types';

export async function getAuthUser(request: NextRequest): Promise<AuthUser | null> {
  // Try x-user-* headers set by edge middleware first
  const userId = request.headers.get('x-user-id');
  const empresaId = request.headers.get('x-empresa-id');
  const rolGlobal = request.headers.get('x-rol-global');
  const suscripcionId = request.headers.get('x-suscripcion-id');
  const userName = request.headers.get('x-user-nombre');
  const userEmail = request.headers.get('x-user-email');

  if (userId && empresaId && rolGlobal) {
    return {
      id: userId,
      email: userEmail || '',
      nombre: userName || '',
      rol_global: rolGlobal as AuthUser['rol_global'],
      empresa_id: empresaId,
      suscripcion_id: suscripcionId || '',
    };
  }

  // Fallback: parse cookie manually (for routes not behind edge middleware)
  const cookie = request.cookies.get('session')?.value;
  if (!cookie) return null;

  const payload = await verifyJwt(cookie);
  if (!payload) return null;

  return {
    id: payload.user_id,
    email: payload.email || '',
    nombre: payload.nombre || '',
    rol_global: payload.rol_global,
    empresa_id: payload.empresa_id,
    suscripcion_id: payload.suscripcion_id,
  };
}
