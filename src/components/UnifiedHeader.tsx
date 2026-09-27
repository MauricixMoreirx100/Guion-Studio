import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  Clapperboard, 
  FolderOpen, 
  Printer, 
  Eye, 
  Edit3, 
  Check, 
  Moon, 
  Sun, 
  Layers, 
  FileCode, 
  Download,
  Sparkles,
  Plus,
  X,
  FileText,
  Film,
  Upload,
  Undo2,
  Redo2,
  Copy,
  ClipboardPaste,
  ZoomIn,
  ZoomOut,
  MapPin,
  AlignLeft,
  Users,
  MessageSquare,
  CornerDownRight,
  Camera,
  Bookmark
} from 'lucide-react';
import { Project, ViewTab, ElementType } from '../types';
import { calculateScriptStats } from '../utils/fountain';
import { downloadDocumentInFormat } from '../utils/fdxExport';

export interface UnifiedHeaderProps {
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
  onOpenProjectModal: () => void;
  onOpenExportModal: () => void;
  onQuickDownloadPdf: () => void;
  onQuickPrint: () => void;
  onManualSave: () => void;
  isSaved: boolean;
  currentTab: ViewTab;
  onChangeTab: (tab: ViewTab) => void;
  isSidePanelOpen?: boolean;
  onToggleSidePanel?: () => void;
  isDarkMode?: boolean;
  onToggleDarkMode?: () => void;
  // Editor Toolbar Props
  zoom?: number;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onZoomReset?: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  onCopy?: () => void;
  onPaste?: () => void;
  onFormatElement?: (type: ElementType) => void;
}

/**
 * Strictly square-shaped button with fixed width & height.
 * CRITICAL ZERO LAYOUT SHIFT: The button maintains a fixed width and height.
 * Tooltips are absolutely positioned and never reflow adjacent tabs or lower toolbars.
 */
interface SquareHoverButtonProps {
  id?: string;
  icon: React.ReactNode;
  label: string;
  badge?: React.ReactNode;
  active?: boolean;
  activeColor?: string;
  onClick?: () => void;
  title?: string;
  isDarkMode?: boolean;
  className?: string;
}

const SquareHoverButton: React.FC<SquareHoverButtonProps> = ({
  id,
  icon,
  label,
  badge,
  active = false,
  activeColor = 'bg-amber-500 text-black font-bold',
  onClick,
  title,
  isDarkMode = true,
  className = '',
}) => {
  return (
    <div className="relative group inline-flex items-center justify-center shrink-0">
      <button
        id={id}
        type="button"
        onClick={onClick}
        title={title || label}
        className={`w-11 h-11 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center transition-all duration-150 cursor-pointer border shrink-0 ${
          active
            ? activeColor
            : isDarkMode
              ? 'bg-[#18181b] hover:bg-[#26262b] border-[#2c2c34] text-[#A0A0A0] hover:text-white active:scale-95'
              : 'bg-white hover:bg-[#EBEBE8] border-[#D4D4CE] text-[#60605B] hover:text-[#1A1A1A] active:scale-95'
        } ${className}`}
      >
        <div className="flex items-center justify-center shrink-0 pointer-events-none">
          {icon}
        </div>
      </button>

      {/* Floating Tooltip Pill (Zero layout shift: Absolute positioned, no reflow) */}
      <div className={`pointer-events-none absolute top-full mt-2 left-1/2 -translate-x-1/2 z-50 px-2.5 py-1 rounded-md shadow-xl text-xs font-medium whitespace-nowrap flex items-center gap-1.5 opacity-0 group-hover:opacity-100 group-hover:translate-y-0 translate-y-1 transition-all duration-150 border ${
        isDarkMode ? 'bg-[#1e1e24] text-white border-[#33333d]' : 'bg-[#1A1A1A] text-white border-[#1A1A1A]'
      }`}>
        <span>{label}</span>
        {badge}
      </div>
    </div>
  );
};

