# Subscription Plans Specification

## Purpose

Manage subscription tiers (Free, Small Team, Enterprise) with limits that **se snapshottean al momento de contratar** en la tabla `suscripciones`. `planes_subscription` es el catálogo/template de planes disponibles. Cada empresa tiene su propia suscripción con los valores que regían cuando contrató. Cambiar el template NO afecta suscripciones existentes (excepto precio, con aviso previo).

## Data Models

### planes_subscription (catalogo / template)

Define los planes disponibles. Es el "menú". Cambiar estos valores SOLO afecta a nuevas suscripciones.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | UUID PK | |
| nombre | TEXT | Nombre del plan (Gratuito, Small Team, Enterprise) |
| descripcion | TEXT | Descripción del plan |
| equipos_max | INT | Máximo de equipos default. **0 = ilimitado** |
| clusters_ia_mes | INT | Máximo de clusters IA/mes default. **0 = ilimitado** |
| precio | DECIMAL(10,2) | Precio mensual en USD |
| created_at | TIMESTAMPTZ | |
| updated_at | TIMESTAMPTZ | |

### suscripciones (contrato por empresa)

Al crear una empresa, se COPIA el template vigente acá. Cambiar `planes_subscription` NO modifica estos valores (excepto precio, que se agenda).

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | UUID PK | |
| empresa_id | UUID FK→empresas | UNIQUE — 1 suscripcion activa por empresa |
| plan_id | UUID FK→planes_subscription | Solo referencial. NO se usan los límites de acá para validar |
| equipos_max | INT | Snapshot del template al contratar. **0 = ilimitado** |
| clusters_ia_mes | INT | Snapshot del template al contratar. **0 = ilimitado** |
| precio | DECIMAL(10,2) | Precio VIGENTE para esta empresa |
| estado | TEXT | 'activa', 'suspendida', 'cancelada' |
| fecha_inicio | TIMESTAMPTZ | |
| precio_proximo | DECIMAL(10,2) | NULL si no hay cambio de precio programado |
| fecha_efectiva_proximo_cambio | DATE | NULL si no hay cambio programado. Fecha desde la cual rige `precio_proximo` |
| created_at | TIMESTAMPTZ | |
| updated_at | TIMESTAMPTZ | |

### empresas (updated)

| Campo | Tipo | Descripción |
|-------|------|-------------|
| (existing fields) | ... | ... |
| suscripcion_id | UUID FK→suscripciones | Suscripción activa de la empresa |

> `empresas.plan_id` se elimina. Ahora es `empresas.suscripcion_id`.

### price_changes_log

Auditoría de cambios de precio (tanto en template como en suscripciones individuales).

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | UUID PK | |
| plan_id | UUID FK→planes_subscription | NULL si fue cambio directo en una suscripcion |
| suscripcion_id | UUID FK→suscripciones | NULL si fue cambio global en el template |
| precio_anterior | DECIMAL(10,2) | |
| precio_nuevo | DECIMAL(10,2) | |
| fecha_efectiva | DATE | Fecha desde la cual rige el nuevo precio |
| tipo_cambio | TEXT | 'global_template' (afecta a todos) o 'directo_suscripcion' (solo uno) |
| motivo | TEXT | Razón del cambio |
| created_by | UUID FK→usuarios | Quién hizo el cambio |
| created_at | TIMESTAMPTZ | |

### notificaciones_email

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | UUID PK | |
| empresa_id | UUID FK→empresas | |
| tipo | TEXT | 'cambio_precio' |
| suscripcion_id | UUID FK→suscripciones | |
| precio_anterior | DECIMAL(10,2) | |
| precio_nuevo | DECIMAL(10,2) | |
| fecha_efectiva | DATE | |
| destinatario_email | TEXT | Email del admin |
| enviado | BOOLEAN DEFAULT FALSE | |
| enviado_en | TIMESTAMPTZ | |
| error_msg | TEXT | Si falló el envío |
| created_at | TIMESTAMPTZ | |

### uso_ia (unchanged)

id (UUID PK), empresa_id (FK), mes (TEXT "YYYY-MM"), clusters_usados (INT DEFAULT 0), UNIQUE(empresa_id, mes)

