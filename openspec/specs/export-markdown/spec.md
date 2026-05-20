# Export Markdown Specification

## Purpose

Generate and download a Markdown file summarizing a retrospective sala's cards, organized by the 4 columns and grouped by AI clusters when available.

## Requirements

| # | Requirement | Strength |
|---|------------|----------|
| 1 | The system MUST generate a .md string from the sala's tarjetas | MUST |
| 2 | The generated markdown MUST have 4 sections matching the 4 columns: "## Start", "## Stop", "## Continue", "## Action Items" | MUST |
| 3 | Within each section, if cards have grupo_id set, cards MUST be organized under group subheadings (### Grupo Name) | MUST |
| 4 | Cards without a grupo_id MUST appear under "### Sin agrupar" within each column | MUST |
| 5 | Each card entry MUST include: "- [card content] — @author_name" | MUST |
| 6 | The document header MUST include the sala name and generation date | MUST |
| 7 | The export MUST be downloadable as a .md file via Blob + URL.createObjectURL | MUST |
| 8 | The file name MUST follow the pattern: `retro-{sala-name}-{YYYY-MM-DD}.md` | MUST |
| 9 | The generation MUST happen client-side (no server round-trip for the export itself) | MUST |
| 10 | The export button SHOULD be in the sala board header, next to the PDF export button | SHOULD |

## Output Format

```markdown
# Retrospectiva: Sprint 25 Retro
**Fecha**: 2026-05-20
**Generado por**: Juan Pérez

## Start

### Grupo: Mejora de procesos
- [Implementar code reviews] — @Juan
- [Automatizar despliegues] — @María

### Sin agrupar
- [Probar nueva herramienta] — @Ana

## Stop

[... same structure ...]
```

## Scenarios

### Scenario: Export markdown with clustered cards

- GIVEN a sala with cards clustered by AI into groups
- WHEN the user clicks "Exportar Markdown"
- THEN the browser downloads `retro-sprint-25-retro-2026-05-20.md`
- AND the file contains 4 column sections with AI group subheadings

### Scenario: Export markdown without clusters

- GIVEN a sala where cards have no grupo_id (not clustered)
- WHEN the user exports
- THEN all cards appear under "### Sin agrupar" within their respective column
- AND the file still has the 4 column sections

### Scenario: Export empty sala

- GIVEN a sala with no cards
- WHEN the user exports
- THEN the generated markdown has the 4 column sections
- AND each section shows "(Sin tarjetas)"
- AND the file still downloads successfully

## Acceptance Criteria

- [ ] Markdown file downloads with .md extension
- [ ] Correct file naming pattern
- [ ] 4 column sections with proper heading hierarchy
- [ ] AI groups shown as subheadings when present
- [ ] Unclustered cards under "Sin agrupar"
- [ ] Empty columns show placeholder text
- [ ] Header includes room name and date
