# Proposal: retro-scrum-app

## Intent

Replace scattered post-meeting notes and manual spreadsheets with a **multi-tenant SaaS** for collaborative Scrum Retrospectives. Teams run sprints, add cards simultaneously to 4 fixed columns, AI clusters similar ideas, and results export as Markdown or PDF. Each company is a tenant with its own teams, users, and subscription plan.

## Scope

### In Scope

- Next.js 14+ (App Router) full-stack app with TypeScript
- Supabase DB (6+ tables) + `postgres_changes` Realtime
- **Multi-tenant architecture**: 1 empresa = 1 tenant con aislamiento de datos
- **Auth**: Sistema de registro/login propio con tabla `usuarios`, JWT + httpOnly cookies, bcrypt para passwords
- **Gestión de empresas**: Creación de tenant, onboarding
- **Gestión de equipos**: CRUD de equipos dentro de cada empresa
- **Gestión de usuarios por equipo**: Invitación y roles (admin/member)
- **Planes de suscripción**:
  - **Gratuito**: 1 equipo, usuarios ilimitados en ese equipo, 5 clusters IA/mes
  - **Small Team**: 1 equipo (una empresa con 1 solo equipo, trato como empresa unipersonal), 30 clusters IA/mes
  - **Enterprise**: equipos ilimitados, 200 clusters IA/mes
- **Tracking de uso IA**: Contador mensual por empresa, bloqueo al exceder el límite
- 4-column Kanban-style retrospective board (fixed columns)
- Inline card creation per column
- Native HTML5 drag-and-drop between columns
- AI clustering via `/api/cluster` → OpenCode Zen with strict JSON output
- Markdown export (.md download)
- PDF export via `@media print` CSS + professional print layout
- Dashboard principal con selector de equipo y lista de salas

### Out of Scope

- Edit / delete cards (MVP: add + move + archive only)
- Custom column configuration
- Export to Jira / Notion / Trello
- Integración con calendarios o sprints
- Pagos online automatizados (la suscripción se asigna manualmente en MVP)

## Jerarquía de Datos

```
Empresa (tenant) ─── Plan Suscripción
├── Equipo 1
│   ├── Usuarios (con roles)
│   ├── Sala "Sprint 25"
│   │   ├── Tarjetas (columna 1-4)
│   │   └── Grupos IA (clusters semánticos)
│   └── Sala "Sprint 26"
├── Equipo 2
│   └── ...
└── Uso IA (contador mensual)
```

## Capabilities

> Contract between proposal and specs phases.

### New Capabilities
- `auth-and-onboarding`: Registro, login, creación de empresa/tenant
- `subscription-plans`: Planes, límites, tracking de uso IA
- `team-management`: CRUD de equipos, invitación de usuarios, roles
- `sala-management`: Creación y acceso a salas de retrospectiva por equipo
- `real-time-board`: 4-column board with live Supabase Realtime subscriptions
- `card-management`: Add cards inline, drag-drop between columns without data loss
- `ai-clustering`: Cluster cards semantically via OpenCode Zen API, store groups
- `export-markdown`: Download structured .md summary
- `export-pdf`: Print-friendly PDF via dedicated `@media print` stylesheet

### Modified Capabilities
None — greenfield project.

## Approach

### Schema de Base de Datos

| Tabla | Propósito |
|-------|-----------|
| `empresas` | Tenants. FK a `planes_subscription` |
| `planes_subscription` | Catálogo de planes (gratuito, small, enterprise) |
| `equipos` | Equipos dentro de una empresa |
| `usuarios` | Usuarios del sistema con email, password_hash, nombre, rol global (super_admin, empresa_admin, member) |
| `usuarios_equipo` | Relación usuario-equipo con rol específico dentro del equipo (team_admin, member) |
| `salas` | Salas de retro, pertenecen a un equipo |
| `tarjetas` | Cards en columnas 1-4 de cada sala |
| `grupos` | Agrupaciones IA de tarjetas |
| `uso_ia` | Contador mensual de clusters por empresa |

