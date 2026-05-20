'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './home.module.css';

interface EquipoResumen {
  id: string;
  nombre: string;
  created_at: string;
  miembros_count: number;
}

export default function DashboardHome() {
  const router = useRouter();
  const [equipos, setEquipos] = useState<EquipoResumen[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/equipos')
      .then(res => res.ok ? res.json() : Promise.reject('Error'))
      .then(data => setEquipos(data.equipos || []))
      .catch(() => setError('Error al cargar equipos'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Panel de Control</h1>
        <button
          className={styles.manageBtn}
          onClick={() => router.push('/dashboard/equipos')}
        >
          Gestionar equipos
        </button>
      </div>

      {error && <div className={styles.error}>{error}</div>}

      {loading ? (
        <div className={styles.loading}>Cargando...</div>
      ) : equipos.length === 0 ? (
        <div className={styles.empty}>
          <p className={styles.emptyText}>No tenés equipos aún.</p>
          <p className={styles.emptySubtext}>
            Creá un equipo para empezar a trabajar en retrospectivas.
          </p>
          <button
            className={styles.createBtn}
            onClick={() => router.push('/dashboard/equipos')}
          >
            Crear equipo
          </button>
        </div>
      ) : (
        <>
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Tus equipos</h2>
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
                      className={styles.cardBtn}
                      onClick={() => router.push(`/dashboard/equipos?id=${equipo.id}`)}
                    >
                      Ver equipo
                    </button>
                    <button
                      className={styles.cardBtnSecondary}
                      onClick={() => {
                        // Quick-create sala — will redirect to the team page
                        router.push(`/dashboard/equipos?id=${equipo.id}`);
                      }}
                    >
                      + Sala
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className={styles.quickActions}>
            <h2 className={styles.sectionTitle}>Acciones rápidas</h2>
            <div className={styles.actionsRow}>
              <button
                className={styles.quickBtn}
                onClick={() => router.push('/dashboard/equipos')}
              >
                Invitar miembros
              </button>
              <button
                className={styles.quickBtn}
                onClick={() => router.push('/dashboard/configuracion')}
              >
                Ver plan y uso
              </button>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
