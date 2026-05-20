# Team Management Specification

## Purpose

CRUD operations for equipos (teams) within an empresa, user invitations, and per-team role assignment.

## Data Models

**equipos**: id (UUID PK), nombre, empresa_id (FK→empresas), created_at

**usuarios_equipo**: id (UUID PK), usuario_id (FK→usuarios), equipo_id (FK→equipos), rol (team_admin|member), created_at, UNIQUE(usuario_id, equipo_id)

## Requirements

| # | Requirement | Strength |
|---|------------|----------|
| 1 | Users with rol_global = empresa_admin MAY create, read, update, and delete equipos within their empresa | MAY |
| 2 | Users with rol_global = member MUST NOT create, update, or delete equipos | MUST |
| 3 | An equipo MUST belong to exactly one empresa | MUST |
| 4 | An empresa MUST NOT exceed equipos_max from its subscription plan when creating teams | MUST |
| 5 | An empresa_admin MAY invite users to an equipo by email | MAY |
| 6 | If the invited user exists in the empresa, the system MUST add them to usuarios_equipo with the specified rol | MUST |
| 7 | If the invited user does NOT exist, the system MUST create an invitation record and SHOW a pending invitation | MUST |
| 8 | When a non-existing user registers later with that email, the system MUST automatically assign them to the equipo | MUST |
| 9 | A team_admin MAY manage members (add/remove, change roles) within their equipo | MAY |
| 10 | A member MAY list all users in their equipo | MAY |
| 11 | A team_admin MAY remove a user from the equipo (but not themselves if they are the last team_admin) | MAY |

## API Contracts

### GET /api/equipos
```typescript
// Response 200
{ equipos: Array<{ id: string; nombre: string; created_at: string; miembros_count: number }> }
```

### POST /api/equipos
```typescript
// Request: { nombre: string }
// Response 201: { equipo: { id, nombre, created_at } }
// Response 403: { error: "Límite de equipos alcanzado para tu plan" }
```

### POST /api/equipos/:id/invitar
```typescript
// Request: { email: string; rol: "team_admin" | "member" }
// Response 200: { message: "Usuario agregado al equipo" }
// Response 201: { message: "Invitación enviada", invitacion_id: string }
```

### DELETE /api/equipos/:id/miembros/:userId
```typescript
// Response 200: { message: "Usuario removido del equipo" }
// Response 403: { error: "No puedes remover al último administrador del equipo" }
```

## Scenarios

### Scenario: Create equipo within plan limits

- GIVEN an Enterprise empresa with 5 existing equipos
- WHEN an empresa_admin creates a new equipo "QA"
- THEN the equipo is created with equipo_id linked to the empresa
- AND the equipo appears in the equipos list

### Scenario: Create equipo blocked by plan

- GIVEN a Free-plan empresa with 1 equipo already
- WHEN any user attempts to create another equipo
- THEN the API returns 403

### Scenario: Invite existing user to team

- GIVEN user "a@b.com" exists in the empresa
- WHEN a team_admin invites "a@b.com" as member
- THEN a usuarios_equipo row is created with rol = member
- AND user "a@b.com" can see the equipo in their dashboard

### Scenario: Invite non-existing user

- GIVEN "new@user.com" does not exist in the sistema
- WHEN a team_admin invites "new@user.com"
- THEN an invitation record is created in the DB
- AND the invitation appears as "Pendiente" in team members list
- AND when "new@user.com" registers later, they are automatically added to the equipo

### Scenario: Remove last team_admin is blocked

- GIVEN an equipo with exactly one team_admin
- WHEN that team_admin tries to remove themselves
- THEN the API returns 403 with error message

## Acceptance Criteria

- [ ] CRUD equipos works within empresa and plan limits
- [ ] Invitation by email works for existing and new users
- [ ] Invitation auto-resolves on registration
- [ ] Per-team roles enforced (team_admin vs member)
- [ ] Last team_admin cannot be removed
