# RetroPulse — Brief de Renovación de Landing

> Documento para entregar a una IA (o a un dev) para renovar la landing page de RetroPulse con foco en **SEO + conversión + diseño B2B SaaS**.
> Proyecto: `retro-scrum` (RetroPulse) — Next.js 14, App Router, CSS Modules + Design Tokens.

---

## 1. Contexto del proyecto

**Qué es RetroPulse:** sistema de retrospectivas Scrum colaborativas en tiempo real. Equipos distribuidos crean tarjetas en un tablero de 4 columnas, las agrupan con IA y exportan resultados (Markdown/PDF).

**Stack relevante para la landing:**
| Capa | Tech |
|------|------|
| Framework | Next.js 14 (App Router), React 18, TypeScript |
| Estilos | CSS Modules + CSS Custom Properties (design tokens en `app/globals.css`) |
| Tipografía | Inter (`next/font/google`) |
| Tema | Claro/Oscuro vía `lib/theme-context.tsx` + `components/ThemeToggle.tsx` |
| Auth | JWT custom (jose, HS256) + bcrypt |
| IA | OpenCode Go (DeepSeek V4 Flash / MiMo V2.5) |
| Pagos | MercadoPago Checkout Pro + Webhooks (precios en ARS) |

**Las 4 columnas del tablero (usarlas en el mockup y en el copy):**
1. ¿Qué hicimos bien?
2. ¿Qué hicimos mal?
3. Ideas para mejorar
4. Acciones a tomar

**Archivos que se tocan:**
- `app/page.tsx` — la landing (hero, features, planes, CTA, footer)
- `app/layout.tsx` — metadata + SEO técnico
- `app/landing.module.css` — estilos de la landing
- `app/globals.css` — design tokens (NO tocar los tokens, solo usarlos)

---

## 2. Objetivos de la renovación

1. **SEO**: rankear en español/LATAM para keywords de retrospectivas ágiles (hueco real de competencia).
2. **Conversión**: de visitante → registro gratis → upgrade. Landing orientada a BENEFICIOS, no a features.
3. **Confianza B2B**: social proof, integraciones, FAQ. El comprador es un Scrum Master / team lead que decide por su equipo.
4. **Mantener identidad**: conservar los design tokens, el tema claro/oscuro y el logo (pulso).

---

## 3. Diagnóstico del estado actual (qué falta / qué está mal)

| Problema | Detalle |
|----------|---------|
| ❌ **SEO casi nulo** | `metadata` solo tiene title "RetroPulse" y una descripción corta. Sin keywords, sin OpenGraph, sin structured data, sin sitemap/robots |
| ❌ **Sin social proof** | No hay testimonios, logos de clientes, ni contador de usuarios/retros |
| ❌ **Sin FAQ** | Los Scrum Masters tienen objeciones (seguridad, precio, privacidad) sin respuesta |
| ❌ **Sin integraciones** | No menciona Jira/Slack/GitHub (los compradores B2B preguntan por esto) |
| ❌ **"Ver demo" roto** | El botón apunta a `/login`, no a una demo real |
| ❌ **Copy genérico** | El hero dice "Colaborá con tu equipo..." (genérico, no vende el dolor) |
| ❌ **Badge débil** | "🚀 100% gratuito" — no comunica valor, solo precio |
| ⚠️ **Nombre de plan inconsistente** | README lo llama "Small Team", la landing dice "Pro". Precios y límites YA coinciden (ARS $20.000/$100.000, IA 5/30/500). Unificar el nombre |
| ✅ Lo que está bien | Estructura base (hero → cómo funciona → features → planes → CTA), design tokens, tema claro/oscuro, mockup visual del tablero |

---

## 4. SEO — técnico

### 4.1 Metadata (`app/layout.tsx`)

```ts
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
```

### 4.2 Structured data (JSON-LD)

Agregar en `app/page.tsx` (o un `<script type="application/ld+json">`):

```json
{
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "RetroPulse",
  "applicationCategory": "BusinessApplication",
  "operatingSystem": "Web",
  "description": "Retrospectivas Scrum colaborativas en tiempo real con agrupación por IA.",
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "ARS"
  }
}
```

### 4.3 Sitemap + robots

- Agregar `app/sitemap.ts` (Next.js genera `sitemap.xml` automáticamente) con las rutas públicas: `/`, `/login`, `/register`.
- Agregar `app/robots.ts` que permita todo e indexe el sitemap.

---

## 5. SEO — on-page (keywords y headings)

**Keyword principal:** `retrospectiva scrum` (y variantes: `retrospectiva ágil`, `herramienta de retrospectiva`).

**Keyword secundaria:** `retrospectiva online`, `retro sprint`, `mejora continua equipo`.

