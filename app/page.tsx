import Link from 'next/link';
import { ThemeToggle } from '@/components/ThemeToggle';
import styles from './landing.module.css';

const PulseIcon = ({ className }: { className?: string }) => (
  <svg className={className} width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
  </svg>
);

const features = [
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
      </svg>
    ),
    title: 'Tiempo Real',
    desc: 'Las tarjetas aparecen al instante para todo el equipo gracias a Supabase Realtime. Sin refrescar, sin demoras.',
  },
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
      </svg>
    ),
    title: 'Agrupación por IA',
    desc: 'Clustering semántico automático. La IA encuentra patrones y temas comunes aunque usen palabras distintas.',
  },
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
        <polyline points="14 2 14 8 20 8" />
      </svg>
    ),
    title: 'Exportación Simple',
    desc: 'Markdown y PDF con un clic. Resultados organizados por columnas y grupos, listos para compartir.',
  },
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="3" width="20" height="14" rx="2" ry="2" /><line x1="8" y1="21" x2="16" y2="21" /><line x1="12" y1="17" x2="12" y2="21" />
      </svg>
    ),
    title: 'Drag & Drop',
    desc: 'Mové tarjetas entre columnas y agrupalas manualmente con solo arrastrar. Rápido e intuitivo.',
  },
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
    title: 'Multi-tenant',
    desc: 'Cada empresa con sus equipos, salas y miembros. Datos aislados, seguridad garantizada.',
  },
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    ),
    title: 'Planes Flexibles',
    desc: 'Gratuito para empezar. Escalá cuando lo necesites. Sin sorpresas, sin compromisos.',
  },
];

const steps = [
  { step: '1', title: 'Creá tu cuenta', desc: 'Registrate en segundos. Sin tarjeta de crédito.' },
  { step: '2', title: 'Armá tu equipo', desc: 'Invitá a tus compañeros y creá tu primera sala.' },
  { step: '3', title: 'Retro en vivo', desc: 'Todos aportan ideas en tiempo real. Arrastrá, agrupá, exportá.' },
  { step: '4', title: 'Mejora continua', desc: 'Exportá resultados, tomá acciones, repetí en el próximo sprint.' },
];

