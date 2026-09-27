import React, { useState } from 'react';
import { 
  X, 
  Plus, 
  FileText, 
  Trash2, 
  Copy, 
  Download, 
  Upload, 
  Clock, 
  Film, 
  Tv, 
  Sparkles, 
  Search, 
  CheckCircle2, 
  FolderPlus
} from 'lucide-react';
import { Project } from '../types';
import { calculateScriptStats } from '../utils/fountain';

interface ProjectManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  projects: Project[];
  activeProjectId: string;
  onSelectProject: (id: string) => void;
  onCreateNewProject: (title: string, type: Project['type'], template?: string) => void;
  onDuplicateProject: (project: Project) => void;
  onDeleteProject: (id: string) => void;
  onImportJson: (jsonStr: string) => void;
  onExportJson: (project: Project) => void;
}

export const ProjectManagerModal: React.FC<ProjectManagerModalProps> = ({
  isOpen,
  onClose,
  projects,
  activeProjectId,
  onSelectProject,
  onCreateNewProject,
  onDuplicateProject,
  onDeleteProject,
  onImportJson,
  onExportJson,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newType, setNewType] = useState<Project['type']>('short');
  const [newTemplate, setNewTemplate] = useState<string>('blank');

  if (!isOpen) return null;

  const filteredProjects = projects.filter((p) =>
    (p.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (p.titlePage?.logline || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    onCreateNewProject(newTitle.trim().toUpperCase(), newType, newTemplate);
    setIsCreatingNew(false);
    setNewTitle('');
    onClose();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const content = evt.target?.result as string;
      if (content) {
        onImportJson(content);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      <div 
        className="bg-white border border-[#D9D9D6] rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-xl overflow-hidden text-[#1A1A1A]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#D9D9D6] flex items-center justify-between bg-[#EBEBE8]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white border border-[#D9D9D6] flex items-center justify-center text-[#1A1A1A]">
              <Film className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#1A1A1A] font-serif">Mis Proyectos de Guion</h2>
              <p className="text-xs text-[#70706B] mt-0.5">
                Administra tus guiones, abre múltiples historias y crea nuevos borradores.
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

        {/* Toolbar (Search, New Project, Import) */}
        <div className="p-4 border-b border-[#D9D9D6] bg-[#F4F4F1] flex flex-wrap items-center justify-between gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 text-[#70706B] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar proyectos por título..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-[#D9D9D6] rounded-lg text-[#1A1A1A] focus:border-[#1A1A1A] outline-none transition-colors"
            />
          </div>

          <div className="flex items-center gap-2">
            {/* Import Button */}
            <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-[#EBEBE8] border border-[#D9D9D6] text-xs font-medium text-[#1A1A1A] cursor-pointer transition-all shadow-xs">
              <Upload className="w-3.5 h-3.5 text-[#70706B]" />
              <span>Importar (.json)</span>
              <input type="file" accept=".json,.fountain,.txt" onChange={handleFileUpload} className="hidden" />
            </label>

            {/* New Project Toggle */}
            <button
              onClick={() => setIsCreatingNew(!isCreatingNew)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#1A1A1A] hover:bg-[#333333] text-white font-semibold text-xs shadow-xs transition-all active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Nuevo Guion</span>
            </button>
          </div>
        </div>

        {/* Create New Project Form (Collapsible) */}
        {isCreatingNew && (
          <form onSubmit={handleCreateSubmit} className="p-4 bg-white border-b border-[#D9D9D6] animate-in slide-in-from-top-2 duration-200">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#1A1A1A] mb-3 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              Crear Nuevo Proyecto
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
              <div className="sm:col-span-2">
                <label className="block text-[11px] text-[#70706B] mb-1">Título del Guion</label>
                <input
                  type="text"
                  required
                  placeholder="EJ: EL MISTERIO DEL VALLE"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-[#F4F4F1] border border-[#D9D9D6] rounded-lg text-[#1A1A1A] font-screenplay font-bold uppercase focus:border-[#1A1A1A] outline-none"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-[11px] text-[#70706B] mb-1">Formato</label>
                <select
                  value={newType}
                  onChange={(e) => setNewType(e.target.value as any)}
                  className="w-full px-2.5 py-1.5 text-xs bg-[#F4F4F1] border border-[#D9D9D6] rounded-lg text-[#1A1A1A] focus:border-[#1A1A1A] outline-none"
                >
                  <option value="short">Cortometraje</option>
                  <option value="feature">Largometraje</option>
                  <option value="tv_pilot">Piloto Serie TV</option>
                  <option value="commercial">Comercial / Spot</option>
                  <option value="theater">Obra de Teatro</option>
                </select>
              </div>
            </div>

            <div className="mb-3">
              <label className="block text-[11px] text-[#70706B] mb-1.5">Plantilla inicial</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'blank', title: 'En Blanco', desc: 'Comienza desde cero' },
                  { id: 'short', title: 'Cortometraje', desc: 'Estructura estándar de 3 escenas' },
                  { id: 'feature', title: 'Largometraje', desc: 'Estructura con prólogo urbano' },
                ].map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setNewTemplate(t.id)}
                    className={`p-2 rounded-lg border text-left transition-all ${
                      newTemplate === t.id
                        ? 'border-[#1A1A1A] bg-[#EBEBE8] text-[#1A1A1A]'
                        : 'border-[#D9D9D6] bg-white text-[#70706B] hover:border-[#1A1A1A]'
                    }`}
                  >
                    <div className="font-semibold text-xs text-[#1A1A1A]">{t.title}</div>
                    <div className="text-[10px] text-[#70706B]">{t.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsCreatingNew(false)}
                className="px-3 py-1.5 text-xs text-[#70706B] hover:text-[#1A1A1A] rounded-lg hover:bg-[#F4F4F1]"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 text-xs font-semibold bg-[#1A1A1A] hover:bg-[#333333] text-white rounded-lg shadow-xs"
              >
                Crear Proyecto
              </button>
            </div>
          </form>
        )}

        {/* Project List */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-3 bg-[#F4F4F1]">
          {filteredProjects.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-[#D9D9D6] rounded-xl bg-white">
              <FileText className="w-10 h-10 mx-auto text-[#9C9C96] mb-2" />
              <p className="text-sm font-medium text-[#1A1A1A]">No se encontraron proyectos</p>
              <p className="text-xs text-[#70706B] mt-1">Crea un nuevo guion o cambia el término de búsqueda.</p>
            </div>
          ) : (
            filteredProjects.map((p) => {
              const isActive = p.id === activeProjectId;
              const stats = calculateScriptStats(p.blocks || []);
              const dateFormatted = new Date(p.updatedAt).toLocaleDateString('es-ES', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              });

              return (
                <div
                  key={p.id}
                  className={`p-4 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white ${
                    isActive
                      ? 'border-[#1A1A1A] shadow-xs'
                      : 'border-[#D9D9D6] hover:border-[#1A1A1A]'
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="font-bold text-sm sm:text-base text-[#1A1A1A] font-screenplay tracking-tight truncate">
                        {p.title || 'SIN TÍTULO'}
                      </span>
                      {isActive && (
                        <span className="flex items-center gap-1 text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-[#EBEBE8] text-[#1A1A1A] border border-[#D9D9D6]">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          Abierto
                        </span>
                      )}
                      <span className="text-[10px] uppercase font-medium px-2 py-0.5 rounded bg-[#F4F4F1] text-[#70706B] border border-[#D9D9D6]">
                        {p.type === 'short' ? 'Cortometraje' : p.type === 'feature' ? 'Largometraje' : p.type === 'tv_pilot' ? 'Serie TV' : 'Guion'}
                      </span>
                    </div>

                    {p.titlePage?.logline && (
                      <p className="text-xs text-[#70706B] line-clamp-1 italic mb-2">
                        "{p.titlePage.logline}"
                      </p>
                    )}

                    {/* Stats pills */}
                    <div className="flex items-center gap-3 text-[11px] text-[#70706B] flex-wrap">
                      <span className="text-[#1A1A1A] font-semibold">{stats.pageCount} {stats.pageCount === 1 ? 'página' : 'páginas'} (~{stats.estimatedMinutes} min)</span>
                      <span>•</span>
                      <span>{stats.sceneCount} escenas</span>
                      <span>•</span>
                      <span>{p.characters?.length || 0} personajes</span>
                      <span>•</span>
                      <span>{p.locations?.length || 0} locaciones</span>
                      <span>•</span>
                      <span className="flex items-center gap-1 text-[#9C9C96]">
                        <Clock className="w-3 h-3" />
                        {dateFormatted}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5 self-end sm:self-center">
                    {!isActive && (
                      <button
                        onClick={() => {
                          onSelectProject(p.id);
                          onClose();
                        }}
                        className="px-3 py-1.5 rounded-lg bg-[#F4F4F1] hover:bg-[#EBEBE8] text-xs font-semibold text-[#1A1A1A] border border-[#D9D9D6] transition-all shadow-xs"
                      >
                        Abrir
                      </button>
                    )}

                    <button
                      onClick={() => onDuplicateProject(p)}
                      title="Duplicar proyecto"
                      className="p-1.5 rounded-lg text-[#70706B] hover:text-[#1A1A1A] hover:bg-[#F4F4F1] transition-colors"
                    >
                      <Copy className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => onExportJson(p)}
                      title="Descargar copia de seguridad .json"
                      className="p-1.5 rounded-lg text-[#70706B] hover:text-[#1A1A1A] hover:bg-[#F4F4F1] transition-colors"
                    >
                      <Download className="w-4 h-4" />
                    </button>

                    {projects.length > 1 && (
                      <button
                        onClick={() => {
                          if (confirm(`¿Estás seguro de eliminar el guion "${p.title}"?`)) {
                            onDeleteProject(p.id);
                          }
                        }}
                        title="Eliminar proyecto"
                        className="p-1.5 rounded-lg text-[#70706B] hover:text-rose-700 hover:bg-rose-50 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
