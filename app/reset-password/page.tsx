'use client';

import { useState } from 'react';
import styles from './reset-password.module.css';

export default function ResetPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Error al solicitar restablecimiento');
        return;
      }

      setSent(true);
    } catch {
      setError('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className={styles.container}>
        <div className={styles.form}>
          <h1 className={styles.title}>Revisá tu email</h1>
          <p className={styles.success}>
            Si existe una cuenta con ese email, vas a recibir un enlace para
            restablecer tu contraseña en los próximos minutos.
          </p>
          <p className={styles.link}>
            <a href="/login">Volver a iniciar sesión</a>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <form className={styles.form} onSubmit={handleSubmit}>
        <h1 className={styles.title}>Restablecer contraseña</h1>
        <p className={styles.description}>
          Ingresá tu email y te vamos a enviar un enlace para restablecer tu
          contraseña.
        </p>
        {error && <p className={styles.error}>{error}</p>}
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className={styles.input}
        />
        <button type="submit" disabled={loading} className={styles.button}>
          {loading ? 'Enviando...' : 'Enviar enlace'}
        </button>
        <p className={styles.link}>
          <a href="/login">Volver a iniciar sesión</a>
        </p>
      </form>
    </div>
  );
}