## Seed Data

Los planes se crean mediante seed migration en `planes_subscription`:

| Plan | equipos_max | clusters_ia_mes | precio |
|------|-------------|-----------------|--------|
| Gratuito | 1 | 5 | 0.00 |
| Small Team | 1 | 30 | 9.00 |
| Enterprise | 10 | 500 | 29.00 |

Estos son los defaults del "menú". Al crear una empresa, se **copian** a su `suscripciones`.

## Flujo de Límites

```
1. Seed: planes_subscription (Free: 1/5, Small: 1/30, Enterprise: 10/500)

2. Empresa se registra → se crea suscripcion SNAPSHOT:
   INSERT INTO suscripciones (empresa_id, plan_id, equipos_max, clusters_ia_mes, precio)
   VALUES (..., plan_free_id, 1, 5, 0.00)
   -- Copia los valores del template EN ESE MOMENTO

3. Admin cambia planes_subscription.equipos_max de 10 → 0
   → SOLO nuevas suscripciones Enterprise toman 0 (ilimitado)
   → Las existentes conservan su snapshot (10)

4. Admin cambia planes_subscription.precio de 9.00 → 12.00
   → Se agenda precio_proximo=12.00 + fecha_efectiva en suscripciones Small Team activas
   → Se envían emails de notificación
   → En la fecha efectiva, se ejecuta: UPDATE suscripciones SET precio = 12.00

5. Admin quiere darle un trato especial a una empresa específica:
   → Actualiza directo sus suscripciones.equipos_max o clusters_ia_mes
   → Solo esa empresa se afecta
```

## Requirements

| # | Requirement | Strength |
|---|------------|----------|
| 1 | `planes_subscription` es el catálogo de planes. Sus valores se usan SOLO como defaults al crear nuevas suscripciones. | MUST |
| 2 | `suscripciones` es la fuente de verdad para validar límites de una empresa. `equipos_max` y `clusters_ia_mes` se leen de acá. | MUST |
| 3 | Al crear una empresa, se DEBE crear una `suscripcion` copiando los valores vigentes de `planes_subscription` del plan Gratuito. | MUST |
| 4 | Un valor de `0` en `equipos_max` (en `suscripciones`) DEBE tratarse como "ilimitado" (no aplicar validación). | MUST |
| 5 | Un valor de `0` en `clusters_ia_mes` (en `suscripciones`) DEBE tratarse como "ilimitado" (no aplicar bloqueo). | MUST |
| 6 | La semilla inicial DEBE crear los 3 planes en `planes_subscription`. | MUST |
| 7 | El sistema DEBE trackear el uso de clusters IA por empresa y mes en `uso_ia`. | MUST |
| 8 | El sistema DEBE incrementar `clusters_usados` cuando `/api/cluster` se completa exitosamente. | MUST |
| 9 | GET /api/uso-ia DEBE devolver el uso actual y los límites desde `suscripciones` (no desde `planes_subscription`). | MUST |
| 10 | El sistema DEBE bloquear `/api/cluster` si `suscripciones.clusters_ia_mes > 0` Y `uso_ia.clusters_usados >= suscripciones.clusters_ia_mes`. | MUST |
| 11 | Cuando se bloquea, la UI DEBE mostrar mensaje claro. | MUST |
| 12 | El sistema DEBE prevenir crear más equipos de los que permite `suscripciones.equipos_max`. Si es 0, no hay límite. | MUST |
| 13 | Un admin PUEDE cambiar el plan de una empresa (upgrade/downgrade). Esto crea una NUEVA suscripción con los valores del template actual. | SHOULD |
| 14 | Un admin (super_admin) PUEDE modificar los límites de una suscripción específica directamente (trato especial). | MAY |
| 15 | Cuando un super_admin cambia `planes_subscription.precio`: (a) NO se actualiza `suscripciones.precio` inmediatamente; (b) se setea `precio_proximo` y `fecha_efectiva_proximo_cambio` en todas las suscripciones activas de ese plan; (c) se registra en `price_changes_log`; (d) se crean notificaciones en `notificaciones_email`. | MUST |
| 16 | Las notificaciones de cambio de precio DEBEN intentar enviarse por email. Si falla, quedan marcadas para reintento. | MUST |
| 17 | El email de cambio de precio DEBE incluir: nombre del plan, precio anterior, precio nuevo, fecha efectiva. | MUST |
| 18 | Debe existir un proceso (cron o trigger manual) que en `fecha_efectiva_proximo_cambio` aplique `precio_proximo` como nuevo `precio` vigente en las suscripciones. | SHOULD |
| 19 | La información del plan actual (nombre, límites snapshot, uso, precio vigente, próximo cambio) DEBE mostrarse en configuración. | MUST |

