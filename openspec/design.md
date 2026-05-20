# Design: retro-scrum-app

## Executive Summary

Multi-tenant SaaS for collaborative Scrum Retrospectives built with Next.js 14+ App Router, TypeScript, Supabase (PostgreSQL + Realtime), custom auth (bcrypt + JWT + httpOnly cookies), CSS Modules, and native HTML5 Drag & Drop. Each company is a tenant (empresa) with its own teams, users, and snapshot-based subscription plan. Real-time board syncs cards via Supabase `postgres_changes` channels. AI clustering via OpenCode Zen groups semantically similar cards per column. Export to Markdown (client-side `.md` generation) and PDF (`window.print()` + `@media print` CSS).

**Tenant isolation is application-enforced**: every query MUST filter by `empresa_id` extracted from the JWT. No Supabase Auth or RLS used.

---

## 1. Project Structure

```
retro-scrum/
├── .env.local
├── .env.example
├── next.config.js
├── tsconfig.json
├── package.json
├── middleware.ts                              ← JWT verification for /dashboard/*
│
├── app/
│   ├── layout.tsx                             ← Root layout (Providers, AuthGuard)
│   ├── page.tsx                               ← Landing page
│   ├── globals.css
│   │
│   ├── login/
│   │   └── page.tsx                           ← Login form
│   ├── register/
│   │   └── page.tsx                           ← Register form
│   │
│   ├── dashboard/
│   │   ├── layout.tsx                         ← Sidebar + main content wrapper
│   │   ├── page.tsx                           ← Dashboard home (equipo list, stats)
│   │   ├── equipos/
│   │   │   └── page.tsx                       ← Team CRUD list + create
│   │   ├── sala/
│   │   │   └── [id]/
│   │   │       └── page.tsx                   ← Board page (4-column retro)
│   │   └── configuracion/
│   │       └── page.tsx                       ← Plan info, usage, limits
│   │
│   ├── reset-password/
│   │   └── [token]/
│   │       └── page.tsx                       ← Reset password form
│   │
│   └── api/
│       ├── auth/
│       │   ├── register/route.ts              ← POST: register
│       │   ├── login/route.ts                 ← POST: login
│       │   ├── logout/route.ts                ← POST: logout
│       │   ├── me/route.ts                    ← GET: current user from JWT
│       │   ├── reset-password/route.ts        ← POST: send reset email
│       │   └── reset-password/confirm/route.ts ← POST: confirm reset + new password
│       │
│       ├── equipos/
│       │   ├── route.ts                       ← GET (list), POST (create)
│       │   └── [equipoId]/
│       │       ├── route.ts                   ← PATCH, DELETE equipo
│       │       ├── salas/route.ts             ← GET (list salas), POST (create)
│       │       ├── invitar/route.ts           ← POST (invite user)
│       │       └── miembros/
│       │           └── [userId]/route.ts      ← DELETE (remove member)
│       │
│       ├── salas/
│       │   └── [salaId]/
│       │       ├── route.ts                   ← PATCH (rename, archive)
│       │       └── tarjetas/route.ts          ← POST (create card)
│       │
│       ├── tarjetas/
│       │   └── [tarjetaId]/route.ts           ← PATCH (move column, edit)
│       │
│       ├── cluster/route.ts                   ← POST: AI clustering
│       ├── uso-ia/route.ts                    ← GET: usage + limits
│       │
│       └── admin/
│           ├── planes/precio/route.ts         ← POST: change plan price
│           └── suscripciones/
│               └── [id]/
│                   └── limites/route.ts       ← POST: override subscription limits
│
├── components/
│   ├── AuthGuard.tsx                          ← Client-side route guard
│   ├── dashboard/
│   │   ├── Sidebar.tsx / Sidebar.module.css
│   │   ├── TeamSelector.tsx
│   │   ├── EquipoList.tsx
│   │   ├── SalaList.tsx
│   │   └── UsageIndicator.tsx
│   ├── board/
│   │   ├── Board.tsx / Board.module.css       ← Main board container
│   │   ├── Column.tsx / Column.module.css     ← Single column with cards
│   │   ├── Card.tsx / Card.module.css         ← Draggable card
│   │   ├── CardForm.tsx / CardForm.module.css ← Inline add form
│   │   ├── ClusterButton.tsx                 ← Trigger AI clustering
│   │   ├── GroupHeader.tsx                    ← AI group heading
│   │   ├── RealtimeIndicator.tsx             ← "Reconectando..." badge
│   │   ├── ExportMenu.tsx                    ← MD + PDF export buttons
│   │   └── PrintLayout.tsx                   ← Print-only header
│   ├── equipo/
│   │   ├── EquipoForm.tsx
│   │   ├── MiembroList.tsx
│   │   └── InviteForm.tsx
│   └── ui/
│       ├── Toast.tsx / Toast.module.css
│       ├── Modal.tsx
│       ├── Button.tsx
│       └── LoadingSpinner.tsx
│
├── contexts/
│   ├── AuthContext.tsx                        ← Auth state provider
│   └── BoardContext.tsx                       ← Board state provider
│
├── lib/
│   ├── supabase.ts                            ← Browser Supabase client
│   ├── supabase-server.ts                     ← Server-only Supabase client
│   ├── auth.ts                                ← JWT sign/verify, hash/compare
│   ├── auth-middleware.ts                     ← API route helper (getAuthUser)
│   ├── realtime.ts                            ← useRealtimeCards hook
│   ├── cluster.ts                             ← OpenCode Zen API client
│   ├── planes.ts                              ← Limit checking logic
│   ├── email.ts                               ← Nodemailer SMTP (cambio precio + password reset)
│   ├── markdown.ts                            ← Client-side MD generation
│   └── utils.ts                               ← Shared helpers
│
├── hooks/
│   ├── useAuth.ts
│   ├── useBoard.ts
│   ├── useRealtimeCards.ts
│   └── useLimits.ts
│
├── stores/
│   └── auth-store.ts                          ← Zustand store for auth/tenant
│
├── types/
│   ├── index.ts                               ← Re-exports
│   ├── auth.ts
│   ├── empresa.ts
│   ├── plan.ts
│   ├── equipo.ts
│   ├── sala.ts
│   ├── tarjeta.ts
│   ├── grupo.ts
│   ├── uso-ia.ts
│   └── reset-token.ts
│
├── styles/
│   ├── print.css                              ← @media print stylesheet
│   ├── landing.module.css
│   └── dashboard.module.css
│
├── migrations/
│   ├── 001_schema.sql                         ← Full DDL
│   └── 002_seed_planes.sql                    ← Seed 3 plans
│
└── public/
    └── favicon.ico
```

