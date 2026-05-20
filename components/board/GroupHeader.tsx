'use client';
import { useState } from 'react';
import { useBoard } from '@/contexts/BoardContext';
import { Grupo, Tarjeta } from '@/types';
import styles from './GroupHeader.module.css';

const GROUP_COLORS = ['#6c5ce7', '#00b894', '#e17055', '#0984e3', '#fdcb6e', '#e84393', '#00cec9', '#636e72'];

interface GroupHeaderProps {
  grupo: Grupo;
  index: number;
}

export function GroupHeader({ grupo, index }: GroupHeaderProps) {
  const { state, updateTarjeta, setDrag } = useBoard();
  const [isDragOver, setIsDragOver] = useState(false);
  const color = GROUP_COLORS[index % GROUP_COLORS.length];

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'move';
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.stopPropagation();
    // Only set false when leaving the header, not when entering a child element
    if (e.currentTarget === e.target || !e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragOver(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const cardId = e.dataTransfer.getData('text/plain');
    const sourceColumna = state.dragState.sourceColumna;
    if (!cardId) return;

    const card = state.tarjetas.find(t => t.id === cardId);
    if (!card) return;

    const isSameColumn = sourceColumna === grupo.columna_id;

    // Build updated card
    const updatedCard: Tarjeta = {
      ...card,
      grupo_id: grupo.id,
      columna_id: isSameColumn ? card.columna_id : grupo.columna_id,
    };

    // Optimistic update
    updateTarjeta(updatedCard);

    // Clear drag state
    setDrag(null, null);

    // Persist via API
    const body: Record<string, any> = { grupo_id: grupo.id };
    if (!isSameColumn) {
      body.columna_id = grupo.columna_id;
    }

    fetch(`/api/salas/${grupo.sala_id}/tarjetas/${cardId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }).catch(err => {
      console.error('Error al mover tarjeta al grupo:', err);
      // Revert on failure
      updateTarjeta(card);
    });
  };

  return (
    <div
      className={`${styles.header} ${isDragOver ? styles.dragOver : ''}`}
      style={{ borderLeftColor: color }}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <span className={styles.dot} style={{ backgroundColor: color }} />
      <span className={styles.name}>{grupo.nombre}</span>
      {isDragOver && <span className={styles.dropHint}>+ Soltar para agrupar</span>}
    </div>
  );
}
