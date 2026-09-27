import React, { useState } from 'react';
import { 
  X, 
  Download, 
  Printer, 
  FileCode, 
  FileText, 
  Database, 
  Copy, 
  Check, 
  Sparkles,
  Layers,
  Film
} from 'lucide-react';
import { Project } from '../types';
import { exportProjectToPdf } from '../utils/pdfExport';
import { blocksToFountain, blocksToFormattedPlainText } from '../utils/fountain';
import { exportProjectAsJson } from '../utils/storage';
import { exportProjectToFdx } from '../utils/fdxExport';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project;
  onPrint: () => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  project,
  onPrint,
}) => {
  const [copiedFormat, setCopiedFormat] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleDownloadPdf = () => {
    exportProjectToPdf(project);
    onClose();
  };

  const handleDownloadFdx = () => {
    exportProjectToFdx(project);
    onClose();
  };

  const handleDownloadFountain = () => {
    const text = blocksToFountain(project.blocks, {
      title: project.titlePage?.title || project.title,
      writtenBy: project.titlePage?.writtenBy || '',
    });
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${(project.title || 'guion').toLowerCase().replace(/\s+/g, '_')}.fountain`;
    link.click();
    URL.revokeObjectURL(url);
    onClose();
  };

  const handleDownloadTxt = () => {
    const text = blocksToFormattedPlainText(project.blocks);
    const header = `TÍTULO: ${project.titlePage?.title || project.title}\nAUTOR: ${project.titlePage?.writtenBy || ''}\nFECHA: ${new Date().toLocaleDateString('es-ES')}\n=======================================================\n\n`;
    const blob = new Blob([header + text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${(project.title || 'guion').toLowerCase().replace(/\s+/g, '_')}_formato.txt`;
    link.click();
    URL.revokeObjectURL(url);
    onClose();
  };

  const handleCopyFountain = () => {
    const text = blocksToFountain(project.blocks, {
      title: project.titlePage?.title || project.title,
      writtenBy: project.titlePage?.writtenBy || '',
    });
    navigator.clipboard.writeText(text);
    setCopiedFormat('fountain');
    setTimeout(() => setCopiedFormat(null), 2000);
  };

  const handleCopyTxt = () => {
    const text = blocksToFormattedPlainText(project.blocks);
    navigator.clipboard.writeText(text);
    setCopiedFormat('txt');
    setTimeout(() => setCopiedFormat(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div 
        className="bg-white border border-[#D9D9D6] rounded-2xl w-full max-w-2xl shadow-xl overflow-hidden flex flex-col text-[#1A1A1A]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#D9D9D6] flex items-center justify-between bg-[#EBEBE8]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white border border-[#D9D9D6] flex items-center justify-center text-[#1A1A1A]">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#1A1A1A] font-serif">Descargar y Exportar Guion</h2>
              <p className="text-xs text-[#70706B] mt-0.5">
                Elige el formato de exportación para producción cinematográfica.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[#70706B] hover:text-[#1A1A1A] rounded-lg hover:bg-[#F4F4F1] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4 bg-[#F4F4F1] max-h-[75vh] overflow-y-auto">
          {/* PDF Standard */}
          <div className="p-4 rounded-xl border border-[#1A1A1A] bg-white flex flex-col justify-between hover:shadow-md transition-all group">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="px-2 py-0.5 rounded bg-[#1A1A1A] text-white font-bold text-[11px]">
                  Recomendado
                </span>
                <FileText className="w-5 h-5 text-[#1A1A1A]" />
              </div>
              <h3 className="font-bold text-sm text-[#1A1A1A] mb-1 font-serif">PDF Estándar Cine</h3>
              <p className="text-xs text-[#70706B] mb-4 leading-relaxed">
                Paginación real de Hollywood con márgenes exactos, portada, personajes y locaciones en negrita.
              </p>
            </div>
            <button
              onClick={handleDownloadPdf}
              className="w-full py-2 px-3 rounded-lg bg-[#1A1A1A] hover:bg-[#333333] text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-xs transition-all active:scale-95"
            >
              <Download className="w-4 h-4" />
              <span>Descargar PDF</span>
            </button>
          </div>

          {/* Final Draft FDX */}
          <div className="p-4 rounded-xl border border-[#D9D9D6] bg-white flex flex-col justify-between hover:border-[#1A1A1A] transition-all">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold text-emerald-800 px-1.5 py-0.5 rounded bg-emerald-50 border border-emerald-200">Final Draft</span>
                <Film className="w-5 h-5 text-emerald-800" />
              </div>
              <h3 className="font-bold text-sm text-[#1A1A1A] mb-1 font-serif">Final Draft XML (.fdx)</h3>
              <p className="text-xs text-[#70706B] mb-4 leading-relaxed">
                Formato estándar de la industria compatible con Final Draft 10/11/12/13, Celtx y WriterDuet.
              </p>
            </div>
            <button
              onClick={handleDownloadFdx}
              className="w-full py-2 px-3 rounded-lg bg-emerald-800 hover:bg-emerald-900 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-xs transition-all active:scale-95"
            >
              <Download className="w-4 h-4" />
              <span>Descargar Final Draft (.fdx)</span>
            </button>
          </div>

          {/* Fountain */}
          <div className="p-4 rounded-xl border border-[#D9D9D6] bg-white flex flex-col justify-between hover:border-[#1A1A1A] transition-all">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-medium text-[#70706B] px-1.5 py-0.5 rounded bg-[#F4F4F1] border border-[#D9D9D6]">Texto Universal</span>
                <FileCode className="w-5 h-5 text-[#1A1A1A]" />
              </div>
              <h3 className="font-bold text-sm text-[#1A1A1A] mb-1 font-serif">Formato Fountain (.fountain)</h3>
              <p className="text-xs text-[#70706B] mb-4 leading-relaxed">
                Compatible con Highland, WriterDuet, Fade In y aplicaciones de guionismo.
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleDownloadFountain}
                className="flex-1 py-2 px-3 rounded-lg bg-[#F4F4F1] hover:bg-[#EBEBE8] text-[#1A1A1A] border border-[#D9D9D6] font-medium text-xs flex items-center justify-center gap-1.5 transition-all shadow-xs"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Archivo</span>
              </button>
              <button
                onClick={handleCopyFountain}
                className="px-3 py-2 rounded-lg bg-[#F4F4F1] hover:bg-[#EBEBE8] text-[#1A1A1A] border border-[#D9D9D6] text-xs flex items-center justify-center transition-all shadow-xs"
                title="Copiar texto Fountain al portapapeles"
              >
                {copiedFormat === 'fountain' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* Formatted TXT */}
          <div className="p-4 rounded-xl border border-[#D9D9D6] bg-white flex flex-col justify-between hover:border-[#1A1A1A] transition-all">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-medium text-[#70706B] px-1.5 py-0.5 rounded bg-[#F4F4F1] border border-[#D9D9D6]">Texto Plano</span>
                <FileText className="w-5 h-5 text-[#1A1A1A]" />
              </div>
              <h3 className="font-bold text-sm text-[#1A1A1A] mb-1 font-serif">Texto Formateado (.txt)</h3>
              <p className="text-xs text-[#70706B] mb-4 leading-relaxed">
                Guion en texto con sangrías y marcas en **negrita** para personajes y lugares.
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleDownloadTxt}
                className="flex-1 py-2 px-3 rounded-lg bg-[#F4F4F1] hover:bg-[#EBEBE8] text-[#1A1A1A] border border-[#D9D9D6] font-medium text-xs flex items-center justify-center gap-1.5 transition-all shadow-xs"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Descargar .txt</span>
              </button>
              <button
                onClick={handleCopyTxt}
                className="px-3 py-2 rounded-lg bg-[#F4F4F1] hover:bg-[#EBEBE8] text-[#1A1A1A] border border-[#D9D9D6] text-xs flex items-center justify-center transition-all shadow-xs"
                title="Copiar texto formateado"
              >
                {copiedFormat === 'txt' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* JSON Project Backup & Print */}
          <div className="p-4 rounded-xl border border-[#D9D9D6] bg-white flex flex-col justify-between hover:border-[#1A1A1A] transition-all sm:col-span-2">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-medium text-[#70706B] px-1.5 py-0.5 rounded bg-[#F4F4F1] border border-[#D9D9D6]">Respaldo & Físico</span>
                <Database className="w-5 h-5 text-[#1A1A1A]" />
              </div>
              <h3 className="font-bold text-sm text-[#1A1A1A] mb-1 font-serif">Respaldo Completo / Imprimir</h3>
              <p className="text-xs text-[#70706B] mb-4 leading-relaxed">
                Exporta el archivo del proyecto con todas las locaciones y personajes o imprime directamente.
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  exportProjectAsJson(project);
                  onClose();
                }}
                className="flex-1 py-2 px-2.5 rounded-lg bg-[#F4F4F1] hover:bg-[#EBEBE8] text-[#1A1A1A] border border-[#D9D9D6] font-medium text-xs flex items-center justify-center gap-1.5 transition-all shadow-xs"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Backup .json</span>
              </button>
              <button
                onClick={() => {
                  onClose();
                  setTimeout(() => onPrint(), 200);
                }}
                className="flex-1 py-2 px-2.5 rounded-lg bg-[#F4F4F1] hover:bg-[#EBEBE8] text-[#1A1A1A] border border-[#D9D9D6] font-medium text-xs flex items-center justify-center gap-1.5 transition-all shadow-xs"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Imprimir</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="px-6 py-3 bg-[#EBEBE8] border-t border-[#D9D9D6] flex items-center justify-between text-xs text-[#70706B]">
          <span>Formato: Negrita en Personajes & Locaciones</span>
          <button
            onClick={onClose}
            className="text-[#1A1A1A] hover:underline font-medium"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
