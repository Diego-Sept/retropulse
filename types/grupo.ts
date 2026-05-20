export interface Grupo {
  id: string;
  sala_id: string;
  columna_id: number;
  nombre: string;
  created_at: string;
}

export interface ClusterRequest {
  columna_id: number;
  tarjetas: { id: string; contenido: string }[];
}

export interface ClusterResponse {
  grupos: { nombre_grupo: string; tarjetas: string[] }[];
}
