export interface Equipo {
  id: string;
  empresa_id: string;
  nombre: string;
  created_at: string;
  updated_at: string;
}

export interface UsuarioEquipo {
  id: string;
  equipo_id: string;
  usuario_id: string;
  rol: 'team_admin' | 'member';
  created_at: string;
}

export interface Invitacion {
  id: string;
  equipo_id: string;
  email: string;
  token: string;
  rol: 'team_admin' | 'member';
  aceptada: boolean;
  expira_en: string;
  created_at: string;
}
