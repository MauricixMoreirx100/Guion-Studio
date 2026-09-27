import { Project, ScriptBlock } from '../types';

/**
 * Generates and downloads a Final Draft (.fdx) XML file compatible with Final Draft 8/9/10/11/12/13 and Celtx
 */
export function exportProjectToFdx(project: Project) {
  const fdxXml = generateFdxXml(project);
  const blob = new Blob([fdxXml], { type: 'application/xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const cleanTitle = (project.title || 'Guion').replace(/[^a-zA-Z0-9_\-áéíóúÁÉÍÓÚñÑ]/g, '_');
  a.download = `${cleanTitle}.fdx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export function generateFdxXml(project: Project): string {
  const { titlePage, blocks } = project;

  let xml = `<?xml version="1.0" encoding="UTF-8" standalone="no" ?>\n`;
  xml += `<FinalDraft DocumentType="Script" Template="No" Version="3">\n`;

  // Content Blocks
  xml += `  <Content>\n`;

  for (const block of blocks) {
    const text = escapeXml(block.content || '');

    switch (block.type) {
      case 'act':
        xml += `    <Paragraph Type="Act Break">\n`;
        xml += `      <Text Bold="Yes">${text.toUpperCase()}</Text>\n`;
        xml += `    </Paragraph>\n`;
        break;

      case 'scene_heading':
        xml += `    <Paragraph Type="Scene Heading">\n`;
        if (block.sceneNumber) {
          xml += `      <SceneProperties Number="${block.sceneNumber}"/>\n`;
        }
        xml += `      <Text>${text.toUpperCase()}</Text>\n`;
        xml += `    </Paragraph>\n`;
        break;

      case 'action':
        xml += `    <Paragraph Type="Action">\n`;
        xml += `      <Text>${text}</Text>\n`;
        xml += `    </Paragraph>\n`;
        break;

      case 'character':
        xml += `    <Paragraph Type="Character">\n`;
        xml += `      <Text>${text.toUpperCase()}</Text>\n`;
        xml += `    </Paragraph>\n`;
        break;

      case 'parenthetical':
        xml += `    <Paragraph Type="Parenthetical">\n`;
        xml += `      <Text>${text.startsWith('(') ? text : `(${text})`}</Text>\n`;
        xml += `    </Paragraph>\n`;
        break;

      case 'dialogue':
        xml += `    <Paragraph Type="Dialogue">\n`;
        xml += `      <Text>${text}</Text>\n`;
        xml += `    </Paragraph>\n`;
        break;

      case 'transition':
        xml += `    <Paragraph Type="Transition">\n`;
        xml += `      <Text>${text.toUpperCase()}</Text>\n`;
        xml += `    </Paragraph>\n`;
        break;

      case 'shot':
        xml += `    <Paragraph Type="Shot">\n`;
        xml += `      <Text>${text.toUpperCase()}</Text>\n`;
        xml += `    </Paragraph>\n`;
        break;

      case 'note':
        xml += `    <Paragraph Type="General">\n`;
        xml += `      <Text>[[ ${text} ]]</Text>\n`;
        xml += `    </Paragraph>\n`;
        break;

      default:
        xml += `    <Paragraph Type="Action">\n`;
        xml += `      <Text>${text}</Text>\n`;
        xml += `    </Paragraph>\n`;
        break;
    }
  }

  xml += `  </Content>\n`;

  // Title Page
  if (titlePage) {
    xml += `  <TitlePage>\n`;
    xml += `    <Header><Paragraph/></Header>\n`;
    xml += `    <Content>\n`;
    xml += `      <Paragraph Alignment="Center">\n`;
    xml += `        <Text Bold="Yes" Size="18">${escapeXml((titlePage.title || project.title || 'SIN TÍTULO').toUpperCase())}</Text>\n`;
    xml += `      </Paragraph>\n`;
    xml += `      <Paragraph Alignment="Center"><Text></Text></Paragraph>\n`;
    xml += `      <Paragraph Alignment="Center">\n`;
    xml += `        <Text>Escrito por</Text>\n`;
    xml += `      </Paragraph>\n`;
    xml += `      <Paragraph Alignment="Center"><Text></Text></Paragraph>\n`;
    xml += `      <Paragraph Alignment="Center">\n`;
    xml += `        <Text Bold="Yes">${escapeXml(titlePage.writtenBy || 'Mauricio Moreira')}</Text>\n`;
    xml += `      </Paragraph>\n`;
    if (titlePage.basedOn) {
      xml += `      <Paragraph Alignment="Center">\n`;
      xml += `        <Text>Basado en: ${escapeXml(titlePage.basedOn)}</Text>\n`;
      xml += `      </Paragraph>\n`;
    }
    xml += `    </Content>\n`;
    xml += `  </TitlePage>\n`;
  }

  xml += `</FinalDraft>\n`;
  return xml;
}

/**
 * Quick direct download for any supported format
 */
export function downloadDocumentInFormat(project: Project, format: 'pdf' | 'fdx' | 'fountain' | 'txt' | 'json') {
  const cleanTitle = (project.title || 'Guion').replace(/[^a-zA-Z0-9_\-áéíóúÁÉÍÓÚñÑ]/g, '_');

  if (format === 'fdx') {
    exportProjectToFdx(project);
    return;
  }

  if (format === 'fountain') {
    import('./fountain').then(({ blocksToFountain }) => {
      const fountainContent = blocksToFountain(project.blocks, {
        title: project.titlePage?.title || project.title,
        writtenBy: project.titlePage?.writtenBy || 'Autor',
      });
      const blob = new Blob([fountainContent], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${cleanTitle}.fountain`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    });
    return;
  }

  if (format === 'txt') {
    import('./fountain').then(({ blocksToFormattedPlainText }) => {
      const txtContent = blocksToFormattedPlainText(project.blocks);
      const blob = new Blob([txtContent], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${cleanTitle}_formateado.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    });
    return;
  }

  if (format === 'json') {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(project, null, 2));
    const a = document.createElement('a');
    a.href = dataStr;
    a.download = `${cleanTitle}_proyecto.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    return;
  }

  if (format === 'pdf') {
    import('./pdfExport').then(({ exportProjectToPdf }) => {
      exportProjectToPdf(project);
    });
    return;
  }
}
