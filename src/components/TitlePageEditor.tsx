import React from 'react';
import { FileText, Save, Sparkles, BookOpen, Info } from 'lucide-react';
import { Project, TitlePageData } from '../types';

interface TitlePageEditorProps {
  project: Project;
  onUpdateTitlePage: (titlePage: TitlePageData) => void;
}

export const TitlePageEditor: React.FC<TitlePageEditorProps> = ({
  project,
  onUpdateTitlePage,
}) => {
  const { titlePage } = project;

  const handleChange = (field: keyof TitlePageData, value: string) => {
    onUpdateTitlePage({
      ...titlePage,
      [field]: value,
    });
  };

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-85px)] bg-[#F4F4F1] text-[#1A1A1A] overflow-y-auto p-4 sm:p-8">
      <div className="max-w-3xl mx-auto w-full space-y-6 pb-20">
        {/* Header */}
        <div className="flex items-center gap-3.5 bg-[#EBEBE8] p-5 rounded-2xl border border-[#D9D9D6] shadow-xs">
          <div className="w-12 h-12 rounded-xl bg-white border border-[#D9D9D6] flex items-center justify-center text-[#1A1A1A]">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[#1A1A1A] font-serif">Portada y Metadatos del Guion</h1>
            <p className="text-xs text-[#70706B] mt-0.5">
              Configura la carátula estándar según los requisitos de los festivales y productoras.
            </p>
          </div>
        </div>

        {/* Title Page Paper Preview & Inputs */}
        <div className="bg-white border border-[#D9D9D6] rounded-2xl p-6 sm:p-8 shadow-xs space-y-6">
          {/* Main Title */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#1A1A1A] mb-1.5">
              Título del Guion (En Mayúsculas)
            </label>
            <input
              type="text"
              value={titlePage.title !== undefined ? titlePage.title : (project.title || '')}
              onChange={(e) => handleChange('title', e.target.value.toUpperCase())}
              placeholder="EJ: LA ÚLTIMA TOMA"
              className="w-full px-4 py-2.5 bg-[#F4F4F1] border border-[#D9D9D6] rounded-xl text-[#1A1A1A] font-screenplay font-bold text-lg focus:border-[#1A1A1A] outline-none uppercase"
            />
          </div>

          {/* Author */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#70706B] mb-1.5">
                Escrito por / Autor(a)
              </label>
              <input
                type="text"
                value={titlePage.writtenBy || ''}
                onChange={(e) => handleChange('writtenBy', e.target.value)}
                placeholder="Nombre del guionista"
                className="w-full px-3.5 py-2 bg-[#F4F4F1] border border-[#D9D9D6] rounded-xl text-[#1A1A1A] text-sm focus:border-[#1A1A1A] outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#70706B] mb-1.5">
                Basado en (Opcional)
              </label>
              <input
                type="text"
                value={titlePage.basedOn || ''}
                onChange={(e) => handleChange('basedOn', e.target.value)}
                placeholder="Ej: Obra teatral / Idea original de..."
                className="w-full px-3.5 py-2 bg-[#F4F4F1] border border-[#D9D9D6] rounded-xl text-[#1A1A1A] text-sm focus:border-[#1A1A1A] outline-none"
              />
            </div>
          </div>

          {/* Draft & Date */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#70706B] mb-1.5">
                Versión / Borrador
              </label>
              <input
                type="text"
                value={titlePage.draft || ''}
                onChange={(e) => handleChange('draft', e.target.value)}
                placeholder="Ej: Primer Borrador"
                className="w-full px-3.5 py-2 bg-[#F4F4F1] border border-[#D9D9D6] rounded-xl text-[#1A1A1A] text-sm focus:border-[#1A1A1A] outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#70706B] mb-1.5">
                Fecha
              </label>
              <input
                type="text"
                value={titlePage.date || ''}
                onChange={(e) => handleChange('date', e.target.value)}
                placeholder="Ej: Octubre 2026"
                className="w-full px-3.5 py-2 bg-[#F4F4F1] border border-[#D9D9D6] rounded-xl text-[#1A1A1A] text-sm focus:border-[#1A1A1A] outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#70706B] mb-1.5">
                Género
              </label>
              <input
                type="text"
                value={titlePage.genre || ''}
                onChange={(e) => handleChange('genre', e.target.value)}
                placeholder="Ej: Thriller / Suspenso"
                className="w-full px-3.5 py-2 bg-[#F4F4F1] border border-[#D9D9D6] rounded-xl text-[#1A1A1A] text-sm focus:border-[#1A1A1A] outline-none"
              />
            </div>
          </div>

          {/* Logline */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#70706B] mb-1.5">
              Logline (Premisa argumental en una o dos oraciones)
            </label>
            <textarea
              value={titlePage.logline || ''}
              onChange={(e) => handleChange('logline', e.target.value)}
              placeholder="Un resumen conciso del protagonista, su objetivo central, el obstáculo y lo que está en juego."
              rows={3}
              className="w-full px-3.5 py-2 bg-[#F4F4F1] border border-[#D9D9D6] rounded-xl text-[#1A1A1A] text-sm focus:border-[#1A1A1A] outline-none resize-none leading-relaxed"
            />
          </div>

          {/* Contact Info */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#70706B] mb-1.5">
              Información de Contacto & Derechos (Esquina Inferior Derecha)
            </label>
            <textarea
              value={titlePage.contact || ''}
              onChange={(e) => handleChange('contact', e.target.value)}
              placeholder="Email: contacto@ejemplo.com&#10;Tel: +34 600 000 000&#10;Registro de Propiedad Intelectual: Dep. Legal 2026"
              rows={3}
              className="w-full px-3.5 py-2 bg-[#F4F4F1] border border-[#D9D9D6] rounded-xl text-[#1A1A1A] text-xs font-mono focus:border-[#1A1A1A] outline-none resize-none leading-relaxed"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
