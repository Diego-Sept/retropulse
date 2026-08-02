export interface Sala {
  id: string;
  equipo_id: string;
  equipo_nombre?: string;
  nombre: string;
  estado: 'activa' | 'archivada';
  created_at: string;
  updated_at: string;
}
