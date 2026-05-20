export interface PlanSubscription {
  id: string;
  nombre: string;
  descripcion: string;
  equipos_max: number;
  clusters_ia_mes: number;
  precio: number;
  created_at: string;
  updated_at: string;
}

export interface Suscripcion {
  id: string;
  empresa_id: string;
  plan_id: string;
  equipos_max: number;      // 0 = ilimitado
  clusters_ia_mes: number;  // 0 = ilimitado
  precio: number;
  estado: 'activa' | 'suspendida' | 'cancelada';
  fecha_inicio: string;
  precio_proximo: number | null;
  fecha_efectiva_proximo_cambio: string | null;
  created_at: string;
  updated_at: string;
}

export interface UsoIa {
  id: string;
  empresa_id: string;
  mes: string;  // "YYYY-MM"
  clusters_usados: number;
}

export interface PriceChangeLog {
  id: string;
  plan_id: string | null;
  suscripcion_id: string | null;
  precio_anterior: number;
  precio_nuevo: number;
  fecha_efectiva: string;
  tipo_cambio: 'global_template' | 'directo_suscripcion';
  motivo: string;
  created_by: string;
  created_at: string;
}

export interface NotificacionEmail {
  id: string;
  empresa_id: string;
  tipo: 'cambio_precio';
  suscripcion_id: string;
  precio_anterior: number;
  precio_nuevo: number;
  fecha_efectiva: string;
  destinatario_email: string;
  enviado: boolean;
  enviado_en: string | null;
  error_msg: string | null;
  created_at: string;
}

// API contracts
export interface UsoIaResponse {
  suscripcion: {
    id: string;
    plan: { id: string; nombre: string };
    equipos_max: number | null;  // null = unlimited
    clusters_ia_mes: number | null;
    precio: number;
    estado: string;
    precio_proximo: number | null;
    fecha_efectiva_proximo_cambio: string | null;
  };
  uso_ia: { mes: string; clusters_usados: number } | null;
  equipos_count: number;
  dentro_limite_clusters: boolean;
  dentro_limite_equipos: boolean;
}

export interface UpdatePlanPrecioRequest {
  plan_id: string;
  precio_nuevo: number;
  fecha_efectiva: string;
  motivo: string;
}

export interface UpdateSuscripcionLimitesRequest {
  equipos_max?: number;
  clusters_ia_mes?: number;
}
