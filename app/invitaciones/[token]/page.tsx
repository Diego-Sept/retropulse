'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth-store';
import Link from 'next/link';
import styles from './page.module.css';

interface InvitacionInfo {
  id: string;
  equipo_nombre: string;
  email: string;
  rol: string;
}

export default function InvitacionPage() {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;
  const { user, isLoading } = useAuthStore();

  const [invitacion, setInvitacion] = useState<InvitacionInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [accepting, setAccepting] = useState(false);
  const [accepted, setAccepted] = useState(false);

  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      router.push(`/login?redirect=/invitaciones/${token}`);
      return;
    }

    fetch(`/api/invitaciones/${token}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) setError(data.error);
        else setInvitacion(data.invitacion);
      })
      .catch(() => setError('Error al cargar la invitación'));
  }, [token, user, isLoading, router]);

  const handleAccept = async () => {
    setAccepting(true);
    setError(null);
    try {
      const res = await fetch(`/api/invitaciones/${token}`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Error al aceptar');
        return;
      }
      setAccepted(true);
    } catch {
      setError('Error de conexión');
    } finally {
      setAccepting(false);
    }
  };

  if (isLoading) return <div className={styles.loading}>Cargando...</div>;
  if (!user) return null;

  if (accepted) {
    return (
      <div className={styles.container}>
        <div className={styles.card}>
          <div className={styles.checkIcon}>✓</div>
          <h1 className={styles.title}>¡Invitación aceptada!</h1>
          <p className={styles.subtitle}>Ya sos miembro del equipo.</p>
          <Link href="/dashboard/equipos" className={styles.cta}>
            Ir a mis equipos
          </Link>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.card}>
          <div className={styles.errorIcon}>!</div>
          <h1 className={styles.title}>Error</h1>
          <p className={styles.subtitle}>{error}</p>
          <Link href="/dashboard" className={styles.cta}>
            Volver al inicio
          </Link>
        </div>
      </div>
    );
  }

  if (!invitacion) {
    return <div className={styles.loading}>Cargando invitación...</div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1 className={styles.title}>Invitación a equipo</h1>
        <p className={styles.subtitle}>
          Fuiste invitado a unirte a <strong>{invitacion.equipo_nombre}</strong>
        </p>
        <p className={styles.email}>{invitacion.email}</p>
        <p className={styles.rol}>Rol: {invitacion.rol === 'team_admin' ? 'Administrador' : 'Miembro'}</p>
        <button
          onClick={handleAccept}
          disabled={accepting}
          className={styles.cta}
        >
          {accepting ? 'Aceptando...' : 'Aceptar invitación'}
        </button>
      </div>
    </div>
  );
}
