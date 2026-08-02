'use client';
import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/stores/auth-store';
import { UsageIndicator } from '@/components/UsageIndicator';
import { ThemeToggle } from '@/components/ThemeToggle';
import { LayoutDashboard, Users, Settings, LogOut, Activity, ListTodo, UserPlus } from 'lucide-react';
import styles from './dashboard.module.css';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isLoading } = useAuthStore();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [isLoading, user, router]);

  if (isLoading) return <div className={styles.loading}>Cargando...</div>;
  if (!user) return null;

  const handleLogout = () => {
    useAuthStore.getState().logout();
    router.push('/login');
  };

  const links = [
    { href: '/dashboard', label: 'Inicio', icon: LayoutDashboard },
    { href: '/dashboard/equipos', label: 'Equipos', icon: Users },
    { href: '/dashboard/salas', label: 'Salas', icon: ListTodo },
    { href: '/dashboard/usuarios', label: 'Usuarios', icon: UserPlus },
    { href: '/dashboard/configuracion', label: 'Configuración', icon: Settings },
  ];

  return (
    <div className={styles.layout}>
      <aside className={styles.sidebar}>
        <div className={styles.logo}>
          <Activity size={22} className={styles.logoIcon} />
          RetroPulse
        </div>
        <nav className={styles.nav}>
          {links.map(link => {
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`${styles.link} ${pathname === link.href ? styles.active : ''}`}
              >
                <Icon size={20} className={styles.icon} />
                {link.label}
              </Link>
            );
          })}
        </nav>
        <div className={styles.userInfo}>
          <div className={styles.userRow}>
            <div className={styles.userDetails}>
              <span className={styles.userName}>{user.nombre}</span>
              <span className={styles.userEmail}>{user.email}</span>
            </div>
            <ThemeToggle />
          </div>
          <UsageIndicator />
          <button onClick={handleLogout} className={styles.logoutBtn}>
            <LogOut size={16} className={styles.icon} />
            Cerrar sesión
          </button>
        </div>
      </aside>
      <main className={styles.main}>{children}</main>
    </div>
  );
}
