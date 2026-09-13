# RetroPulse

**Retrospectivas Scrum colaborativas en tiempo real.**

Sistema de gestión de retrospectivas ágiles donde equipos distribuidos pueden colaborar en tiempo real, agrupar ideas con IA y exportar resultados. Construido con Next.js, Supabase, TypeScript y design system tokens.

---

## Tabla de contenidos

- [Stack tecnológico](#stack-tecnológico)
- [Arquitectura](#arquitectura)
- [Setup local](#setup-local)
- [Variables de entorno](#variables-de-entorno)
- [Esquema de base de datos](#esquema-de-base-de-datos)
- [Planes y límites](#planes-y-límites)
- [API endpoints](#api-endpoints)
- [Pagos con MercadoPago](#pagos-con-mercadopago)
- [Features](#features)
- [Deploy](#deploy)
- [Licencia](#licencia)

---

## Stack tecnológico

| Capa | Tecnología |
|------|-----------|
| **Frontend** | Next.js 14 (App Router), React 18, TypeScript |
| **Estilos** | CSS Modules + Custom Properties (Design System Tokens) |
| **Backend** | Next.js API Routes (serverless) |
| **Base de datos** | Supabase (PostgreSQL) + Realtime |
| **Auth** | JWT custom (jose, HS256) |
| **AI** | OpenCode Go (DeepSeek V4 Flash / MiMo V2.5) |
| **Pagos** | MercadoPago Checkout Pro + Webhooks |
| **Estado** | Zustand (client-side) |
| **Iconos** | Lucide React |
| **Email** | Nodemailer (SMTP) |

---

## Arquitectura

```
app/
├── api/                    # API Routes (Next.js)
│   ├── auth/               # Login, logout, register, reset-password
│   ├── equipos/            # CRUD equipos + miembros + invitar
│   ├── salas/              # CRUD salas + tarjetas
│   ├── grupos/             # Agrupación manual de tarjetas
│   ├── cluster/            # Clustering IA (OpenCode Go)
│   ├── checkout/           # Suscripción MercadoPago
│   ├── webhooks/           # Notificaciones MercadoPago
│   ├── invitaciones/       # Invitaciones a empresa y equipo
│   ├── uso-ia/             # Contador de uso IA por plan
│   └── admin/              # Admin: usuarios, invitaciones empresa
├── dashboard/              # Panel principal
│   ├── page.tsx            # Home (lista de salas)
│   ├── equipos/            # Gestión de equipos
│   ├── salas/              # Todas las salas de tus equipos
│   ├── sala/[id]/          # Tablero de retrospectiva
│   ├── usuarios/           # Gestión de usuarios (admin)
│   └── configuracion/      # Plan, límites, upgrade
├── invitaciones/           # Páginas de aceptación (empresa/equipo)
├── login/                  # Página de login
├── register/               # Registro (soporta invitación)
├── reset-password/         # Recuperación de contraseña
├── not-found.tsx           # Custom 404
└── page.tsx                # Landing page pública

components/
├── board/                  # Componentes del tablero
│   ├── Board.tsx           # Contenedor 4 columnas
│   ├── Column.tsx          # Columna individual
│   ├── Card.tsx            # Tarjeta arrastrable (con autor)
│   ├── CardForm.tsx        # Formulario para crear tarjetas
│   ├── ClusterButton.tsx   # Botón IA clustering
│   ├── GroupHeader.tsx     # Header de grupo
│   └── ExportMenu.tsx      # Exportación MD/PDF
├── ThemeToggle.tsx         # Toggle claro/oscuro
├── UsageIndicator.tsx      # Barra de uso IA
└── AuthGuard.tsx           # HOC de protección

lib/
├── supabase.ts             # Cliente browser
├── supabase-server.ts      # Cliente server-side
├── auth.ts                 # JWT sign/verify + bcrypt
├── auth-middleware.ts      # Helper de verificación
├── cluster.ts              # Cliente OpenCode Go (chat/completions)
├── planes.ts               # Límites y uso de planes
├── sala-access.ts          # Autorización cross-empresa
├── email.ts                # Nodemailer wrapper
└── markdown.ts             # Generador de MD

stores/
└── auth-store.ts           # Zustand store de auth

hooks/
├── useAuth.ts
├── useLimits.ts
└── useRealtimeCards.ts     # Supabase Realtime subscription

migrations/ + supabase/migrations/
├── 001_schema.sql          # Schema completo
├── 002_seed_planes.sql     # Planes iniciales
├── 003_rpc_increment_cluster_usage.sql  # RPC de contador IA
└── (migraciones de precios y features)

types/                      # TypeScript interfaces
```

---

## Setup local

```bash
# Clonar el repo
git clone https://github.com/Diego-Sept/retropulse.git
cd retropulse

# Instalar dependencias
npm install

# Copiar ejemplo de env
cp .env.example .env.local

# Editar .env.local con tus credenciales

# Aplicar migraciones en tu proyecto Supabase
# supabase link --project-ref <tu-ref>
# supabase db push

# Correr en desarrollo
npm run dev
```

---

## Variables de entorno

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-llave-anon

# Auth
JWT_SECRET=tu-secret-minimo-32-chars

# OpenCode Go (AI Clustering)
ZEN_API_URL=https://opencode.ai/zen/go/v1
ZEN_API_KEY=sk-...tu-key-de-opencode-go
ZEN_MODEL=deepseek-v4-flash   # o mimo-v2.5

# MercadoPago
MP_ACCESS_TOKEN=APP_USR-...    # o TEST-... para desarrollo
MP_PUBLIC_KEY=APP_USR-...

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Email (opcional)
SMTP_HOST=smtp.proveedor.com
SMTP_PORT=587
SMTP_USER=tu-usuario
SMTP_PASS=tu-password
SMTP_FROM="RetroPulse <noreply@tudominio.com>"
```

---

## Esquema de base de datos

```sql
planes_subscription  -- Catálogo: Gratuito, Small Team, Enterprise (equipos_max, salas_max, clusters_ia_mes)
empresas             -- Multi-tenant: cada organización
suscripciones        -- Suscripción activa de cada empresa (snapshot de plan)
usuarios             -- Miembros: email, password_hash, nombre, rol_global
equipos              -- Equipos dentro de una empresa
usuarios_equipo      -- Relación many-to-many usuario ↔ equipo (con rol)
salas                -- Salas de retrospectiva
tarjetas             -- Tarjetas (con created_by → autor)
grupos               -- Agrupaciones de tarjetas (IA o manuales)
invitaciones         -- Tokens de invitación a equipos
invitaciones_empresa -- Tokens de invitación a empresa (con rol)
reset_tokens         -- Tokens de recuperación de contraseña
uso_ia               -- Contador mensual de clustering IA por empresa
price_changes_log    -- Historial de cambios de precio
notificaciones_email -- Log de emails enviados
```

### Roles globales

| Rol | Descripción |
|-----|-------------|
| `super_admin` | Administrador del sistema |
| `empresa_admin` | Admin de la empresa (crea usuarios, invita, gestiona planes) |
| `member` | Miembro estándar |

### Columnas del tablero

| # | Título |
|---|--------|
| 1 | ¿Qué hicimos bien? |
| 2 | ¿Qué hicimos mal? |
| 3 | Ideas para mejorar |
| 4 | Acciones a tomar |

---

## Planes y límites

| Feature | Gratuito | Small Team ($20.000/mes) | Enterprise ($100.000/mes) |
|---------|----------|--------------------------|---------------------------|
| Equipos | 1 | 1 | 10 |
| Salas activas | 2 | Ilimitadas | Ilimitadas |
| Agrupación IA/mes | 3 | 30 | 500 |
| Exportación MD/PDF | ✅ | ✅ | ✅ |
| Soporte prioritario | ❌ | ❌ | ✅ |
| SSO / Auditoría | ❌ | ❌ | ✅ (roadmap) |

El plan Gratuito se asigna automáticamente al registrar una empresa nueva.

---

## API endpoints

### Auth
- `POST /api/auth/register` — Registro (soporta `invitacion_token` para entrar a una empresa existente)
- `POST /api/auth/login` — Login
- `POST /api/auth/logout` — Logout
- `GET /api/auth/me` — Usuario actual
- `POST /api/auth/reset-password` — Enviar email de recuperación
- `POST /api/auth/reset-password/confirm` — Confirmar nueva contraseña

### Equipos
- `GET /api/equipos` — Listar equipos (propios + invitados cross-empresa)
- `POST /api/equipos` — Crear equipo
- `GET /api/equipos/[id]` — Detalle equipo
- `PATCH /api/equipos/[id]` — Actualizar equipo
- `DELETE /api/equipos/[id]` — Eliminar equipo
- `GET /api/equipos/[id]/miembros` — Listar miembros
- `DELETE /api/equipos/[id]/miembros/[userId]` — Remover miembro
- `POST /api/equipos/[id]/invitar` — Crear invitación + enviar email

### Salas
- `GET /api/salas` — Listar salas (con o sin filtro de equipo)
- `POST /api/salas` — Crear sala
- `GET /api/salas/[id]` — Detalle sala
- `PATCH /api/salas/[id]` — Actualizar/archivar
- `DELETE /api/salas/[id]` — Archivar sala
- `GET /api/salas/[id]/tarjetas` — Listar tarjetas (con autor)
- `POST /api/salas/[id]/tarjetas` — Crear tarjeta (guarda `created_by`)
- `PATCH /api/salas/[id]/tarjetas/[tarjetaId]` — Mover/actualizar tarjeta
- `DELETE /api/salas/[id]/tarjetas/[tarjetaId]` — Eliminar tarjeta

### Grupos
- `POST /api/grupos` — Crear grupo manualmente

### IA
- `POST /api/cluster` — Agrupar tarjetas con IA (OpenCode Go)
- `GET /api/uso-ia` — Estado actual de uso

### Pagos
- `POST /api/checkout/subscribe` — Crear preferencia de pago Checkout Pro
- `POST /api/webhooks/mercadopago` — Recibir notificaciones de pago

### Invitaciones
- `POST /api/admin/invitaciones-empresa` — Crear invitación a empresa (link mágico)
- `GET /api/invitaciones/empresa/[token]` — Ver invitación a empresa
- `POST /api/invitaciones/empresa/[token]` — Aceptar invitación a empresa
- `GET /api/invitaciones/[token]` — Ver invitación a equipo
- `POST /api/invitaciones/[token]` — Aceptar invitación a equipo

### Admin
- `GET /api/admin/usuarios` — Listar usuarios de la empresa
- `POST /api/admin/usuarios` — Crear usuario dentro de la empresa
- `POST /api/admin/planes/precio` — Cambiar precio de plan
- `POST /api/admin/suscripciones/aplicar-cambios` — Aplicar cambios de precios
- `POST /api/admin/suscripciones/[id]/limites` — Sobreescribir límites

---

## Pagos con MercadoPago

RetroPulse usa **Checkout Pro** (preferencia de pago) para las suscripciones mensuales:

1. El usuario elige plan en **Configuración**
2. El backend crea una preferencia en MP con el monto del plan (ARS)
3. MP redirige al checkout — el usuario paga con tarjeta o plata en cuenta
4. MP redirige de vuelta a `configuracion?status=success|failure|pending` (banner de estado)
5. El **webhook** (`/api/webhooks/mercadopago`) recibe la notificación del pago
6. El backend actualiza la suscripción de la empresa automáticamente

**Configuración del webhook en MP:** Dashboard → Tus integraciones → app → Webhooks → activá **Pagos** → URL `https://tudominio/api/webhooks/mercadopago`.

**Tarjetas de prueba:** [Checkout Pro test cards](https://www.mercadopago.com.ar/developers/es/docs/checkout-pro/test-cards)

---

## Features

### Tablero en tiempo real
- 4 columnas: Bien, Mal, Ideas, Acciones
- Drag & drop entre columnas
- Creación de tarjetas inline (optimista)
- Cada tarjeta muestra el nombre del autor
- Supabase Realtime para tarjetas y grupos

### Agrupación con IA
- Clustering semántico automático (OpenCode Go, DeepSeek V4 Flash / MiMo V2.5)
- Grupos con nombre descriptivo del tema
- Límite mensual por plan (contador RPC atómico)
- Agrupación manual como fallback

### Exportación
- **Markdown**: organizado por columnas y grupos, con autor en cada tarjeta
- **PDF**: generado con jsPDF, autor en gris bajo cada tarjeta

### Gestión de usuarios e invitaciones
- Admin crea usuarios dentro de su empresa (sin que creen empresa propia)
- Invitaciones a empresa via link mágico con rol definido en DB
- Invitaciones a equipos con email + link copiable
- Acceso cross-empresa: invitados ven equipos y salas del invitador

### Pagos y suscripciones
- Checkout Pro de MercadoPago con webhook
- Precios en ARS ($20.000 / $100.000)
- Banner de estado post-pago en Configuración

### Tema claro/oscuro
- Toggle en sidebar y landing
- Design system tokens — todos los colores vía CSS custom properties

### Multi-tenant
- Cada empresa tiene sus equipos, salas y miembros
- Aislamiento por `empresa_id` + verificación de membresía directa
- Roles: `empresa_admin` y `member`

---

## Deploy

**Vercel** con dos ambientes:
- `main` → **producción** (`retropulse.vercel.app` o dominio propio)
- `develop` → **preview** (URL con hash, para testing)

**Supabase:** base de datos compartida, migraciones con `supabase db push`.

> ⚠️ `.env.prod` no se commitea — configurá las variables por ambiente en Vercel Dashboard.

---

## Licencia

MIT © Diego Sept