### package.json Dependencies

```json
{
  "dependencies": {
    "next": "^14.2.0",
    "react": "^18.3.0",
    "react-dom": "^18.3.0",
    "@supabase/supabase-js": "^2.43.0",
    "zustand": "^4.5.0",
    "bcryptjs": "^2.4.3",
    "jsonwebtoken": "^9.0.2",
    "nodemailer": "^6.9.14"
  },
  "devDependencies": {
    "typescript": "^5.4.0",
    "@types/node": "^20.12.0",
    "@types/react": "^18.3.0",
    "@types/react-dom": "^18.3.0",
    "@types/bcryptjs": "^2.4.6",
    "@types/jsonwebtoken": "^9.0.6",
    "@types/nodemailer": "^6.4.16"
  }
}
```

**Notable absences**: No `react-router-dom` dependency needed — Next.js App Router handles all routing. No drag-drop library. No PDF library. No MD library. No ORM (raw Supabase client). No Supabase Auth library (only `@supabase/supabase-js` for the DB + Realtime client).

---

## 2. Database Schema

### DDL (TypeScript-compatible definitions)

```sql
-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- CATÁLOGO: Planes de suscripción (template)
-- ============================================
CREATE TABLE planes_subscription (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre TEXT NOT NULL,
  descripcion TEXT,
  equipos_max INT NOT NULL DEFAULT 1,       -- 0 = ilimitado
  clusters_ia_mes INT NOT NULL DEFAULT 5,   -- 0 = ilimitado
  precio DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- TENANT: Empresas
-- ============================================
CREATE TABLE empresas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- SUSCRIPCIONES: Snapshot por empresa
-- ============================================
CREATE TABLE suscripciones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES planes_subscription(id),
  equipos_max INT NOT NULL DEFAULT 1,
  clusters_ia_mes INT NOT NULL DEFAULT 5,
  precio DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  estado TEXT NOT NULL DEFAULT 'activa'
    CHECK (estado IN ('activa', 'suspendida', 'cancelada')),
  fecha_inicio TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  precio_proximo DECIMAL(10,2),
  fecha_efectiva_proximo_cambio DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_empresa_suscripcion UNIQUE (empresa_id, estado)
);

-- Link empresa to its active subscription
ALTER TABLE empresas ADD COLUMN suscripcion_id UUID REFERENCES suscripciones(id);

-- ============================================
-- USUARIOS (Custom Auth — no Supabase Auth)
-- ============================================
CREATE TABLE usuarios (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  nombre TEXT NOT NULL,
  rol_global TEXT NOT NULL DEFAULT 'member'
    CHECK (rol_global IN ('super_admin', 'empresa_admin', 'member')),
  empresa_id UUID REFERENCES empresas(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- EQUIPOS (Teams)
-- ============================================
CREATE TABLE equipos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre TEXT NOT NULL,
  empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- USUARIOS_EQUIPO (N:N with per-team role)
-- ============================================
CREATE TABLE usuarios_equipo (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  equipo_id UUID NOT NULL REFERENCES equipos(id) ON DELETE CASCADE,
  rol TEXT NOT NULL DEFAULT 'member'
    CHECK (rol IN ('team_admin', 'member')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(usuario_id, equipo_id)
);

-- ============================================
-- INVITACIONES (Pending invitations)
-- ============================================
CREATE TABLE invitaciones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT NOT NULL,
  equipo_id UUID NOT NULL REFERENCES equipos(id) ON DELETE CASCADE,
  rol TEXT NOT NULL DEFAULT 'member'
    CHECK (rol IN ('team_admin', 'member')),
  token TEXT NOT NULL UNIQUE,
  estado TEXT NOT NULL DEFAULT 'pendiente'
    CHECK (estado IN ('pendiente', 'aceptada', 'expirada')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(email, equipo_id)
);

-- ============================================
-- SALAS (Retro rooms)
-- ============================================
CREATE TABLE salas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre TEXT NOT NULL,
  equipo_id UUID NOT NULL REFERENCES equipos(id) ON DELETE CASCADE,
  estado TEXT NOT NULL DEFAULT 'activa'
    CHECK (estado IN ('activa', 'archivada')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- TARJETAS (Cards)
-- ============================================
CREATE TABLE tarjetas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sala_id UUID NOT NULL REFERENCES salas(id) ON DELETE CASCADE,
  columna INT NOT NULL CHECK (columna BETWEEN 1 AND 4),
  contenido TEXT NOT NULL,
  autor_id UUID NOT NULL REFERENCES usuarios(id),
  grupo_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- GRUPOS (AI clusters)
-- ============================================
CREATE TABLE grupos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sala_id UUID NOT NULL REFERENCES salas(id) ON DELETE CASCADE,
  columna INT NOT NULL CHECK (columna BETWEEN 1 AND 4),
  nombre_grupo TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- FK tarjetas → grupos
ALTER TABLE tarjetas
  ADD CONSTRAINT fk_tarjetas_grupo
  FOREIGN KEY (grupo_id) REFERENCES grupos(id) ON DELETE SET NULL;

-- ============================================
-- USO_IA (Monthly AI usage counter)
-- ============================================
CREATE TABLE uso_ia (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  mes TEXT NOT NULL,                          -- "YYYY-MM"
  clusters_usados INT NOT NULL DEFAULT 0,
  UNIQUE(empresa_id, mes)
);

-- ============================================
-- PRICE_CHANGES_LOG (Audit trail)
-- ============================================
CREATE TABLE price_changes_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  plan_id UUID REFERENCES planes_subscription(id),
  suscripcion_id UUID REFERENCES suscripciones(id),
  precio_anterior DECIMAL(10,2) NOT NULL,
  precio_nuevo DECIMAL(10,2) NOT NULL,
  fecha_efectiva DATE NOT NULL,
  tipo_cambio TEXT NOT NULL
    CHECK (tipo_cambio IN ('global_template', 'directo_suscripcion')),
  motivo TEXT,
  created_by UUID REFERENCES usuarios(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- NOTIFICACIONES_EMAIL
-- ============================================
CREATE TABLE notificaciones_email (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL CHECK (tipo IN ('cambio_precio')),
  suscripcion_id UUID REFERENCES suscripciones(id),
  precio_anterior DECIMAL(10,2),
  precio_nuevo DECIMAL(10,2),
  fecha_efectiva DATE,
  destinatario_email TEXT NOT NULL,
  enviado BOOLEAN NOT NULL DEFAULT FALSE,
  enviado_en TIMESTAMPTZ,
  error_msg TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- INDEXES (performance + tenant isolation)
-- ============================================
CREATE INDEX idx_usuarios_email ON usuarios(email);
CREATE INDEX idx_usuarios_empresa ON usuarios(empresa_id);
CREATE INDEX idx_equipos_empresa ON equipos(empresa_id);
CREATE INDEX idx_usuarios_equipo_usuario ON usuarios_equipo(usuario_id);
CREATE INDEX idx_usuarios_equipo_equipo ON usuarios_equipo(equipo_id);
CREATE INDEX idx_salas_equipo ON salas(equipo_id);
CREATE INDEX idx_tarjetas_sala ON tarjetas(sala_id);
CREATE INDEX idx_tarjetas_columna ON tarjetas(sala_id, columna);
CREATE INDEX idx_tarjetas_grupo ON tarjetas(grupo_id);
CREATE INDEX idx_grupos_sala ON grupos(sala_id);
CREATE INDEX idx_uso_ia_empresa_mes ON uso_ia(empresa_id, mes);
CREATE INDEX idx_suscripciones_empresa ON suscripciones(empresa_id);
CREATE INDEX idx_invitaciones_email ON invitaciones(email);
CREATE INDEX idx_price_changes_log_plan ON price_changes_log(plan_id);
CREATE INDEX idx_notificaciones_email_empresa ON notificaciones_email(empresa_id);
```

