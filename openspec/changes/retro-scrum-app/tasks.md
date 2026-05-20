# Tasks: retro-scrum-app

Total: 48 tasks · 8 capability groups

---

## Group 1: Foundation — Database + Project Setup

### T-001: Bootstrap Next.js project
- **Priority**: High
- **Depends on**: None
- **Files**: `package.json`, `tsconfig.json`, `next.config.js`, `.env.example`, `.env.local`
- **Description**: Create project with Next.js 14+, TypeScript, install all deps (zustand, bcryptjs, jsonwebtoken, nodemailer, @supabase/supabase-js). Create `.env.example` with all required vars.
- **Acceptance Criteria**:
  - [x] `npm run dev` starts without errors
  - [x] All dependencies in `package.json` match the design spec
  - [x] `.env.example` documents every env var (SUPABASE_URL, SUPABASE_ANON_KEY, JWT_SECRET, SMTP_*, OPENCODE_ZEN_API_KEY)

### T-002: Create all TypeScript types
- **Priority**: High
- **Depends on**: None
- **Files**: `types/index.ts`, `types/auth.ts`, `types/empresa.ts`, `types/plan.ts`, `types/equipo.ts`, `types/sala.ts`, `types/tarjeta.ts`, `types/grupo.ts`, `types/uso-ia.ts`, `types/reset-token.ts`
- **Description**: Create `types/` directory with all domain types matching the DB schema. `index.ts` re-exports all. Include request/response types used in API contracts.
- **Acceptance Criteria**:
  - [x] Every DB table has a corresponding TypeScript interface
  - [x] API request/response types exist for all routes
  - [x] JWT payload type defined with user_id, empresa_id, rol_global, suscripcion_id, iat, exp

### T-003: Run SQL migration (001_schema.sql)
- **Priority**: High
- **Depends on**: T-001
- **Files**: `migrations/001_schema.sql`
- **Description**: Write and apply full DDL: create extensions, all tables (planes_subscription, empresas, suscripciones, usuarios, equipos, usuarios_equipo, invitaciones, salas, tarjetas, grupos, uso_ia, price_changes_log, notificaciones_email), indexes. Apply via Supabase migration tool.
- **Acceptance Criteria**:
  - [ ] All 13 tables created with correct columns, types, and constraints
  - [ ] All FK constraints and CHECK constraints present
  - [ ] All 15 indexes created
  - [ ] `uuid-ossp` extension enabled

### T-004: Run SQL seed (002_seed_planes.sql)
- **Priority**: High
- **Depends on**: T-003
- **Files**: `migrations/002_seed_planes.sql`
- **Description**: Seed 3 subscription plans: Gratuito (1 equipo, 5 clusters, $0), Small Team (1 equipo, 30 clusters, $9), Enterprise (10 equipos, 500 clusters, $29). Apply via Supabase migration tool.
- **Acceptance Criteria**:
  - [ ] 3 rows in `planes_subscription` with correct values
  - [ ] Seed is idempotent (safe to re-run)

### T-005: Set up Supabase clients
- **Priority**: High
- **Depends on**: T-001
- **Files**: `lib/supabase.ts`, `lib/supabase-server.ts`
- **Description**: Create browser-side Supabase client (singleton) and server-side client (for API routes). Uses `@supabase/supabase-js` with public anon key. No Supabase Auth — only DB + Realtime.
- **Acceptance Criteria**:
  - [ ] Browser client can query public tables
  - [ ] Server client can query with service_role when needed
  - [ ] Both exported as named exports

---

## Group 2: Auth System

### T-006: Implement lib/auth.ts
- **Priority**: High
- **Depends on**: T-001
- **Files**: `lib/auth.ts`
- **Description**: Implement `hashPassword`, `verifyPassword` (bcryptjs, cost 10), `signJwt`, `verifyJwt` (jsonwebtoken, 1h expiry). JWT payload includes `user_id`, `empresa_id`, `rol_global`, `suscripcion_id`.
- **Acceptance Criteria**:
  - [ ] `hashPassword` returns hash with cost factor 10
  - [ ] `verifyPassword` matches correct/incorrect passwords
  - [ ] `signJwt` creates valid JWT with all 4 payload fields
  - [ ] `verifyJwt` returns payload for valid token, `null` for expired/invalid

### T-007: Implement lib/auth-middleware.ts
- **Priority**: High
- **Depends on**: T-006
- **Files**: `lib/auth-middleware.ts`
- **Description**: Implement `getAuthUser(request: NextRequest): AuthUser | null` that reads `x-user-id`, `x-empresa-id`, `x-rol-global`, `x-suscripcion-id` headers set by Edge Middleware.
- **Acceptance Criteria**:
  - [ ] Returns `AuthUser` when all headers present
  - [ ] Returns `null` when any header missing
  - [ ] Types match JWT payload shape

