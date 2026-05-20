'use client';
import React from 'react';
import { useBoard } from '@/contexts/BoardContext';
import { Card } from './Card';
import { CardForm } from './CardForm';
import { ClusterButton } from './ClusterButton';
import { GroupHeader } from './GroupHeader';
import { Tarjeta } from '@/types';
import styles from './Column.module.css';

const COLUMN_TITLES: Record<number, string> = {
  1: '¿Qué hicimos bien?',
  2: '¿Qué hicimos mal?',
  3: 'Ideas para mejorar',
  4: 'Acciones a tomar',
};

const COLORS: Record<number, string> = {
  1: '#10b981', // green
  2: '#ef4444', // red
  3: '#f59e0b', // yellow
  4: '#3b82f6', // blue
};

const GROUP_COLORS = ['#6c5ce7', '#00b894', '#e17055', '#0984e3', '#fdcb6e', '#e84393', '#00cec9', '#636e72'];

interface ColumnProps {
  columnaId: number;
  salaId: string;
}

export function Column({ columnaId, salaId }: ColumnProps) {
  const { state, dispatch, moveTarjeta, setDrag } = useBoard();
  const [isDragOver, setIsDragOver] = React.useState(false);
  const [selectedCardIds, setSelectedCardIds] = React.useState<Set<string>>(new Set());
  const [groupName, setGroupName] = React.useState('');
  const [creatingGroup, setCreatingGroup] = React.useState(false);
  const cards = state.columnas[columnaId] || [];
  const columnGroups = state.grupos.filter(g => g.columna_id === columnaId);

  const toggleCardSelection = (id: string) => {
    setSelectedCardIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectedCount = selectedCardIds.size;

  const handleCreateGroup = async () => {
    if (!groupName.trim() || selectedCount < 2) return;
    setCreatingGroup(true);

    try {
      const res = await fetch('/api/grupos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sala_id: salaId,
          columna_id: columnaId,
          nombre: groupName.trim(),
          tarjetas_ids: Array.from(selectedCardIds),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Error al crear grupo');
      }

      // Refresh state
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

      setSelectedCardIds(new Set());
      setGroupName('');
    } catch (err: any) {
      console.error(err.message || 'Error al crear grupo');
    } finally {
      setCreatingGroup(false);
    }
  };

  const clearSelection = () => {
    setSelectedCardIds(new Set());
    setGroupName('');
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    // Only set false when leaving the column, not when entering a child
    if (e.currentTarget === e.target || !e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragOver(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    const cardId = e.dataTransfer.getData('text/plain');
    const sourceColumna = state.dragState.sourceColumna;

    if (!cardId || sourceColumna === columnaId) return;

    // Optimistic move
    moveTarjeta(cardId, columnaId);

    // API call
    try {
      const res = await fetch(`/api/salas/${salaId}/tarjetas/${cardId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ columna_id: columnaId }),
      });
      if (!res.ok) {
        // Revert on failure
        moveTarjeta(cardId, sourceColumna!);
      }
    } catch {
      moveTarjeta(cardId, sourceColumna!);
    } finally {
      setDrag(null, null);
    }
  };

  // Group cards by grupo_id
  const groupedCards = React.useMemo(() => {
    const grouped: { grupoId: string | null; cards: Tarjeta[] }[] = [];
    const groupMap = new Map<string | null, Tarjeta[]>();

    for (const card of cards) {
      const gid = card.grupo_id || '__ungrouped__';
      if (!groupMap.has(gid)) {
        groupMap.set(gid, []);
      }
      groupMap.get(gid)!.push(card);
    }

    // Ungrouped first, then groups in order
    const ungrouped = groupMap.get('__ungrouped__');
    if (ungrouped) {
      grouped.push({ grupoId: null, cards: ungrouped });
      groupMap.delete('__ungrouped__');
    }

    // Render groups in the order they appear in state.grupos
    for (const grupo of columnGroups) {
      const gCards = groupMap.get(grupo.id);
      if (gCards) {
        grouped.push({ grupoId: grupo.id, cards: gCards });
        groupMap.delete(grupo.id);
      }
    }

    // Any remaining groups not in state.grupos
    groupMap.forEach((gCards, gid) => {
      if (gid !== '__ungrouped__') {
        grouped.push({ grupoId: gid, cards: gCards });
      }
    });

    return grouped;
  }, [cards, columnGroups]);

  const color = COLORS[columnaId];

  return (
    <div
      className={`${styles.column} ${isDragOver ? styles.dragOver : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className={styles.header} style={{ borderTopColor: color }}>
        <div className={styles.headerLeft}>
          <h3 className={styles.title}>{COLUMN_TITLES[columnaId]}</h3>
          <span className={styles.count}>{cards.length}</span>
        </div>
        <ClusterButton salaId={salaId} columnaId={columnaId} />
      </div>
      <div className={styles.cards}>
        {cards.length === 0 && !isDragOver && (
          <p className={styles.empty}>Sin tarjetas aún</p>
        )}
        {groupedCards.map((group) => {
          const grupo = group.grupoId ? columnGroups.find(g => g.id === group.grupoId) : null;
          const index = grupo ? columnGroups.indexOf(grupo) : 0;
          const grupoColor = grupo ? GROUP_COLORS[index % GROUP_COLORS.length] : undefined;
          return (
            <React.Fragment key={group.grupoId || '__ungrouped'}>
              {grupo && <GroupHeader grupo={grupo} index={index} />}
              {group.cards.map((card) => (
                <Card
                  key={card.id}
                  tarjeta={card}
                  columnaId={columnaId}
                  grupoColor={grupoColor}
                  isSelected={selectedCardIds.has(card.id)}
                  onToggleSelect={toggleCardSelection}
                />
              ))}
            </React.Fragment>
          );
        })}
      </div>

      {selectedCount >= 2 && (
        <div className={styles.createGroupBar}>
          <input
            className={styles.groupNameInput}
            type="text"
            placeholder="Nombre del grupo..."
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleCreateGroup(); }}
          />
          <button
            className={styles.createGroupBtn}
            onClick={handleCreateGroup}
            disabled={!groupName.trim() || creatingGroup}
          >
            {creatingGroup ? 'Creando...' : `Agrupar (${selectedCount})`}
          </button>
          <button
            className={styles.cancelSelectBtn}
            onClick={clearSelection}
            title="Cancelar selección"
          >
            ×
          </button>
        </div>
      )}
      <CardForm salaId={salaId} columnaId={columnaId} />
    </div>
  );
}
