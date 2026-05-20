'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Equipo } from '@/types';
import styles from './equipos.module.css';

interface EquipoConConteo extends Equipo {
  miembros_count: number;
}

export default function EquiposPage() {
  const router = useRouter();
  const [equipos, setEquipos] = useState<EquipoConConteo[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [nombre, setNombre] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchEquipos = async () => {
    try {
      const res = await fetch('/api/equipos');
      if (!res.ok) throw new Error('Error al cargar equipos');
      const data = await res.json();
      setEquipos(data.equipos || []);
    } catch {
      setError('Error al cargar equipos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEquipos();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) return;

    setCreating(true);
    setError(null);

    try {
      const res = await fetch('/api/equipos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre: nombre.trim() }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Error al crear equipo');
      }

      setNombre('');
      setShowCreate(false);
      await fetchEquipos();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (equipoId: string) => {
    if (!confirm('¿Estás seguro de eliminar este equipo? Se eliminarán todas sus salas y datos.')) {
      return;
    }

    try {
      const res = await fetch(`/api/equipos/${equipoId}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Error al eliminar equipo');
      }

      await fetchEquipos();
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (loading) {
    return <div className={styles.loading}>Cargando equipos...</div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Equipos</h1>
        <button
          className={styles.createBtn}
          onClick={() => setShowCreate(!showCreate)}
        >
          {showCreate ? 'Cancelar' : 'Nuevo equipo'}
        </button>
      </div>

      {error && (
        <div className={styles.error}>
          {error}
          <button onClick={() => setError(null)} className={styles.errorClose}>×</button>
        </div>
      )}

      {showCreate && (
        <form onSubmit={handleCreate} className={styles.createForm}>
          <input
            type="text"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Nombre del equipo"
            className={styles.input}
            disabled={creating}
            autoFocus
          />
          <button
            type="submit"
            className={styles.submitBtn}
            disabled={creating || !nombre.trim()}
          >
            {creating ? 'Creando...' : 'Crear equipo'}
          </button>
        </form>
      )}

      {equipos.length === 0 ? (
        <div className={styles.empty}>
          <p>No hay equipos aún.</p>
          <p>Crea tu primer equipo para comenzar.</p>
        </div>
      ) : (
        <div className={styles.grid}>
          {equipos.map((equipo) => (
            <div key={equipo.id} className={styles.card}>
              <div className={styles.cardBody}>
                <h3 className={styles.cardTitle}>{equipo.nombre}</h3>
                <p className={styles.cardMeta}>
                  {equipo.miembros_count} miembro{equipo.miembros_count !== 1 ? 's' : ''}
                </p>
              </div>
              <div className={styles.cardActions}>
                <button
                  className={styles.actionBtn}
                    onClick={() => router.push(`/dashboard/salas?equipo_id=${equipo.id}`)}
                >
                  Salas
                </button>
                <button
                  className={styles.actionBtn}
                  onClick={() => router.push(`/dashboard/equipos?id=${equipo.id}`)}
                >
                  Invitar
                </button>
                <button
                  className={`${styles.actionBtn} ${styles.deleteBtn}`}
                  onClick={() => handleDelete(equipo.id)}
                >
                  Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
