'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth-store';
import Link from 'next/link';

export default function InvitacionEmpresaPage() {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;
  const { user, isLoading } = useAuthStore();

  const [invitacion, setInvitacion] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [accepting, setAccepting] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetch(`/api/invitaciones/empresa/${token}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) setError(data.error);
        else setInvitacion(data.invitacion);
      })
      .catch(() => setError('Error al cargar la invitación'));
  }, [token]);

  const handleAccept = async () => {
    setAccepting(true);
    setError(null);
    try {
      const res = await fetch(`/api/invitaciones/empresa/${token}`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Error al aceptar');
        return;
      }
      setMessage(data.message);
      setAccepted(true);
    } catch {
      setError('Error de conexión');
    } finally {
      setAccepting(false);
    }
  };

  const handleGoToDashboard = () => {
    // Force re-login to refresh JWT with new empresa
    useAuthStore.getState().logout();
    router.push('/login');
  };

  if (error) {
    return (
      <div style={centered}>
        <div style={card}>
          <h2 style={{ margin: '0 0 12px' }}>Error</h2>
          <p style={{ color: '#666', margin: '0 0 24px' }}>{error}</p>
          <Link href="/dashboard" style={btnStyle}>Volver al inicio</Link>
        </div>
      </div>
    );
  }

  if (!invitacion) {
    return <div style={centered}><p style={{ color: '#666' }}>Cargando...</p></div>;
  }

  if (accepted) {
    return (
      <div style={centered}>
        <div style={card}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
          <h2 style={{ margin: '0 0 8px' }}>¡Invitación aceptada!</h2>
          <p style={{ color: '#666', margin: '0 0 24px' }}>{message}</p>
          <button onClick={handleGoToDashboard} style={btnStyle}>
            Ir al dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={centered}>
      <div style={card}>
        <h2 style={{ margin: '0 0 8px' }}>Invitación a empresa</h2>
        <p style={{ color: '#666', margin: '0 0 16px' }}>
          Fuiste invitado a unirte a <strong>{invitacion.empresa_nombre}</strong>
        </p>
        <p style={{ color: '#888', fontSize: '0.875rem', margin: '0 0 24px' }}>
          {invitacion.email}
        </p>

        {isLoading ? (
          <p style={{ color: '#666' }}>Verificando sesión...</p>
        ) : user ? (
          <button
            onClick={handleAccept}
            disabled={accepting}
            style={{ ...btnStyle, width: '100%' }}
          >
            {accepting ? 'Aceptando...' : 'Aceptar invitación'}
          </button>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <Link
              href={`/login?redirect=/invitaciones/empresa/${token}`}
              style={btnStyle}
            >
              Iniciar sesión
            </Link>
            <Link
              href={`/register?invitacion=${token}`}
              style={{ ...btnStyle, background: '#fff', color: '#3b82f6', border: '2px solid #3b82f6' }}
            >
              Crear cuenta
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

const centered: React.CSSProperties = {
  minHeight: '100vh',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 24,
  background: '#f8f9fa',
};

const card: React.CSSProperties = {
  background: '#fff',
  borderRadius: 12,
  padding: '40px 32px',
  maxWidth: 420,
  width: '100%',
  textAlign: 'center',
  boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
};

const btnStyle: React.CSSProperties = {
  display: 'inline-block',
  padding: '12px 24px',
  background: '#3b82f6',
  color: '#fff',
  borderRadius: 8,
  textDecoration: 'none',
  fontWeight: 600,
  fontSize: '0.95rem',
  border: 'none',
  cursor: 'pointer',
  textAlign: 'center',
};
