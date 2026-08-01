'use client';
import { useBoard } from '@/contexts/BoardContext';
import { Tarjeta } from '@/types';
import styles from './Card.module.css';

interface CardProps {
  tarjeta: Tarjeta;
  columnaId: number;
  grupoColor?: string;
  isSelected?: boolean;
  onToggleSelect?: (id: string) => void;
}

export function Card({ tarjeta, columnaId, grupoColor, isSelected, onToggleSelect }: CardProps) {
  const { setDrag } = useBoard();

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('text/plain', tarjeta.id);
    e.dataTransfer.effectAllowed = 'move';
    setDrag(tarjeta.id, columnaId);
  };

  const handleDragEnd = () => {
    setDrag(null, null);
  };

  const { deleteTarjeta } = useBoard();

  const handleDelete = async () => {
    if (!confirm('¿Eliminar esta tarjeta?')) return;
    try {
      // Optimistic removal from UI
      deleteTarjeta(tarjeta.id);

      const res = await fetch(
        `/api/salas/${tarjeta.sala_id}/tarjetas/${tarjeta.id}`,
        { method: 'DELETE' },
      );
      if (!res.ok) throw new Error('Error al eliminar');
    } catch (err) {
      console.error('Delete error:', err);
      // Re-fetch on failure — realtime subscription will handle the rollback
    }
  };

  const handleSelectClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleSelect?.(tarjeta.id);
  };

  return (
    <div
      className={`${styles.card} ${grupoColor ? styles.hasGroup : ''} ${isSelected ? styles.selected : ''}`}
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      style={grupoColor ? { borderLeftColor: grupoColor } : undefined}
      onClick={handleSelectClick}
    >
      <p className={styles.content}>{tarjeta.contenido}</p>
      {isSelected && <span className={styles.checkBadge}>✓</span>}
      <button
        className={styles.deleteBtn}
        onClick={(e) => { e.stopPropagation(); handleDelete(); }}
        title="Eliminar"
      >
        ×
      </button>
    </div>
  );
}