export default function LandingPage() {
  return (
    <div className={styles.landing}>
      {/* ── Header ── */}
      <header className={styles.header}>
        <div className={styles.logo}>
          <PulseIcon className={styles.logoIcon} />
          RetroPulse
        </div>
        <nav className={styles.nav}>
          <ThemeToggle />
          <Link href="/login" className={styles.loginBtn}>Iniciar Sesión</Link>
          <Link href="/register" className={styles.registerBtn}>Crear cuenta</Link>
        </nav>
      </header>

      {/* ── Hero ── */}
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <span className={styles.badge}>🚀 100% gratuito · Sin tarjeta</span>
          <h1 className={styles.title}>
            Retrospectivas Scrum<br />
            <span className={styles.titleAccent}>en tiempo real</span>
          </h1>
          <p className={styles.subtitle}>
            Colaborá con tu equipo, agrupá ideas con IA y exportá resultados al instante.
            Multi-tenant, sin configuraciones complejas.
          </p>
          <div className={styles.heroCta}>
            <Link href="/register" className={styles.ctaPrimary}>
              Comenzar gratis
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
              </svg>
            </Link>
            <Link href="/login" className={styles.ctaSecondary}>
              Ver demo
            </Link>
          </div>
        </div>
        <div className={styles.heroVisual}>
          <div className={styles.mockup}>
            <div className={styles.mockupBar}>
              <span /><span /><span />
            </div>
            <div className={styles.mockupColumns}>
              <div className={styles.mockupCol}>
                <div className={styles.mockupCard} style={{ '--card-color': '#10b981' } as React.CSSProperties} />
                <div className={styles.mockupCard} style={{ '--card-color': '#10b981' } as React.CSSProperties} />
                <div className={styles.mockupCard} style={{ '--card-color': '#10b981' } as React.CSSProperties} />
              </div>
              <div className={styles.mockupCol}>
                <div className={styles.mockupCard} style={{ '--card-color': '#ef4444' } as React.CSSProperties} />
                <div className={styles.mockupCard} style={{ '--card-color': '#ef4444' } as React.CSSProperties} />
              </div>
              <div className={styles.mockupCol}>
                <div className={styles.mockupCard} style={{ '--card-color': '#f59e0b' } as React.CSSProperties} />
                <div className={styles.mockupCard} style={{ '--card-color': '#f59e0b' } as React.CSSProperties} />
                <div className={styles.mockupCard} style={{ '--card-color': '#f59e0b' } as React.CSSProperties} />
              </div>
              <div className={styles.mockupCol}>
                <div className={styles.mockupCard} style={{ '--card-color': '#3b82f6' } as React.CSSProperties} />
                <div className={styles.mockupCard} style={{ '--card-color': '#3b82f6' } as React.CSSProperties} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className={styles.section}>
        <div className={styles.sectionInner}>
          <h2 className={styles.sectionTitle}>Cómo funciona</h2>
          <p className={styles.sectionDesc}>En 4 pasos tenés tu retrospectiva lista.</p>
          <div className={styles.steps}>
            {steps.map((s) => (
              <div key={s.step} className={styles.step}>
                <div className={styles.stepNum}>{s.step}</div>
                <h3 className={styles.stepTitle}>{s.title}</h3>
                <p className={styles.stepDesc}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className={`${styles.section} ${styles.sectionAlt}`}>
        <div className={styles.sectionInner}>
          <h2 className={styles.sectionTitle}>Todo lo que necesitás</h2>
          <p className={styles.sectionDesc}>Diseñado para equipos ágiles que quieren mejorar de verdad.</p>
          <div className={styles.features}>
            {features.map((f) => (
              <div key={f.title} className={styles.feature}>
                <div className={styles.featureIcon}>{f.icon}</div>
                <h3 className={styles.featureTitle}>{f.title}</h3>
                <p className={styles.featureDesc}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Plans ── */}
      <section className={styles.section}>
        <div className={styles.sectionInner}>
          <h2 className={styles.sectionTitle}>Planes simples</h2>
          <p className={styles.sectionDesc}>Empezá gratis. Escalá cuando quieras.</p>
          <div className={styles.plans}>
            <div className={styles.plan}>
              <h3 className={styles.planName}>Gratuito</h3>
              <div className={styles.planPrice}>
                <span className={styles.planAmount}>$0</span>
                <span className={styles.planPeriod}>/mes</span>
              </div>
              <ul className={styles.planFeatures}>
                <li>1 equipo</li>
                <li>Salas ilimitadas</li>
                <li>Exportación MD y PDF</li>
                <li>Agrupación IA (5/mes)</li>
              </ul>
              <Link href="/register" className={styles.planBtn}>Empezar gratis</Link>
            </div>
            <div className={`${styles.plan} ${styles.planFeatured}`}>
              <span className={styles.planBadge}>Popular</span>
              <h3 className={styles.planName}>Pro</h3>
              <div className={styles.planPrice}>
                <span className={styles.planAmount}>$20.000</span>
                <span className={styles.planPeriod}>/mes</span>
              </div>
              <ul className={styles.planFeatures}>
                <li>1 equipo</li>
                <li>Salas ilimitadas</li>
                <li>Exportación MD y PDF</li>
                <li>Agrupación IA (30/mes)</li>
              </ul>
              <Link href="/register" className={`${styles.planBtn} ${styles.planBtnPrimary}`}>Elegir Pro</Link>
            </div>
            <div className={styles.plan}>
              <h3 className={styles.planName}>Enterprise</h3>
              <div className={styles.planPrice}>
                <span className={styles.planAmount}>$100.000</span>
                <span className={styles.planPeriod}>/mes</span>
              </div>
              <ul className={styles.planFeatures}>
                <li>10 equipos</li>
                <li>Salas ilimitadas</li>
                <li>Agrupación IA (500/mes)</li>
                <li>SSO / SAML</li>
                <li>Soporte prioritario</li>
                <li>Auditoría de retrospectivas</li>
              </ul>
              <Link href="/register" className={styles.planBtn}>Contactar</Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className={`${styles.section} ${styles.sectionCta}`}>
        <div className={styles.sectionInner}>
          <h2 className={styles.ctaTitle}>Dale ritmo a tus retrospectivas</h2>
          <p className={styles.ctaDesc}>Gratis para empezar. Sin tarjeta, sin compromiso.</p>
          <Link href="/register" className={styles.ctaPrimary}>
            Crear cuenta gratis
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
            </svg>
          </Link>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className={styles.footer}>
        <div className={styles.footerInner}>
          <div className={styles.footerBrand}>
            <PulseIcon className={styles.footerIcon} />
            <span>RetroPulse</span>
          </div>
          <p className={styles.footerCopy}>© {new Date().getFullYear()} RetroPulse. Todos los derechos reservados.</p>
        </div>
      </footer>
    </div>
  );
}
