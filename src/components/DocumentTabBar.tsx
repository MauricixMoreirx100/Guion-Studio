import React, { useState, useRef, useEffect } from 'react';
import { 
  FileText, 
  Film, 
  Plus, 
  X, 
  Download, 
  MoreVertical, 
  Copy, 
  FileCode, 
  Sparkles, 
  ChevronDown,
  FolderOpen,
  Upload,
  Edit2,
  Check
} from 'lucide-react';
import { Project } from '../types';
import { downloadDocumentInFormat } from '../utils/fdxExport';
import { calculateScriptStats } from '../utils/fountain';

interface DocumentTabBarProps {
  allProjects: Project[];
  openTabIds: string[];
  activeProjectId: string;
  onSelectTab: (id: string) => void;
  onCloseTab: (id: string) => void;
  onNewTab: (type?: Project['type'], template?: string) => void;
  onOpenExistingInNewTab: (id: string) => void;
  onDuplicateProject: (project: Project) => void;
  onUpdateTitle: (id: string, newTitle: string) => void;
  onOpenProjectModal: () => void;
  onImportJson: (jsonStr: string) => void;
  isDarkMode?: boolean;
}

export const DocumentTabBar: React.FC<DocumentTabBarProps> = ({
  allProjects,
  openTabIds,
  activeProjectId,
  onSelectTab,
  onCloseTab,
  onNewTab,
  onOpenExistingInNewTab,
  onDuplicateProject,
  onUpdateTitle,
  onOpenProjectModal,
  onImportJson,
  isDarkMode = true,
}) => {
  const [showNewMenu, setShowNewMenu] = useState(false);
  const [downloadDropdownId, setDownloadDropdownId] = useState<string | null>(null);
  const [editingTabId, setEditingTabId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const menuRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Close menus on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowNewMenu(false);
        setDownloadDropdownId(null);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const openProjects = openTabIds
    .map((id) => allProjects.find((p) => p.id === id))
    .filter((p): p is Project => Boolean(p));

  const projectsNotInTabs = allProjects.filter((p) => !openTabIds.includes(p.id));

  const handleStartRename = (e: React.MouseEvent, p: Project) => {
    e.stopPropagation();
    setEditingTabId(p.id);
    setEditingTitle(p.title);
  };

  const handleFinishRename = (id: string) => {
    if (editingTitle.trim()) {
      onUpdateTitle(id, editingTitle.trim().toUpperCase());
    }
    setEditingTabId(null);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        onImportJson(content);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
    setShowNewMenu(false);
  };

  return (
    <div className={`no-print px-2 sm:px-4 pt-1.5 flex items-center justify-between gap-2 select-none relative z-30 border-b transition-colors ${
      isDarkMode ? 'bg-[#121212] border-[#222222]' : 'bg-[#E2E2DE] border-[#D4D4CE]'
    }`}>
      {/* Tabs Container */}
      <div className="flex items-center gap-1 min-w-0 flex-1 overflow-x-auto no-scrollbar py-0.5">
        {openProjects.map((p) => {
          const isActive = p.id === activeProjectId;
          const stats = calculateScriptStats(p.blocks);
          const isDownloadingThis = downloadDropdownId === p.id;
          const isRenaming = editingTabId === p.id;

          return (
            <div
              key={p.id}
              onClick={() => onSelectTab(p.id)}
              className={`group relative flex items-center gap-1.5 px-3 py-2 rounded-t-lg border-t border-x transition-all cursor-pointer min-w-[130px] max-w-[240px] ${
                isActive
                  ? isDarkMode
                    ? 'bg-[#1E1E1E] border-[#333333] border-b-[#1E1E1E] text-white font-medium shadow-xs z-10 -mb-px'
                    : 'bg-white border-[#D9D9D6] border-b-white text-[#1A1A1A] font-medium shadow-xs z-10 -mb-px'
                  : isDarkMode
                    ? 'bg-[#161616] border-transparent text-[#888888] hover:bg-[#1A1A1A] hover:text-[#D4D4D4]'
                    : 'bg-[#ECECE9] border-transparent text-[#70706B] hover:bg-[#F2F2EF] hover:text-[#1A1A1A]'
              }`}
            >
              {/* Document Icon */}
              <div className={`shrink-0 ${isDarkMode ? 'text-amber-400' : 'text-[#1A1A1A]'}`}>
                {p.type === 'feature' ? (
                  <Film className="w-3.5 h-3.5" />
                ) : (
                  <FileText className="w-3.5 h-3.5" />
                )}
              </div>

              {/* Title / Inline Rename */}
              <div className="flex-1 min-w-0">
                {isRenaming ? (
                  <input
                    type="text"
                    value={editingTitle}
                    onChange={(e) => setEditingTitle(e.target.value)}
                    onBlur={() => handleFinishRename(p.id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleFinishRename(p.id);
                      if (e.key === 'Escape') setEditingTabId(null);
                    }}
                    onClick={(e) => e.stopPropagation()}
                    autoFocus
                    className={`w-full border rounded px-1 text-xs font-bold outline-none font-screenplay ${
                      isDarkMode ? 'bg-[#2A2A2A] border-amber-400 text-white' : 'bg-white border-[#1A1A1A] text-[#1A1A1A]'
                    }`}
                  />
                ) : (
                  <div 
                    onDoubleClick={(e) => handleStartRename(e, p)}
                    className={`text-xs truncate font-screenplay font-bold tracking-tight ${
                      isDarkMode ? 'text-white' : 'text-[#1A1A1A]'
                    }`}
                    title={`${p.title} (Doble clic para renombrar)`}
                  >
                    {p.title || 'SIN TÍTULO'}
                  </div>
                )}
              </div>

              {/* Page count badge */}
              <span className={`text-[10px] px-1 py-0.2 rounded font-mono shrink-0 ${
                isActive 
                  ? isDarkMode ? 'bg-[#2A2A2A] text-amber-300 border border-[#3A3A3A]' : 'bg-[#F4F4F1] text-[#70706B] border border-[#D9D9D6]' 
                  : isDarkMode ? 'text-[#666666]' : 'text-[#9C9C96]'
              }`}>
                {stats.pageCount}p
              </span>

              {/* Tab Quick Actions (Download & Close) */}
              <div className="flex items-center gap-0.5 shrink-0 opacity-80 group-hover:opacity-100">
                {/* Download dropdown toggle */}
                <div className="relative">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setDownloadDropdownId(isDownloadingThis ? null : p.id);
                    }}
                    className={`p-1 rounded transition-colors ${
                      isDarkMode ? 'hover:bg-[#2A2A2A] text-[#888888] hover:text-white' : 'hover:bg-[#EBEBE8] text-[#70706B] hover:text-[#1A1A1A]'
                    }`}
                    title={`Descargar "${p.title}" (PDF, Final Draft FDX, Fountain)`}
                  >
                    <Download className="w-3 h-3" />
                  </button>

                  {/* Per-Tab Download Menu */}
                  {isDownloadingThis && (
                    <div 
                      ref={menuRef}
                      className={`absolute left-0 top-full mt-1.5 w-52 rounded-xl shadow-xl py-1.5 z-50 text-xs animate-in fade-in zoom-in-95 duration-150 border ${
                        isDarkMode ? 'bg-[#202020] border-[#333333] text-white' : 'bg-white border-[#D9D9D6] text-[#1A1A1A]'
                      }`}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className={`px-3 py-1 text-[10px] uppercase font-bold border-b mb-1 ${
                        isDarkMode ? 'border-[#333333] text-[#888888]' : 'border-[#D9D9D6] text-[#70706B]'
                      }`}>
                        Descargar esta pestaña
                      </div>

                      <button
                        onClick={() => {
                          downloadDocumentInFormat(p, 'pdf');
                          setDownloadDropdownId(null);
                        }}
                        className={`w-full px-3 py-1.5 text-left flex items-center justify-between cursor-pointer ${
                          isDarkMode ? 'hover:bg-[#2A2A2A]' : 'hover:bg-[#F4F4F1]'
                        }`}
                      >
                        <span className="font-semibold">📄 PDF Estándar Cine</span>
                        <span className="text-[10px] opacity-60 font-mono">.pdf</span>
                      </button>

                      <button
                        onClick={() => {
                          downloadDocumentInFormat(p, 'fdx');
                          setDownloadDropdownId(null);
                        }}
                        className={`w-full px-3 py-1.5 text-left flex items-center justify-between cursor-pointer ${
                          isDarkMode ? 'hover:bg-[#2A2A2A]' : 'hover:bg-[#F4F4F1]'
                        }`}
                      >
                        <span className="font-semibold text-amber-400">🎬 Final Draft (XML)</span>
                        <span className="text-[10px] opacity-60 font-mono">.fdx</span>
                      </button>

                      <button
                        onClick={() => {
                          downloadDocumentInFormat(p, 'fountain');
                          setDownloadDropdownId(null);
                        }}
                        className={`w-full px-3 py-1.5 text-left flex items-center justify-between cursor-pointer ${
                          isDarkMode ? 'hover:bg-[#2A2A2A]' : 'hover:bg-[#F4F4F1]'
                        }`}
                      >
                        <span>✒️ Fountain Script</span>
                        <span className="text-[10px] opacity-60 font-mono">.fountain</span>
                      </button>

                      <button
                        onClick={() => {
                          downloadDocumentInFormat(p, 'txt');
                          setDownloadDropdownId(null);
                        }}
                        className={`w-full px-3 py-1.5 text-left flex items-center justify-between cursor-pointer ${
                          isDarkMode ? 'hover:bg-[#2A2A2A]' : 'hover:bg-[#F4F4F1]'
                        }`}
                      >
                        <span>📝 Texto Formateado</span>
                        <span className="text-[10px] opacity-60 font-mono">.txt</span>
                      </button>

                      <button
                        onClick={() => {
                          downloadDocumentInFormat(p, 'json');
                          setDownloadDropdownId(null);
                        }}
                        className={`w-full px-3 py-1.5 text-left flex items-center justify-between border-t mt-1 pt-1 cursor-pointer ${
                          isDarkMode ? 'border-[#333333] hover:bg-[#2A2A2A]' : 'border-[#D9D9D6] hover:bg-[#F4F4F1]'
                        }`}
                      >
                        <span>💾 Proyecto Completo</span>
                        <span className="text-[10px] opacity-60 font-mono">.json</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Close Tab Button */}
                {openTabIds.length > 1 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onCloseTab(p.id);
                    }}
                    className={`p-1 rounded transition-colors ${
                      isDarkMode ? 'hover:bg-[#2A2A2A] text-[#888888] hover:text-rose-400' : 'hover:bg-[#EBEBE8] text-[#70706B] hover:text-rose-700'
                    }`}
                    title="Cerrar pestaña"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          );
        })}

        {/* Plus (+) Button for New Tab */}
        <div className="relative shrink-0 ml-1">
          <button
            onClick={() => setShowNewMenu(!showNewMenu)}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md border text-xs font-semibold transition-all shadow-xs cursor-pointer ${
              isDarkMode 
                ? 'bg-[#1C1C1C] hover:bg-[#242424] border-[#333333] text-white hover:border-amber-400' 
                : 'bg-[#ECECE9] hover:bg-white border-[#D4D4CE] hover:border-[#1A1A1A] text-[#1A1A1A]'
            }`}
            title="Abrir nueva pestaña / Nuevo documento"
          >
            <Plus className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline text-[11px]">Nueva Pestaña</span>
            <ChevronDown className="w-3 h-3 opacity-60" />
          </button>

          {/* New Tab Dropdown Menu */}
          {showNewMenu && (
            <div
              ref={menuRef}
              className={`absolute left-0 top-full mt-1.5 w-64 rounded-xl shadow-xl py-1.5 z-50 text-xs animate-in fade-in zoom-in-95 duration-150 border ${
                isDarkMode ? 'bg-[#202020] border-[#333333] text-white' : 'bg-white border-[#D9D9D6] text-[#1A1A1A]'
              }`}
            >
              <div className={`px-3 py-1 text-[10px] uppercase font-bold border-b mb-1 ${
                isDarkMode ? 'text-[#888888] border-[#333333]' : 'text-[#70706B] border-[#D9D9D6]'
              }`}>
                Crear en nueva pestaña
              </div>

              <button
                onClick={() => {
                  onNewTab('short', 'blank');
                  setShowNewMenu(false);
                }}
                className={`w-full px-3 py-2 text-left flex items-center gap-2 cursor-pointer ${
                  isDarkMode ? 'hover:bg-[#2A2A2A] text-white' : 'hover:bg-[#F4F4F1] text-[#1A1A1A]'
                }`}
              >
                <div className={`w-6 h-6 rounded border flex items-center justify-center shrink-0 ${
                  isDarkMode ? 'bg-[#161616] border-[#333333] text-amber-400' : 'bg-[#F4F4F1] border-[#D9D9D6] text-[#1A1A1A]'
                }`}>
                  <FileText className="w-3.5 h-3.5" />
                </div>
                <div>
                  <div className="font-semibold">Guion en Blanco</div>
                  <div className={`text-[10px] ${isDarkMode ? 'text-[#888888]' : 'text-[#70706B]'}`}>Comenzar un nuevo guion desde cero</div>
                </div>
              </button>

              <button
                onClick={() => {
                  onNewTab('short', 'short_drama');
                  setShowNewMenu(false);
                }}
                className={`w-full px-3 py-2 text-left flex items-center gap-2 cursor-pointer ${
                  isDarkMode ? 'hover:bg-[#2A2A2A] text-white' : 'hover:bg-[#F4F4F1] text-[#1A1A1A]'
                }`}
              >
                <div className={`w-6 h-6 rounded border flex items-center justify-center shrink-0 ${
                  isDarkMode ? 'bg-[#161616] border-[#333333] text-blue-400' : 'bg-[#F4F4F1] border-[#D9D9D6] text-[#1A1A1A]'
                }`}>
                  <Film className="w-3.5 h-3.5" />
                </div>
                <div>
                  <div className="font-semibold">Plantilla Cortometraje</div>
                  <div className={`text-[10px] ${isDarkMode ? 'text-[#888888]' : 'text-[#70706B]'}`}>Estructura de 3 a 10 páginas</div>
                </div>
              </button>

              <button
                onClick={() => {
                  onNewTab('feature', 'feature_action');
                  setShowNewMenu(false);
                }}
                className={`w-full px-3 py-2 text-left flex items-center gap-2 cursor-pointer ${
                  isDarkMode ? 'hover:bg-[#2A2A2A] text-white' : 'hover:bg-[#F4F4F1] text-[#1A1A1A]'
                }`}
              >
                <div className={`w-6 h-6 rounded border flex items-center justify-center shrink-0 ${
                  isDarkMode ? 'bg-[#161616] border-[#333333] text-amber-400' : 'bg-[#F4F4F1] border-[#D9D9D6] text-[#1A1A1A]'
                }`}>
                  <Sparkles className="w-3.5 h-3.5" />
                </div>
                <div>
                  <div className="font-semibold">Largometraje (3 Actos)</div>
                  <div className={`text-[10px] ${isDarkMode ? 'text-[#888888]' : 'text-[#70706B]'}`}>Guion cinematográfico completo</div>
                </div>
              </button>

              {/* Projects not yet open in tabs */}
              {projectsNotInTabs.length > 0 && (
                <>
                  <div className={`px-3 py-1 text-[10px] uppercase font-bold border-t border-b my-1 ${
                    isDarkMode ? 'text-[#888888] border-[#333333]' : 'text-[#70706B] border-[#D9D9D6]'
                  }`}>
                    Abrir en pestaña
                  </div>
                  <div className="max-h-40 overflow-y-auto">
                    {projectsNotInTabs.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => {
                          onOpenExistingInNewTab(p.id);
                          setShowNewMenu(false);
                        }}
                        className={`w-full px-3 py-1.5 text-left flex items-center justify-between cursor-pointer ${
                          isDarkMode ? 'hover:bg-[#2A2A2A] text-white' : 'hover:bg-[#F4F4F1] text-[#1A1A1A]'
                        }`}
                      >
                        <span className="font-screenplay font-bold truncate text-[11px]">{p.title}</span>
                        <span className={`text-[10px] font-mono ${isDarkMode ? 'text-amber-400' : 'text-[#70706B]'}`}>Abrir</span>
                      </button>
                    ))}
                  </div>
                </>
              )}

              {/* Import or Project Library */}
              <div className={`border-t pt-1 mt-1 ${isDarkMode ? 'border-[#333333]' : 'border-[#D9D9D6]'}`}>
                <button
                  onClick={() => {
                    setShowNewMenu(false);
                    onOpenProjectModal();
                  }}
                  className={`w-full px-3 py-1.5 text-left flex items-center gap-2 cursor-pointer ${
                    isDarkMode ? 'hover:bg-[#2A2A2A] text-white' : 'hover:bg-[#F4F4F1] text-[#1A1A1A]'
                  }`}
                >
                  <FolderOpen className={`w-3.5 h-3.5 ${isDarkMode ? 'text-[#888888]' : 'text-[#70706B]'}`} />
                  <span>Gestionar todos los proyectos...</span>
                </button>

                <button
                  onClick={() => fileInputRef.current?.click()}
                  className={`w-full px-3 py-1.5 text-left flex items-center gap-2 cursor-pointer ${
                    isDarkMode ? 'hover:bg-[#2A2A2A] text-white' : 'hover:bg-[#F4F4F1] text-[#1A1A1A]'
                  }`}
                >
                  <Upload className={`w-3.5 h-3.5 ${isDarkMode ? 'text-[#888888]' : 'text-[#70706B]'}`} />
                  <span>Importar archivo en nueva pestaña (.json)...</span>
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json,.fountain,.txt"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right Quick Download active tab button */}
      <div className="shrink-0 flex items-center gap-1.5">
        <button
          onClick={() => {
            const activeProj = allProjects.find((p) => p.id === activeProjectId);
            if (activeProj) downloadDocumentInFormat(activeProj, 'pdf');
          }}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white hover:bg-[#F4F4F1] border border-[#D4D4CE] hover:border-[#1A1A1A] text-[11px] font-semibold text-[#1A1A1A] transition-all shadow-xs active:scale-95"
          title="Descargar PDF de la pestaña activa"
        >
          <Download className="w-3 h-3 text-[#1A1A1A]" />
          <span className="hidden md:inline">Descargar Pestaña Activa</span>
          <span className="md:hidden">PDF</span>
        </button>
      </div>
    </div>
  );
};
