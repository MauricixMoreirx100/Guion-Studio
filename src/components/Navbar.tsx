import React, { useState } from 'react';
import { 
  Clapperboard, 
  FolderOpen, 
  Plus, 
  Download, 
  Printer, 
  Eye, 
  Edit3, 
  MapPin, 
  Users, 
  LayoutGrid, 
  FileText, 
  Sparkles, 
  Save, 
  Check, 
  ChevronDown,
  Moon,
  Sun,
  Layers
} from 'lucide-react';
import { Project, ViewTab } from '../types';

interface NavbarProps {
  project: Project;
  onUpdateProjectTitle: (title: string) => void;
  currentTab: ViewTab;
  onChangeTab: (tab: ViewTab) => void;
  onOpenProjectModal: () => void;
  onOpenExportModal: () => void;
  onQuickDownloadPdf: () => void;
  onQuickPrint: () => void;
  onManualSave: () => void;
  isSaved: boolean;
  totalProjectsCount: number;
  isDarkMode?: boolean;
  onToggleDarkMode?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  project,
  onUpdateProjectTitle,
  currentTab,
  onChangeTab,
  onOpenProjectModal,
  onOpenExportModal,
  onQuickDownloadPdf,
  onQuickPrint,
  onManualSave,
  isSaved,
  totalProjectsCount,
  isDarkMode = true,
  onToggleDarkMode,
}) => {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState(project.title);

  const handleTitleSubmit = () => {
    if (titleInput.trim()) {
      onUpdateProjectTitle(titleInput.trim().toUpperCase());
    } else {
      setTitleInput(project.title);
    }
    setIsEditingTitle(false);
  };

  const productionBadgeCount = (project.locations?.length || 0) + (project.characters?.length || 0);

  const tabs: { id: ViewTab; label: string; icon: React.ReactNode; badge?: number }[] = [
    { id: 'editor', label: 'Editor de Guion', icon: <Edit3 className="w-3.5 h-3.5" /> },
    { id: 'preview', label: 'Páginas PDF', icon: <Eye className="w-3.5 h-3.5" /> },
    { 
      id: 'production', 
      label: 'Producción', 
      icon: <Clapperboard className="w-3.5 h-3.5 text-amber-400" />,
      badge: productionBadgeCount 
    },
  ];

  return (
    <header className={`no-print sticky top-0 z-40 px-3 sm:px-6 py-2.5 flex flex-col gap-2.5 border-b transition-colors duration-200 ${
      isDarkMode ? 'bg-[#181818] border-[#2A2A2A] text-white' : 'bg-[#EBEBE8] border-[#D9D9D6] text-[#1A1A1A]'
    }`}>
      <div className="flex items-center justify-between gap-2 sm:gap-4 flex-wrap">
        {/* Brand & Project Selector */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shadow-xs ${
              isDarkMode ? 'bg-amber-500 text-black font-bold' : 'bg-[#1A1A1A] text-white'
            }`}>
              <Clapperboard className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className={`font-serif italic font-bold tracking-tight text-lg leading-none ${
                  isDarkMode ? 'text-white' : 'text-[#1A1A1A]'
                }`}>GuionStudio</span>
                <span className={`text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded border ${
                  isDarkMode ? 'bg-[#252525] border-[#383838] text-amber-300' : 'bg-white border-[#D9D9D6] text-[#70706B]'
                }`}>
                  Editorial
                </span>
              </div>
            </div>
          </div>

          <div className={`h-4 w-px hidden sm:block ${isDarkMode ? 'bg-[#333333]' : 'bg-[#D9D9D6]'}`} />

          {/* Project Switcher Pill */}
          <button
            id="btn-open-projects"
            onClick={onOpenProjectModal}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all shadow-xs cursor-pointer ${
              isDarkMode 
                ? 'bg-[#222222] hover:bg-[#2C2C2C] border-[#333333] text-white' 
                : 'bg-white hover:bg-[#F4F4F1] border-[#D9D9D6] text-[#1A1A1A]'
            }`}
            title="Cambiar o crear nuevo proyecto"
          >
            <FolderOpen className="w-3.5 h-3.5 text-amber-400" />
            <span>Proyectos ({totalProjectsCount})</span>
            <ChevronDown className="w-3 h-3 opacity-60" />
          </button>

          {/* Active Project Title (Editable) */}
          <div className="flex items-center gap-1.5 max-w-[200px] sm:max-w-[280px] md:max-w-[360px]">
            {isEditingTitle ? (
              <input
                type="text"
                value={titleInput}
                onChange={(e) => setTitleInput(e.target.value)}
                onBlur={handleTitleSubmit}
                onKeyDown={(e) => e.key === 'Enter' && handleTitleSubmit()}
                autoFocus
                className={`border rounded px-2 py-0.5 text-xs font-bold font-screenplay w-full outline-none ${
                  isDarkMode ? 'bg-[#252525] border-amber-400 text-white' : 'bg-white border-[#1A1A1A] text-[#1A1A1A]'
                }`}
              />
            ) : (
              <button
                onClick={() => {
                  setTitleInput(project.title);
                  setIsEditingTitle(true);
                }}
                className={`text-left font-bold text-xs sm:text-sm truncate flex items-center gap-1.5 font-screenplay group cursor-pointer ${
                  isDarkMode ? 'text-white hover:text-amber-300' : 'text-[#1A1A1A] hover:text-black'
                }`}
                title="Haz clic para renombrar el guion"
              >
                <span className="truncate">{project.title || 'SIN TÍTULO'}</span>
                <Edit3 className="w-3 h-3 opacity-0 group-hover:opacity-100 text-[#888888]" />
              </button>
            )}
          </div>
        </div>

        {/* Action buttons (Save status, Download, Print, Dark Mode) */}
        <div className="flex items-center gap-2">
          {/* Dark Mode Toggle */}
          {onToggleDarkMode && (
            <button
              onClick={onToggleDarkMode}
              className={`p-1.5 rounded-lg border transition-all shadow-xs cursor-pointer ${
                isDarkMode 
                  ? 'bg-[#222222] hover:bg-[#2C2C2C] border-[#333333] text-amber-300' 
                  : 'bg-white hover:bg-[#F4F4F1] border-[#D9D9D6] text-[#70706B]'
              }`}
              title={isDarkMode ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
            >
              {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          )}

          {/* Auto-save indicator */}
          <button
            onClick={onManualSave}
            className={`flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border transition-colors shadow-xs cursor-pointer ${
              isDarkMode 
                ? 'bg-[#222222] hover:bg-[#2C2C2C] border-[#333333]' 
                : 'bg-white hover:bg-[#F4F4F1] border-[#D9D9D6]'
            }`}
            title="Guardar cambios (se auto-guarda continuamente)"
          >
            {isSaved ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-[11px] text-emerald-400 font-medium hidden sm:inline">Guardado</span>
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-[11px] text-amber-400 font-medium hidden sm:inline">Guardando...</span>
              </>
            )}
          </button>

          {/* Quick Print Button */}
          <button
            id="btn-print-screenplay"
            onClick={onQuickPrint}
            className={`hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all shadow-xs cursor-pointer ${
              isDarkMode 
                ? 'bg-[#222222] hover:bg-[#2C2C2C] border-[#333333] text-white' 
                : 'bg-white hover:bg-[#F4F4F1] border-[#D9D9D6] text-[#1A1A1A]'
            }`}
            title="Imprimir guion (formato estándar)"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Imprimir</span>
          </button>

          {/* Quick PDF Download */}
          <button
            id="btn-quick-pdf"
            onClick={onQuickDownloadPdf}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs shadow-xs transition-all active:scale-[0.98] cursor-pointer"
            title="Descargar guion en PDF estándar"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Descargar PDF</span>
          </button>

          {/* More Export Options */}
          <button
            id="btn-export-options"
            onClick={onOpenExportModal}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-all shadow-xs cursor-pointer ${
              isDarkMode 
                ? 'bg-[#222222] hover:bg-[#2C2C2C] border-[#333333] text-white' 
                : 'bg-white hover:bg-[#F4F4F1] border-[#D9D9D6] text-[#1A1A1A]'
            }`}
            title="Más formatos de descarga (Final Draft FDX, Fountain, TXT)"
          >
            <span>Formatos</span>
            <ChevronDown className="w-3 h-3 opacity-60" />
          </button>
        </div>
      </div>

      {/* Navigation View Tabs */}
      <nav className={`flex items-center gap-1.5 overflow-x-auto pt-1 pb-0.5 border-t no-scrollbar ${
        isDarkMode ? 'border-[#2A2A2A]' : 'border-[#D9D9D6]'
      }`}>
        {tabs.map((tab) => {
          const isActive = currentTab === tab.id;
          return (
            <button
              key={tab.id}
              id={`nav-tab-${tab.id}`}
              onClick={() => onChangeTab(tab.id)}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                isActive
                  ? isDarkMode 
                    ? 'bg-amber-500 text-black font-extrabold shadow-sm' 
                    : 'bg-white text-[#1A1A1A] font-bold border border-[#D9D9D6] shadow-xs'
                  : isDarkMode
                    ? 'text-[#A0A0A0] hover:text-white hover:bg-[#252525] border border-transparent'
                    : 'text-[#70706B] hover:text-[#1A1A1A] hover:bg-[#E1E1DE] border border-transparent'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
              {typeof tab.badge === 'number' && tab.badge > 0 && (
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                  isActive 
                    ? isDarkMode ? 'bg-black text-amber-300' : 'bg-[#1A1A1A] text-white' 
                    : isDarkMode ? 'bg-[#2C2C2C] text-amber-300 border border-[#383838]' : 'bg-white text-[#70706B] border border-[#D9D9D6]'
                }`}>
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>
    </header>
  );
};
