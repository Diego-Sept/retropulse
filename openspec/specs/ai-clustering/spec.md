# AI Clustering Specification

## Purpose

Group semantically similar cards within a column using OpenCode Zen API. Creates AI-generated groups and assigns cards to them.

## Data Models

**grupos**: id (UUID PK), sala_id (FK→salas), columna (INT 1-4), nombre_grupo (TEXT), created_at

**tarjetas**.grupo_id: FK→grupos (nullable)

## Requirements

| # | Requirement | Strength |
|---|------------|----------|
| 1 | The system MUST provide POST /api/cluster accepting column_id and array of cards | MUST |
| 2 | The system MUST check subscription plan's clusters_ia_mes limit BEFORE calling OpenCode Zen | MUST |
| 3 | If limit is reached, the system MUST return 429 with "Límite mensual de clusters IA alcanzado" | MUST |
| 4 | The system MUST call OpenCode Zen API with a strict system prompt that enforces JSON output format | MUST |
| 5 | The OpenCode Zen request MUST include card id and contenido for each card in the column | MUST |
| 6 | The system MUST validate that the AI response matches the expected schema before persisting | MUST |
| 7 | On success, the system MUST create grupos rows in the DB with nombre_grupo and columna | MUST |
| 8 | On success, the system MUST update each tarjeta's grupo_id to match its assigned group | MUST |
| 9 | On success, the system MUST increment clusters_usados in uso_ia for the current month | MUST |
| 10 | If OpenCode Zen returns invalid JSON or schema mismatch, the system MUST return 502 | MUST |
| 11 | Clusters SHOULD be displayed visually on the board as colored group headers | SHOULD |

## API Contract

### POST /api/cluster

```typescript
// Request
{
  sala_id: string;
  columna: 1 | 2 | 3 | 4;
  tarjetas: Array<{ id: string; contenido: string }>;
}

// Response 200
{
  grupos: Array<{
    id: string;
    nombre_grupo: string;
    tarjetas: Array<{ id: string; contenido: string }>;
  }>;
}

// Response 429 (limit exceeded)
{ error: "Límite mensual de clusters IA alcanzado", plan: string, clusters_ia_mes: number }

// Response 502 (AI error)
{ error: "Error al procesar la agrupación IA" }
```

### OpenCode Zen System Prompt

```
Agrupa las siguientes tarjetas de retrospectiva por similitud semántica.
Responde ÚNICAMENTE con un JSON válido en este formato SIN markdown ni explicaciones:
{ "grupos": [{ "nombre_grupo": "string", "tarjetas": ["id1", "id2"] }] }
Grupo "Otros" para tarjetas sin similitud clara.
```

## Scenarios

### Scenario: Successful cluster within limit

- GIVEN a Free-plan empresa with 3 of 5 clusters used this month
- WHEN POST /api/cluster is called with 10 cards from column 1
- THEN the system calls OpenCode Zen API
- AND the response creates 3 grupos in the DB
- AND each tarjeta's grupo_id is updated
- AND clusters_usados is incremented to 4

### Scenario: Clustering blocked by limit

- GIVEN a Free-plan empresa with 5 of 5 clusters used
- WHEN POST /api/cluster is called
- THEN the API returns 429 without calling OpenCode Zen
- AND no grupos or tarjetas are modified

### Scenario: Invalid AI response handled gracefully

- GIVEN valid cards in a column
- WHEN OpenCode Zen returns malformed JSON (e.g., missing "grupos" key)
- THEN the API returns 502
- AND no data is persisted
- AND the UI shows error toast

### Scenario: Empty column clustering

- GIVEN a column with 0 cards
- WHEN POST /api/cluster is called
- THEN the API returns 400 with "No hay tarjetas para agrupar en esta columna"
- AND no API call is made to OpenCode Zen

## Acceptance Criteria

- [ ] Clustering groups cards semantically by column
- [ ] Subscription limit checked before AI call
- [ ] 429 returned when limit exceeded
- [ ] AI response validated before persistence
- [ ] 502 on invalid AI response
- [ ] Usage counter increments on success
- [ ] Empty column returns 400