## API Contracts

### GET /api/uso-ia

```typescript
// Lee límites de suscripciones (NO de planes_subscription)
// Response 200
{
  suscripcion: {
    id: string;
    plan: { id: string; nombre: string };   // solo referencial
    equipos_max: number | null;              // null si es 0 (ilimitado)
    clusters_ia_mes: number | null;          // null si es 0 (ilimitado)
    precio: number;                          // precio vigente
    estado: string;                          // 'activa'
    precio_proximo: number | null;           // null si no hay cambio programado
    fecha_efectiva_proximo_cambio: string | null; // "2026-08-01"
  };
  uso_ia: {
    mes: string;       // "2026-05"
    clusters_usados: number;
  } | null;
  equipos_count: number;
  dentro_limite_clusters: boolean;
  dentro_limite_equipos: boolean;
}
```

### POST /api/admin/planes/precio (super_admin only)

Cambia el precio en `planes_subscription` y agenda el cambio en todas las `suscripciones` activas de ese plan.

```typescript
// Request
{
  plan_id: string;
  precio_nuevo: number;
  fecha_efectiva: string; // "2026-08-01"
  motivo: string;
}

// Response 200
{
  ok: true;
  cambio_template: {
    precio_anterior: number;
    precio_nuevo: number;
  };
  suscripciones_afectadas: number;  // cuántas suscripciones activas se actualizaron con precio_proximo+fecha
  notificaciones_email: {
    creadas: number;
    enviadas: number;
    fallidas: number;
  };
}
```

### POST /api/admin/suscripciones/:id/limites (super_admin only)

Para modificar límites de UNA suscripcion específica (trato especial, no afecta el template).

```typescript
// Request
{
  equipos_max?: number;     // opcional. null para no cambiar
  clusters_ia_mes?: number; // opcional. null para no cambiar
}

// Response 200
{
  ok: true;
  suscripcion_id: string;
  equipos_max: number;
  clusters_ia_mes: number;
}
```

## Scenarios

### Scenario 1: Track cluster usage within limit from suscripcion

- GIVEN una empresa con suscripcion activa Small Team que tiene `clusters_ia_mes = 30` (snapshot) y 15 clusters usados este mes en `uso_ia`
- WHEN /api/cluster se ejecuta exitosamente
- THEN clusters_usados se incrementa a 16
- AND la validación usó `suscripciones.clusters_ia_mes`, NO `planes_subscription`

### Scenario 2: Block clustering when limit exceeded

- GIVEN una empresa con `suscripciones.clusters_ia_mes = 5` y 5 clusters usados este mes
- WHEN /api/cluster es llamado
- THEN la API retorna 429 con "Has alcanzado el límite mensual de clusters IA. Actualiza tu plan para continuar."
- AND el botón de cluster se deshabilita en UI

### Scenario 3: Zero clusters_ia_mes = unlimited

- GIVEN una empresa con `suscripciones.clusters_ia_mes = 0`
- WHEN /api/cluster se ejecuta 200 veces
- THEN todas se procesan sin bloqueo (nunca se checkea límite)

### Scenario 4: Zero equipos_max = unlimited teams

- GIVEN una empresa con `suscripciones.equipos_max = 0`
- WHEN se crean 50 equipos
- THEN todos se crean sin bloqueo

### Scenario 5: Snapshot protege a suscripciones existentes

