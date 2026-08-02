'use client';
import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Equipo } from '@/types';
import styles from './equipos.module.css';

interface EquipoConConteo extends Equipo {
  miembros_count: number;
}

export default function EquiposPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeEquipoId = searchParams.get('id');

  const [equipos, setEquipos] = useState<EquipoConConteo[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [nombre, setNombre] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Invitation state
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRol, setInviteRol] = useState<'member' | 'team_admin'>('member');
  const [inviting, setInviting] = useState(false);
  const [inviteMsg, setInviteMsg] = useState<string | null>(null);
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [inviteError, setInviteError] = useState<string | null>(null);

  const activeEquipo = activeEquipoId
    ? equipos.find((e) => e.id === activeEquipoId)
    : null;

  const fetchEquipos = async () => {
    try {
      const res = await fetch('/api/equipos');
      if (!res.ok) throw new Error('Error al cargar equipos');
      const data = await res.json();
      setEquipos(data.equipos || []);
    } catch {
      setError('Error al cargar equipos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEquipos();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) return;

    setCreating(true);
    setError(null);

    try {
      const res = await fetch('/api/equipos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre: nombre.trim() }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Error al crear equipo');
      }

      setNombre('');
      setShowCreate(false);
      await fetchEquipos();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (equipoId: string) => {
    if (!confirm('¿Estás seguro de eliminar este equipo? Se eliminarán todas sus salas y datos.')) return;

    try {
      const res = await fetch(`/api/equipos/${equipoId}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Error al eliminar equipo');
      }
      await fetchEquipos();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim() || !activeEquipoId) return;

    setInviting(true);
    setInviteError(null);
    setInviteMsg(null);
    setInviteLink(null);

    try {
      const res = await fetch(`/api/equipos/${activeEquipoId}/invitar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: inviteEmail.trim(), rol: inviteRol }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Error al invitar');
      }

      setInviteMsg(`Invitación enviada a ${inviteEmail}. Si el mail no llega, compartí el link:`);
      if (data.token) {
        const link = `${window.location.origin}/invitaciones/${data.token}`;
        setInviteLink(link);
      }
      setInviteEmail('');
    } catch (err: any) {
      setInviteError(err.message);
    } finally {
      setInviting(false);
    }
  };

  const closeInvite = () => {
    router.push('/dashboard/equipos');
    setInviteMsg(null);
    setInviteError(null);
    setInviteEmail('');
  };

  if (loading) {
    return <div className={styles.loading}>Cargando equipos...</div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Equipos</h1>
        <button
          className={styles.createBtn}
          onClick={() => setShowCreate(!showCreate)}
        >
          {showCreate ? 'Cancelar' : 'Nuevo equipo'}
        </button>
      </div>

      {error && (
        <div className={styles.error}>
          {error}
          <button onClick={() => setError(null)} className={styles.errorClose}>×</button>
        </div>
      )}

      {/* Invitation panel */}
      {activeEquipo && (
        <div className={styles.invitePanel}>
          <div className={styles.inviteHeader}>
            <h2>Invitar a {activeEquipo.nombre}</h2>
            <button onClick={closeInvite} className={styles.inviteClose}>×</button>
          </div>
          {inviteMsg ? (
            <div className={styles.inviteSuccess}>
              <p>{inviteMsg}</p>
              {inviteLink && (
                <div className={styles.inviteLinkBox}>
                  <input
                    type="text"
                    value={inviteLink}
                    readOnly
                    className={styles.inviteLinkInput}
                    onFocus={(e) => e.target.select()}
                  />
                </div>
              )}
              <button onClick={closeInvite} className={styles.inviteDoneBtn}>Listo</button>
            </div>
          ) : (
            <form onSubmit={handleInvite} className={styles.inviteForm}>
              <input
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="Email del colaborador"
                className={styles.inviteInput}
                disabled={inviting}
                autoFocus
                required
              />
              <select
                value={inviteRol}
                onChange={(e) => setInviteRol(e.target.value as 'member' | 'team_admin')}
                className={styles.inviteSelect}
                disabled={inviting}
              >
                <option value="member">Miembro</option>
                <option value="team_admin">Administrador</option>
              </select>
              <button
                type="submit"
                className={styles.inviteSubmitBtn}
                disabled={inviting || !inviteEmail.trim()}
              >
                {inviting ? 'Enviando...' : 'Invitar'}
              </button>
            </form>
          )}
          {inviteError && (
            <div className={styles.inviteError}>{inviteError}</div>
          )}
        </div>
      )}

      {showCreate && (
        <form onSubmit={handleCreate} className={styles.createForm}>
          <input
            type="text"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Nombre del equipo"
            className={styles.input}
            disabled={creating}
            autoFocus
          />
          <button
            type="submit"
            className={styles.submitBtn}
            disabled={creating || !nombre.trim()}
          >
            {creating ? 'Creando...' : 'Crear equipo'}
          </button>
        </form>
      )}

      {equipos.length === 0 ? (
        <div className={styles.empty}>
          <p>No hay equipos aún.</p>
          <p>Creá tu primer equipo para comenzar.</p>
        </div>
      ) : (
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
                  className={styles.actionBtn}
                  onClick={() => router.push(`/dashboard/salas?equipo_id=${equipo.id}`)}
                >
                  Salas
                </button>
                <button
                  className={styles.actionBtn}
                  onClick={() => router.push(`/dashboard/equipos?id=${equipo.id}`)}
                >
                  Invitar
                </button>
                <button
                  className={`${styles.actionBtn} ${styles.deleteBtn}`}
                  onClick={() => handleDelete(equipo.id)}
                >
                  Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
