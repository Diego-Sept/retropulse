'use client';
import { useBoard } from '@/contexts/BoardContext';
import { useLimits } from '@/hooks/useLimits';
import { generateMarkdown, downloadMarkdown } from '@/lib/markdown';
import styles from './ExportMenu.module.css';

const COLUMN_NAMES: Record<number, string> = {
  1: '¿Qué hicimos bien?',
  2: '¿Qué hicimos mal?',
  3: 'Ideas para mejorar',
  4: 'Acciones a tomar',
};

const VIOLETA = [108, 92, 231];
const GRIS_CLARO = [170, 170, 170];

interface ExportMenuProps {
  salaNombre: string;
}

export function ExportMenu({ salaNombre }: ExportMenuProps) {
  const { state } = useBoard();
  const { limits } = useLimits();

  const isFreePlan = limits?.suscripcion?.plan?.nombre === 'Gratuito';
  if (isFreePlan) {
    return (
      <div className={styles.menu}>
        <span className={styles.lockedHint} title="La exportación está disponible en planes pagos">
          🔒 Export
        </span>
      </div>
    );
  }

  const handleExportMd = () => {
    const md = generateMarkdown(salaNombre, state.columnas, state.grupos);
    const sanitizedName = salaNombre
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    downloadMarkdown(md, `retro-${sanitizedName}-${Date.now()}`);
  };

  const handleExportPdf = async () => {
    const sanitizedName = salaNombre
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    const date = new Date().toLocaleDateString('es-AR', {
      year: 'numeric', month: 'long', day: 'numeric',
    });

    const { jsPDF } = await import('jspdf');
    const pdf = new jsPDF('portrait', 'mm', 'a4');

    const MARGIN = 20;
    const PAGE_W = 210;
    const PAGE_H = 297;
    const CONTENT_W = PAGE_W - 2 * MARGIN;
    let y = MARGIN;

    const addPageIfNeeded = (needed: number) => {
      if (y + needed > PAGE_H - MARGIN) {
        pdf.addPage();
        y = MARGIN;
      }
    };

    const writeText = (
      text: string,
      fontSize: number,
      opts?: { bold?: boolean; color?: number[]; indent?: number; prefix?: string }
    ) => {
      const { bold = false, color = [26, 26, 46], indent = 0, prefix = '' } = opts || {};
      pdf.setFontSize(fontSize);
      pdf.setFont('helvetica', bold ? 'bold' : 'normal');
      pdf.setTextColor(color[0], color[1], color[2]);

      const x = MARGIN + indent;
      const maxW = CONTENT_W - indent;
      const lh = fontSize * 0.38; // line height in mm

      const displayText = prefix + text;
      const lines = pdf.splitTextToSize(displayText, maxW);
      addPageIfNeeded(lines.length * lh);

      for (let i = 0; i < lines.length; i++) {
        pdf.text(lines[i], x, y + i * lh);
      }
      y += lines.length * lh + 1;
    };

    // --- Title ---
    writeText(`Retrospectiva: ${salaNombre}`, 22, { bold: true });
    y += 1;

    // --- Date ---
    writeText(date, 9, { color: [136, 136, 136] });
    y += 3;

    // --- Separator line ---
    addPageIfNeeded(3);
    pdf.setDrawColor(221, 221, 221);
    pdf.line(MARGIN, y, PAGE_W - MARGIN, y);
    y += 6;

    // --- Columns ---
    for (const [colId, cards] of Object.entries(state.columnas)) {
      const colNum = Number(colId);

      addPageIfNeeded(12);
      writeText(`${COLUMN_NAMES[colNum]} (${cards.length})`, 16, {
        bold: true, color: [45, 45, 94],
      });
      y += 2;

      if (cards.length === 0) {
        writeText('Sin tarjetas', 10, { color: GRIS_CLARO });
        y += 3;
        continue;
      }

      const columnGroups = state.grupos.filter(g => g.columna_id === colNum);
      const groupedIds = new Set(
        columnGroups.flatMap(g => cards.filter(c => c.grupo_id === g.id).map(c => c.id))
      );

      for (const grupo of columnGroups) {
        const grupoCards = cards.filter(c => c.grupo_id === grupo.id);
        if (grupoCards.length === 0) continue;

        addPageIfNeeded(8);
        writeText(grupo.nombre, 13, { bold: true, color: VIOLETA });
        for (const card of grupoCards) {
          writeText(card.contenido, 10, { indent: 5, prefix: '• ' });
          if (card.autor_nombre) {
            writeText(card.autor_nombre, 7, { indent: 11, color: GRIS_CLARO });
          }
        }
        y += 2;
      }

      const ungrouped = cards.filter(c => !groupedIds.has(c.id));
      if (ungrouped.length > 0) {
        if (columnGroups.length > 0) {
          addPageIfNeeded(8);
          writeText('Otras', 13, { bold: true, color: VIOLETA });
        }
        for (const card of ungrouped) {
          writeText(card.contenido, 10, {
            indent: columnGroups.length > 0 ? 5 : 0,
            prefix: '• ',
          });
          if (card.autor_nombre) {
            writeText(card.autor_nombre, 7, {
              indent: columnGroups.length > 0 ? 11 : 6,
              color: GRIS_CLARO,
            });
          }
        }
        y += 3;
      }
    }

    // --- Footer ---
    addPageIfNeeded(12);
    pdf.setDrawColor(238, 238, 238);
    pdf.line(MARGIN, y, PAGE_W - MARGIN, y);
    y += 5;
    writeText(`Generado por RetroPulse — ${date}`, 9, { color: GRIS_CLARO });

    pdf.save(`retro-${sanitizedName}.pdf`);
  };

  return (
    <div className={styles.menu}>
      <button
        className={styles.button}
        onClick={handleExportMd}
        title="Descargar como Markdown"
      >
        .MD
      </button>
      <button
        className={styles.button}
        onClick={handleExportPdf}
        title="Descargar PDF"
      >
        PDF
      </button>
    </div>
  );
}
