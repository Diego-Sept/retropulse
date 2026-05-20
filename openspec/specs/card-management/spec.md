# Card Management Specification

## Purpose

Allow users to create cards inline per column and drag-drop cards between columns using native HTML5 DnD API. Cards sync via Supabase with optimistic updates.

## Data Models

**tarjetas**: id (UUID PK), sala_id (FK→salas), columna (INT 1-4), contenido (TEXT), autor_id (FK→usuarios), grupo_id (FK→grupos, nullable), created_at, updated_at

## Requirements

| # | Requirement | Strength |
|---|------------|----------|
| 1 | Each column MUST have an inline form to add a new card with text content | MUST |
| 2 | Submitting the form MUST insert a row in tarjetas with sala_id, columna, contenido, and autor_id | MUST |
| 3 | On submit, the UI MUST show the card optimistically (before server confirms) | MUST |
| 4 | If the server insert fails, the card MUST be removed and an error toast shown | MUST |
| 5 | Cards MUST be draggable using native HTML5 Drag & Drop API | MUST |
| 6 | Dropping a card on a different column MUST update its columna value in the DB | MUST |
| 7 | On drop, the UI MUST move the card optimistically to the target column | MUST |
| 8 | If the server update fails, the card MUST return to its original column and an error toast shown | MUST |
| 9 | While dragging, the dragged card SHOULD show a visual "ghost" effect | SHOULD |
| 10 | While dragging, target columns SHOULD highlight to indicate drop zone | SHOULD |
| 11 | When a Realtime UPDATE arrives for a card that was optimistically moved, the UI MUST reconcile — prefer the server state if different | MUST |
| 12 | The card form MUST be a multiline textarea (not single-line input) | MUST |
| 13 | Empty content MUST NOT be submitted (client-side and server-side validation) | MUST |
| 14 | Card contenido MUST be trimmed of whitespace before storage | MUST |

## API Contracts

### POST /api/salas/:salaId/tarjetas
```typescript
// Request: { contenido: string; columna: 1 | 2 | 3 | 4 }
// Response 201: { tarjeta: { id, sala_id, columna, contenido, autor_id, created_at } }
// Response 400: { error: "El contenido no puede estar vacío" }
```

### PATCH /api/tarjetas/:id
```typescript
// Request: { columna?: 1 | 2 | 3 | 4; contenido?: string }
// Response 200: { tarjeta: { id, columna, contenido, updated_at } }
// Response 400: { error: "Columna debe ser 1-4" }
```

## Scenarios

### Scenario: Add card to column (happy path)

- GIVEN a user viewing a sala board
- WHEN the user types "Mejorar tests unitarios" in column 1's inline form and submits
- THEN the card appears immediately in column 1 (optimistic)
- AND the card persists in the DB
- AND other users see it via Realtime

### Scenario: Add card with empty content rejected

- GIVEN the inline form in any column
- WHEN the user submits with empty or whitespace-only content
- THEN the form shows validation error "El contenido no puede estar vacío"
- AND no API call is made

### Scenario: Drag card to different column (happy path)

- GIVEN a card in column 1 ("Start")
- WHEN the user drags it to column 2 ("Stop")
- THEN the card moves to column 2 optimistically
- AND the DB updates columna to 2
- AND other users see the move via Realtime

### Scenario: Drag update fails — card returns

- GIVEN a card in column 1
- WHEN the user drags it to column 2 but the PATCH request fails (e.g., network error)
- THEN the card moves back to column 1
- AND an error toast "Error al mover la tarjeta" is shown

### Scenario: Realtime conflict resolution

- GIVEN user A drags card to column 2 (optimistic)
- AND user B simultaneously drags same card to column 3 (server confirmed first)
- WHEN the Realtime UPDATE arrives for user A
- THEN the card reconciles to column 3 (server state wins)

## Acceptance Criteria

- [ ] Inline form creates cards in the correct column
- [ ] Empty content rejected client and server side
- [ ] HTML5 drag-drop moves cards between columns
- [ ] Optimistic updates with rollback on failure
- [ ] Realtime reconciliation prefers server state
- [ ] Drag ghost and drop zone highlight visible
