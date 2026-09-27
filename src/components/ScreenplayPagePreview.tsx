import React, { useState } from 'react';
import { 
  Download, 
  Printer, 
  ZoomIn, 
  ZoomOut, 
  Maximize2, 
  FileText, 
  Check, 
  Layers,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { Project, ScriptBlock } from '../types';
import { exportProjectToPdf } from '../utils/pdfExport';

interface ScreenplayPagePreviewProps {
  project: Project;
  onPrint: () => void;
  isDarkMode?: boolean;
}

export const ScreenplayPagePreview: React.FC<ScreenplayPagePreviewProps> = ({
  project,
  onPrint,
  isDarkMode = false,
}) => {
  const [zoom, setZoom] = useState<number>(100);
  const [showTitlePage, setShowTitlePage] = useState<boolean>(true);

  // Group blocks into simulated pages (~52 lines per standard page)
  const pages: ScriptBlock[][] = [];
  let currentPage: ScriptBlock[] = [];
  let currentLines = 0;
  const MAX_LINES_PER_PAGE = 50;

  for (const block of project.blocks) {
    let blockLines = 1;
    switch (block.type) {
      case 'scene_heading':
        blockLines = 3;
        break;
      case 'action':
        blockLines = Math.max(1, Math.ceil(block.content.length / 60)) + 1;
        break;
      case 'character':
        blockLines = 2;
        break;
      case 'parenthetical':
        blockLines = 1;
        break;
      case 'dialogue':
        blockLines = Math.max(1, Math.ceil(block.content.length / 35)) + 1;
        break;
      case 'transition':
      case 'shot':
        blockLines = 2;
        break;
      default:
        blockLines = 1;
        break;
    }

    if (currentLines + blockLines > MAX_LINES_PER_PAGE && currentPage.length > 0) {
      pages.push(currentPage);
      currentPage = [block];
      currentLines = blockLines;
    } else {
      currentPage.push(block);
      currentLines += blockLines;
    }
  }

  if (currentPage.length > 0) {
    pages.push(currentPage);
  }

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-85px)] bg-[#F4F4F1] text-[#1A1A1A] overflow-hidden">
      {/* Top Preview Controls Toolbar */}
      <div className={`no-print border-b px-4 py-2 flex items-center justify-between gap-4 flex-wrap z-10 transition-colors ${
        isDarkMode ? 'bg-[#18181b] border-[#27272a] text-white' : 'bg-[#EBEBE8] border-[#D9D9D6] text-[#1A1A1A]'
      }`}>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs font-medium">
            <Layers className="w-4 h-4 text-amber-500" />
            <span>Páginas: <strong>{pages.length + (showTitlePage ? 1 : 0)}</strong></span>
          </div>

          <div className={`h-4 w-px ${isDarkMode ? 'bg-[#33333c]' : 'bg-[#D9D9D6]'}`} />

          {/* Toggle Title page */}
          <label className={`flex items-center gap-1.5 text-xs cursor-pointer select-none ${
            isDarkMode ? 'text-[#A0A0AB] hover:text-white' : 'text-[#70706B] hover:text-[#1A1A1A]'
          }`}>
            <input
              type="checkbox"
              checked={showTitlePage}
              onChange={(e) => setShowTitlePage(e.target.checked)}
              className="accent-amber-500 rounded"
            />
            <span>Mostrar Portada</span>
          </label>
        </div>

        {/* Zoom & Export Actions */}
        <div className="flex items-center gap-2">
          {/* Zoom controls */}
          <div className={`flex items-center px-2 py-1 rounded-md border gap-1 text-xs shadow-xs ${
            isDarkMode ? 'bg-[#222228] border-[#33333c] text-[#A0A0AB]' : 'bg-white border-[#D9D9D6] text-[#70706B]'
          }`}>
            <button
              onClick={() => setZoom((z) => Math.max(60, z - 10))}
              className={`p-1 ${isDarkMode ? 'hover:text-white' : 'hover:text-[#1A1A1A]'}`}
              title="Reducir zoom"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className={`w-10 text-center font-mono font-medium ${isDarkMode ? 'text-white' : 'text-[#1A1A1A]'}`}>{zoom}%</span>
            <button
              onClick={() => setZoom((z) => Math.min(140, z + 10))}
              className={`p-1 ${isDarkMode ? 'hover:text-white' : 'hover:text-[#1A1A1A]'}`}
              title="Aumentar zoom"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Print Button */}
          <button
            onClick={onPrint}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md border text-xs font-medium transition-all shadow-xs ${
              isDarkMode
                ? 'bg-[#222228] hover:bg-[#2c2c34] border-[#33333c] text-white'
                : 'bg-white hover:bg-[#F4F4F1] border-[#D9D9D6] text-[#1A1A1A] hover:border-[#1A1A1A]'
            }`}
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Imprimir</span>
          </button>

          {/* Direct PDF Download */}
          <button
            onClick={() => exportProjectToPdf(project)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-md bg-amber-500 hover:bg-amber-400 text-black font-semibold text-xs shadow-xs transition-all active:scale-95"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Descargar PDF</span>
          </button>
        </div>
      </div>

      {/* Pages Canvas */}
      <div className={`flex-1 overflow-y-auto p-4 sm:p-8 flex flex-col items-center gap-8 transition-colors ${
        isDarkMode ? 'bg-[#121214]' : 'bg-[#EBEBE8]'
      }`}>
        <div 
          style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top center' }}
          className="transition-transform duration-150 flex flex-col gap-10 items-center pb-20"
        >
          {/* 1. TITLE PAGE (PORTADA) */}
          {showTitlePage && (
            <div className={`screenplay-paper flex flex-col justify-between select-text relative border ${
              isDarkMode ? 'dark-sheet bg-[#222228] text-white border-[#33333c]' : 'light-sheet bg-white text-[#111111] border-[#D9D9D6]'
            }`}>
              <div />
              {/* Center Title & Author */}
              <div className="text-center my-auto space-y-8 px-6">
                <h1 className="text-3xl sm:text-5xl font-black uppercase tracking-wider font-screenplay leading-tight">
                  {project.titlePage?.title || project.title || 'TÍTULO DEL GUIÓN'}
                </h1>
                <div className="space-y-2 pt-2">
                  <p className="text-xs sm:text-sm font-screenplay uppercase tracking-[0.25em] opacity-70">Escrito por</p>
                  <p className="text-xl sm:text-2xl font-bold font-screenplay">
                    {project.titlePage?.writtenBy || 'Mauricio Moreira'}
                  </p>
                </div>
                {project.titlePage?.basedOn && (
                  <p className={`text-xs sm:text-sm italic font-screenplay ${isDarkMode ? 'text-[#A0A0AB]' : 'text-neutral-700'}`}>
                    Basado en: {project.titlePage.basedOn}
                  </p>
                )}
              </div>

              {/* Bottom Metadata */}
              <div className={`flex justify-between items-end text-xs font-screenplay border-t pt-4 ${
                isDarkMode ? 'text-[#A0A0AB] border-[#33333c]' : 'text-neutral-700 border-neutral-300/40'
              }`}>
                <div>
                  <p className="font-semibold">{project.titlePage?.draft || 'Primer Borrador'}</p>
                  <p>{project.titlePage?.date || new Date().toLocaleDateString('es-ES')}</p>
                </div>
                <div className="text-right whitespace-pre-line text-[11px]">
                  {project.titlePage?.contact || 'contacto@guionstudio.com'}
                </div>
              </div>
            </div>
          )}

          {/* 2. SCRIPT PAGES */}
          {pages.map((pageBlocks, pageIdx) => {
            const pageNumber = pageIdx + 1;

            return (
              <div key={pageIdx} className={`screenplay-paper select-text relative border ${
                isDarkMode ? 'dark-sheet bg-[#222228] text-white border-[#33333c]' : 'light-sheet bg-white text-[#111111] border-[#D9D9D6]'
              }`}>
                {/* Page Number Header (Page 2 onwards) */}
                {pageNumber > 1 && (
                  <div className={`text-right text-xs font-screenplay mb-6 -mt-4 ${
                    isDarkMode ? 'text-white' : 'text-neutral-700'
                  }`}>
                    {pageNumber}.
                  </div>
                )}

                {/* Blocks Content */}
                <div className="space-y-1">
                  {pageBlocks.map((block) => {
                    switch (block.type) {
                      case 'act':
                        return (
                          <div key={block.id} className="script-act">
                            <strong>{block.content.toUpperCase()}</strong>
                          </div>
                        );

                      case 'scene_heading':
                        return (
                          <div key={block.id} className="script-scene-heading">
                            {project.settings.showSceneNumbers && block.sceneNumber && (
                              <span className="mr-2">{block.sceneNumber}.</span>
                            )}
                            <strong>{block.content.toUpperCase()}</strong>
                          </div>
                        );

                      case 'action':
                        return (
                          <div key={block.id} className="script-action">
                            {block.content}
                          </div>
                        );

                      case 'character':
                        return (
                          <div key={block.id} className="script-character">
                            <strong>{block.content.toUpperCase()}</strong>
                          </div>
                        );

                      case 'parenthetical':
                        return (
                          <div key={block.id} className="script-parenthetical">
                            {block.content.startsWith('(') ? block.content : `(${block.content})`}
                          </div>
                        );

                      case 'dialogue':
                        return (
                          <div key={block.id} className="script-dialogue">
                            {block.content}
                          </div>
                        );

                      case 'transition':
                        return (
                          <div key={block.id} className="script-transition">
                            <strong>{block.content.toUpperCase()}</strong>
                          </div>
                        );

                      case 'shot':
                        return (
                          <div key={block.id} className="script-shot">
                            <strong>{block.content.toUpperCase()}</strong>
                          </div>
                        );

                      case 'text':
                        return (
                          <div key={block.id} className="script-text">
                            {block.content}
                          </div>
                        );

                      default:
                        return null;
                    }
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
