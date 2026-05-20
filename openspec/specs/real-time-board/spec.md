# Real-Time Board Specification

## Purpose

Display a 4-column retrospective board (Start, Stop, Continue, Action Items) with real-time updates via Supabase Realtime. All users in the same sala see cards appear instantly.

## Data Models

**tarjetas**: id (UUID PK), sala_id (FK→salas), columna (INT 1-4), contenido (TEXT), autor_id (FK→usuarios), grupo_id (FK→grupos, nullable), created_at, updated_at

## Requirements

| # | Requirement | Strength |
|---|------------|----------|
| 1 | The board MUST display exactly 4 fixed columns: "Start", "Stop", "Continue", "Action Items" (columnas 1-4) | MUST |
| 2 | Each column MUST render all tarjetas where sala_id matches and columna matches that column number | MUST |
| 3 | The system MUST open a Supabase Realtime channel per sala_id on the tarjetas table | MUST |
| 4 | The channel MUST filter by `{ event: "*", schema: "public", table: "tarjetas", filter: `sala_id=eq.{salaId}` }` | MUST |
| 5 | On INSERT event, the new card MUST appear in its corresponding column without page refresh | MUST |
| 6 | On UPDATE event (columna change or contenido change), the card MUST update/move in-place | MUST |
| 7 | On DELETE event, the card MUST be removed from the column | MUST |
| 8 | The Realtime subscription MUST be cleaned up when the user leaves the sala page | MUST |
| 9 | If Realtime connection drops, the board SHOULD show a "Reconectando..." indicator | SHOULD |
| 10 | The system MUST enforce that only members of the sala's equipo can subscribe to the channel | MUST |

## Realtime Subscription

```typescript
// Channel setup
const channel = supabase
  .channel(`sala-${salaId}`)
  .on(
    'postgres_changes',
    {
      event: '*',
      schema: 'public',
      table: 'tarjetas',
      filter: `sala_id=eq.${salaId}`
    },
    (payload) => {
      switch (payload.eventType) {
        case 'INSERT': addCard(payload.new); break;
        case 'UPDATE': updateCard(payload.new); break;
        case 'DELETE': removeCard(payload.old.id); break;
      }
    }
  )
  .subscribe()
```

## Scenarios

### Scenario: Two users see the same card in real time

- GIVEN two users, A and B, viewing the same sala board
- WHEN user A creates a card in column 1
- THEN user B sees the card appear in column 1 within 500ms
- AND the card shows the correct contenido and autor

### Scenario: Card moves column for all viewers

- GIVEN two users viewing the same sala with a card in column 1
- WHEN user A drags and drops the card to column 2
- THEN the card moves to column 2 for user B in real time

### Scenario: Card deleted disappears for all

- GIVEN a card visible to both users
- WHEN user A (or system) deletes the card
- THEN the card is removed from user B's view without refresh

### Scenario: Realtime disconnection indicator

- GIVEN a user on the sala board
- WHEN the Supabase Realtime connection drops
- THEN a "Reconectando..." indicator is shown
- AND when connection restores, the board syncs current state

## Acceptance Criteria

- [ ] 4 columns render correctly with column names
- [ ] INSERT events appear in real time for all subscribers
- [ ] UPDATE events move/update cards in real time
- [ ] DELETE events remove cards in real time
- [ ] Channel cleanup on unmount (no memory leaks)
- [ ] Disconnection indicator shown when offline
