'use client';
import { useEffect, useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Sala } from '@/types';
import styles from './salas.module.css';

interface SalaConConteo extends Sala {
  tarjetas_count?: number;
}

export default function SalasPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const equipoId = searchParams.get('equipo_id');

  const [salas, setSalas] = useState<SalaConConteo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showArchived, setShowArchived] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [nombre, setNombre] = useState('');
  const [creating, setCreating] = useState(false);

  const fetchSalas = useCallback(async () => {
    if (!equipoId) {
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`/api/salas?equipo_id=${equipoId}`);
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Error al cargar salas');
      }
      const data = await res.json();
      setSalas(data.salas || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [equipoId]);

  useEffect(() => {
    fetchSalas();
  }, [fetchSalas]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim() || !equipoId) return;

    setCreating(true);
    setError(null);

    try {
      const res = await fetch('/api/salas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ equipo_id: equipoId, nombre: nombre.trim() }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Error al crear sala');
      }

      setNombre('');
      setShowCreate(false);
      await fetchSalas();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setCreating(false);
    }
  };

  const handleArchive = async (salaId: string) => {
    if (!confirm('¿Archivar esta sala? Las tarjetas no se perderán.')) return;

    try {
      const res = await fetch(`/api/salas/${salaId}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Error al archivar sala');
      }

      await fetchSalas();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleReactivate = async (salaId: string) => {
    try {
      const res = await fetch(`/api/salas/${salaId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado: 'activa' }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Error al reactivar sala');
      }

      await fetchSalas();
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (!equipoId) {
    return (
      <div className={styles.container}>
        <div className={styles.empty}>
          <p>Seleccioná un equipo para ver sus salas.</p>
        </div>
      </div>
    );
  }

  const filteredSalas = salas.filter((s) =>
    showArchived ? true : s.estado === 'activa'
  );

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Retrospectivas</h1>
          <p className={styles.subtitle}>Salas de retrospectiva del equipo</p>
        </div>
        <div className={styles.headerActions}>
          <label className={styles.toggleLabel}>
            <input
              type="checkbox"
              checked={showArchived}
              onChange={(e) => setShowArchived(e.target.checked)}
              className={styles.toggleInput}
            />
            Mostrar archivadas
          </label>
          <button
            className={styles.createBtn}
            onClick={() => setShowCreate(!showCreate)}
          >
            {showCreate ? 'Cancelar' : 'Nueva sala'}
          </button>
        </div>
      </div>

      {error && (
        <div className={styles.error}>
          {error}
          <button onClick={() => setError(null)} className={styles.errorClose}>
            ×
          </button>
        </div>
      )}

      {showCreate && (
        <form onSubmit={handleCreate} className={styles.createForm}>
          <input
            type="text"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Nombre de la retrospectiva"
            className={styles.input}
            disabled={creating}
            autoFocus
          />
          <button
            type="submit"
            className={styles.submitBtn}
            disabled={creating || !nombre.trim()}
          >
            {creating ? 'Creando...' : 'Crear'}
          </button>
        </form>
      )}

      {loading ? (
        <div className={styles.loading}>Cargando salas...</div>
      ) : filteredSalas.length === 0 ? (
        <div className={styles.empty}>
          <p>
            {showArchived
              ? 'No hay salas en este equipo.'
              : 'No hay salas activas.'}
          </p>
          <p>Creá una nueva sala para empezar una retrospectiva.</p>
        </div>
      ) : (
        <div className={styles.grid}>
          {filteredSalas.map((sala) => (
            <div
              key={sala.id}
              className={`${styles.card} ${sala.estado === 'archivada' ? styles.archived : ''}`}
            >
              <div
                className={styles.cardBody}
                onClick={() => router.push(`/dashboard/sala/${sala.id}`)}
              >
                <h3 className={styles.cardTitle}>{sala.nombre}</h3>
                <p className={styles.cardMeta}>
                  {new Date(sala.created_at).toLocaleDateString('es-AR', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
                <span
                  className={`${styles.statusBadge} ${sala.estado === 'archivada' ? styles.statusArchived : styles.statusActive}`}
                >
                  {sala.estado === 'archivada' ? 'Archivada' : 'Activa'}
                </span>
              </div>
              <div className={styles.cardActions}>
                <button
                  className={styles.actionBtn}
                  onClick={() => router.push(`/dashboard/sala/${sala.id}`)}
                >
                  Abrir
                </button>
                {sala.estado === 'activa' ? (
                  <button
                    className={`${styles.actionBtn} ${styles.archiveBtn}`}
                    onClick={() => handleArchive(sala.id)}
                  >
                    Archivar
                  </button>
                ) : (
                  <button
                    className={`${styles.actionBtn} ${styles.reactivateBtn}`}
                    onClick={() => handleReactivate(sala.id)}
                  >
                    Reactivar
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
