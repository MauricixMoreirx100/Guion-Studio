import jsPDF from 'jspdf';
import { Project, ScriptBlock } from '../types';

/**
 * Exports a screenplay project to a beautifully formatted standard Screenplay PDF
 */
export function exportProjectToPdf(project: Project) {
  const isA4 = project.settings.paperFormat === 'A4';
  
  // Create jsPDF instance (US Letter: 8.5 x 11 inches = 215.9 x 279.4 mm, A4: 210 x 297 mm)
  const doc = new jsPDF({
    unit: 'in',
    format: isA4 ? 'a4' : 'letter',
    orientation: 'portrait',
  });

  const pageWidth = isA4 ? 8.27 : 8.5;
  const pageHeight = isA4 ? 11.69 : 11.0;
  const centerX = pageWidth / 2;
  
  // Standard Hollywood screenplay margins in inches
  const leftMargin = 1.5; // for 3-hole punch
  const rightMargin = 1.0;
  const topMargin = 1.0;
  const bottomMargin = 1.0;
  const contentWidth = pageWidth - leftMargin - rightMargin; // ~6.0 in

  // Set font
  doc.setFont('courier', 'normal');
  doc.setFontSize(12);

  // Line height in inches (12pt font = 1/6 inch line pitch)
  const lineHeight = 0.18; // approx 13pt leading
  let cursorY = topMargin;
  let pageNumber = 1;

  // 1. TITLE PAGE
  if (project.titlePage && project.titlePage.title) {
    renderTitlePage(doc, project, pageWidth, pageHeight);
    doc.addPage();
    cursorY = topMargin;
  }

  // Header helper for page numbers (Page 2 onward)
  const printPageHeader = (pageNum: number) => {
    if (pageNum > 1) {
      doc.setFont('courier', 'normal');
      doc.setFontSize(12);
      // Top-right aligned page number: "2."
      doc.text(`${pageNum}.`, pageWidth - rightMargin, topMargin - 0.35, { align: 'right' });
    }
  };

  const checkPageBreak = (neededHeight: number) => {
    if (cursorY + neededHeight > pageHeight - bottomMargin) {
      doc.addPage();
      pageNumber++;
      printPageHeader(pageNumber);
      cursorY = topMargin;
    }
  };

  printPageHeader(pageNumber);

  // 2. RENDER BLOCKS
  for (let i = 0; i < project.blocks.length; i++) {
    const block = project.blocks[i];

    switch (block.type) {
      case 'act': {
        checkPageBreak(lineHeight * 4);
        cursorY += lineHeight * 1.5;

        // Act heading centered, bold uppercase
        doc.setFont('courier', 'bold');
        doc.setFontSize(13);

        const actText = block.content.toUpperCase();
        doc.text(actText, centerX, cursorY, { align: 'center' });
        cursorY += lineHeight * 1.2;
        break;
      }

      case 'scene_heading': {
        checkPageBreak(lineHeight * 3);
        cursorY += lineHeight * 0.8; // extra blank space before scene heading

        // Scene heading in BOLD
        doc.setFont('courier', 'bold');
        doc.setFontSize(12);
        
        let text = block.content.toUpperCase();
        if (project.settings.showSceneNumbers && block.sceneNumber) {
          text = `${block.sceneNumber}. ${text}`;
        }
        
        const lines = doc.splitTextToSize(text, contentWidth);
        for (const line of lines) {
          checkPageBreak(lineHeight);
          doc.text(line, leftMargin, cursorY);
          cursorY += lineHeight;
        }
        cursorY += lineHeight * 0.4;
        break;
      }

      case 'action': {
        checkPageBreak(lineHeight * 2);
        doc.setFont('courier', 'normal');
        doc.setFontSize(12);

        const lines = doc.splitTextToSize(block.content, contentWidth);
        for (const line of lines) {
          checkPageBreak(lineHeight);
          doc.text(line, leftMargin, cursorY);
          cursorY += lineHeight;
        }
        cursorY += lineHeight * 0.4;
        break;
      }

      case 'character': {
        checkPageBreak(lineHeight * 3);
        cursorY += lineHeight * 0.5;

        // Character in BOLD uppercase, indented ~2.2 inches from left edge (leftMargin + 2.2)
        doc.setFont('courier', 'bold');
        doc.setFontSize(12);

        const charIndent = leftMargin + 2.2;
        const charWidth = 3.5;
        const lines = doc.splitTextToSize(block.content.toUpperCase(), charWidth);
        
        for (const line of lines) {
          checkPageBreak(lineHeight);
          doc.text(line, charIndent, cursorY);
          cursorY += lineHeight;
        }
        break;
      }

      case 'parenthetical': {
        checkPageBreak(lineHeight * 2);
        doc.setFont('courier', 'normal');
        doc.setFontSize(12);

        const parenIndent = leftMargin + 1.5;
        const parenWidth = 3.0;
        const formatted = block.content.startsWith('(') && block.content.endsWith(')')
          ? block.content
          : `(${block.content.replace(/^\(+|\)+$/g, '')})`;

        const lines = doc.splitTextToSize(formatted, parenWidth);
        for (const line of lines) {
          checkPageBreak(lineHeight);
          doc.text(line, parenIndent, cursorY);
          cursorY += lineHeight;
        }
        break;
      }

      case 'dialogue': {
        checkPageBreak(lineHeight * 2);
        doc.setFont('courier', 'normal');
        doc.setFontSize(12);

        const dialIndent = leftMargin + 1.0;
        const dialWidth = 3.8;
        const lines = doc.splitTextToSize(block.content, dialWidth);
        
        for (const line of lines) {
          checkPageBreak(lineHeight);
          doc.text(line, dialIndent, cursorY);
          cursorY += lineHeight;
        }
        cursorY += lineHeight * 0.4;
        break;
      }

      case 'transition': {
        checkPageBreak(lineHeight * 2);
        cursorY += lineHeight * 0.5;

        // Transition in BOLD, right-aligned
        doc.setFont('courier', 'bold');
        doc.setFontSize(12);

        const transText = block.content.toUpperCase();
        doc.text(transText, pageWidth - rightMargin, cursorY, { align: 'right' });
        cursorY += lineHeight * 1.2;
        break;
      }

      case 'shot': {
        checkPageBreak(lineHeight * 2);
        cursorY += lineHeight * 0.5;

        doc.setFont('courier', 'bold');
        doc.setFontSize(12);

        const lines = doc.splitTextToSize(block.content.toUpperCase(), contentWidth);
        for (const line of lines) {
          checkPageBreak(lineHeight);
          doc.text(line, leftMargin, cursorY);
          cursorY += lineHeight;
        }
        cursorY += lineHeight * 0.4;
        break;
      }

      case 'text': {
        checkPageBreak(lineHeight * 2);
        doc.setFont('courier', 'normal');
        doc.setFontSize(12);

        const lines = doc.splitTextToSize(block.content, contentWidth);
        for (const line of lines) {
          checkPageBreak(lineHeight);
          doc.text(line, leftMargin, cursorY);
          cursorY += lineHeight;
        }
        cursorY += lineHeight * 0.4;
        break;
      }

      default:
        break;
    }
  }

  // Save the PDF with sanitized title
  const cleanTitle = (project.title || 'Guion').replace(/[^a-zA-Z0-9_\-áéíóúÁÉÍÓÚñÑ]/g, '_');
  doc.save(`${cleanTitle}.pdf`);
}