### Tenant Isolation Pattern

Every query in API routes MUST include `empresa_id = $1` from the JWT:

```typescript
// ✅ CORRECT — tenant isolation enforced
const { rows } = await supabase
  .from('equipos')
  .select('*')
  .eq('empresa_id', authUser.empresa_id);

// ❌ WRONG — leaks data across tenants
const { rows } = await supabase.from('equipos').select('*');
```

This is enforced at the **application level** in `auth-middleware.ts`. Each API route helper receives the authenticated user with `empresa_id` and MUST pass it to every query.

---

## 3. Auth Architecture

### Flow Overview

```
┌─────────────┐     ┌──────────────┐     ┌───────────────┐     ┌─────────────┐
│  Register    │────→│  bcrypt hash  │────→│  INSERT user   │────→│  Sign JWT   │
│  /register   │     │  (cost 10)    │     │  + create      │     │  + set      │
│              │     │               │     │  empresa (1st) │     │  httpOnly   │
└─────────────┘     └──────────────┘     └───────────────┘     │  cookie     │
                                                                 └──────┬──────┘
                                                                        │
┌─────────────┐     ┌──────────────┐     ┌───────────────┐            │
│   Login     │────→│  bcrypt      │────→│  Get user by  │────────────┘
│  /login     │     │  compare     │     │  email        │
│             │     │  401 if fail │     └───────────────┘
└─────────────┘     └──────────────┘
```

### JWT Payload

```typescript
interface JwtPayload {
  user_id: string;
  empresa_id: string;
  rol_global: 'super_admin' | 'empresa_admin' | 'member';
  suscripcion_id: string;
  iat: number;    // issued at
  exp: number;    // expires (1h from now)
}
```

### middleware.ts (Next.js Edge Middleware)

```typescript
// middleware.ts — protects /dashboard/*
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyJwt } from '@/lib/auth';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('session')?.value;

  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  const payload = verifyJwt(token);
  if (!payload) {
    const response = NextResponse.redirect(new URL('/login', request.url));
    response.cookies.delete('session');
    return response;
  }

  // Forward user info to API routes via headers
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-user-id', payload.user_id);
  requestHeaders.set('x-empresa-id', payload.empresa_id);
  requestHeaders.set('x-rol-global', payload.rol_global);
  requestHeaders.set('x-suscripcion-id', payload.suscripcion_id);

  return NextResponse.next({
    request: { headers: requestHeaders },
  });
}

export const config = {
  matcher: '/dashboard/:path*',
};
```

### API Route Auth Helper

```typescript
// lib/auth-middleware.ts
import { NextRequest, NextResponse } from 'next/server';

export interface AuthUser {
  user_id: string;
  empresa_id: string;
  rol_global: 'super_admin' | 'empresa_admin' | 'member';
  suscripcion_id: string;
}

export function getAuthUser(request: NextRequest): AuthUser | null {
  const userId = request.headers.get('x-user-id');
  const empresaId = request.headers.get('x-empresa-id');
  const rolGlobal = request.headers.get('x-rol-global');
  const suscripcionId = request.headers.get('x-suscripcion-id');

  if (!userId || !empresaId || !rolGlobal) return null;

  return {
    user_id: userId,
    empresa_id: empresaId,
    rol_global: rolGlobal as AuthUser['rol_global'],
    suscripcion_id: suscripcionId,
  };
}
```

