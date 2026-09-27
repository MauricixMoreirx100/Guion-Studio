import React, { useState, useRef, useEffect } from 'react';
import { 
  Plus, 
  X, 
  Download, 
  FileText, 
  Film, 
  Upload
} from 'lucide-react';
import { Project } from '../types';
import { calculateScriptStats } from '../utils/fountain';
import { downloadDocumentInFormat } from '../utils/fdxExport';

export interface DocumentTabsProps {
  project: Project;
  allProjects: Project[];
  openTabIds: string[];
  activeProjectId: string;
  onSelectTab: (id: string) => void;
  onCloseTab: (id: string) => void;
  onNewTab: (type?: Project['type'], template?: string) => void;
  onOpenExistingInNewTab: (id: string) => void;
  onDuplicateProject?: (project: Project) => void;
  onUpdateTitle: (id: string, newTitle: string) => void;
  onImportJson: (jsonStr: string) => void;
  isDarkMode?: boolean;
}

export const DocumentTabs: React.FC<DocumentTabsProps> = ({
  allProjects,
  openTabIds,
  activeProjectId,
  onSelectTab,
  onCloseTab,
  onNewTab,
  onOpenExistingInNewTab,
  onUpdateTitle,
  onImportJson,
  isDarkMode = true,
}) => {
  const [showNewMenu, setShowNewMenu] = useState(false);
  const [downloadDropdownId, setDownloadDropdownId] = useState<string | null>(null);
  const [editingTabId, setEditingTabId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const menuRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Close popup menus on outside click
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
    <div className="flex items-center gap-1.5 min-w-0 overflow-x-auto no-scrollbar py-0.5">
      {openProjects.map((p) => {
        const isActive = p.id === activeProjectId;
        const stats = calculateScriptStats(p.blocks);
        const isDownloadingThis = downloadDropdownId === p.id;
        const isRenaming = editingTabId === p.id;

        return (
          <div
            key={p.id}
            onClick={() => onSelectTab(p.id)}
            className={`group relative flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs transition-all cursor-pointer shrink-0 max-w-[200px] border ${
              isActive
                ? isDarkMode
                  ? 'bg-[#1e1e22] border-[#383840] text-white font-medium shadow-xs'
                  : 'bg-white border-[#D4D4CE] text-[#1A1A1A] font-medium shadow-xs'
                : isDarkMode
                  ? 'bg-transparent border-transparent text-[#888888] hover:bg-[#1c1c20] hover:text-[#D4D4D4]'
                  : 'bg-transparent border-transparent text-[#70706B] hover:bg-[#F2F2EF] hover:text-[#1A1A1A]'
            }`}
          >
            {/* Document Type Icon */}
            <div className={`shrink-0 ${isActive ? 'text-amber-400' : 'text-[#888888]'}`}>
              {p.type === 'feature' ? (
                <Film className="w-3 h-3" />
              ) : (
                <FileText className="w-3 h-3" />
              )}
            </div>

            {/* Title / Inline Rename */}
            <div className="min-w-0 flex-1">
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
                  className={`w-full border rounded px-1 text-[11px] font-bold outline-none font-screenplay ${
                    isDarkMode ? 'bg-[#2A2A2A] border-amber-400 text-white' : 'bg-white border-[#1A1A1A] text-[#1A1A1A]'
                  }`}
                />
              ) : (
                <div 
                  onDoubleClick={(e) => handleStartRename(e, p)}
                  className="text-[11px] truncate font-screenplay font-bold tracking-tight"
                  title={`${p.title} (Doble clic para renombrar)`}
                >
                  {p.title || 'SIN TÍTULO'}
                </div>
              )}
            </div>

            {/* Page count badge */}
            <span className={`text-[9px] px-1 py-0.2 rounded font-mono shrink-0 ${
              isActive 
                ? isDarkMode ? 'bg-[#2c2c34] text-amber-300' : 'bg-[#EAEAE7] text-[#70706B]' 
                : 'opacity-50'
            }`}>
              {stats.pageCount}p
            </span>

            {/* Per-Tab Download Button */}
            <div className="relative opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setDownloadDropdownId(isDownloadingThis ? null : p.id);
                }}
                className={`p-0.5 rounded transition-colors ${
                  isDarkMode ? 'hover:bg-[#2c2c34] text-[#888888] hover:text-white' : 'hover:bg-[#EBEBE8] text-[#70706B] hover:text-[#1A1A1A]'
                }`}
                title={`Descargar "${p.title}"`}
              >
                <Download className="w-2.5 h-2.5" />
              </button>

              {isDownloadingThis && (
                <div 
                  ref={menuRef}
                  className={`absolute left-0 top-full mt-1.5 w-48 rounded-lg shadow-xl py-1 z-50 text-xs border ${
                    isDarkMode ? 'bg-[#202025] border-[#33333b] text-white' : 'bg-white border-[#D9D9D6] text-[#1A1A1A]'
                  }`}
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    onClick={() => {
                      downloadDocumentInFormat(p, 'pdf');
                      setDownloadDropdownId(null);
                    }}
                    className={`w-full px-2.5 py-1 text-left flex items-center justify-between cursor-pointer ${
                      isDarkMode ? 'hover:bg-[#2c2c34]' : 'hover:bg-[#F4F4F1]'
                    }`}
                  >
                    <span>PDF Estándar</span>
                    <span className="text-[10px] opacity-60 font-mono">.pdf</span>
                  </button>

                  <button
                    onClick={() => {
                      downloadDocumentInFormat(p, 'fdx');
                      setDownloadDropdownId(null);
                    }}
                    className={`w-full px-2.5 py-1 text-left flex items-center justify-between cursor-pointer ${
                      isDarkMode ? 'hover:bg-[#2c2c34]' : 'hover:bg-[#F4F4F1]'
                    }`}
                  >
                    <span className="text-amber-400">Final Draft</span>
                    <span className="text-[10px] opacity-60 font-mono">.fdx</span>
                  </button>

                  <button
                    onClick={() => {
                      downloadDocumentInFormat(p, 'fountain');
                      setDownloadDropdownId(null);
                    }}
                    className={`w-full px-2.5 py-1 text-left flex items-center justify-between cursor-pointer ${
                      isDarkMode ? 'hover:bg-[#2c2c34]' : 'hover:bg-[#F4F4F1]'
                    }`}
                  >
                    <span>Fountain</span>
                    <span className="text-[10px] opacity-60 font-mono">.fountain</span>
                  </button>
                </div>
              )}
            </div>

            {/* Close tab button */}
            {openProjects.length > 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onCloseTab(p.id);
                }}
                className={`p-0.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity ${
                  isDarkMode ? 'hover:bg-[#33333d] text-[#888888] hover:text-white' : 'hover:bg-[#D4D4CE] text-[#70706B] hover:text-[#1A1A1A]'
                }`}
                title="Cerrar pestaña"
              >
                <X className="w-2.5 h-2.5" />
              </button>
            )}
          </div>
        );
      })}

      {/* Discrete "+" Icon to Add/Open Tab */}
      <div className="relative shrink-0" ref={menuRef}>
        <button
          onClick={() => setShowNewMenu(!showNewMenu)}
          className={`p-1 rounded-md transition-all cursor-pointer ${
            isDarkMode 
              ? 'text-[#888888] hover:text-white hover:bg-[#202025]' 
              : 'text-[#70706B] hover:text-[#1A1A1A] hover:bg-[#DFDFDC]'
          }`}
          title="Nueva pestaña / Documento"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>

        {showNewMenu && (
          <div className={`absolute left-0 top-full mt-1.5 w-56 rounded-xl shadow-2xl py-1.5 z-50 text-xs border animate-in fade-in duration-100 ${
            isDarkMode ? 'bg-[#1c1c20] border-[#2c2c32] text-white' : 'bg-white border-[#D4D4CE] text-[#1A1A1A]'
          }`}>
            <button
              onClick={() => {
                onNewTab('short', 'blank');
                setShowNewMenu(false);
              }}
              className={`w-full px-3 py-1.5 text-left flex items-center gap-2 cursor-pointer ${
                isDarkMode ? 'hover:bg-[#26262b]' : 'hover:bg-[#F2F2EF]'
              }`}
            >
              <FileText className="w-3.5 h-3.5 text-amber-400" />
              <span>Nuevo Guion (En blanco)</span>
            </button>

            <button
              onClick={() => {
                onNewTab('feature', 'feature_action');
                setShowNewMenu(false);
              }}
              className={`w-full px-3 py-1.5 text-left flex items-center gap-2 cursor-pointer ${
                isDarkMode ? 'hover:bg-[#26262b]' : 'hover:bg-[#F2F2EF]'
              }`}
            >
              <Film className="w-3.5 h-3.5 text-sky-400" />
              <span>Plantilla Largometraje</span>
            </button>

            <button
              onClick={() => {
                onNewTab('short', 'short_drama');
                setShowNewMenu(false);
              }}
              className={`w-full px-3 py-1.5 text-left flex items-center gap-2 cursor-pointer ${
                isDarkMode ? 'hover:bg-[#26262b]' : 'hover:bg-[#F2F2EF]'
              }`}
            >
              <FileText className="w-3.5 h-3.5 text-emerald-400" />
              <span>Plantilla Cortometraje</span>
            </button>

            <div className={`my-1 border-t ${isDarkMode ? 'border-[#27272a]' : 'border-[#EBEBE8]'}`} />

            {projectsNotInTabs.length > 0 && (
              <>
                <div className={`px-3 py-1 text-[10px] uppercase font-bold ${
                  isDarkMode ? 'text-[#888888]' : 'text-[#70706B]'
                }`}>
                  Abrir proyecto existente:
                </div>
                {projectsNotInTabs.slice(0, 4).map((p) => (
                  <button
                    key={p.id}
                    onClick={() => {
                      onOpenExistingInNewTab(p.id);
                      setShowNewMenu(false);
                    }}
                    className={`w-full px-3 py-1 text-left text-xs truncate flex items-center gap-1.5 cursor-pointer ${
                      isDarkMode ? 'hover:bg-[#26262b]' : 'hover:bg-[#F2F2EF]'
                    }`}
                  >
                    <span className="text-amber-400">•</span>
                    <span className="truncate">{p.title}</span>
                  </button>
                ))}
                <div className={`my-1 border-t ${isDarkMode ? 'border-[#27272a]' : 'border-[#EBEBE8]'}`} />
              </>
            )}

            <button
              onClick={() => fileInputRef.current?.click()}
              className={`w-full px-3 py-1.5 text-left flex items-center gap-2 cursor-pointer ${
                isDarkMode ? 'hover:bg-[#26262b]' : 'hover:bg-[#F2F2EF]'
              }`}
            >
              <Upload className="w-3.5 h-3.5 text-[#888888]" />
              <span>Importar archivo JSON</span>
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleFileUpload}
              className="hidden"
            />
          </div>
        )}
      </div>
    </div>
  );
};
