# Export PDF Specification

## Purpose

Generate a professional A4-ready PDF document from a retrospective sala using browser print CSS. Zero external PDF libraries — relies entirely on CSS @media print + window.print().

## Requirements

| # | Requirement | Strength |
|---|------------|----------|
| 1 | The PDF export MUST use `window.print()` with a dedicated `@media print` stylesheet | MUST |
| 2 | The print stylesheet MUST set @page to A4 with 2cm margins on all sides | MUST |
| 3 | The document header (sala name + date) MUST be visible only in print mode | MUST |
| 4 | All UI chrome (buttons, scrollbars, navigation, drag handles, input forms) MUST be hidden in print mode via `display: none` | MUST |
| 5 | The board MUST render its 4 columns as sections in print, one per page where needed | MUST |
| 6 | A `page-break-before` MUST be inserted between columns so each column starts on a new page | MUST |
| 7 | Cards MUST be grouped under AI group headings if clustered, or listed chronologically | MUST |
| 8 | The font MUST be a professional serif (e.g., Georgia or Times New Roman) for body, sans-serif for headings | MUST |
| 9 | Color scheme MUST be black on white (no background colors, no gradients) | MUST |
| 10 | The PDF MUST NOT include empty columns (columns with 0 cards SHOULD be omitted from output) | SHOULD |
| 11 | A print button MUST be available in the sala board header | MUST |

## CSS Contract

```css
@media print {
  @page {
    size: A4;
    margin: 2cm;
  }

  /* Hide UI */
  .no-print { display: none !important; }
  nav, header, footer, button:not(.print-btn) { display: none !important; }
  ::-webkit-scrollbar { display: none; }

  /* Layout */
  .print-only { display: block !important; }
  .print-header { text-align: center; margin-bottom: 1.5cm; }
  .print-section { page-break-before: always; }
  .print-section:first-of-type { page-break-before: auto; }

  /* Typography */
  body { font-family: Georgia, 'Times New Roman', serif; font-size: 12pt; color: #000; }
  h1 { font-family: Arial, Helvetica, sans-serif; font-size: 18pt; }
  h2 { font-family: Arial, Helvetica, sans-serif; font-size: 14pt; border-bottom: 1px solid #000; }
  h3 { font-family: Arial, Helvetica, sans-serif; font-size: 12pt; }
  .card { padding: 4pt 0; border-bottom: 0.5pt solid #ccc; }
  .card-author { font-size: 9pt; color: #555; }
}
```

## Scenarios

### Scenario: Export PDF for full sala

- GIVEN a sala with cards in all 4 columns, some clustered by AI
- WHEN the user clicks "Exportar PDF"
- THEN the browser print dialog opens
- AND the print preview shows A4 layout with 2cm margins
- AND each column starts on a new page
- AND no UI elements (buttons, inputs) are visible

### Scenario: Export PDF with empty columns

- GIVEN a sala with cards only in columns 1 and 3 (columns 2 and 4 are empty)
- WHEN the user exports PDF
- THEN the print output includes only column 1 and column 3 sections
- AND empty columns do not appear

### Scenario: Print layout hides all interactive elements

- GIVEN the board page with inline forms, drag handles, buttons, scrollbar
- WHEN `window.print()` is triggered
- THEN print preview shows none of the interactive elements
- AND only card content, group headings, and column titles are visible

## Acceptance Criteria

- [ ] A4 page size with 2cm margins
- [ ] UI chrome hidden in print
- [ ] Page breaks between columns
- [ ] Professional serif/sans-serif typography
- [ ] Black on white color scheme
- [ ] Empty columns omitted
- [ ] Header shows room name and date
- [ ] No external PDF library dependencies