**Reglas de uso:**
- H1 del hero debe contener "Retrospectivas Scrum" (ya lo tiene, mantener)
- H2 de secciones: usar keywords secundarias naturales ("Cómo funciona", "Todo lo que necesitás" → cambiar a títulos con más keyword)
- Un párrafo del hero o una sección debe mencionar "herramienta de retrospectiva" textual
- `alt` descriptivo en imágenes (si se agregan screenshots reales)
- Los textos de los botones deben ser descriptivos (no "Ver demo" genérico, mejor "Probar gratis")

---

## 6. Estructura objetivo de la landing (B2B SaaS)

Orden de secciones recomendado (la IA debe reorganizar/añadir):

1. **Header** — logo + nav + "Iniciar sesión" + CTA "Comenzar gratis"
2. **Hero** — headline de valor + subheadline + CTA + mockup del tablero + micro social proof ("Usado por X equipos")
3. **Barra de social proof** — logos de clientes o contadores ("+500 retros realizadas", "equipos en LATAM")
4. **Problema → Solución** — el dolor (retros aburridas que no generan acción) → cómo RetroPulse lo resuelve
5. **Features** — orientadas a BENEFICIO, no a descripción técnica (ver sección 7)
6. **Cómo funciona** — los 4 pasos (ya existe, mantener y pulir)
7. **Integraciones** — Jira, Slack, GitHub (NUEVA)
8. **Testimonios / social proof** — 3 testimonios de Scrum Masters (NUEVA)
9. **Planes** — la tabla de precios (ya existe, actualizar según decisión de moneda)
10. **FAQ** — 5-6 preguntas que eliminan objeciones (NUEVA)
11. **CTA final** — "Dale ritmo a tus retrospectivas" (ya existe, mantener)
12. **Footer** — marca + copyright + links (privacidad, términos, contacto)

---

## 7. Copy de venta — sugerencias concretas

### Hero
- **Badge actual** (débil): `🚀 100% gratuito · Sin tarjeta`
- **Sugerencia**: `Para equipos ágiles que quieren retros que sirvan` o `+500 retrospectivas mejoradas`

- **Headline actual**: "Retrospectivas Scrum en tiempo real"
- **Sugerencia (beneficio)**: "Retrospectivas que terminan en acción, no en un PDF olvidado"
  - Mantener "Retrospectivas Scrum" en el H1 por SEO, pero el acento de valor va en el subheadline

- **Subheadline actual**: "Colaborá con tu equipo, agrupá ideas con IA y exportá resultados al instante. Multi-tenant, sin configuraciones complejas."
- **Sugerencia**: "Tu equipo escribe las tarjetas en tiempo real, la IA agrupa los temas y en un clic exportás acciones concretas. Sin setup, gratis para empezar."
  - (Quitar "Multi-tenant" del subheadline — es jerga técnica, no vende)

### Features (reescribir con beneficio primero)
| Actual (descripción) | Mejor (beneficio) |
|----------------------|-------------------|
| "Las tarjetas aparecen al instante... Supabase Realtime" | "Nadie espera su turno: todos escriben al mismo tiempo" (quitar "Supabase" — jerga técnica) |
| "Clustering semántico automático. La IA encuentra patrones..." | "La IA agrupa 40 tarjetas sueltas en 5 temas claros en segundos" |
| "Markdown y PDF con un clic" | "El resumen de la retro sale solo: PDF y Markdown para compartir con el equipo" |
| "Multi-tenant" | (quitar o reescribir: "Datos aislados por empresa. Cada equipo ve lo suyo, nada más") |

### CTA
- Botón primario: `Comenzar gratis` (mantener)
- Botón secundario "Ver demo": **o lo conectás a una demo real, o lo cambiás por** `Ver cómo funciona` (scroll a la sección de pasos)

### Confianza de pago (MercadoPago) — señal clave para LATAM
- Mencionar en el hero o en los planes: **"Pagá con MercadoPago, el método que ya usás"**
- Para el comprador LATAM, saber que paga con MercadoPago (no tarjeta internacional) elimina una objeción enorme
- Es tu diferenciador local vs competidores que cobran en USD con Stripe

---

## 8. Secciones nuevas — contenido a crear

### Integraciones (NUEVA)
- Mostrar logos/íconos de Jira, Slack, GitHub con texto tipo: "Conectá RetroPulse con tu stack ágil"
- Aunque la integración real sea futura, el POSICIONAMIENTO importa (los compradores B2B preguntan)

### Testimonios (NUEVA)
- 3 testimonios de Scrum Masters / team leads:
  - "Antes las retros eran una lista de quejas. Con la agrupación IA encontramos el patrón real en 2 minutos." — Scrum Master, startup fintech
  - "Lo usamos cada sprint hace 6 meses. El equipo por fin ve el resultado de lo que propone." — Engineering Manager
  - "Exporto el PDF y lo pego en la reunión de planning. Cero trabajo manual." — Team Lead