### Auth lib functions

```typescript
// lib/auth.ts
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET!;
const JWT_EXPIRES_IN = '1h';
const BCRYPT_COST = 10;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_COST);
}

export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function signJwt(payload: {
  user_id: string;
  empresa_id: string;
  rol_global: string;
  suscripcion_id: string;
}): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

export function verifyJwt(token: string) {
  try {
    return jwt.verify(token, JWT_SECRET) as {
      user_id: string;
      empresa_id: string;
      rol_global: string;
      suscripcion_id: string;
    };
  } catch {
    return null;
  }
}
```

### Cookie Configuration

```typescript
// Set on login/register
response.cookies.set('session', token, {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  path: '/',
  maxAge: 60 * 60, // 1 hour
});

// Clear on logout
response.cookies.delete('session');
```

---

## 4. Component Architecture

```
app/layout.tsx
  └── AuthProvider (AuthContext)
      └── app/dashboard/layout.tsx
          ├── Sidebar
          │   ├── TeamSelector (equipo activo en Zustand)
          │   ├── EquipoList
          │   └── UsageIndicator (límites desde suscripcion)
          │
          └── {children}
              ├── dashboard/page.tsx                 ← Dashboard home
              │   └── SalaList (by equipo)
              │
              ├── dashboard/equipos/page.tsx
              │   ├── EquipoForm (create)
              │   ├── MiembroList
              │   └── InviteForm
              │
              ├── dashboard/sala/[id]/page.tsx       ← Board
              │   └── BoardProvider (BoardContext)
              │       └── Board
              │           ├── Column (×4)
              │           │   ├── ColumnHeader ("Start", "Stop", etc.)
              │           │   ├── CardList (draggable zone)
              │           │   │   ├── GroupHeader (if clustered)
              │           │   │   └── Card × N (draggable)
              │           │   └── CardForm (inline add)
              │           ├── ClusterButton (per column)
              │           ├── ExportMenu (MD + PDF)
              │           └── RealtimeIndicator
              │
              └── dashboard/configuracion/page.tsx
                  └── PlanInfo + UsageStats
```

### State Management

| Concern | Solution | Why |
|---------|----------|-----|
| Auth/user/tenant | **Zustand** (`auth-store.ts`) | Global, needed everywhere, minimal re-renders |
| Active equipo | **Zustand** | Persists across page navigation in dashboard |
| Board cards | **React Context** (`BoardContext`) | Scoped to sala/[id] page, resets on unmount |
| Drag state | **React Context** | Fast local state, no global scope |
| Realtime updates | **React Context + reducer** | Merge remote changes with local optimistic state |

### Zustand Auth Store

```typescript
// stores/auth-store.ts
import { create } from 'zustand';

interface AuthState {
  user: {
    id: string;
    email: string;
    nombre: string;
    rol_global: string;
    empresa_id: string;
    suscripcion_id: string;
  } | null;
  isLoading: boolean;
  setUser: (user: AuthState['user']) => void;
  clearUser: () => void;
  equipoActivo: string | null;
  setEquipoActivo: (id: string) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  setUser: (user) => set({ user, isLoading: false }),
  clearUser: () => set({ user: null, isLoading: false }),
  equipoActivo: null,
  setEquipoActivo: (id) => set({ equipoActivo: id }),
}));
```

### BoardContext (Reducer-based)

```typescript
// contexts/BoardContext.tsx
interface BoardState {
  cards: Record<string, Tarjeta>;          // id → tarjeta
  grupos: Grupo[];
  dragState: {
    draggedCardId: string | null;
    sourceColumn: number | null;
  } | null;
  isRealtimeConnected: boolean;
}

type BoardAction =
  | { type: 'ADD_CARD'; payload: Tarjeta }
  | { type: 'MOVE_CARD'; payload: { id: string; columna: number } }
  | { type: 'REMOVE_CARD'; payload: string }
  | { type: 'SET_GRUPOS'; payload: Grupo[] }
  | { type: 'SET_CONNECTED'; payload: boolean }
  | { type: 'RECONCILE'; payload: Tarjeta };  // server state wins
```

---

## 5. Real-time Architecture

### Channel Setup

```typescript
// hooks/useRealtimeCards.ts
import { useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export function useRealtimeCards(
  salaId: string,
  dispatch: React.Dispatch<BoardAction>
) {
  useEffect(() => {
    const channel = supabase
      .channel(`sala-${salaId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tarjetas',
          filter: `sala_id=eq.${salaId}`,
        },
        (payload) => {
          switch (payload.eventType) {
            case 'INSERT':
              dispatch({ type: 'ADD_CARD', payload: payload.new as Tarjeta });
              break;
            case 'UPDATE':
              dispatch({ type: 'RECONCILE', payload: payload.new as Tarjeta });
              break;
            case 'DELETE':
              dispatch({ type: 'REMOVE_CARD', payload: payload.old.id });
              break;
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          dispatch({ type: 'SET_CONNECTED', payload: true });
        }
        if (status === 'CHANNEL_ERROR') {
          dispatch({ type: 'SET_CONNECTED', payload: false });
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [salaId]);
}
```

### Optimistic Update + Conflict Resolution

```
User drags card to column 2:
  1. Dispatch MOVE_CARD (optimistic — card moves immediately in UI)
  2. PATCH /api/tarjetas/:id { columna: 2 }
  3a. ✅ Success → card stays, Realtime broadcasts update
  3b. ❌ Failure → dispatch MOVE_CARD back to original column
                  → show error toast

Realtime UPDATE arrives:
  1. If card exists locally → RECONCILE (server state wins)
  2. If card doesn't exist → ADD_CARD
