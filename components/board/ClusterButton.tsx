'use client';
import { useState } from 'react';
import { useBoard } from '@/contexts/BoardContext';
import styles from './ClusterButton.module.css';

interface ClusterButtonProps {
  salaId: string;
  columnaId: number;
  disabled?: boolean;
  disabledReason?: string;
}

export function ClusterButton({ salaId, columnaId, disabled, disabledReason }: ClusterButtonProps) {
  const { state, dispatch } = useBoard();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const columnCards = state.columnas[columnaId] || [];
  const hasCards = columnCards.length > 0;
  const isDisabled = disabled || !hasCards || loading;

  const handleCluster = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/cluster', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sala_id: salaId,
          columna_id: columnaId,
          tarjetas: columnCards.map(c => ({ id: c.id, contenido: c.contenido })),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Error al agrupar');
      }

      // Fetch ALL tarjetas (con grupo_id actualizado) y grupos para refrescar el board completo
      const [tarjetasRes, supabaseMod] = await Promise.all([
        fetch(`/api/salas/${salaId}/tarjetas`),
        import('@/lib/supabase'),
      ]);
      const { tarjetas } = await tarjetasRes.json();
      const supabase = supabaseMod.getSupabaseBrowserClient();
      const { data: grupos } = await supabase
        .from('grupos')
        .select('*')
        .eq('sala_id', salaId);

      if (grupos && tarjetas) {
        dispatch({ type: 'SET_GRUPOS_TARJETAS', payload: { grupos, tarjetas } });
      }
    } catch (err: any) {
      setError(err.message || 'Error al agrupar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.wrapper}>
      <button
        className={styles.button}
        onClick={handleCluster}
        disabled={isDisabled}
        title={disabledReason || (!hasCards ? 'Agregá tarjetas primero' : '')}
      >
        {loading ? 'Agrupando...' : '🤖 Agrupar'}
      </button>
      {error && <p className={styles.error}>{error}</p>}
    </div>
  );
}
