'use client';
import { useLimits } from '@/hooks/useLimits';
import styles from './UsageIndicator.module.css';

export function UsageIndicator() {
  const { limits } = useLimits();

  if (!limits) return null;

  const usado = limits.uso_ia?.clusters_usados ?? 0;
  const max = limits.suscripcion.clusters_ia_mes;
  const percentage = max ? Math.min(Math.round((usado / max) * 100), 100) : 0;

  return (
    <div className={styles.wrapper}>
      <div className={styles.label}>
        <span>Clusters IA</span>
        <span>{max ? `${usado} / ${max}` : usado.toString()}</span>
      </div>
      {max && (
        <div className={styles.bar}>
          <div
            className={`${styles.fill} ${percentage >= 90 ? styles.danger : percentage >= 70 ? styles.warning : ''}`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      )}
      {!max && <small className={styles.unlimited}>Ilimitado</small>}
    </div>
  );
}