```

### Connection Status

The `RealtimeIndicator` component reads `isRealtimeConnected` from BoardContext and shows a "Reconectando..." banner when false. It auto-hides when the status returns to `SUBSCRIBED`.

---

## 6. AI Clustering Flow

```
┌──────────┐    ┌──────────────┐    ┌───────────────┐    ┌──────────────┐
│  User    │    │  POST        │    │  Check        │    │  Call        │
│  clicks  │───→│  /api/cluster│───→│  subscription │───→│  OpenCode    │
│  Cluster │    │  {sala_id,   │    │  limit        │    │  Zen API     │
│  button  │    │   columna,   │    │  (uso_ia +    │    │              │
│          │    │   tarjetas}  │    │  suscripcion) │    └──────┬───────┘
└──────────┘    └──────────────┘    └──────┬────────┘           │
                                           │                    │
                                    ┌──────┴───────┐    ┌───────┴───────┐
                                    │  429: límite  │    │  Validate     │
                                    │  excedido     │    │  JSON schema  │
                                    └──────────────┘    └───────┬───────┘
                                                                 │
                                                    ┌────────────┴──────────┐
                                                    │  INSERT grupos rows    │
                                                    │  UPDATE tarjetas FK    │
                                                    │  INSERT/INCREMENT      │
                                                    │    uso_ia              │
                                                    └───────────────────────┘
