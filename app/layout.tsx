import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import { AuthProvider } from '@/contexts/AuthContext';
import { ThemeProvider } from '@/lib/theme-context';
import '@/app/globals.css';
import '@/styles/print.css';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'RetroPulse — Retrospectivas Scrum colaborativas en tiempo real',
  description:
    'Herramienta de retrospectiva ágil para equipos Scrum. Tablero en tiempo real, agrupación de ideas con IA y exportación en PDF. Gratis para empezar.',
  keywords: [
    'retrospectiva scrum', 'retrospectiva ágil', 'herramienta retrospectiva',
    'tablero retrospectiva', 'retro sprint', 'scrum retrospective español',
    'retrospectiva online', 'mejora continua equipo',
  ],
  openGraph: {
    title: 'RetroPulse — Retrospectivas Scrum en tiempo real',
    description: 'Colaborá, agrupá ideas con IA y exportá resultados. Gratis para empezar.',
    type: 'website',
    locale: 'es_AR',
    siteName: 'RetroPulse',
  },
  robots: { index: true, follow: true },
  alternates: { canonical: '/' },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={inter.variable}>
      <body>
        <ThemeProvider>
          <AuthProvider>
            {children}
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