### FAQ (NUEVA) — preguntas que eliminan objeciones
1. ¿Es gratis? — "Sí, el plan Gratuito incluye 1 equipo, salas ilimitadas y 5 agrupaciones con IA por mes. Sin tarjeta."
2. ¿Mis datos están seguros? — "Cada empresa tiene sus datos aislados (multi-tenant). Sin acceso entre equipos."
3. ¿Necesito instalar algo? — "No, funciona 100% en el navegador."
4. ¿Sirve para equipos remotos? — "Sí, la colaboración es en tiempo real, pensada para equipos distribuidos."
5. ¿Puedo exportar los resultados? — "Sí, Markdown y PDF con un clic, con el autor de cada tarjeta."
6. ¿Cómo funciona la agrupación con IA? — "Analiza las tarjetas y las agrupa por tema, aunque usen palabras distintas."
7. ¿Cómo pago? — "Con MercadoPago. Tarjeta, débito o plata en cuenta. Sin tarjeta internacional."

---

## 9. Diseño y UX — qué mantener, qué mejorar

### MANTENER (identidad)
- Design tokens de `app/globals.css` (colores, radios, espaciados)
- Tema claro/oscuro con `ThemeToggle`
- Logo del pulso (PulseIcon)
- Tipografía Inter

### MEJORAR
- **Jerarquía visual**: el hero debe tener UN CTA dominante (hoy hay 2 botones con igual peso)
- **Respiración**: más espacio entre secciones (B2B valora lo limpio)
- **Mockup real**: reemplazar el mockup CSS de tarjetas por un **screenshot real del tablero** (más credibilidad). Si no hay screenshot, mantener el mockup pero más pulido
- **Consistencia de planes**: unificar el nombre del plan pago ("Small Team" vs "Pro") y reflejar los límites reales (IA 5/30/500)
- **Accesibilidad**: contrastes AA en texto, `aria-label` en botones de icono

---

## 10. Posicionamiento de mercado (YA DECIDIDO: LATAM con MercadoPago)

El proyecto ya tiene una decisión tomada y es coherente: **vende en pesos argentinos con MercadoPago Checkout Pro**. No hay que elegir moneda — ya está resuelto.

**Lo que confirma la dirección LATAM:**
- Precios en ARS: Small Team $20.000/mes, Enterprise $100.000/mes (~$20 y ~$100 USD)
- Pago con MercadoPago (el método que todo comprador local ya usa — gran ventaja de confianza)
- SEO en español rioplatense (la landing ya habla a equipos de LATAM)

**Lo que SÍ hay que pulir antes de renovar:**
1. **Nombre del plan**: README dice "Small Team", la landing dice "Pro". Unificar (sugerencia: "Pro" es más claro para el público local).
2. **Límites reales en la landing**: asegurar que coincidan con la DB (IA 5/30/500, equipos 1/1/10).
3. **Mencionar MercadoPago en la landing** como señal de confianza: "Pagá con MercadoPago".

**Nota de pricing B2B (para evaluar más adelante):** $20.000 ARS (~$20 USD) por empresa entera sigue siendo barato para B2B (competidores cobran $10-30 POR USUARIO). Está bien para arrancar y validar, pero el camino de subida es por ahí.

---

## 11. Checklist de verificación (para cerrar la renovación)

- [ ] `metadata` en `layout.tsx` con title descriptivo + description con keyword + OpenGraph + canonical
- [ ] Structured data (JSON-LD) de SoftwareApplication en la landing
- [ ] `sitemap.ts` y `robots.ts` generados
- [ ] H1 contiene "Retrospectivas Scrum"
- [ ] Social proof agregado (testimonios + contador)
- [ ] Sección de integraciones agregada
- [ ] FAQ con 5-6 preguntas
- [ ] Copy de features reescrito (beneficio, sin jerga técnica)
- [ ] "Ver demo" arreglado o reemplazado
- [ ] Nombre de plan unificado (Small Team vs Pro) y límites reales (IA 5/30/500)
- [ ] MercadoPago mencionado como señal de confianza en la landing
- [ ] Tema claro/oscuro sigue funcionando
- [ ] Design tokens respetados (no inventar colores nuevos fuera del sistema)
- [ ] Responsive: probar en mobile (los Scrum Masters entran desde el celu)

---

## 12. Instrucciones para la IA

> "Sos un diseñador de landing B2B SaaS senior. Renová la landing de RetroPulse siguiendo este brief. Trabajá SOLO sobre `app/page.tsx`, `app/layout.tsx`, `app/landing.module.css` y los archivos de SEO (`sitemap.ts`, `robots.ts`). NO modifiques los design tokens de `globals.css`, ni la lógica de auth, ni el dashboard. Mantené el idioma español rioplatense y el tono cálido pero profesional. Reorganizá las secciones según el punto 6, reescribí el copy según el punto 7, y agregá las secciones nuevas del punto 8. El resultado debe verse como un SaaS serio, no como un proyecto de portafolio."