```

### API Route Implementation

```typescript
// app/api/cluster/route.ts
export async function POST(request: NextRequest) {
  // 1. Auth check
  const authUser = getAuthUser(request);
  if (!authUser) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  // 2. Parse body
  const body = await request.json();
  const { sala_id, columna, tarjetas } = body;

  // 3. Validate
  if (!tarjetas?.length) {
    return NextResponse.json({ error: 'No hay tarjetas para agrupar' }, { status: 400 });
  }

  // 4. Check subscription limit (from suscripciones snapshot, NOT planes_subscription)
  const dentroLimite = await checkClusterLimit(authUser.empresa_id);
  if (!dentroLimite) {
    return NextResponse.json({
      error: 'Límite mensual de clusters IA alcanzado',
      plan: 'Gratuito', // from suscripcion
      clusters_ia_mes: 5, // from suscripcion snapshot
    }, { status: 429 });
  }

  // 5. Call OpenCode Zen
  const grupos = await clusterCards(tarjetas);

  // 6. Validate response schema
  if (!isValidClusterResponse(grupos)) {
    return NextResponse.json({ error: 'Error al procesar la agrupación IA' }, { status: 502 });
  }

  // 7. Persist groups + update cards + increment usage (transaction)
  const result = await persistClustering(sala_id, columna, grupos, authUser.empresa_id);

  return NextResponse.json({ grupos: result });
}
```

### OpenCode Zen System Prompt

```
Agrupa las siguientes tarjetas de retrospectiva por similitud semántica.
Responde ÚNICAMENTE con un JSON válido en este formato SIN markdown ni explicaciones:
{ "grupos": [{ "nombre_grupo": "string", "tarjetas": ["id1", "id2"] }] }
Grupo "Otros" para tarjetas sin similitud clara.
```

### Usage Tracking

```sql
-- After successful clustering (in transaction):
INSERT INTO uso_ia (empresa_id, mes, clusters_usados)
VALUES ($empresaId, to_char(NOW(), 'YYYY-MM'), 1)
ON CONFLICT (empresa_id, mes)
DO UPDATE SET clusters_usados = uso_ia.clusters_usados + 1;
```

---

## 7. API Routes Design

| Method | Path | Auth | Req Body | Res (200) | Errors |
|--------|------|------|----------|-----------|--------|
| **Auth** |
| POST | `/api/auth/register` | None | `{ email, password, nombre }` | `{ user, token }` | 409 email dup |
| POST | `/api/auth/login` | None | `{ email, password }` | `{ user, token }` | 401 invalid |
| POST | `/api/auth/logout` | Cookie | — | `{ message }` | — |
| GET | `/api/auth/me` | Cookie | — | `{ user }` | 401 |
| **Teams** |
| GET | `/api/equipos` | Cookie | — | `{ equipos: [{ id, nombre, miembros_count }] }` | — |
| POST | `/api/equipos` | Cookie | `{ nombre }` | `{ equipo }` | 403 plan limit |
| PATCH | `/api/equipos/{id}` | Cookie | `{ nombre }` | `{ equipo }` | 403, 404 |
| DELETE | `/api/equipos/{id}` | Cookie | — | `{ message }` | 403 |
| POST | `/api/equipos/{id}/invitar` | Cookie | `{ email, rol }` | `{ message }` or `{ message, invitacion_id }` | 403, 404 |
| DELETE | `/api/equipos/{id}/miembros/{userId}` | Cookie | — | `{ message }` | 403 last admin |
| **Salas** |
| GET | `/api/equipos/{id}/salas` | Cookie | — | `{ salas: [{ id, nombre, estado, tarjetas_count }] }` | 403 |
| POST | `/api/equipos/{id}/salas` | Cookie | `{ nombre }` | `{ sala }` | 403 |
| PATCH | `/api/salas/{id}` | Cookie | `{ nombre?, estado? }` | `{ sala }` | 403 |
| **Cards** |
| POST | `/api/salas/{id}/tarjetas` | Cookie | `{ contenido, columna }` | `{ tarjeta }` | 400 empty, 403 |
| PATCH | `/api/tarjetas/{id}` | Cookie | `{ columna?, contenido? }` | `{ tarjeta }` | 400, 404 |
| **AI** |
| POST | `/api/cluster` | Cookie | `{ sala_id, columna, tarjetas }` | `{ grupos }` | 400 empty, 429 limit, 502 AI |
| **Usage** |
| GET | `/api/uso-ia` | Cookie | — | `{ suscripcion, uso_ia, equipos_count, dentro_limite_clusters, dentro_limite_equipos }` | — |
| **Admin** |
| POST | `/api/admin/planes/precio` | super_admin | `{ plan_id, precio_nuevo, fecha_efectiva, motivo }` | `{ ok, cambio_template, suscripciones_afectadas, notificaciones_email }` | 403, 400 |
| POST | `/api/admin/suscripciones/{id}/limites` | super_admin | `{ equipos_max?, clusters_ia_mes? }` | `{ ok, suscripcion_id, equipos_max, clusters_ia_mes }` | 403, 404 |

**Auth middleware**: All routes except `register`, `login`, and the landing page use `getAuthUser()` from `auth-middleware.ts`. Protected routes return 401 if the JWT is missing, invalid, or expired.

---

## 8. Key Technical Decisions

### Decision: Custom Auth (bcrypt + JWT) instead of Supabase Auth

| Option | Tradeoff | Decision |
|--------|----------|----------|
| Supabase Auth | Built-in, easy setup, but limited custom fields, no custom roles without triggers, dependency lock-in | ❌ Rejected |
| NextAuth.js / Auth.js | Established, but heavy for this scope, requires adapter for custom DB schema | ❌ Rejected |
| **Custom bcrypt + JWT** | Full control over users table, roles as first-class citizens, no external auth dependency. Tradeoff: must implement password reset, rate limiting ourselves | ✅ **Chosen** |

**Why**: The `usuarios` table needs `rol_global` (super_admin, empresa_admin, member) and `empresa_id` as core fields. Supabase Auth would require a separate `usuarios` table anyway to store these, creating auth sync complexity. Custom auth gives us a single source of truth.

### Decision: Snapshot-based suscripciones instead of FK to plan template

| Option | Tradeoff | Decision |
|--------|----------|----------|
| FK to `planes_subscription` | Simple, but changing template affects all existing customers retroactively | ❌ Rejected |
| **Snapshot in suscripciones** | Copy values on creation. Changing template only affects new subscriptions. Extra table, but matches real-world subscription behavior | ✅ **Chosen** |

**Why**: Changing `equipos_max` in the Enterprise template should NOT give existing customers more teams unless they re-contract. Snapshot model is the standard SaaS approach. 0 = unlimited is per-company configurable.

### Decision: Application-level tenant isolation instead of RLS

| Option | Tradeoff | Decision |
|--------|----------|----------|
| RLS (Supabase Row Level Security) | Enforced at DB level, but requires Supabase Auth integration, complex policies, hard to debug | ❌ Rejected |
| **Application-level filtering** | Every query includes `empresa_id = $1`. Explicit, testable, no DB magic. Tradeoff: developer discipline required | ✅ **Chosen** |

**Why**: We're using custom auth (not Supabase Auth), so RLS would have no `auth.uid()` to reference. The JWT middleware already extracts `empresa_id` — we pass it explicitly in every query. This is more transparent and debuggable.

### Decision: Native HTML5 DnD instead of a library

| Option | Tradeoff | Decision |
|--------|----------|----------|
| react-beautiful-dnd / dnd-kit | Battle-tested, animations, but 15-30KB+ deps, API changes between versions | ❌ Rejected |
| **Native HTML5 DnD** | Zero deps, cross-browser, simpler for single use-case (card between columns). Tradeoff: more boilerplate for drag ghost, drop zone highlight | ✅ **Chosen** |

**Why**: The only drag-drop requirement is moving cards between 4 columns. Native DnD handles `dragstart` / `dragover` / `drop` events well. The tradeoff (manual ghost/highlight CSS) is minimal for the zero-dependency benefit.

### Decision: Zustand (global) + React Context (board)

| Option | Tradeoff | Decision |
|--------|----------|----------|
| Zustand only | Global state for everything, but board state would persist across navigation | ❌ Rejected |
| Context only | Scoped but no middleware, debugging harder for global auth | ❌ Rejected |
| **Zustand for global, Context for board** | Auth/tenant/active-equipo in Zustand (persists). Board cards/drag in Context (reset per room). Clean separation | ✅ **Chosen** |

**Why**: Auth state and the active equipo selection are needed across all dashboard pages and survive navigation. Board state (cards, drag, groups) is page-scoped and resets when leaving the sala. Combining both gives the right lifecycle for each concern.

### Decision: CSS Modules instead of Tailwind

| Option | Tradeoff | Decision |
|--------|----------|----------|
| Tailwind CSS | Rapid prototyping, utility classes, but verbose JSX, purge config, team familiarity | ❌ Rejected |
| **CSS Modules** | Scoped styles, zero runtime, standard CSS, no build overhead, co-located with components | ✅ **Chosen** |

**Why**: CSS Modules generate unique class names per component by default (no leakage), require no runtime, and use standard CSS syntax. Co-located `.module.css` files next to components keep styles maintainable without fighting utility class verbosity.

---

## 9. Data Flow Diagrams

### Auth Flow

```
┌─────────┐    ┌───────────┐    ┌──────────┐    ┌─────────────┐    ┌───────────┐
│ Browser │    │  Next.js  │    │  API     │    │  Supabase   │    │  Zustand  │
│          │    │ Middleware │    │  Route   │    │  (Postgres) │    │  Store    │
└────┬─────┘    └─────┬─────┘    └────┬─────┘    └──────┬──────┘    └─────┬─────┘
     │                │                │                 │                │
     │  POST /register│                │                 │                │
     │────────────────→│               │                 │                │
     │                 │               │  POST /register │                │
     │                 │──────────────→│                 │                │
     │                 │               │  bcrypt hash    │                │
     │                 │               │   (cost 10)     │                │
     │                 │               │  INSERT usuario │                │
     │                 │               │────────────────→│                │
     │                 │               │  (1st user →    │                │
     │                 │               │   CREATE empresa │                │
     │                 │               │   + suscripcion) │                │
     │                 │               │                 │                │
     │                 │               │  ← user row     │                │
     │                 │               │←────────────────│                │
     │                 │               │                 │                │
     │                 │               │  sign JWT       │                │
     │                 │               │  set httpOnly    │                │
     │                 │               │  cookie          │                │
     │                 │  { user,      │                 │                │
     │                 │    set-cookie }│                 │                │
     │  ← 201 + cookie │←──────────────│                 │                │
     │                 │               │                 │                │
     │  Client stores  │               │                 │                │
     │  user in Zustand│               │                 │                │
     │──────────────────────────────────────────────────────────────→     │
     │                 │               │                 │                │
     │  Navigate to    │               │                 │                │
     │  /dashboard/    │               │                 │                │
     │────────────────→│               │                 │                │
     │                 │  Read cookie  │                 │                │
     │                 │  verify JWT   │                 │                │
     │                 │  set x-user-id│                 │                │
     │                 │  headers      │                 │                │
     │                 │               │ GET /api/auth/me│                │
     │                 │──────────────→│                 │                │
     │                 │               │  SELECT usuario  │                │
     │                 │               │   + suscripcion  │                │
     │                 │               │────────────────→│                │
     │                 │               │← data           │                │
     │                 │               │←────────────────│                │
     │                 │  ← user data  │                 │                │
     │  ← 200          │←──────────────│                 │                │
     │  protected page │               │                 │                │
     │  renders        │               │                 │                │
