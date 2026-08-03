'use client';
import { useState } from 'react';
import { useLimits } from '@/hooks/useLimits';
import styles from './configuracion.module.css';

export default function ConfiguracionPage() {
  const { limits, loading, refetch } = useLimits();
  const [upgrading, setUpgrading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleUpgrade = async (plan: string) => {
    setUpgrading(plan);
    setError(null);
    try {
      const res = await fetch('/api/checkout/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Error al iniciar pago');
      }

      // Redirect to MercadoPago
      window.location.href = data.init_point;
    } catch (err: any) {
      setError(err.message);
      setUpgrading(null);
    }
  };

  if (loading) {
    return <div className={styles.container}><p>Cargando...</p></div>;
  }

  if (!limits) {
    return <div className={styles.container}><p>Error al cargar configuración</p></div>;
  }

  const currentPlan = limits.suscripcion.plan.nombre;
  const clusterLimit = limits.suscripcion.clusters_ia_mes;
  const clusterUsed = limits.uso_ia?.clusters_usados ?? 0;
  const clusterPercentage = clusterLimit ? Math.round((clusterUsed / clusterLimit) * 100) : 0;
  const teamLimit = limits.suscripcion.equipos_max;
  const teamCount = limits.equipos_count;

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Configuración</h1>

      {error && (
        <div className={styles.error}>
          {error}
          <button onClick={() => setError(null)} className={styles.errorClose}>×</button>
        </div>
      )}

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Plan Actual</h2>
        <div className={styles.planCard}>
          <div className={styles.planHeader}>
            <h3 className={styles.planName}>{limits.suscripcion.plan.nombre}</h3>
            <span className={styles.planPrice}>
              {limits.suscripcion.precio > 0 ? `$${limits.suscripcion.precio}/mes` : 'Gratis'}
            </span>
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

      {currentPlan === 'Gratuito' && (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Mejorar Plan</h2>
          <div className={styles.plansGrid}>
            <div className={styles.planOption}>
              <h3>Small Team</h3>
              <p className={styles.planOptionPrice}>$20.000/mes</p>
              <ul>
                <li>1 equipo</li>
                <li>30 clusters IA/mes</li>
                <li>Exportación MD y PDF</li>
              </ul>
              <button
                className={styles.upgradeBtn}
                disabled={upgrading === 'small_team'}
                onClick={() => handleUpgrade('small_team')}
              >
                {upgrading === 'small_team' ? 'Redirigiendo...' : 'Elegir Small Team'}
              </button>
            </div>
            <div className={`${styles.planOption} ${styles.planOptionFeatured}`}>
              <span className={styles.planBadge}>Recomendado</span>
              <h3>Enterprise</h3>
              <p className={styles.planOptionPrice}>$100.000/mes</p>
              <ul>
                <li>10 equipos</li>
                <li>500 clusters IA/mes</li>
                <li>Soporte prioritario</li>
              </ul>
              <button
                className={`${styles.upgradeBtn} ${styles.upgradeBtnPrimary}`}
                disabled={upgrading === 'enterprise'}
                onClick={() => handleUpgrade('enterprise')}
              >
                {upgrading === 'enterprise' ? 'Redirigiendo...' : 'Elegir Enterprise'}
              </button>
            </div>
          </div>
        </section>
      )}

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
