import { Tarjeta, Grupo } from '@/types';

const COLUMN_NAMES: Record<number, string> = {
  1: '¿Qué hicimos bien?',
  2: '¿Qué hicimos mal?',
  3: 'Ideas para mejorar',
  4: 'Acciones a tomar',
};

export function generateMarkdown(
  salaNombre: string,
  columnas: Record<number, Tarjeta[]>,
  grupos: Grupo[]
): string {
  const date = new Date().toLocaleDateString('es-AR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  let md = `# Retrospectiva: ${salaNombre}\n\n`;
  md += `**Fecha:** ${date}\n\n`;
  md += `---\n\n`;

  for (const [colId, cards] of Object.entries(columnas)) {
    const colNum = parseInt(colId);
    md += `## ${COLUMN_NAMES[colNum]} (${cards.length})\n\n`;

    if (cards.length === 0) {
      md += `*Sin tarjetas*\n\n`;
      continue;
    }

    const columnGroups = grupos.filter(g => g.columna_id === colNum);
    const groupedIds = new Set(
      columnGroups.flatMap(g => cards.filter(c => c.grupo_id === g.id).map(c => c.id))
    );

    for (const grupo of columnGroups) {
      const grupoCards = cards.filter(c => c.grupo_id === grupo.id);
      if (grupoCards.length === 0) continue;
      md += `### ${grupo.nombre}\n\n`;
      for (const card of grupoCards) {
        md += `- ${card.contenido}\n`;
      }
      md += '\n';
    }

    const ungrouped = cards.filter(c => !groupedIds.has(c.id));
    if (ungrouped.length > 0) {
      if (columnGroups.length > 0) md += `### Otras\n\n`;
      for (const card of ungrouped) {
        md += `- ${card.contenido}\n`;
      }
      md += '\n';
    }
  }

  md += `---\n\n`;
  md += `*Generado por Retro Scrum — ${date}*\n`;

  return md;
}

export function downloadMarkdown(markdown: string, filename: string) {
  const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}.md`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