```

### Board Flow

```
┌───────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌───────────┐
│ User  │    │ Board    │    │ API      │    │ Supabase │    │ Realtime  │
│ A     │    │ Context  │    │ Route    │    │ DB       │    │ Channel   │
└───┬───┘    └────┬─────┘    └────┬─────┘    └────┬─────┘    └─────┬─────┘
    │             │                │               │               │
    │ Load sala   │                │               │               │
    │ /sala/[id]  │                │               │               │
    │────────────→│                │               │               │
    │             │ FETCH initial  │               │               │
    │             │ tarjetas       │               │               │
    │             │───────────────→│──────────────→│               │
    │             │                │               │               │
    │             │← cards + grupos│               │               │
    │             │←───────────────│←──────────────│               │
    │             │                │               │               │
    │             │ SUBSCRIBE to   │               │               │
    │             │ postgres_changes               │               │
    │             │──────────────────────────────────────────────→│
    │             │                │               │               │
    │             │ ← connected    │               │               │
    │             │←──────────────────────────────────────────────│
    │             │                │               │               │
    │ Add card    │                │               │               │
    │ "foo" in    │                │               │               │
    │ column 1    │                │               │               │
    │────────────→│                │               │               │
    │             │ OPTIMISTIC:    │               │               │
    │             │ ADD_CARD       │               │               │
    │             │ (local, in     │               │               │
    │             │  column 1)     │               │               │
    │             │                │               │               │
    │             │ POST /tarjetas │               │               │
    │             │───────────────→│──────────────→│               │
    │             │                │               │               │
    │             │                │               │ INSERT row    │
    │             │                │               │ → triggers    │
    │             │                │               │   Realtime    │
    │             │                │               │──────────────→│
    │             │                │               │               │
    │             │                │               │ Realtime      │
    │             │                │               │ broadcasts    │
    │             │← 201 + tarjeta │               │ to ALL        │
    │             │←───────────────│               │ subscribers   │
    │             │                │               │               │
    │             │ RECONCILE:     │               │──────────────→│
    │             │ server.id =    │               │ (User A & B)  │
    │             │ optimistic.id  │               │               │
    │             │                │               │               │
    │  Card shows │                │               │               │
    │  in column 1│                │               │               │
    │←────────────│                │               │               │
    │             │                │               │               │
    │ Drag card   │                │               │               │
    │ to column 2 │                │               │               │
    │────────────→│                │               │               │
    │             │ OPTIMISTIC:    │               │               │
    │             │ MOVE_CARD      │               │               │
    │             │ (column 2)     │               │               │
    │             │                │               │               │
    │  Card moves │                │               │               │
    │  to col 2   │                │               │               │
    │←────────────│                │               │               │
    │             │ PATCH /tarjetas│               │               │
    │             │ { columna: 2 } │               │               │
    │             │───────────────→│──────────────→│               │
    │             │                │               │               │
    │             │                │               │ UPDATE row    │
    │             │                │               │ → Realtime    │
    │             │                │               │──────────────→│
    │             │                │               │               │
    │             │ ← 200          │               │               │
    │             │←───────────────│               │               │
    │             │                │               │               │
    │ If FAIL     │                │               │               │
    │ MOVE_CARD   │                │               │               │
    │ back to 1   │                │               │               │
    │ + error     │                │               │               │
    │ toast       │                │               │               │
    │             │                │               │               │
    │ Cluster btn │                │               │               │
    │────────────→│                │               │               │
    │             │ POST /cluster  │               │               │
    │             │───────────────→│──────────────→│               │
    │             │                │ Check limit   │               │
    │             │                │ Call Zen      │               │
    │             │                │ Persist       │               │
    │             │                │ ← grupos      │               │
    │             │← grupos        │               │               │
    │  Show group │←───────────────│               │               │
    │  headers    │                │               │               │
    │←────────────│                │               │               │
```

### Subscription Enforcement Flow

```
                   ┌──────────────────────────┐
                   │  Cliente action:          │
                   │  • Create equipo          │
                   │  • POST /api/cluster      │
                   └────────────┬─────────────┘
                                │
                   ┌────────────┴─────────────┐
                   │  GetAuthUser from JWT     │
                   │  → empresa_id             │
                   │  → suscripcion_id         │
                   └────────────┬─────────────┘
                                │
                   ┌────────────┴─────────────┐
                   │  Read suscripcion:        │
                   │  SELECT FROM suscripciones│
                   │  WHERE id = $1            │
                   │  → equipos_max            │
                   │  → clusters_ia_mes        │
                   └────────────┬─────────────┘
                                │
                   ┌────────────┴─────────────┐
                   │  0 = unlimited?           │
                   │  ──→ Yes: skip check      │
                   │  ──→ No: compare count    │
                   └────────────┬─────────────┘
                                │
                   ┌────────────┴─────────────┐
                   │  Within limit?            │
                   │  ──→ Yes: proceed         │
                   │  ──→ No: return 429/403  │
                   │       + upgrade prompt    │
                   └─────────────────────────┘