### T-008: Implement middleware.ts (Edge Middleware)
- **Priority**: High
- **Depends on**: T-006
- **Files**: `middleware.ts`
- **Description**: Next.js middleware that reads `session` cookie, verifies JWT on `/dashboard/*` routes, forwards user info as headers (`x-user-id`, `x-empresa-id`, `x-rol-global`, `x-suscripcion-id`). Redirects to `/login` on missing/invalid token. Matcher configured for `/dashboard/:path*`.
- **Acceptance Criteria**:
  - [ ] `/dashboard/*` without cookie redirects to `/login`
  - [ ] `/dashboard/*` with valid cookie sets headers and passes through
  - [ ] `/dashboard/*` with expired cookie redirects to `/login` and deletes cookie
  - [ ] `/login` and `/api/auth/*` are NOT intercepted

### T-009: Create auth API routes
- **Priority**: High
- **Depends on**: T-005, T-006, T-007, T-003
- **Files**: `app/api/auth/register/route.ts`, `app/api/auth/login/route.ts`, `app/api/auth/logout/route.ts`, `app/api/auth/me/route.ts`
- **Description**: Four routes:
  - **POST /register**: Hash password, create user. If first user ever → create empresa + suscripcion (Gratuito snapshot) + set `empresa_admin`. Set JWT httpOnly cookie. Return 409 on duplicate email.
  - **POST /login**: Lookup by email, bcrypt compare. Set JWT cookie on success. Return 401 on failure.
  - **POST /logout**: Clear `session` cookie.
  - **GET /me**: Read JWT from cookie, return user data from DB.
- **Acceptance Criteria**:
  - [ ] Register creates empresa only on first user; subsequent users join existing empresa
  - [ ] Register with duplicate email returns 409
  - [ ] Login with wrong password returns 401
  - [ ] Login sets httpOnly, Secure, SameSite=Strict cookie
  - [ ] Logout clears cookie
  - [ ] GET /me returns current user from valid cookie

### T-010: Create login page
- **Priority**: High
- **Depends on**: T-009
- **Files**: `app/login/page.tsx`, `app/login/page.module.css`
- **Description**: Login form with email + password inputs. Calls POST /api/auth/login. On success stores user in Zustand, redirects to `/dashboard`. Shows error on 401. Redirects to `/dashboard` if already authenticated.
- **Acceptance Criteria**:
  - [ ] Form submits email/password to login API
  - [ ] Success redirects to `/dashboard`
  - [ ] Error shows "Credenciales inválidas"
  - [ ] Already-authenticated users redirected away from login

### T-011: Create register page
- **Priority**: High
- **Depends on**: T-009
- **Files**: `app/register/page.tsx`, `app/register/page.module.css`
- **Description**: Register form with email + password + nombre. Calls POST /api/auth/register. On success stores user, redirects to `/dashboard`. Shows error on 409.
- **Acceptance Criteria**:
  - [ ] Form submits email/password/nombre to register API
  - [ ] Success redirects to `/dashboard`
  - [ ] Duplicate email shows "El email ya está registrado"
  - [ ] First-registered user gets empresa_admin role

### T-012: Implement password reset
- **Priority**: Medium
- **Depends on**: T-006, T-005, T-015
- **Files**: `app/api/auth/reset-password/route.ts`, `app/api/auth/reset-password/confirm/route.ts`, `app/reset-password/[token]/page.tsx`, `lib/email.ts`
- **Description**: POST `/api/auth/reset-password` — generates reset token, stores in `reset_tokens` table, sends email. POST `/api/auth/reset-password/confirm` — validates token, updates password_hash. Page at `/reset-password/[token]` — form to enter new password with validation.
- **Acceptance Criteria**:
  - [x] Reset request sends email with token link
  - [x] Token expires after 1 hour
  - [x] Confirm endpoint validates token and updates password
  - [x] Invalid/expired token returns 400

---

## Group 3: Subscription & Usage

### T-013: Implement lib/planes.ts
- **Priority**: High
- **Depends on**: T-005, T-002
- **Files**: `lib/planes.ts`
- **Description**: Limit-checking functions that read from `suscripciones` snapshot (NOT from `planes_subscription`):
  - `getSuscripcionLimits(empresaId)`: returns full plan limits with plan name from join.
  - `checkClusterLimit(empresaId)`: read `uso_ia` for current month, compare with `suscripciones.clusters_ia_mes`. Returns `{ allowed, reason, current, limit }`.
  - `checkTeamLimit(empresaId)`: count equipos, compare with `suscripciones.equipos_max`. Returns `{ allowed, reason }`.
  - `incrementClusterUsage(empresaId)`: calls RPC function to upsert uso_ia increment.
  - 0 = unlimited (treated as null).
