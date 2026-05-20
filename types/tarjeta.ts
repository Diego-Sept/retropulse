export interface Tarjeta {
  id: string;
  sala_id: string;
  columna_id: number;  // 1-4
  contenido: string;
  grupo_id: string | null;
  created_at: string;
  updated_at: string;
}