```

---

## Additional Notes

### OpenCode Zen Client

```typescript
// lib/cluster.ts
const ZEN_API_URL = process.env.ZEN_API_URL!;
const ZEN_API_KEY = process.env.ZEN_API_KEY!;

export async function clusterCards(
  tarjetas: Array<{ id: string; contenido: string }>
): Promise<{ grupos: Array<{ nombre_grupo: string; tarjetas: string[] }> }> {
  const response = await fetch(ZEN_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${ZEN_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'opencode-zen',
      messages: [
        {
          role: 'system',
          content: `Agrupa las siguientes tarjetas de retrospectiva por similitud semántica.
Responde ÚNICAMENTE con un JSON válido en este formato SIN markdown ni explicaciones:
{ "grupos": [{ "nombre_grupo": "string", "tarjetas": ["id1", "id2"] }] }
Grupo "Otros" para tarjetas sin similitud clara.`,
        },
        {
          role: 'user',
          content: JSON.stringify(tarjetas.map(t => ({ id: t.id, contenido: t.contenido }))),
        },
      ],
      temperature: 0.3,
      max_tokens: 2000,
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenCode Zen API error: ${response.status}`);
  }

  const data = await response.json();
  const parsed = JSON.parse(data.choices[0].message.content);
  return parsed;
}
```

### Supabase Configuration

The existing Supabase project (`mrityrauffpzbafqsdxy`) is configured in `opencode.json` via MCP. For the Next.js app:

```env
# .env.local
NEXT_PUBLIC_SUPABASE_URL=https://mrityrauffpzbafqsdxy.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
JWT_SECRET=<random-64-char-secret>
ZEN_API_URL=<opencode-zen-endpoint>
ZEN_API_KEY=<opencode-zen-key>
SUPER_ADMIN_EMAIL=admin@tuempresa.com

# SMTP for emails (password reset + price change notifications)
SMTP_HOST=smtp.tuproveedor.com
SMTP_PORT=587
SMTP_USER=noreply@tuempresa.com
SMTP_PASS=<smtp-password>
SMTP_FROM="Retro Scrum <noreply@tuempresa.com>"
```

### Seed Migration (002_seed_planes.sql)

```sql
INSERT INTO planes_subscription (nombre, descripcion, equipos_max, clusters_ia_mes, precio)
VALUES
  ('Gratuito', 'Plan gratuito para equipos pequeños', 1, 5, 0.00),
  ('Small Team', 'Para equipos que necesitan más retrospectivas', 1, 30, 9.00),
  ('Enterprise', 'Para organizaciones con múltiples equipos', 10, 500, 29.00);
```

### Risks & Mitigations

| Risk | Likelihood | Mitigation | Status |
|------|------------|------------|--------|
| **Tenant isolation bug** leaks data across empresas | High | Every query explicitly filters by `empresa_id` from JWT. Code review MUST verify this in every route. Add integration tests. | ✅ Aceptado |
| **OpenCode Zen latency** blocks clustering UX | Medium | Cluster per-column, show loading spinner, disable button during request. 30s timeout in fetch. | ✅ Aceptado |
| **Drag-drop state race** with Realtime (two users move same card) | Medium | Optimistic local moves are reconciled when Realtime UPDATE arrives. Server state always wins. | ✅ Aceptado |
| **JWT expiration** causes mid-session redirect | Low | 1h expiry is reasonable. `GET /api/auth/me` on page load re-verifies. Refresh could be added later. | ✅ Aceptado |
| **print.css** not supported identically across browsers | Low | Target modern browsers (Chrome, Firefox, Edge). Avoid `-webkit-print-color-adjust` quirks. | ✅ Aceptado |
| **Email sending** for price changes fails | Low | `notificaciones_email` table tracks failures with error_msg. Manual retry or cron. | ✅ Aceptado |
| **Super admin creation** sin mecanismo claro | Medium | Seed DB con email/env var al primer deploy | ✅ Seed DB |
| **Password reset** no implementado | Medium | Se implementa en MVP: token en BD + email con link de reset | ✅ En MVP |
| **Reconexión Realtime** sin refetch al reconectar | Medium | Al reconectar, se hace fetch completo del estado de la sala vía API | ✅ Refetch |

### Decisiones de Riesgos Resueltas

| Decisión | Resolución |
|----------|------------|
| Creación primer super_admin | Seed migration con email configurable (env var `SUPER_ADMIN_EMAIL`). Si no existe, el primer usuario registrado con ese email se marca como super_admin automáticamente. |
| Password reset | Se implementa en MVP. Tabla `reset_tokens` con token + expiry. POST /api/auth/reset-password envía email con link. POST /api/auth/reset-password/confirm actualiza password. |
| Reconexión Realtime | En el hook `useRealtime`, al detectar reconnect via `channel.on('system', { event: 'reconnect' })`, se hace GET /api/salas/[id]/tarjetas para refrescar estado completo. |

### New Capability: Password Reset

Se agrega la capacidad `password-reset` a las existentes:

- Tabla `reset_tokens`: id UUID PK, usuario_id UUID FK, token TEXT (hasheado), expires_at TIMESTAMPTZ, used BOOLEAN DEFAULT FALSE, created_at TIMESTAMPTZ
- POST /api/auth/reset-password: recibe email, genera token, lo guarda hasheado, envía email con link
- GET /reset-password/[token]: página que muestra formulario para nuevo password
- POST /api/auth/reset-password/confirm: recibe token + nueva_password, valida token, hashea y actualiza password, marca token como usado
- El email se envía con nodemailer vía SMTP configurable por env vars

---

## Closed Questions

- [x] ~~Password reset flow~~ → ✅ Implementado en MVP (reset_tokens table + 2 API routes + email)
- [x] ~~Rate limiting for auth endpoints~~ → 🟡 No se implementa en MVP (queda para post-MVP)
- [x] ~~Super admin creation~~ → ✅ Seed DB + env var SUPER_ADMIN_EMAIL
- [x] ~~Reconnection strategy~~ → ✅ Refetch full state on Realtime reconnect
