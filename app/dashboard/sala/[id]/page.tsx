'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { AuthGuard } from '@/components/AuthGuard';
import { Board } from '@/components/board/Board';
import styles from './sala.module.css';

export default function SalaPage() {
  const params = useParams();
  const router = useRouter();
  const salaId = params.id as string;
  const [sala, setSala] = useState<{ id: string; nombre: string; equipo_id: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!salaId) return;

    fetch(`/api/salas/${salaId}`)
      .then(res => {
        if (res.status === 404) throw new Error('Sala no encontrada');
        if (res.status === 403) throw new Error('No tenés acceso a esta sala');
        if (!res.ok) throw new Error('Error al cargar la sala');
        return res.json();
      })
      .then(data => {
        setSala(data.sala ?? data);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, [salaId]);

  if (loading) {
    return (
      <AuthGuard>
        <div className={styles.statusContainer}>
          <p>Cargando sala...</p>
        </div>
      </AuthGuard>
    );
  }

  if (error) {
    return (
      <AuthGuard>
        <div className={styles.statusContainer}>
          <p className={styles.errorText}>{error}</p>
          <button onClick={() => router.push('/dashboard')} className={styles.backBtn}>
            Volver al dashboard
          </button>
        </div>
      </AuthGuard>
    );
  }

  if (!sala) return null;

  return (
    <AuthGuard>
      <Board salaId={sala.id} salaNombre={sala.nombre} />
    </AuthGuard>
  );
}
