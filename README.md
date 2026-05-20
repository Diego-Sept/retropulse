# RetroPulse

**Retrospectivas Scrum colaborativas en tiempo real.**

Sistema de gestión de retrospectivas ágiles donde equiposdistributed pueden colaborar en tiempo real, agrupar ideas con IA y exportar resultados. Construido con Next.js 15, Supabase, TypeScript y diseño system tokens.

---

## Tabla de contenidos

- [Stack tecnológico](#stack-tecnológico)
- [Arquitectura](#arquitectura)
- [Setup local](#setup-local)
- [Variables de entorno](#variables-de-entorno)
- [Esquema de base de datos](#esquema-de-base-de-datos)
- [Planes y límites](#planes-y-límites)
- [API endpoints](#api-endpoints)
- [Features](#features)
- [Licencia](#licencia)

---

## Stack tecnológico

| Capa | Tecnología |
|------|-----------|
| **Frontend** | Next.js 15 (App Router), React 18, TypeScript |
| **Estilos** | CSS Modules + Custom Properties (Design System Tokens) |
| **Backend** | Next.js API Routes (serverless) |
| **Base de datos** | Supabase (PostgreSQL) + Realtime |
| **Auth** | JWT (jose) + Supabase Auth |
| **AI** | OpenRouter API (modelos gratuitos) |
| **Estado** | Zustand (client-side) |
| **Iconos** | Lucide React |
| **Email** | Nodemailer (SMTP) |

---

## Arquitectura

```
app/
├── api/                    # API Routes (Next.js)
│   ├── auth/               # Login, logout, register, reset-password
│   ├── equipos/            # CRUD equipos + miembros
│   ├── salas/              # CRUD salas + tarjetas
│   ├── grupos/             # Agrupación de tarjetas
│   ├── cluster/            # Clustering IA via OpenRouter
│   ├── uso-ia/             # Contador de uso IA por plan
│   └── admin/              # Admin: planes, suscripciones
├── dashboard/              # Panel principal
│   ├── page.tsx            # Home (lista de salas)
│   ├── equipos/             # Gestión de equipos
│   ├── salas/              # Lista de salas
│   ├── sala/[id]/          # Tablero de retrospectiva
│   └── configuracion/       # Plan y límites
├── login/                  # Página de login
├── register/               # Registro
├── reset-password/         # Recuperación de contraseña
└── page.tsx                # Landing page pública

components/
├── board/                  # Componentes del tablero
│   ├── Board.tsx            # Contenedor 4 columnas
│   ├── Column.tsx          # Columna individual
│   ├── Card.tsx            # Tarjeta arrastrable
│   ├── CardForm.tsx        # Formulario para crear tarjetas
│   ├── ClusterButton.tsx   # Botón IA clustering
│   ├── GroupHeader.tsx     # Header de grupo
│   └── ExportMenu.tsx      # Exportación MD/PDF
├── ThemeToggle.tsx         # Toggle claro/oscuro
├── UsageIndicator.tsx      # Barra de uso IA
└── AuthGuard.tsx            # HOC de protección

contexts/
├── AuthContext.tsx         # Provider de auth + fetch /api/auth/me
├── BoardContext.tsx        # Estado del tablero (Zustand-like)
└── role-context.tsx        # Contexto de rol (admin/member)

lib/
├── supabase.ts             # Cliente browser
├── supabase-server.ts      # Cliente server-side
├── auth.ts                 # Middleware JWT
├── auth-middleware.ts      # Helper de verificación
├── cluster.ts              # Cliente OpenRouter
├── planes.ts               # Definiciones de planes
├── email.ts                # Nodemailer wrapper
└── markdown.ts             # Generador de MD

stores/
└── auth-store.ts           # Zustand store de auth

hooks/
├── useAuth.ts
├── useLimits.ts
└── useRealtimeCards.ts     # Supabase Realtime subscription

migrations/
├── 001_schema.sql          # Schema completo
└── 002_seed_planes.sql     # Planes iniciales

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

# Editar .env.local con tus credenciales de Supabase y OpenRouter

# Aplicar migraciones en tu proyecto Supabase
# Copiá el contenido de migrations/001_schema.sql
# y migrations/002_seed_planes.sql al SQL editor de Supabase

# Correr en desarrollo
npm run dev
```

---

## Variables de entorno

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-llave-anon
SUPABASE_SERVICE_ROLE_KEY=tu-llave-service

# Auth
JWT_SECRET=tu-secret-minimo-32-chars

# OpenRouter (AI Clustering)
ZEN_API_URL=https://openrouter.ai/api/v1
ZEN_API_KEY=sk-or-v1-...

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Email (opcional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=tu@gmail.com
SMTP_PASS=tu-app-password
SMTP_FROM=RetroPulse <tu@gmail.com>
```

---

## Esquema de base de datos

```sql
empresas        -- Multi-tenant: cada organización
planes           -- Planes: Gratuito, Pro ($9/mes), Enterprise ($29/mes)
suscripciones    -- Suscripción activa de cada empresa
usuarios         -- Miembros: email, password_hash, nombre, rol_global
equipos          -- Equipos dentro de una empresa
equipo_miembros  -- Relación many-to-many usuario ↔ equipo
salas            -- Salas de retrospectiva
tarjetas         -- Tarjetas individuales en columnas
grupos           -- Agrupaciones de tarjetas (creadas por IA o manualmente)
 invitaciones    -- Tokens de invitación a equipos
reset_tokens     -- Tokens de recuperación de contraseña
uso_ia           -- Contador mensual de clustering IA por empresa
```

### Roles globales

| Rol | Descripción |
|-----|-------------|
| `super_admin` | Administrador del sistema (no usado aún) |
| `empresa_admin` | Admin de la empresa (puede invitar miembros) |
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

| Feature | Gratuito | Pro ($9) | Enterprise ($29) |
|---------|----------|----------|------------------|
| Equipos | 1 | Ilimitados | Ilimitados |
| Salas | Ilimitadas | Ilimitadas | Ilimitadas |
| Miembros | 3 | 10 | 50 |
| Agrupación IA/mes | 50 | 500 | Ilimitada |
| Exportación MD/PDF | ✅ | ✅ | ✅ |
| SSO/SAML | ❌ | ❌ | ✅ |
| Auditoría | ❌ | ❌ | ✅ |

El plan Gratuito se asigna automáticamente al registrar una empresa nueva.

---

## API endpoints

### Auth
- `POST /api/auth/register` — Registro
- `POST /api/auth/login` — Login
- `POST /api/auth/logout` — Logout
- `GET /api/auth/me` — Usuario actual
- `POST /api/auth/reset-password` — Enviar email de recuperación
- `POST /api/auth/reset-password/confirm` — Confirmar nueva contraseña

### Equipos
- `GET /api/equipos` — Listar equipos
- `POST /api/equipos` — Crear equipo
- `GET /api/equipos/[id]` — Detalle equipo
- `PATCH /api/equipos/[id]` — Actualizar equipo
- `DELETE /api/equipos/[id]` — Eliminar equipo
- `GET /api/equipos/[id]/miembros` — Listar miembros
- `POST /api/equipos/[id]/invitar` — Generar link de invitación

### Salas
- `GET /api/salas` — Listar salas
- `POST /api/salas` — Crear sala
- `GET /api/salas/[id]` — Detalle sala
- `GET /api/salas/[id]/tarjetas` — Listar tarjetas
- `POST /api/salas/[id]/tarjetas` — Crear tarjeta
- `PATCH /api/salas/[id]/tarjetas/[tarjetaId]` — Mover/actualizar tarjeta

### Grupos
- `POST /api/grupos` — Crear grupo manualmente

### IA
- `POST /api/cluster` — Agrupar tarjetas con IA (OpenRouter)
- `GET /api/uso-ia` — Estado actual de uso

---

## Features

### Tablero en tiempo real
- 4 columnas: Bien, Mal, Ideas, Acciones
- Drag & drop entre columnas
- Creación de tarjetas inline
- Supabase Realtime para sincronización instantánea

### Agrupación con IA
- Clustering semántico automático (OpenRouter, modelos gratuitos)
- Grupos con nombre descriptivo del tema
- Límite mensual por plan
- Agrupación manual como fallback

### Exportación
- **Markdown**: organizado por columnas y grupos
- **PDF**: generado con jsPDF (sin dependencias externas de captura)

### Tema claro/oscuro
- Toggle en sidebar y landing
- Diseño system tokens — todos los colores vía CSS custom properties
- Persistencia en localStorage

### Multi-tenant
- Cada empresa tiene sus equipos, salas y miembros
- Aislación por `empresa_id` en todas las queries
- Roles: `empresa_admin` y `member`

---

## Licencia

MIT © Diego Sept