export const UnifiedHeader: React.FC<UnifiedHeaderProps> = ({
  project,
  allProjects,
  openTabIds,
  activeProjectId,
  onSelectTab,
  onCloseTab,
  onNewTab,
  onOpenExistingInNewTab,
  onUpdateTitle,
  onImportJson,
  onOpenProjectModal,
  onOpenExportModal,
  onQuickDownloadPdf,
  onQuickPrint,
  onManualSave,
  isSaved,
  currentTab,
  onChangeTab,
  isSidePanelOpen = false,
  onToggleSidePanel,
  isDarkMode = true,
  onToggleDarkMode,
  zoom = 100,
  onZoomIn,
  onZoomOut,
  onZoomReset,
  onUndo,
  onRedo,
  onCopy,
  onPaste,
  onFormatElement,
}) => {
  const [showNewMenu, setShowNewMenu] = useState(false);
  const [downloadDropdownId, setDownloadDropdownId] = useState<string | null>(null);
  const [editingTabId, setEditingTabId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [copiedNotification, setCopiedNotification] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const downloadMenuRef = useRef<HTMLDivElement>(null);
  const newBtnRef = useRef<HTMLButtonElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [newMenuCoords, setNewMenuCoords] = useState<{ top: number; left: number } | null>(null);

  const toggleNewMenu = () => {
    if (!showNewMenu) {
      if (newBtnRef.current) {
        const rect = newBtnRef.current.getBoundingClientRect();
        setNewMenuCoords({
          top: rect.bottom + 6,
          left: Math.min(rect.left, window.innerWidth - 260),
        });
      }
      setShowNewMenu(true);
    } else {
      setShowNewMenu(false);
    }
  };

  // Close popup menus on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        menuRef.current &&
        !menuRef.current.contains(target) &&
        newBtnRef.current &&
        !newBtnRef.current.contains(target)
      ) {
        setShowNewMenu(false);
      }
      if (downloadMenuRef.current && !downloadMenuRef.current.contains(target)) {
        setDownloadDropdownId(null);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // Recalculate menu coords on window resize or scroll
  useEffect(() => {
    const handleScrollOrResize = () => {
      if (showNewMenu && newBtnRef.current) {
        const rect = newBtnRef.current.getBoundingClientRect();
        setNewMenuCoords({
          top: rect.bottom + 6,
          left: Math.min(rect.left, window.innerWidth - 260),
        });
      }
    };
    window.addEventListener('resize', handleScrollOrResize);
    window.addEventListener('scroll', handleScrollOrResize, true);
    return () => {
      window.removeEventListener('resize', handleScrollOrResize);
      window.removeEventListener('scroll', handleScrollOrResize, true);
    };
  }, [showNewMenu]);

  const openProjects = openTabIds
    .map((id) => allProjects.find((p) => p.id === id))
    .filter((p): p is Project => Boolean(p));

  const projectsNotInTabs = allProjects.filter((p) => !openTabIds.includes(p.id));
  const productionBadgeCount = (project.locations?.length || 0) + (project.characters?.length || 0);

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

  const handleTriggerAction = (action: string, type?: ElementType) => {
    if (action === 'copy') {
      setCopiedNotification(true);
      setTimeout(() => setCopiedNotification(false), 2000);
    }
    window.dispatchEvent(new CustomEvent('editor-action', { detail: { action, type } }));
  };

  return (
    <header className="no-print sticky top-0 z-40 select-none flex flex-col shadow-md">
      {/* ========================================================================= */}
      {/* 1. PRIMARY NAVIGATION HEADER (GLOBAL CONTROLS, MODES & UTILITIES)          */}
      {/* ========================================================================= */}
      <div className={`h-15 sm:h-16 px-3 sm:px-4 flex items-center justify-between gap-3 border-b transition-colors duration-200 z-30 shrink-0 ${
        isDarkMode ? 'bg-[#121214] border-[#222226] text-white' : 'bg-[#EAEAE7] border-[#D4D4CE] text-[#1A1A1A]'
      }`}>
        {/* LEFT: BRAND & SQUARE "PROYECTOS" TRIGGER */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center bg-amber-500 text-black shadow-xs shrink-0">
              <Clapperboard className="w-6 h-6" />
            </div>
            <span className={`font-serif italic font-black text-lg tracking-tight hidden sm:inline ${
              isDarkMode ? 'text-white' : 'text-[#1A1A1A]'
            }`}>
              GuionStudio
            </span>
          </div>

          <div className={`h-6 w-px mx-1 ${isDarkMode ? 'bg-[#27272a]' : 'bg-[#D4D4CE]'}`} />

          {/* Proyectos Modal Trigger Button */}
          <SquareHoverButton
            id="btn-open-projects"
            icon={<FolderOpen className="w-5.5 h-5.5 text-amber-400" />}
            label={`Proyectos (${allProjects.length})`}
            onClick={onOpenProjectModal}
            title={`Abrir gestor de proyectos (${allProjects.length} guardados)`}
            isDarkMode={isDarkMode}
          />
        </div>

        {/* RIGHT: VIEW MODES & UTILITIES (FIXED ANCHORED BUTTONS, ZERO LAYOUT SHIFT) */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Quick Undo / Redo / Copy buttons for Editor */}
          {currentTab === 'editor' && (
            <>
              <SquareHoverButton
                id="btn-undo"
                icon={<Undo2 className="w-5.5 h-5.5" />}
                label="Deshacer"
                onClick={() => handleTriggerAction('undo')}
                title="Deshacer (Ctrl+Z)"
                isDarkMode={isDarkMode}
              />
              <SquareHoverButton
                id="btn-redo"
                icon={<Redo2 className="w-5.5 h-5.5" />}
                label="Rehacer"
                onClick={() => handleTriggerAction('redo')}
                title="Rehacer (Ctrl+Y)"
                isDarkMode={isDarkMode}
              />
              <SquareHoverButton
                id="btn-copy"
                icon={copiedNotification ? <Check className="w-5.5 h-5.5 text-emerald-400" /> : <Copy className="w-5.5 h-5.5" />}
                label="Copiar"
                onClick={() => handleTriggerAction('copy')}
                title="Copiar texto del guion"
                isDarkMode={isDarkMode}
              />
              <div className={`h-6 w-px mx-0.5 ${isDarkMode ? 'bg-[#27272a]' : 'bg-[#D4D4CE]'}`} />
            </>
          )}

          {/* Editor View Mode */}
          <SquareHoverButton
            id="btn-view-editor"
            icon={<Edit3 className="w-5.5 h-5.5" />}
            label="Editor"
            active={currentTab === 'editor'}
            activeColor={isDarkMode ? 'bg-[#282830] border-[#3e3e48] text-white shadow-xs font-bold' : 'bg-white border-[#D4D4CE] text-[#1A1A1A] shadow-xs font-bold'}
            onClick={() => onChangeTab('editor')}
            title="Editor de Guion"
            isDarkMode={isDarkMode}
          />

          {/* Producción View Mode */}
          <SquareHoverButton
            id="btn-view-production"
            icon={<Layers className="w-5.5 h-5.5" />}
            label="Producción"
            badge={
              productionBadgeCount > 0 ? (
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                  isDarkMode ? 'bg-amber-500/20 text-amber-300' : 'bg-amber-100 text-amber-800'
                }`}>
                  {productionBadgeCount}
                </span>
              ) : undefined
            }
            active={currentTab === 'production'}
            activeColor={isDarkMode ? 'bg-[#282830] border-[#3e3e48] text-amber-300 shadow-xs font-bold' : 'bg-white border-[#D4D4CE] text-amber-600 shadow-xs font-bold'}
            onClick={() => onChangeTab('production')}
            title="Vista de Producción (Personajes, Locaciones, Escaleta)"
            isDarkMode={isDarkMode}
          />

          {/* Páginas PDF View Mode */}
          <SquareHoverButton
            id="btn-view-pdf-preview"
            icon={<Eye className="w-5.5 h-5.5" />}
            label="Páginas PDF"
            active={currentTab === 'preview'}
            activeColor={isDarkMode ? 'bg-[#282830] border-[#3e3e48] text-white shadow-xs font-bold' : 'bg-white border-[#D4D4CE] text-[#1A1A1A] shadow-xs font-bold'}
            onClick={() => onChangeTab('preview')}
            title="Vista de Páginas Numeradas / Formato PDF"
            isDarkMode={isDarkMode}
          />

          <div className={`h-6 w-px mx-0.5 ${isDarkMode ? 'bg-[#27272a]' : 'bg-[#D4D4CE]'}`} />

          {/* Secretarios Sidebar Toggle Button */}
          {onToggleSidePanel && (
            <SquareHoverButton
              id="btn-toggle-secretarios"
              icon={<Sparkles className="w-5.5 h-5.5 text-amber-400" />}
              label="Secretarios (IA)"
              active={isSidePanelOpen}
              activeColor={isDarkMode ? 'bg-amber-500/20 border-amber-500/40 text-amber-300 font-bold' : 'bg-amber-100 border-amber-300 text-amber-900 font-bold'}
              onClick={onToggleSidePanel}
              title="Panel de Secretarios (Formatear Guion con IA)"
              isDarkMode={isDarkMode}
            />
          )}

          {/* Real-time Save Status */}
          <SquareHoverButton
            id="btn-manual-save"
            icon={
              isSaved ? (
                <Check className="w-5.5 h-5.5 text-emerald-400" />
              ) : (
                <div className="w-5 h-5 rounded-full border-2 border-amber-400 border-t-transparent animate-spin" />
              )
            }
            label={isSaved ? "Guardado" : "Guardando..."}
            onClick={onManualSave}
            title={isSaved ? "Guardado en tiempo real" : "Guardando cambios..."}
            isDarkMode={isDarkMode}
          />

          {/* Dark/Light Mode Switcher */}
          {onToggleDarkMode && (
            <SquareHoverButton
              id="btn-theme-toggle"
              icon={isDarkMode ? <Sun className="w-5.5 h-5.5 text-amber-300" /> : <Moon className="w-5.5 h-5.5 text-sky-600" />}
              label={isDarkMode ? "Modo Claro" : "Modo Oscuro"}
              onClick={onToggleDarkMode}
              title={isDarkMode ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
              isDarkMode={isDarkMode}
            />
          )}

          {/* Quick Print Button */}
          <SquareHoverButton
            id="btn-print-screenplay"
            icon={<Printer className="w-5.5 h-5.5" />}
            label="Imprimir"
            onClick={onQuickPrint}
            title="Imprimir Guion (Ctrl+P)"
            isDarkMode={isDarkMode}
          />

          {/* Quick Download PDF Button */}
          <SquareHoverButton
            id="btn-quick-pdf"
            icon={<Download className="w-5.5 h-5.5" />}
            label="Descargar PDF"
            onClick={onQuickDownloadPdf}
            title="Descargar PDF Estándar de Cine"
            isDarkMode={isDarkMode}
          />

          {/* Export Options Modal Button */}
          <SquareHoverButton
            id="btn-export-options"
            icon={<FileCode className="w-5.5 h-5.5" />}
            label="Exportar..."
            onClick={onOpenExportModal}
            title="Más formatos (Final Draft .fdx, Fountain, TXT)"
            isDarkMode={isDarkMode}
          />
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. PROJECT TABS BAR (DOCUMENT TABS: REALISTA, DEADLINE, + & TAB ACTIONS)   */}
      {/* ========================================================================= */}
      <div className={`h-10 px-3 sm:px-4 flex items-center justify-between gap-2 border-b transition-colors duration-200 z-10 shrink-0 ${
        isDarkMode ? 'bg-[#141417] border-[#222226]' : 'bg-[#F0F0ED] border-[#D4D4CE]'
      }`}>
        {/* Open Document Tabs + Inline Renaming & Downloads */}
        <div className="flex items-center gap-1.5 min-w-0 overflow-x-auto no-scrollbar py-0.5 flex-1">
          {openProjects.map((p) => {
            const isActive = p.id === activeProjectId;
            const stats = calculateScriptStats(p.blocks);
            const isDownloadingThis = downloadDropdownId === p.id;
            const isRenaming = editingTabId === p.id;

            return (
              <div
                key={p.id}
                onClick={() => onSelectTab(p.id)}
                className={`group relative flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs transition-colors cursor-pointer shrink-0 max-w-[220px] border ${
                  isActive
                    ? isDarkMode
                      ? 'bg-[#1e1e24] border-[#383842] text-white font-semibold shadow-xs'
                      : 'bg-white border-[#D4D4CE] text-[#1A1A1A] font-semibold shadow-xs'
                    : isDarkMode
                      ? 'bg-transparent border-transparent text-[#888888] hover:bg-[#18181b] hover:text-[#D4D4D4]'
                      : 'bg-transparent border-transparent text-[#70706B] hover:bg-[#F2F2EF] hover:text-[#1A1A1A]'
                }`}
              >
                {/* Document Type Icon */}
                <div className={`shrink-0 ${isActive ? 'text-amber-400' : 'text-[#888888]'}`}>
                  {p.type === 'feature' ? (
                    <Film className="w-3.5 h-3.5" />
                  ) : (
                    <FileText className="w-3.5 h-3.5" />
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
                      className={`w-full border rounded px-1.5 py-0.5 text-xs font-bold outline-none font-screenplay ${
                        isDarkMode ? 'bg-[#2A2A2A] border-amber-400 text-white' : 'bg-white border-[#1A1A1A] text-[#1A1A1A]'
                      }`}
                    />
                  ) : (
                    <div 
                      onDoubleClick={(e) => handleStartRename(e, p)}
                      className="text-xs truncate font-screenplay font-bold tracking-tight"
                      title={`${p.title} (Doble clic para renombrar)`}
                    >
                      {p.title || 'SIN TÍTULO'}
                    </div>
                  )}
                </div>

                {/* Page count badge */}
                <span className={`text-[9px] px-1.5 py-0.2 rounded font-mono shrink-0 ${
                  isActive 
                    ? isDarkMode ? 'bg-[#2c2c34] text-amber-300' : 'bg-[#EAEAE7] text-[#70706B]' 
                    : 'opacity-50'
                }`}>
                  {stats.pageCount}p
                </span>

                {/* Quick Download Dropdown */}
                <div className="relative opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setDownloadDropdownId(isDownloadingThis ? null : p.id);
                    }}
                    className={`p-1 rounded transition-colors ${
                      isDarkMode ? 'hover:bg-[#2c2c34] text-[#888888] hover:text-white' : 'hover:bg-[#EBEBE8] text-[#70706B] hover:text-[#1A1A1A]'
                    }`}
                    title={`Descargar "${p.title}"`}
                  >
                    <Download className="w-3 h-3" />
                  </button>

                  {isDownloadingThis && (
                    <div 
                      ref={downloadMenuRef}
                      className={`absolute left-0 top-full mt-1.5 w-48 rounded-lg shadow-xl py-1 z-50 text-xs border ${
                        isDarkMode ? 'bg-[#202025] border-[#33333b] text-white' : 'bg-white border-[#D9D9D6] text-[#1A1A1A]'
                      }`}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        type="button"
                        onClick={() => {
                          downloadDocumentInFormat(p, 'pdf');
                          setDownloadDropdownId(null);
                        }}
                        className={`w-full px-2.5 py-1.5 text-left flex items-center justify-between cursor-pointer ${
                          isDarkMode ? 'hover:bg-[#2c2c34]' : 'hover:bg-[#F4F4F1]'
                        }`}
                      >
                        <span>PDF Estándar</span>
                        <span className="text-[10px] opacity-60 font-mono">.pdf</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          downloadDocumentInFormat(p, 'fdx');
                          setDownloadDropdownId(null);
                        }}
                        className={`w-full px-2.5 py-1.5 text-left flex items-center justify-between cursor-pointer ${
                          isDarkMode ? 'hover:bg-[#2c2c34]' : 'hover:bg-[#F4F4F1]'
                        }`}
                      >
                        <span className="text-amber-400">Final Draft</span>
                        <span className="text-[10px] opacity-60 font-mono">.fdx</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          downloadDocumentInFormat(p, 'fountain');
                          setDownloadDropdownId(null);
                        }}
                        className={`w-full px-2.5 py-1.5 text-left flex items-center justify-between cursor-pointer ${
                          isDarkMode ? 'hover:bg-[#2c2c34]' : 'hover:bg-[#F4F4F1]'
                        }`}
                      >
                        <span>Fountain</span>
                        <span className="text-[10px] opacity-60 font-mono">.fountain</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          downloadDocumentInFormat(p, 'txt');
                          setDownloadDropdownId(null);
                        }}
                        className={`w-full px-2.5 py-1.5 text-left flex items-center justify-between cursor-pointer ${
                          isDarkMode ? 'hover:bg-[#2c2c34]' : 'hover:bg-[#F4F4F1]'
                        }`}
                      >
                        <span>Texto Plano</span>
                        <span className="text-[10px] opacity-60 font-mono">.txt</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Close Tab Button (if multiple open) */}
                {openTabIds.length > 1 && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onCloseTab(p.id);
                    }}
                    className={`p-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity ${
                      isDarkMode ? 'hover:bg-[#2c2c34] text-[#888888] hover:text-white' : 'hover:bg-[#EBEBE8] text-[#70706B] hover:text-[#1A1A1A]'
                    }`}
                    title="Cerrar pestaña"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            );
          })}

          {/* Plus Button for New Document Tab */}
          <div className="relative">
            <button
              ref={newBtnRef}
              type="button"
              onClick={toggleNewMenu}
              className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors cursor-pointer border ${
                isDarkMode 
                  ? 'bg-[#18181b] hover:bg-[#27272e] border-[#2c2c34] text-[#A0A0A0] hover:text-white' 
                  : 'bg-white hover:bg-[#EBEBE8] border-[#D4D4CE] text-[#60605B] hover:text-[#1A1A1A]'
              }`}
              title="Nueva pestaña de guion (+)"
            >
              <Plus className="w-4 h-4" />
            </button>

            {/* Hidden file input for import */}
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,.fountain,.txt"
              className="hidden"
              onChange={handleFileUpload}
            />

            {/* New Tab Context Menu - Rendered via Portal to float above interface */}
            {showNewMenu && newMenuCoords && createPortal(
              <div 
                ref={menuRef}
                style={{
                  position: 'fixed',
                  top: `${newMenuCoords.top}px`,
                  left: `${newMenuCoords.left}px`,
                }}
                className={`w-60 rounded-xl shadow-2xl py-1.5 z-[9999] text-xs border animate-in fade-in duration-150 ${
                  isDarkMode ? 'bg-[#1e1e24] border-[#2f2f3a] text-white' : 'bg-white border-[#D9D9D6] text-[#1A1A1A]'
                }`}
              >
                <div className="px-3 py-1 text-[10px] font-mono uppercase tracking-wider text-[#888888]">
                  Crear Nuevo Proyecto
                </div>

                <button
                  type="button"
                  onClick={() => {
                    onNewTab('short', 'blank');
                    setShowNewMenu(false);
                  }}
                  className={`w-full px-3 py-2 text-left flex items-center gap-2 cursor-pointer ${
                    isDarkMode ? 'hover:bg-[#282830]' : 'hover:bg-[#F4F4F1]'
                  }`}
                >
                  <FileText className="w-4 h-4 text-amber-500" />
                  <div>
                    <div className="font-semibold text-sm">Nuevo guion</div>
                    <div className="text-[10px] text-[#888888]">Estructura estándar de guion</div>
                  </div>
                </button>

                <div className={`my-1 border-t ${isDarkMode ? 'border-[#2c2c34]' : 'border-[#EAEAE7]'}`} />

                {/* Import Fountain/JSON */}
                <button
                  type="button"
                  onClick={() => {
                    fileInputRef.current?.click();
                    setShowNewMenu(false);
                  }}
                  className={`w-full px-3 py-2 text-left flex items-center gap-2 cursor-pointer ${
                    isDarkMode ? 'hover:bg-[#282830]' : 'hover:bg-[#F4F4F1]'
                  }`}
                >
                  <Upload className="w-4 h-4 text-emerald-400" />
                  <div>
                    <div className="font-semibold">Importar Archivo</div>
                    <div className="text-[10px] text-[#888888]">Fountain o JSON</div>
                  </div>
                </button>

                {/* Existing Projects to open */}
                {projectsNotInTabs.length > 0 && (
                  <>
                    <div className={`my-1 border-t ${isDarkMode ? 'border-[#2c2c34]' : 'border-[#EAEAE7]'}`} />
                    <div className="px-3 py-1 text-[10px] font-mono uppercase tracking-wider text-[#888888]">
                      Abrir Guardado
                    </div>
                    {projectsNotInTabs.slice(0, 4).map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => {
                          onOpenExistingInNewTab(p.id);
                          setShowNewMenu(false);
                        }}
                        className={`w-full px-3 py-1.5 text-left text-xs truncate cursor-pointer ${
                          isDarkMode ? 'hover:bg-[#282830] text-[#D4D4D4]' : 'hover:bg-[#F4F4F1] text-[#333333]'
                        }`}
                      >
                        {p.title}
                      </button>
                    ))}
                  </>
                )}
              </div>,
              document.body
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

