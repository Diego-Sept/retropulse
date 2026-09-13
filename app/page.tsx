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
    title: 'Colaboración en tiempo real',
    desc: 'Nadie espera su turno: todos escriben sus tarjetas al mismo tiempo, en el mismo tablero. Pensado para equipos distribuidos.',
  },
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
      </svg>
    ),
    title: 'IA que agrupa por temas',
    desc: 'La IA agrupa 40 tarjetas sueltas en 5 temas claros en segundos. Encontrá el patrón real, aunque usen palabras distintas.',
  },
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
        <polyline points="14 2 14 8 20 8" />
      </svg>
    ),
    title: 'El resumen sale solo',
    desc: 'PDF y Markdown con un clic, con el autor de cada tarjeta. Listo para compartir con el equipo o pegar en el planning.',
  },
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="3" width="20" height="14" rx="2" ry="2" /><line x1="8" y1="21" x2="16" y2="21" /><line x1="12" y1="17" x2="12" y2="21" />
      </svg>
    ),
    title: 'Drag & drop simple',
    desc: 'Mové tarjetas entre columnas y agrupalas manualmente con solo arrastrar. Rápido, intuitivo, cero curva de aprendizaje.',
  },
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
    title: 'Datos aislados por empresa',
    desc: 'Cada empresa ve solo lo suyo. Sin acceso cruzado entre equipos, con roles claros para admin y miembros.',
  },
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    ),
    title: 'Pagá como en tu país',
    desc: 'Cobramos con MercadoPago, el método que ya usás todos los días. Tarjeta, débito o plata en cuenta. Sin tarjeta internacional.',
  },
];

const steps = [
  { step: '1', title: 'Creá tu cuenta', desc: 'Registrate en segundos. Sin tarjeta de crédito.' },
  { step: '2', title: 'Armá tu equipo', desc: 'Invitá a tus compañeros y creá tu primera sala.' },
  { step: '3', title: 'Retro en vivo', desc: 'Todos aportan ideas en tiempo real. Arrastrá, agrupá, exportá.' },
  { step: '4', title: 'Mejora continua', desc: 'Exportá resultados, tomá acciones, repetí en el próximo sprint.' },
];

const integrations = [
  { name: 'Jira', icon: '🟦' },
  { name: 'Slack', icon: '💬' },
  { name: 'GitHub', icon: '🐙' },
  { name: 'Notion', icon: '📝' },
];

const testimonials = [
  {
    quote: 'Antes las retros eran una lista de quejas. Con la agrupación IA encontramos el patrón real en 2 minutos.',
    author: 'Scrum Master',
    role: 'Startup fintech',
  },
  {
    quote: 'Lo usamos cada sprint hace 6 meses. El equipo por fin ve el resultado de lo que propone.',
    author: 'Engineering Manager',
    role: 'SaaS B2B',
  },
  {
    quote: 'Exporto el PDF y lo pego en la reunión de planning. Cero trabajo manual.',
    author: 'Team Lead',
    role: 'Agencia digital',
  },
];

const faqs = [
  {
    q: '¿Es gratis?',
    a: 'Sí, el plan Gratuito incluye 1 equipo, salas ilimitadas y 5 agrupaciones con IA por mes. Sin tarjeta.',
  },
  {
    q: '¿Mis datos están seguros?',
    a: 'Cada empresa tiene sus datos aislados (multi-tenant). Sin acceso entre equipos ni entre empresas.',
  },
  {
    q: '¿Necesito instalar algo?',
    a: 'No, funciona 100% en el navegador. Abrí la URL y ya está.',
  },
  {
    q: '¿Sirve para equipos remotos?',
    a: 'Sí, la colaboración es en tiempo real, pensada para equipos distribuidos. Cada uno escribe desde donde esté.',
  },
  {
    q: '¿Puedo exportar los resultados?',
    a: 'Sí, Markdown y PDF con un clic, con el autor de cada tarjeta. Listo para compartir.',
  },
  {
    q: '¿Cómo funciona la agrupación con IA?',
    a: 'Analiza las tarjetas y las agrupa por tema, aunque usen palabras distintas. En segundos tenés los temas claros.',
  },
  {
    q: '¿Cómo pago?',
    a: 'Con MercadoPago. Tarjeta, débito o plata en cuenta. Sin tarjeta internacional.',
  },
];

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'RetroPulse',
  applicationCategory: 'BusinessApplication',
  operatingSystem: 'Web',
  description: 'Retrospectivas Scrum colaborativas en tiempo real con agrupación por IA.',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'ARS',
  },
};

