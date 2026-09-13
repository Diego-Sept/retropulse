import { getSupabaseServerClient } from './supabase-server';

export interface PlanLimits {
  suscripcionId: string;
  planNombre: string;
  equiposMax: number | null;  // null = unlimited
  salasMax: number | null;    // null = unlimited
  clustersIaMes: number | null;  // null = unlimited
  precio: number;
  estado: string;
  precioProximo: number | null;
  fechaEfectivaProximoCambio: string | null;
}

export async function getSuscripcionLimits(empresaId: string): Promise<PlanLimits | null> {
  const supabase = getSupabaseServerClient();

  const { data, error } = await supabase
    .from('suscripciones')
    .select(`
      id, equipos_max, salas_max, clusters_ia_mes, precio, estado,
      precio_proximo, fecha_efectiva_proximo_cambio,
      planes_subscription!inner(nombre)
    `)
    .eq('empresa_id', empresaId)
    .eq('estado', 'activa')
    .single();

  if (error || !data) return null;

  return {
    suscripcionId: data.id,
    planNombre: (data.planes_subscription as any).nombre,
    equiposMax: data.equipos_max === 0 ? null : data.equipos_max,
    salasMax: data.salas_max === 0 ? null : data.salas_max,
    clustersIaMes: data.clusters_ia_mes === 0 ? null : data.clusters_ia_mes,
    precio: data.precio,
    estado: data.estado,
    precioProximo: data.precio_proximo,
    fechaEfectivaProximoCambio: data.fecha_efectiva_proximo_cambio,
  };
}

export async function checkClusterLimit(empresaId: string): Promise<{ allowed: boolean; reason?: string; current: number; limit: number | null }> {
  const supabase = getSupabaseServerClient();
  const limits = await getSuscripcionLimits(empresaId);

  if (!limits) {
    return { allowed: false, reason: 'Suscripción no encontrada', current: 0, limit: null };
  }

  // If unlimited
  if (limits.clustersIaMes === null) {
    return { allowed: true, current: 0, limit: null };
  }

  // Get current month usage
  const mes = new Date().toISOString().slice(0, 7); // "2026-05"
  const { data: uso } = await supabase
    .from('uso_ia')
    .select('clusters_usados')
    .eq('empresa_id', empresaId)
    .eq('mes', mes)
    .maybeSingle();

  const current = uso?.clusters_usados ?? 0;
  const allowed = current < limits.clustersIaMes;

  return {
    allowed,
    reason: allowed ? undefined : `Has alcanzado el límite mensual de clusters IA (${limits.clustersIaMes}). Actualiza tu plan para continuar.`,
    current,
    limit: limits.clustersIaMes,
  };
}

export async function checkTeamLimit(empresaId: string): Promise<{ allowed: boolean; reason?: string }> {
  const supabase = getSupabaseServerClient();
  const limits = await getSuscripcionLimits(empresaId);

  if (!limits) {
    return { allowed: false, reason: 'Suscripción no encontrada' };
  }

  if (limits.equiposMax === null) {
    return { allowed: true }; // unlimited
  }

  const { count } = await supabase
    .from('equipos')
    .select('*', { count: 'exact', head: true })
    .eq('empresa_id', empresaId);

  const allowed = (count ?? 0) < limits.equiposMax;

  return {
    allowed,
    reason: allowed ? undefined : `Tu plan actual permite solo ${limits.equiposMax} equipo${limits.equiposMax === 1 ? '' : 's'}. Actualiza tu plan para crear más.`,
  };
}

export async function checkSalasLimit(empresaId: string): Promise<{ allowed: boolean; reason?: string }> {
  const supabase = getSupabaseServerClient();
  const limits = await getSuscripcionLimits(empresaId);

  if (!limits) {
    return { allowed: false, reason: 'Suscripción no encontrada' };
  }

  if (limits.salasMax === null) {
    return { allowed: true }; // unlimited
  }

  // Count active salas only (archived don't count against the limit)
  // salas belongs to equipos which belong to the empresa
  const { count } = await supabase
    .from('salas')
    .select('id, equipos!inner(empresa_id)', { count: 'exact', head: true })
    .eq('equipos.empresa_id', empresaId)
    .eq('estado', 'activa');

  const allowed = (count ?? 0) < limits.salasMax;

  return {
    allowed,
    reason: allowed ? undefined : `Tu plan gratuito permite hasta ${limits.salasMax} salas activas. Archivá una o actualizá tu plan para crear más.`,
  };
}

export async function incrementClusterUsage(empresaId: string): Promise<void> {
  const supabase = getSupabaseServerClient();
  const mes = new Date().toISOString().slice(0, 7);

  // Upsert: increment clusters_usados
  await supabase.rpc('increment_cluster_usage', { p_empresa_id: empresaId, p_mes: mes });
}