- **Acceptance Criteria**:
  - [x] Both functions read limits from `suscripciones` not `planes_subscription`
  - [x] 0 is treated as unlimited (returns `null` for the limit field)
  - [x] Returns current count alongside limit

### T-014: Implement GET /api/uso-ia
- **Priority**: High
- **Depends on**: T-007, T-013
- **Files**: `app/api/uso-ia/route.ts`
- **Description**: Returns subscription info, current AI usage, equipo count, and limits status. Auth required. Reads from `getSuscripcionLimits`.
- **Acceptance Criteria**:
  - [x] Returns all fields per API contract (suscripcion, uso_ia, equipos_count, limit booleans)
  - [x] Returns 401 without auth
  - [x] Limits read from suscripcion snapshot, not plan template

### T-015: Implement lib/email.ts
- **Priority**: Medium
- **Depends on**: T-001
- **Files**: `lib/email.ts`
- **Description**: Nodemailer SMTP client. Functions: `sendPriceChangeEmail(to, planName, oldPrice, newPrice, effectiveDate)`, `sendPasswordResetEmail(to, resetLink)`. SMTP config from env vars.
- **Acceptance Criteria**:
  - [ ] SMTP transport configurable via env vars
  - [ ] Price change email includes plan name, old price, new price, effective date
  - [ ] Password reset email includes reset link
  - [ ] Error returns descriptive message (doesn't throw)

### T-016: Implement POST /api/admin/planes/precio
- **Priority**: Low
- **Depends on**: T-007, T-013, T-015
- **Files**: `app/api/admin/planes/precio/route.ts`
- **Description**: super_admin only. Updates `planes_subscription.precio`, schedules `precio_proximo` + `fecha_efectiva` in all active suscripciones of that plan. Logs in `price_changes_log`. Creates `notificaciones_email` rows and attempts send.
- **Acceptance Criteria**:
  - [x] Only super_admin can call
  - [x] Template price updated immediately
  - [x] Existing suscripciones get precio_proximo, NOT immediate precio change
  - [x] price_changes_log entry created with tipo_cambio='global_template'
  - [x] Notificaciones_email rows created and send attempted
  - [x] Returns count of affected suscripciones and email stats

### T-017: Implement POST /api/admin/suscripciones/:id/limites
- **Priority**: Low
- **Depends on**: T-007, T-013
- **Files**: `app/api/admin/suscripciones/[id]/limites/route.ts`
- **Description**: super_admin only. Override `equipos_max` and/or `clusters_ia_mes` for a specific suscripcion. Does NOT affect template or other suscripciones.
- **Acceptance Criteria**:
  - [x] Only super_admin can call
  - [x] Only specified fields updated; others preserved
  - [x] Template unchanged
  - [x] Returns updated limits in response

### T-017b: Implement POST /api/admin/suscripciones/aplicar-cambios
- **Priority**: Low
- **Depends on**: T-016
- **Files**: `app/api/admin/suscripciones/aplicar-cambios/route.ts`
- **Description**: Applies all scheduled price changes where fecha_efectiva_proximo_cambio <= today. Uses `apply_scheduled_price_changes()` SQL function. super_admin only.
- **Acceptance Criteria**:
  - [x] Only super_admin can call
  - [x] Finds suscripciones with fecha_efectiva_proximo_cambio <= today
  - [x] Updates precio = precio_proximo, clears scheduling fields
  - [x] Returns count of updated suscripciones

---

## Group 4: Team Management

### T-018: Implement equipos list + create API
- **Priority**: High
- **Depends on**: T-007, T-013
- **Files**: `app/api/equipos/route.ts`
- **Description**: GET `/api/equipos` — list all equipos for auth user's empresa with `miembros_count`. POST `/api/equipos` — create equipo with plan limit check via `checkEquipoLimit`. Returns 403 if limit reached.
- **Acceptance Criteria**:
  - [x] GET returns equipos scoped to auth user's empresa_id
  - [x] POST creates equipo when within plan limit
  - [x] POST returns 403 when equipo limit reached
  - [x] Non-admin users blocked from POST

### T-019: Implement equipo update + delete API
- **Priority**: High
- **Depends on**: T-018
- **Files**: `app/api/equipos/[equipoId]/route.ts`
- **Description**: PATCH to rename equipo, DELETE to remove. Both scoped to auth user's empresa. Only empresa_admin can call.
- **Acceptance Criteria**:
  - [x] PATCH updates nombre
  - [x] DELETE removes equipo and cascades
  - [x] 404 when equipo not found in user's empresa
  - [x] empresa_admin or team_admin required

### T-020: Implement miembros API routes
- **Priority**: High
- **Depends on**: T-018
- **Files**: `app/api/equipos/[equipoId]/invitar/route.ts`, `app/api/equipos/[equipoId]/miembros/route.ts`, `app/api/invitaciones/[token]/route.ts`
- **Description**: POST `.../invitar` — invite by email. If user exists in empresa → add directly to `usuarios_equipo`. If not → create `invitaciones` row. GET `.../miembros` — list members. GET/POST `.../invitaciones/[token]` — view and accept invitation.
- **Acceptance Criteria**:
  - [x] Inviting existing user adds them to equipo immediately
  - [x] Inviting non-existing user creates pending invitation
  - [x] Accepting invitation validates email match and adds user
  - [x] Only team_admin/empresa_admin can manage members

### T-021: Create UI primitives (shared)
- **Priority**: High
- **Depends on**: T-001
- **Files**: `components/ui/Toast.tsx`, `components/ui/Toast.module.css`, `components/ui/Modal.tsx`, `components/ui/Button.tsx`, `components/ui/Button.module.css`, `components/ui/LoadingSpinner.tsx`, `components/ui/LoadingSpinner.module.css`
- **Description**: Build shared UI components: Toast (auto-dismiss, error/success variants), Modal (overlay + close), Button (primary/secondary variants), LoadingSpinner. All CSS Modules. Used across all dashboard pages.
- **Acceptance Criteria**:
  - [ ] Toast auto-dismisses after 3s
  - [ ] Modal closes on overlay click and Escape key
  - [ ] Button has primary and secondary variants
  - [ ] LoadingSpinner visible during async operations

### T-022: Create equipos page in dashboard
- **Priority**: High
- **Depends on**: T-018, T-019, T-020, T-044, T-021
- **Files**: `app/dashboard/equipos/page.tsx`, `app/dashboard/equipos/equipos.module.css`
- **Description**: Team management page showing equipo list with member count. Create button with inline form. Card per equipo with action buttons. Shows limit info from subscription.
- **Acceptance Criteria**:
  - [x] List shows all equipos with member counts
  - [x] Create opens form, submits to POST /api/equipos
  - [ ] Member list shows all members with roles (pending MiembroList component)
  - [ ] Invite form sends invitation by email (pending InviteForm component)
  - [x] Remove member/equipo button works with confirmation
  - [ ] Shows plan limit info when at capacity (pending UsageIndicator)

---

## Group 5: Sala & Board

### T-023: Implement salas API routes
- **Priority**: High
- **Depends on**: T-007, T-018
- **Files**: `app/api/equipos/[equipoId]/salas/route.ts`, `app/api/salas/[salaId]/route.ts`
- **Description**: GET/POST `/api/equipos/:equipoId/salas` — list (with tarjetas_count), create. PATCH `/api/salas/:salaId` — rename, archive. Auth checks equipo membership. Archive sets estado='archivada' (soft delete).
- **Acceptance Criteria**:
  - [ ] GET returns salas with tarjetas_count
  - [ ] POST creates sala with estado='activa'
  - [ ] PATCH can rename and archive
  - [ ] Archived salas preserve data
  - [ ] Non-members get 403
  - [ ] Only team_admin can create/modify

### T-024: Create Implement salas list in dashboard
- **Priority**: High
- **Depends on**: T-023, T-044
- **Files**: `app/dashboard/page.tsx`, `app/dashboard/page.module.css`, `components/dashboard/SalaList.tsx`, `components/dashboard/SalaList.module.css`
- **Description**: Dashboard home page showing list of salas for the active equipo. Filter between active/archived. Create sala button for team_admins. Shows tarjetas_count per sala.
- **Acceptance Criteria**:
  - [ ] Shows salas for currently selected equipo
  - [ ] Active/archived filter works
  - [ ] Create sala button visible for team_admins
  - [ ] Clicking sala navigates to /dashboard/sala/[id]

### T-025: Create BoardContext.tsx
- **Priority**: High
- **Depends on**: T-002
- **Files**: `contexts/BoardContext.tsx`
- **Description**: Reducer-based React Context for board state. State: `cards` (Record<string, Tarjeta>), `grupos` (Grupo[]), `dragState`, `isRealtimeConnected`. Actions: ADD_CARD, MOVE_CARD, REMOVE_CARD, SET_GRUPOS, SET_CONNECTED, RECONCILE (server state wins).
- **Acceptance Criteria**:
  - [ ] Reducer handles all 6 action types
  - [ ] RECONCILE properly replaces existing card state
  - [ ] State resets on context unmount
  - [ ] Exports BoardProvider and useBoardContext hook

### T-026: Implement useRealtimeCards hook
- **Priority**: High
- **Depends on**: T-005, T-025
- **Files**: `hooks/useRealtimeCards.ts`
- **Description**: Hook that opens Supabase channel `sala-{salaId}`, subscribes to `postgres_changes` on `tarjetas` with filter `sala_id=eq.{salaId}`. Dispatches ADD_CARD/REMOVE_CARD/RECONCILE to BoardContext. Cleans up on unmount. Updates SET_CONNECTED on status change.
- **Acceptance Criteria**:
  - [ ] Subscribes to correct channel with sala_id filter
  - [ ] INSERT events dispatch ADD_CARD
  - [ ] UPDATE events dispatch RECONCILE
  - [ ] DELETE events dispatch REMOVE_CARD
  - [ ] Channel removed on unmount (no memory leaks)
  - [ ] SET_CONNECTED dispatched on subscribe/error

### T-027: Create tarjetas API routes
- **Priority**: High
- **Depends on**: T-007, T-023
- **Files**: `app/api/salas/[salaId]/tarjetas/route.ts`, `app/api/tarjetas/[tarjetaId]/route.ts`
- **Description**: POST `/api/salas/:salaId/tarjetas` — create card with contenido, columna, autor_id. Validates non-empty content. PATCH `/api/tarjetas/:tarjetaId` — update columna (for drag-drop) and/or contenido.
- **Acceptance Criteria**:
  - [ ] POST creates card with correct sala_id, columna, contenido
  - [ ] POST rejects empty content with 400
  - [ ] PATCH updates columna and/or contenido
  - [ ] PATCH validates columna is 1-4
  - [ ] Only members of sala's equipo can create/update cards

### T-028: Create Card component
- **Priority**: High
- **Depends on**: T-025
- **Files**: `components/board/Card.tsx`, `components/board/Card.module.css`
- **Description**: Draggable card showing contenido, author name, created_at. Implements `draggable`, `onDragStart`. Visual ghost effect during drag via CSS. Shows grupo color indicator if clustered.
- **Acceptance Criteria**:
  - [ ] Card renders contenido and author
  - [ ] Implements HTML5 draggable with correct data transfer
  - [ ] Ghost effect visible during drag
  - [ ] Grupo indicator visible when card has grupo_id

### T-029: Create Column component
- **Priority**: High
- **Depends on**: T-025, T-028
- **Files**: `components/board/Column.tsx`, `components/board/Column.module.css`
- **Description**: Board column with header (title + card count), Card list, CardForm inline. Implements `onDragOver` (prevent default), `onDrop` handler that dispatches MOVE_CARD. Shows drop zone highlight on dragover. Renders GroupHeader when cards have AI groups.
- **Acceptance Criteria**:
  - [x] Shows column title ("Start", "Stop", "Continue", "Action Items")
  - [x] Shows card count
  - [x] Drop zone highlights on dragover
  - [x] Drop dispatches MOVE_CARD to BoardContext
  - [ ] Renders GroupHeader for clustered cards
  - [x] Renders Card for each card in column

### T-030: Create Board component
- **Priority**: High
- **Depends on**: T-025, T-026, T-029
- **Files**: `components/board/Board.tsx`, `components/board/Board.module.css`
- **Description**: Main board container. Wraps BoardProvider. Renders 4 Column components. Uses useRealtimeCards hook. Shows ClusterButton, ExportMenu, RealtimeIndicator. Initial fetch of cards+grupos from API on mount.
- **Acceptance Criteria**:
  - [x] 4 columns rendered correctly
  - [x] Initial data fetch loads cards and grupos
  - [x] Realtime subscription active via hook
  - [ ] ClusterButton visible per column
  - [ ] ExportMenu visible
  - [ ] RealtimeIndicator visible when disconnected

### T-031: Create CardForm component
- **Priority**: High
- **Depends on**: T-025, T-027
- **Files**: `components/board/CardForm.tsx`, `components/board/CardForm.module.css`
- **Description**: Inline textarea form at bottom of each column. Multiline input. Submit button. Validates non-empty content. On submit: optimistically dispatch ADD_CARD, POST to API, on failure revert + show toast.
- **Acceptance Criteria**:
  - [ ] Multiline textarea input
  - [ ] Submit on button click or Ctrl+Enter
  - [ ] Optimistic ADD_CARD dispatched immediately
  - [ ] Empty content rejected with client validation
  - [ ] Failed API call reverts card and shows error toast

### T-032: Implement drag-drop between columns
- **Priority**: High
- **Depends on**: T-028, T-029, T-025, T-027
- **Files**: (modifies) `components/board/Column.tsx`, `components/board/Card.tsx`
- **Description**: Wire up native HTML5 DnD flow:
   1. Card `onDragStart` stores `cardId` + `sourceColumn` in BoardContext.dragState
   2. Column `onDragOver` prevents default, highlights
   3. Column `onDrop` dispatches MOVE_CARD (optimistic), PATCH API
   4. On API failure → dispatch MOVE_CARD back to source, show error toast
   5. Realtime RECONCILE lands and server state wins if conflict
- **Acceptance Criteria**:
  - [x] Card follows cursor during drag
  - [x] Drop zone highlights on valid targets
  - [x] Card moves to target column optimistically
  - [x] API failure reverts card to original position
  - [ ] Realtime reconcile handles concurrent moves correctly

### T-033: Create AuthGuard and Zustand auth store
- **Priority**: High
- **Depends on**: T-009
- **Files**: `stores/auth-store.ts`, `components/AuthGuard.tsx`, `contexts/AuthContext.tsx`
- **Description**: Zustand store with user, isLoading, equipoActivo. AuthContext provider calls GET /api/auth/me on mount to hydrate user. AuthGuard component wraps dashboard pages, redirects to /login if not authenticated. Exposes useAuth hook.
- **Acceptance Criteria**:
  - [ ] Store initialized with null user and isLoading=true
  - [ ] AuthContext calls GET /me on mount
  - [ ] AuthGuard shows loading spinner while checking, redirects if null
  - [ ] equipoActivo setter/getter works in Zustand

### T-034: Create sala board page
- **Priority**: High
- **Depends on**: T-030, T-033
- **Files**: `app/dashboard/sala/[id]/page.tsx`
- **Description**: Page that loads sala data, wraps Board component. Checks user is member of the sala's equipo. Shows 404 if sala not found or access denied.
- **Acceptance Criteria**:
  - [x] Loads sala data server-side
  - [x] Checks equipo membership
  - [x] Renders Board component with correct salaId
  - [ ] 404/redirect on unauthorized access

---

## Group 6: AI Clustering

### T-035: Implement lib/cluster.ts
- **Priority**: Medium
- **Depends on**: T-001
- **Files**: `lib/cluster.ts`
- **Description**: OpenCode Zen API client. Function `clusterCards(tarjetas: Array<{id, contenido}>): Promise<GrupoResponse>` sends POST request with system prompt that enforces JSON output. Includes validation (`isValidClusterResponse`). Returns parsed groups.
- **Acceptance Criteria**:
  - [ ] Calls OpenCode Zen API with correct system prompt
  - [ ] System prompt enforces strict JSON output
  - [ ] Validates response has `grupos` array with `nombre_grupo` and `tarjetas` array
  - [ ] Throws on invalid/malformed response
  - [ ] API key read from env var

### T-036: Implement POST /api/cluster
- **Priority**: Medium
- **Depends on**: T-007, T-013, T-035
- **Files**: `app/api/cluster/route.ts`
- **Description**: Clustering endpoint. Validates body (sala_id, columna, tarjetas). Checks cluster limit via `checkClusterLimit`. Calls `clusterCards`. Validates response. Persists grupos + updates tarjetas.grupo_id + increments `uso_ia` in transaction. Returns 400 empty, 429 limit, 502 AI error.
- **Acceptance Criteria**:
  - [ ] Validates tarjetas array not empty → 400
  - [ ] Checks cluster limit → 429 if exceeded
  - [ ] Calls clusterCards with correct input
  - [ ] Validates AI response → 502 on invalid
  - [ ] Persists grupos, updates tarjetas, increments uso_ia in one transaction
  - [ ] Returns formatted grupos with tarjetas

### T-037: Create ClusterButton and GroupHeader components
- **Priority**: Medium
- **Depends on**: T-036, T-025
- **Files**: `components/board/ClusterButton.tsx`, `components/board/ClusterButton.module.css`, `components/board/GroupHeader.tsx`, `components/board/GroupHeader.module.css`
- **Description**: ClusterButton per column — calls POST /api/cluster with column's cards, shows loading state, disabled if no cards or limit reached. GroupHeader shows AI group name with colored accent bar. RealtimeIndicator shows connection status.
- **Acceptance Criteria**:
  - [ ] ClusterButton disabled when column has 0 cards
  - [ ] Shows loading spinner during API call
  - [ ] Disabled with tooltip when limit reached
  - [ ] GroupHeader renders with colored accent
  - [ ] Error toast on clustering failure
  - [ ] Groups displayed above their cards in column

### T-038: Wire usage limit check + increment into UI
- **Priority**: Medium
- **Depends on**: T-037, T-014
- **Files**: `hooks/useLimits.ts`, `components/dashboard/UsageIndicator.tsx`, `components/dashboard/UsageIndicator.module.css`
- **Description**: Hook that calls GET /api/uso-ia periodically. Returns cluster limit status, equipo limit status, usage counts. UsageIndicator component shows "X/Y clusters usados este mes" in sidebar/header. ClusterButton reads from this hook.
- **Acceptance Criteria**:
  - [ ] useLimits fetches usage data from API
  - [ ] UsageIndicator shows clusters_usados / clusters_ia_mes
  - [ ] ClusterButton disabled when clusters_ia_mes reached
  - [ ] Shows warning when approaching limit (e.g., 80%)

---

## Group 7: Export

### T-039: Implement lib/markdown.ts
- **Priority**: Medium
- **Depends on**: T-002
- **Files**: `lib/markdown.ts`
- **Description**: Client-side Markdown generation. `generateRetroMd(sala: Sala, cards: Tarjeta[], grupos: Grupo[], authorName: string): string` produces formatted .md string with 4 column sections, AI group subheadings, and "Sin agrupar" fallback. Downloads via Blob + URL.createObjectURL.
- **Acceptance Criteria**:
  - [ ] Generates document header with sala name + date + author
  - [ ] 4 column sections with ## headings
  - [ ] AI groups as ### subheadings within each column
  - [ ] Unclustered cards under "### Sin agrupar"
  - [ ] Each card formatted as "- [content] — @author"
  - [ ] Empty columns show "(Sin tarjetas)"

### T-040: Create export panel MD component
- **Priority**: Medium
- **Depends on**: T-025, T-039
- **Files**: `components/board/ExportMenu.tsx`, `components/board/ExportMenu.module.css`
- **Description**: Dropdown/button that triggers Markdown download. Reads cards + grupos from BoardContext. Calls `generateRetroMd`. Triggers browser download with filename `retro-{sala-name}-{YYYY-MM-DD}.md`.
- **Acceptance Criteria**:
  - [ ] Button visible in board header
  - [ ] Click triggers .md file download
  - [ ] Filename matches pattern `retro-{sala-name}-{date}.md`
  - [ ] Special characters in sala name sanitized

### T-041: Create styles/print.css
- **Priority**: Medium
- **Depends on**: None (pure CSS)
- **Files**: `styles/print.css`
- **Description**: Full `@media print` stylesheet. @page A4 with 2cm margins. Hides all `.no-print` elements, buttons, nav, scrollbars. Shows `.print-only` elements. Professional serif/sans-serif typography. Black on white. Page breaks between column sections. Empty columns omitted via CSS.
- **Acceptance Criteria**:
  - [ ] @page set to A4 with 2cm margins
  - [ ] All UI chrome hidden (display: none)
  - [ ] Print header visible only in print
  - [ ] Page breaks between columns
  - [ ] Georgia/Times New Roman for body, Arial/Helvetica for headings
  - [ ] Black on white, no background colors
  - [ ] Empty columns not visible in print

### T-042: Create export panel PDF component
- **Priority**: Medium
- **Depends on**: T-025, T-041
- **Files**: (modifies) `components/board/ExportMenu.tsx`, `components/board/PrintLayout.tsx`, `components/board/PrintLayout.module.css`
- **Description**: Extend ExportMenu with PDF option (or separate button). On click: shows PrintLayout component, calls `window.print()`. PrintLayout is a `.print-only` component with retro name, date, formatted cards. Import `styles/print.css`.
- **Acceptance Criteria**:
  - [ ] Click opens browser print dialog
  - [ ] Print preview shows A4 layout with correct typography
  - [ ] Only content (no UI) visible in print preview
  - [ ] Page breaks between columns
  - [ ] Empty columns omitted

---

## Group 8: Polish

### T-043: Create landing page
- **Priority**: Medium
- **Depends on**: T-033, T-010
- **Files**: `app/page.tsx`, `styles/landing.module.css`, `app/globals.css`
- **Description**: Public landing page. Hero section with app name, description, CTA buttons (Login / Register). Features section. Footer. Clean professional design. `globals.css` provides CSS variables, reset, base typography.
- **Acceptance Criteria**:
  - [ ] Hero section with CTA buttons
  - [ ] Features section (retro boards, AI clustering, export)
  - [ ] Responsive layout
  - [ ] Already-authenticated users redirected to /dashboard

### T-044: Create dashboard layout with sidebar
- **Priority**: High
- **Depends on**: T-033, T-021
- **Files**: `app/dashboard/layout.tsx`, `app/dashboard/dashboard.module.css`
- **Description**: Dashboard shell: Sidebar with nav links (Inicio, Equipos, Configuración), user info, logout button. Main content area renders children. Reads user from `/api/auth/me` on mount.
- **Acceptance Criteria**:
  - [x] Sidebar shows nav links with active state
  - [ ] TeamSelector shows equipo list from API (pending)
  - [ ] Selecting equipo updates Zustand (pending)
  - [ ] UsageIndicator shows current plan info (pending)
  - [ ] Layout responsive (collapsible sidebar on mobile)
  - [x] Logout button clears session

### T-045: Create configuracion page
- **Priority**: Medium
- **Depends on**: T-014, T-033, T-044
- **Files**: `app/dashboard/configuracion/page.tsx`, `app/dashboard/configuracion/page.module.css`
- **Description**: Shows plan information: plan name, limits (equipos, clusters), current usage, next price change if scheduled. Simple information page — no upgrade flow in MVP.
- **Acceptance Criteria**:
  - [ ] Shows subscription plan name and status
  - [ ] Shows equipos_max and current equipo count
  - [ ] Shows clusters_ia_mes and current usage
  - [ ] Shows precio_proximo and fecha_efectiva if scheduled
  - [ ] Data from GET /api/uso-ia

### T-046: Implement loading states and error handling
- **Priority**: Medium
- **Depends on**: T-021, T-030, T-022, T-024, T-045
- **Files**: (modifications throughout)
- **Description**: Add loading skeletons for board, equipo list, sala list. Error boundaries for API calls. Empty states ("No hay equipos aún", "No hay tarjetas en esta columna"). Toast notifications for all mutations. Consistent error UX.
- **Acceptance Criteria**:
  - [ ] Loading skeleton shown during initial data fetch
  - [ ] Error states show retry option
  - [ ] Empty states have helpful message and CTA
  - [ ] All mutations show success/error toast
  - [ ] Network errors don't crash the page

### T-047: Final integration and smoke testing
- **Priority**: High
- **Depends on**: All prior tasks
- **Files**: N/A (verification)
- **Description**: End-to-end smoke test of full flow:
  1. Register → creates empresa + suscripcion
  2. Login → redirects to dashboard
  3. Create equipo → appears in list
  4. Invite user → show pending, then register → auto-join
  5. Create sala → appears in dashboard
  6. Open board → 4 columns visible
  7. Add card → appears optimistically, realtime to other window
  8. Drag card → moves between columns
  9. Cluster → groups created, usage incremented
  10. Export MD → file downloads
  11. Export PDF → print dialog with clean layout
  12. Config page → shows plan info
- **Acceptance Criteria**:
  - [ ] Full flow works end-to-end
  - [ ] No console errors
  - [ ] Tenant isolation verified (second user in different empresa sees no cross-data)

---

## Summary

| Group | Tasks | Focus |
|-------|-------|-------|
| 1. Foundation | T-001 — T-005 | Bootstrap, types, migration, seed, supabase client |
| 2. Auth System | T-006 — T-012 | Auth lib, middleware, API routes, pages, password reset |
| 3. Subscription | T-013 — T-017 | Plan limits, usage API, email, admin price/limit routes |
| 4. Team | T-018 — T-022 | Equipos API, miembros, UI primitives, equipos page |
| 5. Sala & Board | T-023 — T-034 | Salas API, board context, realtime, board components, drag-drop |
| 6. AI Clustering | T-035 — T-038 | Cluster lib, API, button UI, usage indicator |
| 7. Export | T-039 — T-042 | Markdown lib, MD export, print CSS, PDF export |
| 8. Polish | T-043 — T-047 | Landing, layout, config, loading states, smoke test |

**Total tasks**: 47 (1-47 numbering, but actually T-001 through T-047 = 47 tasks)

Wait, let me recount:
- G1: T-001, T-002, T-003, T-004, T-005 = 5
- G2: T-006, T-007, T-008, T-009, T-010, T-011, T-012 = 7
- G3: T-013, T-014, T-015, T-016, T-017 = 5
- G4: T-018, T-019, T-020, T-021, T-022 = 5
- G5: T-023, T-024, T-025, T-026, T-027, T-028, T-029, T-030, T-031, T-032, T-033, T-034 = 12
- G6: T-035, T-036, T-037, T-038 = 4
- G7: T-039, T-040, T-041, T-042 = 4
- G8: T-043, T-044, T-045, T-046, T-047 = 5

Total: 5+7+5+5+12+4+4+5 = 47 tasks

## Critical Path

The longest dependency chain (sequential tasks):

```
T-001 → T-005 → T-006 → T-007 → T-008 → T-009 → T-010
                                              ↘ T-033 → T-044
  → T-018 → T-019 → T-020 → T-022
  → T-023 → T-024 → T-025 → T-026 → T-028 → T-029 → T-030 → T-032 → T-034
                                                                       ↘ T-040 (after T-039)
                                                                       ↘ T-042 (after T-041)
  → T-035 → T-036 → T-037
  → T-043 → T-045 → T-046 → T-047
```

~16 tasks in the absolute critical path. Many groups run in parallel:
- G3 (Subscription) runs parallel to G4 (Team)
- G7 (Export) runs parallel to G6 (AI)
- Password reset (T-012) is non-blocking

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Race condition: optimistic DnD vs Realtime | Medium | RECONCILE action always prefers server state; rollback on API failure |
| TeamSelector causes Zustand hydration mismatch | Low | Initialize equipoActivo from first equipo on equipos fetch |
| OpenCode Zen latency during clustering | Medium | ClusterButton shows loading state; debounce; limit is per-column |
| Email sending (SMTP) in dev environment | Low | SMTP env vars optional; email errors logged, not blocking; use Ethereal for dev |
| Custom auth security: no rate limiting | Medium | Add rate limiting middleware before MVP launch (out of scope for now, noted) |