### Arquitectura

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Routing | Next.js App Router + react-router-dom | App Router for pages (`/`, `/dashboard`, `/sala/[id]`); react-router-dom for in-board tabs (cluster view, export panel) |
| Auth | Custom (bcrypt + JWT + httpOnly cookies) | Tabla `usuarios` con roles. Sin dependencia de Supabase Auth ni Auth.js |
| Multi-tenant | Row-Level Security + `empresa_id` en cada tabla | Aislamiento por fila, no por base de datos (más económico) |
| Styling | CSS Modules | Scoped, no runtime, no Tailwind dependency |
| Drag-drop | Native HTML5 Drag & Drop API | Zero deps; cross-browser |
| Real-time | Supabase `channel().on('postgres_changes', ...)` | One channel per `sala_id`, filter by INSERT/UPDATE on `tarjetas` |
| AI clustering | `/api/cluster` route → OpenCode Zen | System prompt enforces `{ grupos: [{ nombre, tarjetas: [id] }] }` |
| Export md | `blob()` + `URL.createObjectURL` | Native, no library needed |
| Export pdf | `window.print()` + print CSS | Zero deps, professional layout |
| State | React Context (board-level) + Zustand (global) | Zustand for auth/tenant state, Context for board |
| Límites IA | Check before API call + disable button | UX clara cuando se alcanza el límite |

### Planes de Suscripción

| Plan | Equipos | Clusters IA/mes | Precio |
|------|---------|-----------------|--------|
| Gratuito | 1 | 5 | $0 |
| Small Team | 1 | 30 | $9/mes |
| Enterprise | Ilimitados | 200 | $29/mes |

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `app/page.tsx` | New | Landing page |
| `app/login/page.tsx` | New | Login/registro |
| `app/dashboard/layout.tsx` | New | Dashboard layout con sidebar de equipos |
| `app/dashboard/page.tsx` | New | Dashboard principal con lista de salas |
| `app/dashboard/sala/[id]/page.tsx` | New | Board page |
| `app/dashboard/equipos/page.tsx` | New | CRUD de equipos |
| `app/dashboard/configuracion/page.tsx` | New | Plan, billing, límites |
| `app/api/cluster/route.ts` | New | POST handler → OpenCode Zen |
| `app/api/uso-ia/route.ts` | New | GET current usage, POST increment |
| `components/` | New | Varios componentes |
| `lib/supabase.ts` | New | Supabase client singleton (browser + server) |
| `lib/realtime.ts` | New | React hook for `postgres_changes` |
| `lib/cluster.ts` | New | OpenCode Zen API client |
| `lib/auth.ts` | New | JWT helpers, password hashing, cookie management |
| `middleware.ts` | New | Next.js middleware para proteger rutas del dashboard |
| `lib/planes.ts` | New | Plan limits and validation logic |
| `contexts/` | New | AuthContext, BoardContext |
| `types/` | New | All TypeScript types |
| `styles/` | New | CSS Modules + print.css |
| `migrations/001_schema.sql` | New | Full DDL |
| `migrations/002_seed_planes.sql` | New | Seed subscription plans |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| OpenCode Zen latency on clustering | Medium | Cluster per-column, show loading, debounce |
| RLS policies incorrect → data leak | High | Test policies thoroughly; usar `using (empresa_id = ...)` |
| Drag-drop state race with Realtime | Medium | Optimistic local + server confirm; reconcile on conflict |
| Multi-tenant performance with RLS | Low | Index on `empresa_id` in all tables |
| Costo IA si muchos clusters | Low | Límites duros por plan + tracking de uso |
| React Router + App Router conflict | Low | react-router-dom only for _internal_ tab navigation |

## Rollback Plan

1. AI clustering behind env var — disable without deploy
2. All DB columns nullable or with defaults
3. Feature flags for subscription gating
4. Git revert on critical bug

## Dependencies

- Supabase project (`mrityrauffpzbafqsdxy`)
- OpenCode Zen API endpoint + valid API key in env
- Supabase Auth (built-in)
- Node.js 18+, npm/pnpm
- react-router-dom (for in-dashboard navigation)
- zustand (for global state)

## Success Criteria

- [ ] 2+ usuarios en misma sala ven tarjetas en tiempo real
- [ ] Una empresa no puede ver datos de otra empresa
- [ ] Plan gratuito bloquea clustering al llegar al límite mensual
- [ ] AI clustering returns valid JSON 100% of API calls
- [ ] Invitación a equipo funciona y asigna rol correcto
- [ ] Markdown export produces clean file with 4 sections
- [ ] PDF print layout shows professional A4-ready document
- [ ] Full flow: registro → crear empresa → invitar usuario → crear equipo → crear sala → agregar tarjetas → cluster → exportar
