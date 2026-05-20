'use client';
import { useState } from 'react';
import { useBoard } from '@/contexts/BoardContext';
import styles from './CardForm.module.css';

interface CardFormProps {
  salaId: string;
  columnaId: number;
}

export function CardForm({ salaId, columnaId }: CardFormProps) {
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { addTarjeta } = useBoard();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = content.trim();
    if (!trimmed || submitting) return;

    setSubmitting(true);

    // Optimistic update
    const tempId = `temp-${Date.now()}`;
    const optimisticCard = {
      id: tempId,
      sala_id: salaId,
      columna_id: columnaId,
      contenido: trimmed,
      grupo_id: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    addTarjeta(optimisticCard as any);
    setContent('');

    try {
      const res = await fetch(`/api/salas/${salaId}/tarjetas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contenido: trimmed, columna_id: columnaId }),
      });

      if (!res.ok) {
        // Revert optimistic on failure — the Realtime subscription will handle correct state
        console.error('Failed to create card');
      }
    } catch (err) {
      console.error('Create card error:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <textarea
        className={styles.textarea}
        placeholder="Agregar una tarjeta..."
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onKeyDown={handleKeyDown}
        rows={2}
      />
      <button
        type="submit"
        className={styles.submitBtn}
        disabled={!content.trim() || submitting}
      >
        {submitting ? '...' : '+'}
      </button>
    </form>
  );
}
