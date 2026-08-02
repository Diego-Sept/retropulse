'use client';
import { useEffect, useState } from 'react';
import { useAuthStore } from '@/stores/auth-store';
import styles from './usuarios.module.css';

interface UsuarioInfo {
  id: string;
  email: string;
  nombre: string;
  rol_global: 'super_admin' | 'empresa_admin' | 'member';
  created_at: string;
}

export default function UsuariosPage() {
  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.rol_global === 'empresa_admin' || user?.rol_global === 'super_admin';

  const [usuarios, setUsuarios] = useState<UsuarioInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Create user form
  const [showCreate, setShowCreate] = useState(false);
  const [formNombre, setFormNombre] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formRol, setFormRol] = useState<'member' | 'empresa_admin'>('member');
  const [creating, setCreating] = useState(false);

  // Invite form
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRol, setInviteRol] = useState<'member' | 'empresa_admin'>('member');
  const [inviting, setInviting] = useState(false);
  const [inviteLink, setInviteLink] = useState<string | null>(null);

  const fetchUsuarios = async () => {
    try {
      const res = await fetch('/api/admin/usuarios');
      if (!res.ok) throw new Error('Error al cargar');
      const data = await res.json();
      setUsuarios(data.usuarios || []);
    } catch {
      setError('Error al cargar usuarios');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsuarios(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formNombre.trim() || !formEmail.trim() || !formPassword.trim()) return;
    setCreating(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/usuarios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formEmail.trim(), password: formPassword, nombre: formNombre.trim(), rol_global: formRol }),
      });
      if (!res.ok) { const data = await res.json(); throw new Error(data.error || 'Error al crear'); }
      setFormNombre(''); setFormEmail(''); setFormPassword(''); setFormRol('member'); setShowCreate(false);
      await fetchUsuarios();
    } catch (err: any) { setError(err.message); } finally { setCreating(false); }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    setInviting(true);
    setError(null);
    setInviteLink(null);
    try {
      const res = await fetch('/api/admin/invitaciones-empresa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: inviteEmail.trim(), rol: inviteRol }),
      });
      if (!res.ok) { const data = await res.json(); throw new Error(data.error || 'Error al crear'); }
      const data = await res.json();
      setInviteLink(data.link);
      setInviteEmail('');
    } catch (err: any) { setError(err.message); } finally { setInviting(false); }
  };

  const rolLabel = (rol: string) => rol === 'empresa_admin' ? 'Administrador' : rol === 'super_admin' ? 'Super Admin' : 'Miembro';

  if (!isAdmin) {
    return <div className={styles.container}><div className={styles.empty}>Solo los administradores pueden gestionar usuarios.</div></div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Usuarios</h1>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className={styles.inviteBtn} onClick={() => { setShowInvite(!showInvite); setShowCreate(false); }}>
            {showInvite ? 'Cancelar' : 'Invitar a empresa'}
          </button>
          <button className={styles.createBtn} onClick={() => { setShowCreate(!showCreate); setShowInvite(false); }}>
            {showCreate ? 'Cancelar' : 'Nuevo usuario'}
          </button>
        </div>
      </div>

      {error && <div className={styles.error}>{error}<button onClick={() => setError(null)} className={styles.errorClose}>×</button></div>}

      {showCreate && (
        <form onSubmit={handleCreate} className={styles.createForm}>
          <input type="text" value={formNombre} onChange={(e) => setFormNombre(e.target.value)} placeholder="Nombre completo" className={styles.input} disabled={creating} autoFocus required />
          <input type="email" value={formEmail} onChange={(e) => setFormEmail(e.target.value)} placeholder="Email" className={styles.input} disabled={creating} required />
          <input type="password" value={formPassword} onChange={(e) => setFormPassword(e.target.value)} placeholder="Contraseña (mín. 6)" className={styles.input} disabled={creating} required minLength={6} />
          <select value={formRol} onChange={(e) => setFormRol(e.target.value as any)} className={styles.select} disabled={creating}>
            <option value="member">Miembro</option>
            <option value="empresa_admin">Administrador</option>
          </select>
          <button type="submit" className={styles.submitBtn} disabled={creating || !formNombre.trim() || !formEmail.trim() || formPassword.length < 6}>
            {creating ? 'Creando...' : 'Crear usuario'}
          </button>
        </form>
      )}

      {showInvite && (
        <div>
          {inviteLink ? (
            <div className={styles.inviteSuccess}>
              <p>Invitación creada. Compartí este link:</p>
              <input type="text" value={inviteLink} readOnly className={styles.inviteLinkInput} onFocus={(e) => e.target.select()} />
              <button onClick={() => { setShowInvite(false); setInviteLink(null); }} className={styles.createBtn}>Listo</button>
            </div>
          ) : (
            <form onSubmit={handleInvite} className={styles.createForm}>
              <input type="email" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} placeholder="Email del invitado" className={styles.input} disabled={inviting} autoFocus required />
              <select value={inviteRol} onChange={(e) => setInviteRol(e.target.value as any)} className={styles.select} disabled={inviting}>
                <option value="member">Miembro</option>
                <option value="empresa_admin">Administrador</option>
              </select>
              <button type="submit" className={styles.submitBtn} disabled={inviting || !inviteEmail.trim()}>
                {inviting ? 'Creando...' : 'Crear invitación'}
              </button>
            </form>
          )}
        </div>
      )}

      {loading ? (
        <div className={styles.loading}>Cargando usuarios...</div>
      ) : usuarios.length === 0 ? (
        <div className={styles.empty}><p>No hay usuarios en tu empresa.</p></div>
      ) : (
        <div className={styles.table}>
          <div className={styles.tableHeader}><span>Nombre</span><span>Email</span><span>Rol</span><span>Fecha</span></div>
          {usuarios.map((u) => (
            <div key={u.id} className={styles.tableRow}>
              <span className={styles.cellName}>{u.nombre}</span>
              <span className={styles.cellEmail}>{u.email}</span>
              <span className={`${styles.cellRol} ${u.rol_global === 'empresa_admin' ? styles.rolAdmin : ''}`}>{rolLabel(u.rol_global)}</span>
              <span className={styles.cellDate}>{new Date(u.created_at).toLocaleDateString('es-AR')}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