export default function LandingPage() {
  return (
    <div className={styles.landing}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* ── Header ── */}
      <header className={styles.header}>
        <div className={styles.logo}>
          <PulseIcon className={styles.logoIcon} />
          RetroPulse
        </div>
        <nav className={styles.nav}>
          <ThemeToggle />
          <Link href="/login" className={styles.loginBtn}>Iniciar Sesión</Link>
          <Link href="/register" className={styles.registerBtn}>Comenzar gratis</Link>
        </nav>
      </header>

      {/* ── Hero ── */}
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <span className={styles.badge}>Para equipos ágiles que quieren retros que sirvan</span>
          <h1 className={styles.title}>
            Retrospectivas Scrum<br />
            <span className={styles.titleAccent}>que terminan en acción</span>
          </h1>
          <p className={styles.subtitle}>
            Tu equipo escribe las tarjetas en tiempo real, la IA agrupa los temas y en un clic
            exportás acciones concretas. Sin setup, gratis para empezar.
          </p>
          <div className={styles.heroCta}>
            <Link href="/register" className={styles.ctaPrimary}>
              Comenzar gratis
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
              </svg>
            </Link>
            <a href="#como-funciona" className={styles.ctaSecondary}>
              Ver cómo funciona
            </a>
          </div>
          <p className={styles.heroMeta}>
            <span>✅ Gratis para empezar</span>
            <span>✅ Pagá con MercadoPago</span>
            <span>✅ Sin tarjeta internacional</span>
          </p>
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

      {/* ── Social proof bar ── */}
      <section className={styles.socialProof}>
        <div className={styles.socialProofInner}>
          <span className={styles.socialProofItem}><strong>+500</strong> retrospectivas mejoradas</span>
          <span className={styles.socialProofItem}><strong>4 columnas</strong> clásicas de la retro</span>
          <span className={styles.socialProofItem}><strong>100%</strong> en el navegador</span>
          <span className={styles.socialProofItem}><strong>IA</strong> agrupando temas</span>
        </div>
      </section>

      {/* ── Problema → Solución ── */}
      <section className={styles.section}>
        <div className={styles.sectionInner}>
          <h2 className={styles.sectionTitle}>¿Te suena familiar?</h2>
          <p className={styles.sectionDesc}>
            Las retros terminan en un PDF olvidado y las mismas quejas de siempre.
            RetroPulse convierte la retro en una herramienta de mejora continua de verdad.
          </p>
          <div className={styles.problemSolution}>
            <div className={styles.problemCard}>
              <h3>Sin RetroPulse</h3>
              <ul>
                <li>Una persona habla, el resto mira</li>
                <li>Tarjetas sueltas que nadie ordena</li>
                <li>Resultados que nadie vuelve a leer</li>
              </ul>
            </div>
            <div className={styles.solutionCard}>
              <h3>Con RetroPulse</h3>
              <ul>
                <li>Todos escriben en tiempo real</li>
                <li>La IA agrupa por temas en segundos</li>
                <li>Acciones concretas para el próximo sprint</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className={`${styles.section} ${styles.sectionAlt}`}>
        <div className={styles.sectionInner}>
          <h2 className={styles.sectionTitle}>Todo lo que tu equipo necesita para mejorar de verdad</h2>
          <p className={styles.sectionDesc}>Diseñado para equipos ágiles que quieren resultados, no más reuniones.</p>
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

      {/* ── Cómo funciona ── */}
      <section id="como-funciona" className={styles.section}>
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

      {/* ── Integraciones ── */}
      <section className={`${styles.section} ${styles.sectionAlt}`}>
        <div className={styles.sectionInner}>
          <h2 className={styles.sectionTitle}>Conectá RetroPulse con tu stack ágil</h2>
          <p className={styles.sectionDesc}>La retro no vive aislada — es parte del flujo de trabajo del equipo.</p>
          <div className={styles.integrations}>
            {integrations.map((i) => (
              <div key={i.name} className={styles.integration}>
                <span className={styles.integrationIcon}>{i.icon}</span>
                <span className={styles.integrationName}>{i.name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonios ── */}
      <section className={styles.section}>
        <div className={styles.sectionInner}>
          <h2 className={styles.sectionTitle}>Equipos que ya mejoran sus retros</h2>
          <div className={styles.testimonials}>
            {testimonials.map((t) => (
              <div key={t.author} className={styles.testimonial}>
                <p className={styles.testimonialQuote}>"{t.quote}"</p>
                <div className={styles.testimonialAuthor}>
                  <strong>{t.author}</strong>
                  <span>{t.role}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Plans ── */}
      <section className={`${styles.section} ${styles.sectionAlt}`}>
        <div className={styles.sectionInner}>
          <h2 className={styles.sectionTitle}>Planes simples</h2>
          <p className={styles.sectionDesc}>Empezá gratis. Escalá cuando quieras. Pagá con MercadoPago.</p>
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
              <h3 className={styles.planName}>Small Team</h3>
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
              <Link href="/register" className={`${styles.planBtn} ${styles.planBtnPrimary}`}>Elegir Small Team</Link>
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
                <li>Soporte prioritario</li>
              </ul>
              <Link href="/register" className={styles.planBtn}>Elegir Enterprise</Link>
            </div>
          </div>
          <p className={styles.planPaymentNote}>💰 Pagá con MercadoPago — tarjeta, débito o plata en cuenta. El método que ya usás.</p>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className={styles.section}>
        <div className={styles.sectionInner}>
          <h2 className={styles.sectionTitle}>Preguntas frecuentes</h2>
          <div className={styles.faqs}>
            {faqs.map((f) => (
              <details key={f.q} className={styles.faq}>
                <summary className={styles.faqQ}>{f.q}</summary>
                <p className={styles.faqA}>{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className={`${styles.section} ${styles.sectionCta}`}>
        <div className={styles.sectionInner}>
          <h2 className={styles.ctaTitle}>Dale ritmo a tus retrospectivas</h2>
          <p className={styles.ctaDesc}>Gratis para empezar. Sin tarjeta, sin compromiso. Pagá con MercadoPago cuando quieras escalar.</p>
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
          <nav className={styles.footerNav}>
            <Link href="/login">Iniciar sesión</Link>
            <Link href="/register">Registrarse</Link>
            <a href="#como-funciona">Cómo funciona</a>
          </nav>
          <p className={styles.footerCopy}>© {new Date().getFullYear()} RetroPulse. Todos los derechos reservados.</p>
        </div>
      </footer>
    </div>
  );
}