function renderTitlePage(doc: jsPDF, project: Project, pageWidth: number, pageHeight: number) {
  const { titlePage } = project;
  const centerX = pageWidth / 2;

  // Title in bold uppercase
  doc.setFont('courier', 'bold');
  doc.setFontSize(24);
  const titleLines = doc.splitTextToSize((titlePage.title || project.title || 'TÍTULO DEL GUIÓN').toUpperCase(), 6.0);
  
  let titleY = pageHeight * 0.35;
  for (const line of titleLines) {
    doc.text(line, centerX, titleY, { align: 'center' });
    titleY += 0.38;
  }

  // Written by
  doc.setFont('courier', 'normal');
  doc.setFontSize(12);
  doc.text('Escrito por', centerX, titleY + 0.3, { align: 'center' });

  // Author name in bold
  doc.setFont('courier', 'bold');
  doc.setFontSize(16);
  doc.text(titlePage.writtenBy || 'Mauricio Moreira', centerX, titleY + 0.65, { align: 'center' });

  // Based on (if any)
  if (titlePage.basedOn) {
    doc.setFont('courier', 'normal');
    doc.setFontSize(11);
    doc.text(`Basado en: ${titlePage.basedOn}`, centerX, titleY + 1.0, { align: 'center' });
  }

  // Bottom metadata: Draft & Contact
  const bottomY = pageHeight - 1.5;
  doc.setFont('courier', 'normal');
  doc.setFontSize(11);

  if (titlePage.draft || titlePage.date) {
    const draftText = `${titlePage.draft || 'Primer Borrador'} - ${titlePage.date || new Date().toLocaleDateString('es-ES')}`;
    doc.text(draftText, 1.5, bottomY);
  }

  if (titlePage.contact) {
    const contactLines = doc.splitTextToSize(titlePage.contact, 3.5);
    let cY = bottomY;
    for (const cline of contactLines) {
      doc.text(cline, pageWidth - 1.0, cY, { align: 'right' });
      cY += 0.2;
    }
  }
}
