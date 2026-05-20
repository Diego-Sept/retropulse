'use client';
import { BoardProvider } from '@/contexts/BoardContext';
import { useRealtimeCards } from '@/hooks/useRealtimeCards';
import { Column } from './Column';
import { ExportMenu } from './ExportMenu';
import styles from './Board.module.css';

const COLUMNAS = [1, 2, 3, 4] as const;

interface BoardProps {
  salaId: string;
  salaNombre: string;
}

function BoardContent({ salaId }: { salaId: string }) {
  const { loading, error } = useRealtimeCards(salaId);

  if (loading) {
    return <div className={styles.loading}>Cargando tablero...</div>;
  }

  if (error) {
    return <div className={styles.error}>Error: {error}</div>;
  }

  return (
    <div className={styles.board}>
      {COLUMNAS.map((id) => (
        <Column key={id} columnaId={id} salaId={salaId} />
      ))}
    </div>
  );
}

export function Board({ salaId, salaNombre }: BoardProps) {
  return (
    <BoardProvider>
      <div className={styles.container}>
        <header className={styles.header}>
          <h1 className={styles.title}>{salaNombre}</h1>
          <div className={styles.actions}>
            <ExportMenu salaNombre={salaNombre} />
          </div>
        </header>
        <BoardContent salaId={salaId} />
      </div>
    </BoardProvider>
  );
}
