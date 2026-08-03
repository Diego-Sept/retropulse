'use client';

import { Suspense, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/stores/auth-store';
import styles from './register.module.css';

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const invitacionToken = searchParams.get('invitacion');

  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [fromInvite, setFromInvite] = useState(false);

  useEffect(() => {
    if (invitacionToken) {
      setFromInvite(true);
      fetch(`/api/invitaciones/empresa/${invitacionToken}`)
        .then((r) => r.json())
        .then((data) => {
          if (data.invitacion?.email) {
            setEmail(data.invitacion.email);
          }
        })
        .catch(() => {});
    }
  }, [invitacionToken]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    setLoading(true);

    try {
      const body: any = { email, password, nombre };
      if (invitacionToken) body.invitacion_token = invitacionToken;

      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Error al registrarse');
        return;
      }

      useAuthStore.getState().setUser(data.user);
      router.push('/dashboard');
    } catch {
      setError('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <form className={styles.form} onSubmit={handleSubmit}>
        <h1 className={styles.title}>Crear Cuenta</h1>
        {fromInvite && (
          <p className={styles.inviteHint}>Estás registrándote por invitación de empresa</p>
        )}
        {error && <p className={styles.error}>{error}</p>}
        <input
          type="text"
          placeholder="Nombre"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          required
          className={styles.input}
        />
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className={styles.input}
        />
        <input
          type="password"
          placeholder="Contraseña (mín. 6 caracteres)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
          className={styles.input}
        />
        <button type="submit" disabled={loading} className={styles.button}>
          {loading ? 'Registrando...' : 'Registrarse'}
        </button>
        <p className={styles.link}>
          ¿Ya tenés cuenta? <a href="/login">Iniciá sesión</a>
        </p>
      </form>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense>
      <RegisterForm />
    </Suspense>
  );
}
