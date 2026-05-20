'use client';
import { useLimits } from '@/hooks/useLimits';
import styles from './configuracion.module.css';

export default function ConfiguracionPage() {
  const { limits, loading, refetch } = useLimits();

  if (loading) {
    return <div className={styles.container}><p>Cargando...</p></div>;
  }

  if (!limits) {
    return <div className={styles.container}><p>Error al cargar configuración</p></div>;
  }

  const clusterLimit = limits.suscripcion.clusters_ia_mes;
  const clusterUsed = limits.uso_ia?.clusters_usados ?? 0;
  const clusterPercentage = clusterLimit ? Math.round((clusterUsed / clusterLimit) * 100) : 0;
  const teamLimit = limits.suscripcion.equipos_max;
  const teamCount = limits.equipos_count;

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Configuración</h1>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Plan Actual</h2>
        <div className={styles.planCard}>
          <div className={styles.planHeader}>
            <h3 className={styles.planName}>{limits.suscripcion.plan.nombre}</h3>
            <span className={styles.planPrice}>${limits.suscripcion.precio}/mes</span>
          </div>
          <div className={styles.planStatus}>
            Estado: <span className={`${styles.status} ${styles[limits.suscripcion.estado]}`}>
              {limits.suscripcion.estado === 'activa' ? 'Activa' : limits.suscripcion.estado}
            </span>
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Límites y Uso</h2>
        
        <div className={styles.limitRow}>
          <div className={styles.limitLabel}>
            <span>Clusters IA este mes</span>
            <span className={styles.limitValue}>
              {clusterUsed} / {clusterLimit ?? '∞'}
            </span>
          </div>
          {clusterLimit && (
            <div className={styles.progressBar}>
              <div
                className={`${styles.progressFill} ${
                  clusterPercentage >= 90 ? styles.danger :
                  clusterPercentage >= 70 ? styles.warning :
                  styles.normal
                }`}
                style={{ width: `${Math.min(clusterPercentage, 100)}%` }}
              />
            </div>
          )}
        </div>

        <div className={styles.limitRow}>
          <div className={styles.limitLabel}>
            <span>Equipos</span>
            <span className={styles.limitValue}>
              {teamCount} / {teamLimit ?? '∞'}
            </span>
          </div>
        </div>
      </section>

      {limits.suscripcion.precio_proximo && (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Próximo Cambio de Precio</h2>
          <div className={styles.priceChange}>
            <p>El precio pasará de <strong>${limits.suscripcion.precio}</strong> a <strong>${limits.suscripcion.precio_proximo}</strong></p>
            <p>Fecha efectiva: <strong>{limits.suscripcion.fecha_efectiva_proximo_cambio}</strong></p>
          </div>
        </section>
      )}
    </div>
  );
}