- GIVEN una empresa con suscripcion Enterprise que snapshotée `equipos_max = 10` cuando se registró
- WHEN un super_admin cambia `planes_subscription.equipos_max` a 0 (ilimitado)
- THEN la suscripcion de la empresa SIGUE teniendo `equipos_max = 10`
- AND solo las nuevas suscripciones Enterprise obtienen 0
- AND la UI muestra `10` como límite, no ilimitado

### Scenario 6: Price change with future date

- GIVEN 5 empresas con suscripcion Small Team activa (precio vigente = $9.00 cada una)
- WHEN un super_admin cambia `planes_subscription.precio` a $12.00 con fecha_efectiva = "2026-08-01"
- THEN se registra en `price_changes_log` con tipo_cambio = 'global_template'
- AND las 5 suscripciones quedan con `precio_proximo = 12.00`, `fecha_efectiva_proximo_cambio = 2026-08-01`
- AND el `precio` vigente SIGUE siendo $9.00
- AND se crean 5 `notificaciones_email` (1 por empresa_admin)
- AND cada email contiene: precio anterior ($9.00), nuevo ($12.00), fecha efectiva (2026-08-01)

### Scenario 7: Price change applied on effective date

- GIVEN una suscripcion con `precio_proximo = 12.00` y `fecha_efectiva_proximo_cambio = 2026-08-01`
- WHEN se ejecuta el proceso de aplicación (cron o trigger manual) en 2026-08-01
- THEN `precio` se actualiza a 12.00
- AND `precio_proximo` pasa a NULL
- AND `fecha_efectiva_proximo_cambio` pasa a NULL

### Scenario 8: Email send failure is logged

- GIVEN un cambio de precio global que crea notificación para admin@ejemplo.com
- WHEN el envío de email falla (SMTP down)
- THEN la notificación queda con `enviado = FALSE`
- AND `error_msg` contiene la descripción del error
- AND se puede reintentar manualmente

### Scenario 9: Admin upgrades empresa to another plan

- GIVEN una empresa con suscripcion Gratuito (snapshot: equipos_max=1, clusters=5)
- WHEN un admin cambia su plan a Enterprise
- THEN se CREA una nueva suscripcion con los valores actuales del template Enterprise (equipos_max=10, clusters=500)
- AND la anterior suscripcion queda con estado 'cancelada'
- AND los datos (equipos, salas, tarjetas) no se pierden

### Scenario 10: Special deal — admin modifica límites de una suscripcion específica

- GIVEN una empresa con suscripcion Small Team (equipos_max=1)
- WHEN un super_admin llama a POST /api/admin/suscripciones/:id/limites con `equipos_max = 5`
- THEN solo esa suscripcion cambia a equipos_max=5
- AND el template Small Team sigue teniendo equipos_max=1
- AND otras empresas Small Team no se afectan

### Scenario 11: Team creation blocked by snapshot limit

- GIVEN una empresa con `suscripciones.equipos_max = 1` (snapshot de Gratuito) y 1 equipo existente
- WHEN un usuario intenta crear un segundo equipo
- THEN la API retorna 403 con "Tu plan actual permite solo 1 equipo. Actualiza tu plan para crear más."
- AND la UI muestra upgrade prompt

## Acceptance Criteria

- [ ] Seed migration crea 3 planes en `planes_subscription`
- [ ] Nueva empresa crea `suscripcion` con SNAPSHOT del plan Gratuito
- [ ] `suscripciones.equipos_max = 0` permite equipos ilimitados
- [ ] `suscripciones.clusters_ia_mes = 0` permite clusters ilimitados
- [ ] Cambiar `planes_subscription` NO afecta suscripciones existentes (excepto precio)
- [ ] Cambio de precio global setea `precio_proximo` + `fecha_efectiva` en suscripciones
- [ ] Cambio de precio NO toca `suscripciones.precio` vigente hasta la fecha efectiva
- [ ] Cambio de precio crea notificaciones email
- [ ] Trato especial a una suscripcion no afecta el template ni otras suscripciones
- [ ] Upgrade de plan crea nueva suscripcion con snapshot fresco
- [ ] GET /api/uso-ia devuelve límites desde `suscripciones`
- [ ] Al alcanzar límite > 0, clustering se bloquea con mensaje claro
- [ ] Fallo en envío email queda registrado para reintento
