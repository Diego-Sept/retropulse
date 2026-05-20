# Sala Management Specification

## Purpose

CRUD operations for salas (retrospective rooms) within a team. Each sala is a retrospective board with 4 fixed columns.

## Data Models

**salas**: id (UUID PK), nombre, equipo_id (FK→equipos), estado (activa|archivada), created_at

## Requirements

| # | Requirement | Strength |
|---|------------|----------|
| 1 | Users with role team_admin in the equipo MAY create, update, and archive salas | MAY |
| 2 | Users with role member in the equipo MAY read and list salas | MAY |
| 3 | Users NOT in the equipo MUST NOT see or access the equipo's salas | MUST |
| 4 | A sala MUST have: id, nombre, equipo_id, created_at, estado | MUST |
| 5 | estado MUST be either "activa" or "archivada" | MUST |
| 6 | Creating a sala MUST set estado = "activa" by default | MUST |
| 7 | Archiving a sala MUST set estado = "archivada" (soft delete, no hard delete) | MUST |
| 8 | When listing salas, archived salas SHOULD be shown separately or filtered by default | SHOULD |
| 9 | Deleting a sala (hard delete) SHOULD be restricted to team_admin only | SHOULD |
| 10 | The system MUST validate that the authenticated user belongs to the equipo before returning any sala data | MUST |

## API Contracts

### GET /api/equipos/:equipoId/salas
```typescript
// Response 200
{ salas: Array<{ id: string; nombre: string; estado: string; created_at: string; tarjetas_count: number }> }
```

### POST /api/equipos/:equipoId/salas
```typescript
// Request: { nombre: string }
// Response 201: { sala: { id, nombre, equipo_id, estado, created_at } }
// Response 403: { error: "No tienes permisos en este equipo" }
```

### PATCH /api/salas/:id
```typescript
// Request: { nombre?: string; estado?: "archivada" | "activa" }
// Response 200: { sala: { id, nombre, estado, ... } }
// Response 403: { error: "Solo administradores del equipo pueden modificar salas" }
```

## Scenarios

### Scenario: Team_admin creates sala

- GIVEN a user with team_admin role in equipo "QA"
- WHEN the user creates a sala "Sprint 25 Retro"
- THEN the sala is created with estado = "activa"
- AND the sala appears in the equipo's sala list

### Scenario: Member reads sala list

- GIVEN a user with member role in equipo "QA" which has 3 salas
- WHEN the user opens the equipo dashboard
- THEN the user sees all 3 salas with their tarjetas_count
- AND the user can view any sala

### Scenario: Non-member denied access

- GIVEN a user NOT in equipo "QA"
- WHEN the user attempts GET /api/equipos/QA/salas
- THEN the API returns 403
- AND no sala data is leaked

### Scenario: Archive sala

- GIVEN an activa sala "Sprint 25 Retro"
- WHEN a team_admin archives it
- THEN estado changes to "archivada"
- AND the sala no longer appears in default active list
- AND all tarjetas and grupos data is preserved

### Scenario: Member cannot create sala

- GIVEN a user with member role in the equipo
- WHEN the user attempts POST to create a sala
- THEN the API returns 403

## Acceptance Criteria

- [ ] team_admin can create, archive, delete salas
- [ ] member can only read salas
- [ ] Non-members cannot access salas
- [ ] Archived salas preserve all data
- [ ] Active/archived filtering works in list
