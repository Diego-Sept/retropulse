import Link from 'next/link';
import { Activity } from 'lucide-react';

export default function NotFound() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#f1f5f9',
      color: '#1e293b',
      fontFamily: 'system-ui, sans-serif',
      padding: 24,
      textAlign: 'center',
    }}>
      <Activity size={48} style={{ color: '#6c5ce7', marginBottom: 16 }} />
      <h1 style={{ fontSize: '4rem', fontWeight: 800, margin: '0 0 8px', color: '#0f172a' }}>404</h1>
      <p style={{ fontSize: '1.125rem', color: '#64748b', margin: '0 0 32px', maxWidth: 400 }}>
        La página que buscás no existe o fue movida.
      </p>
      <Link
        href="/dashboard"
        style={{
          display: 'inline-block',
          padding: '12px 24px',
          background: '#6c5ce7',
          color: '#fff',
          borderRadius: 8,
          textDecoration: 'none',
          fontWeight: 600,
          fontSize: '0.95rem',
        }}
      >
        Volver al inicio
      </Link>
    </div>
  );
}
