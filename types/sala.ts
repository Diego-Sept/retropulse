export interface Sala {
  id: string;
  equipo_id: string;
  nombre: string;
  estado: 'activa' | 'archivada';
  created_at: string;
  updated_at: string;
}
