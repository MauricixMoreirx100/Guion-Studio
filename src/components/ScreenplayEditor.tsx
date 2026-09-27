import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { 
  Sparkles, 
  Bookmark,
  Users, 
  MapPin, 
  AlignLeft, 
  MessageSquare, 
  CornerDownRight, 
  Camera, 
  Video,
  Settings2,
  ZoomIn,
  ZoomOut,
  Download,
  Copy,
  Check,
  Undo2,
  Redo2,
  Eye,
  EyeOff,
  Maximize2,
  Minimize2,
  FileText,
  Plus,
  Trash2,
  Wand2,
  CheckCheck,
  Keyboard,
  ListOrdered,
  ChevronDown,
  Loader2,
  ClipboardPaste,
  Film,
  Printer,
  ArrowRight,
  Sparkle,
  PanelRightClose,
  PanelRightOpen,
  ChevronRight,
  Info,
  CheckCircle2,
  ChevronUp,
  RotateCcw,
  GripVertical,
  X
} from 'lucide-react';
import { Project, ScriptBlock, ElementType, PageData, TitlePageData } from '../types';
import { 
  parseFountainToBlocks, 
  blocksToFountain, 
  calculateScriptStats, 
  generateId,
  isValidCharacterName,
  pruneIncompleteCharacterNames,
  cleanLocationName,
  isValidLocationName,
  pruneIncompleteLocationNames
} from '../utils/fountain';
import { downloadDocumentInFormat } from '../utils/fdxExport';
import { AiFormatModal } from './AiFormatModal';
import { DocumentTabs } from './DocumentTabs';

// Celtx-style Autocompletion Types (Scene Prefixes, Locations, Times of Day, and Characters)
export type AutocompleteType = 'scene_prefix' | 'scene_location' | 'scene_time' | 'character';

export interface EditorSuggestionItem {
  id: string;
  label: string;
  category?: string;
}

export interface EditorSuggestionMenu {
  type: AutocompleteType;
  headerTitle?: string;
  items: EditorSuggestionItem[];
  selectedIndex: number;
  coords: { top: number; left: number };
}

interface ScreenplayEditorProps {
  project: Project;
  onUpdateBlocks: (blocks: ScriptBlock[]) => void;
  onUpdateSettings: (settings: Project['settings']) => void;
  onUpdateTitlePage?: (titlePage: TitlePageData) => void;
  onNavigateToPreview?: () => void;
  onOpenExportModal?: () => void;
  isDarkMode?: boolean;
  isSidePanelOpen?: boolean;
  onToggleSidePanel?: () => void;
  allProjects?: Project[];
  openTabIds?: string[];
  activeProjectId?: string;
  onSelectTab?: (id: string) => void;
  onCloseTab?: (id: string) => void;
  onNewTab?: (type?: Project['type'], template?: string) => void;
  onOpenExistingInNewTab?: (id: string) => void;
  onDuplicateProject?: (project: Project) => void;
  onUpdateTitle?: (id: string, newTitle: string) => void;
  onImportJson?: (jsonStr: string) => void;
}

// Complete Screenplay Elements Configuration with Shortcuts & Visual Styling
export interface ScreenplayElementDef {
  type: ElementType;
  label: string;
  shortLabel: string;
  number: number;
  shortcut: string;
  description: string;
  sampleText: string;
  icon: React.ComponentType<{ className?: string }>;
  tagColor: string;
}

// The 6 core screenplay elements in standard sequence (Ctrl+1 through Ctrl+6)
export const CORE_SCREENPLAY_TYPES: ElementType[] = [
  'scene_heading',  // 1 -> INT./EXT. (Ctrl + 1)
  'action',         // 2 -> ACCIÓN (Ctrl + 2)
  'character',      // 3 -> PERSONAJE (Ctrl + 3)
  'dialogue',       // 4 -> DIÁLOGO (Ctrl + 4)
  'parenthetical',  // 5 -> ACOTACIÓN (Ctrl + 5)
  'transition',     // 6 -> TRANSICIÓN (Ctrl + 6)
];

// The full 9-element sequence in order with shortcuts Ctrl+0 to Ctrl+8
export const ORDERED_ELEMENT_TYPES: ElementType[] = [
  'scene_heading',  // 1 -> Scene Title (Ctrl + 1)
  'action',         // 2 -> Action (Ctrl + 2)
  'character',      // 3 -> Character (Ctrl + 3)
  'dialogue',       // 4 -> Dialogue (Ctrl + 4)
  'parenthetical',  // 5 -> Parenthetical (Ctrl + 5)
  'transition',     // 6 -> Transition (Ctrl + 6)
  'act',            // 0 -> Act (Ctrl + 0)
  'shot',           // 7 -> Shot (Ctrl + 7)
  'text',           // 8 -> Text (Ctrl + 8)
];

export const SCREENPLAY_ELEMENTS: ScreenplayElementDef[] = [
  {
    type: 'scene_heading',
    label: 'Título de Escena (INT./EXT.)',
    shortLabel: 'Título Escena',
    number: 1,
    shortcut: 'Ctrl+1',
    description: 'Encabezado de escena: interior/exterior, lugar y momento del día',
    sampleText: 'INT. LUGAR - DÍA',
    icon: MapPin,
    tagColor: 'bg-emerald-100 text-emerald-900 border-emerald-300',
  },
  {
    type: 'action',
    label: 'Acción / Descripción',
    shortLabel: 'Acción',
    number: 2,
    shortcut: 'Ctrl+2',
    description: 'Descripción visual de lo que sucede y se observa en cámara',
    sampleText: 'Descripción de la acción...',
    icon: AlignLeft,
    tagColor: 'bg-stone-100 text-stone-900 border-stone-300',
  },
  {
    type: 'character',
    label: 'Personaje',
    shortLabel: 'Personaje',
    number: 3,
    shortcut: 'Ctrl+3',
    description: 'Nombre del personaje que hablará (en MAYÚSCULAS y NEGRITA)',
    sampleText: 'PERSONAJE',
    icon: Users,
    tagColor: 'bg-amber-100 text-amber-900 border-amber-300',
  },
  {
    type: 'dialogue',
    label: 'Diálogo',
    shortLabel: 'Diálogo',
    number: 4,
    shortcut: 'Ctrl+4',
    description: 'Líneas habladas por el personaje en pantalla',
    sampleText: 'Línea de diálogo...',
    icon: MessageSquare,
    tagColor: 'bg-indigo-100 text-indigo-900 border-indigo-300',
  },
  {
    type: 'parenthetical',
    label: 'Acotación (Paréntesis)',
    shortLabel: '(Acotación)',
    number: 5,
    shortcut: 'Ctrl+5',
    description: 'Instrucción actoral, tono o actitud entre paréntesis',
    sampleText: '(acotación)',
    icon: CornerDownRight,
    tagColor: 'bg-sky-100 text-sky-900 border-sky-300',
  },
  {
    type: 'transition',
    label: 'Transición / Corte',
    shortLabel: 'Transición',
    number: 6,
    shortcut: 'Ctrl+6',
    description: 'Transición de montaje cinematográfico (CORTE A:, FUNDIDO A NEGRO:)',
    sampleText: 'CORTE A:',
    icon: Camera,
    tagColor: 'bg-purple-100 text-purple-900 border-purple-300',
  },
  {
    type: 'act',
    label: 'Acto (División Estructural)',
    shortLabel: 'Acto',
    number: 0,
    shortcut: 'Ctrl+0',
    description: 'División principal de la estructura dramática (ACTO I / ACT ONE)',
    sampleText: 'ACTO I',
    icon: Bookmark,
    tagColor: 'bg-yellow-100 text-yellow-900 border-yellow-300',
  },
  {
    type: 'shot',
    label: 'Plano / Toma de Cámara',
    shortLabel: 'Plano / Toma',
    number: 7,
    shortcut: 'Ctrl+7',
    description: 'Instrucción de encuadre (PLANO GENERAL, P.O.V., DETALLE)',
    sampleText: 'PLANO GENERAL - DETALLE',
    icon: Video,
    tagColor: 'bg-rose-100 text-rose-900 border-rose-300',
  },
  {
    type: 'text',
    label: 'Texto General',
    shortLabel: 'Texto',
    number: 8,
    shortcut: 'Ctrl+8',
    description: 'Texto general, nota narrativa o comentario en prosa libre',
    sampleText: 'Texto general o nota narrativa...',
    icon: FileText,
    tagColor: 'bg-teal-100 text-teal-900 border-teal-300',
  },
];

// Standard placeholder helper texts displayed in empty blocks via CSS
export const ELEMENT_PLACEHOLDERS: Record<ElementType, string> = {
  act: 'ACTO I / ACT ONE',
  scene_heading: 'INT./EXT. LUGAR - MOMENTO DEL DÍA',
  action: 'Descripción de la acción y lo que sucede en escena...',
  character: 'NOMBRE DEL PERSONAJE',
  dialogue: 'Línea de diálogo del personaje...',
  parenthetical: '(acotación actoral, tono o pausa)',
  transition: 'CORTE A: / FUNDIDO A:',
  shot: 'PLANO GENERAL / TOMA DE CÁMARA',
  text: 'Texto general o nota narrativa...',
  note: '[[Nota de producción...]]',
};

export const ALL_LEGACY_PLACEHOLDER_TEXTS = [
  'ACTO I',
  'ACTO I / ACT ONE',
  'ACT ONE',
  'INT. LUGAR - DÍA',
  'EXT. LUGAR - DÍA',
  'INT. NUEVA LOCACIÓN - DÍA',
  'INT. LUGAR DE GRABACIÓN - DÍA',
  'INT./EXT. LUGAR - MOMENTO DEL DÍA',
  'Descripción de la acción...',
  'Descripción de la acción y atmósfera...',
  'Descripción visual de la escena...',
  'Descripción de la acción y lo que sucede en escena...',
  'PERSONAJE',
  'PROTAGONISTA',
  'NOMBRE DEL PERSONAJE',
  '(acotación)',
  '(acotación actoral, tono o pausa)',
  'Línea de diálogo...',
  'Línea de diálogo del personaje...',
  'Primera línea de diálogo del guion.',
  'CORTE A:',
  'CORTE A: / FUNDIDO A:',
  'PLANO GENERAL - DETALLE',
  'PLANO GENERAL / TOMA DE CÁMARA',
  'Texto general o nota narrativa...',
];

export const isPlaceholderText = (text: string | null | undefined): boolean => {
  if (!text) return false;
  const clean = text.trim().toLowerCase();
  if (clean === '' || clean === '<br>') return false;
  return Object.values(ELEMENT_PLACEHOLDERS).some((p) => p.toLowerCase() === clean) ||
    ALL_LEGACY_PLACEHOLDER_TEXTS.some((p) => p.toLowerCase() === clean);
};

export const isBlockContentEmpty = (text: string | null | undefined): boolean => {
  if (!text) return true;
  const clean = text.trim();
  if (clean === '' || clean === '<br>') return true;
  // Parenthetical artifacts or incomplete parentheses
  if (clean === '()' || clean === '(' || clean === ')' || clean === '():') return true;
  return isPlaceholderText(clean);
};

// Common Spanish screenplay accents & typos
const SPANISH_ACCENT_CORRECTIONS: Record<string, string> = {
  'guion': 'guión',
  'guiones': 'guiones',
  'camara': 'cámara',
  'camaras': 'cámaras',
  'musica': 'música',
  'accion': 'acción',
  'acciones': 'acciones',
  'dialogo': 'diálogo',
  'dialogos': 'diálogos',
  'angulo': 'ángulo',
  'telefono': 'teléfono',
  'produccion': 'producción',
  'grabacion': 'grabación',
  'corazon': 'corazón',
  'habitacion': 'habitación',
  'escenografia': 'escenografía',
  'continuacion': 'continuación',
};

export const ScreenplayEditor: React.FC<ScreenplayEditorProps> = ({
  project,
  onUpdateBlocks,
  onUpdateSettings,
  onUpdateTitlePage,
  onNavigateToPreview,
  onOpenExportModal,
  isDarkMode = true,
  isSidePanelOpen,
  onToggleSidePanel,
  allProjects,
  openTabIds,
  activeProjectId,
  onSelectTab,
  onCloseTab,
  onNewTab,
  onOpenExistingInNewTab,
  onDuplicateProject,
  onUpdateTitle,
  onImportJson,
}) => {
  // Option to hide top bar and tools, leaving only the pure page
  const [hideTopBar, setHideTopBar] = useState<boolean>(false);
  const [internalShowSidePanel, setInternalShowSidePanel] = useState<boolean>(false);
  const sidePanelVisible = isSidePanelOpen !== undefined ? isSidePanelOpen : internalShowSidePanel;
  const handleToggleSidePanel = () => {
    if (onToggleSidePanel) {
      onToggleSidePanel();
    } else {
      setInternalShowSidePanel((prev) => !prev);
    }
  };

  // Title Page (Portada) at the start of the script - enabled by default for new projects
  const [showTitlePage, setShowTitlePage] = useState<boolean>(() => {
    return project.settings?.showTitlePage !== false;
  });

  useEffect(() => {
    setShowTitlePage(project.settings?.showTitlePage !== false);
  }, [project.id, project.settings?.showTitlePage]);

  const handleToggleTitlePage = useCallback(() => {
    setShowTitlePage((prev) => {
      const next = !prev;
      onUpdateSettings({
        ...project.settings,
        showTitlePage: next,
      });
      return next;
    });
  }, [project.settings, onUpdateSettings]);

  const handleTitlePageFieldChange = useCallback((field: keyof TitlePageData, value: string) => {
    const updatedTitlePage: TitlePageData = {
      ...(project.titlePage || {
        title: project.title ?? '',
        writtenBy: 'Mauricio Moreira',
        draft: 'Primer Borrador',
        date: new Date().toLocaleDateString('es-ES', { month: 'long', year: 'numeric' }),
        contact: 'contacto@guionstudio.com',
      }),
      [field]: value,
    };

    if (field === 'title' && onUpdateTitle) {
      onUpdateTitle(project.id, value);
    }
    onUpdateTitlePage?.(updatedTitlePage);
  }, [project.id, project.title, project.titlePage, onUpdateTitle, onUpdateTitlePage]);
  const [zoom, setZoom] = useState<number>(100);
  const [copied, setCopied] = useState<boolean>(false);
  const [autocorrectEnabled, setAutocorrectEnabled] = useState<boolean>(true);
  const [lastNotice, setLastNotice] = useState<{ text: string; icon?: string; shortcut?: string } | null>(null);
  const [isFormattingAi, setIsFormattingAi] = useState<boolean>(false);
  const [isAiFormatModalOpen, setIsAiFormatModalOpen] = useState<boolean>(false);
  const [isAiPanelExpanded, setIsAiPanelExpanded] = useState<boolean>(false);
  const [sidebarRawText, setSidebarRawText] = useState<string>('');
  const [sidebarApplyMode, setSidebarApplyMode] = useState<'replace' | 'append'>('replace');
  const [sidebarFormatError, setSidebarFormatError] = useState<string | null>(null);

  // Celtx-style Autocompletion popup state (Scene Prefixes, Locations, Times of Day, and Characters)
  const [suggestionMenu, setSuggestionMenu] = useState<EditorSuggestionMenu | null>(null);

  // Draggable Secretarios floating square widget state
  const [fabPos, setFabPos] = useState<{ x: number; y: number } | null>(null);
  const isDraggingFabRef = useRef<boolean>(false);
  const dragStartFabRef = useRef<{ startX: number; startY: number; initX: number; initY: number; moved: boolean }>({
    startX: 0,
    startY: 0,
    initX: 0,
    initY: 0,
    moved: false,
  });

  const handlePointerDownFab = (e: React.PointerEvent<HTMLDivElement | HTMLButtonElement>) => {
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    isDraggingFabRef.current = true;
    const currentX = fabPos ? fabPos.x : Math.max(16, window.innerWidth - 90);
    const currentY = fabPos ? fabPos.y : Math.max(80, window.innerHeight - 110);
    dragStartFabRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initX: currentX,
      initY: currentY,
      moved: false,
    };
  };

  const handlePointerMoveFab = (e: React.PointerEvent<HTMLDivElement | HTMLButtonElement>) => {
    if (!isDraggingFabRef.current) return;
    const dx = e.clientX - dragStartFabRef.current.startX;
    const dy = e.clientY - dragStartFabRef.current.startY;
    if (Math.hypot(dx, dy) > 5) {
      dragStartFabRef.current.moved = true;
    }
    const newX = Math.max(12, Math.min(window.innerWidth - 80, dragStartFabRef.current.initX + dx));
    const newY = Math.max(60, Math.min(window.innerHeight - 80, dragStartFabRef.current.initY + dy));
    setFabPos({ x: newX, y: newY });
  };

  const handlePointerUpFab = (e: React.PointerEvent<HTMLDivElement | HTMLButtonElement>) => {
    if (!isDraggingFabRef.current) return;
    isDraggingFabRef.current = false;
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      // safe
    }
    if (!dragStartFabRef.current.moved) {
      handleToggleSidePanel();
    }
  };

  // Active element state & Top-Bar Dropdown Selector
  const [activeElementType, setActiveElementType] = useState<ElementType>('scene_heading');
  const [isElementDropdownOpen, setIsElementDropdownOpen] = useState<boolean>(false);
  const [isSceneNavOpen, setIsSceneNavOpen] = useState<boolean>(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const sceneNavRef = useRef<HTMLDivElement>(null);

  const editorRef = useRef<HTMLDivElement>(null);
  const isInternalUpdateRef = useRef<boolean>(false);
  const currentProjectIdRef = useRef<string>('');
  const historyRef = useRef<string[]>([blocksToFountain(project.blocks)]);
  const historyIndexRef = useRef<number>(0);
  const hideNoticeTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsElementDropdownOpen(false);
      }
      if (sceneNavRef.current && !sceneNavRef.current.contains(event.target as Node)) {
        setIsSceneNavOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // List of scenes in screenplay for navigation jumper
  const sceneList = useMemo(() => {
    const scenes: { index: number; title: string; sceneNumber?: number }[] = [];
    let count = 1;
    (project.blocks || []).forEach((b) => {
      if (b.type === 'scene_heading') {
        const text = (b.content || '').trim();
        if (text && !isPlaceholderText(text)) {
          scenes.push({
            index: scenes.length,
            title: text,
            sceneNumber: b.sceneNumber || count++,
          });
        }
      }
    });
    return scenes;
  }, [project.blocks]);

  // Jump smoothly to a scene in the editor
  const handleScrollToScene = (sceneIndex: number) => {
    if (!editorRef.current) return;
    const sceneHeadings = editorRef.current.querySelectorAll('p[data-type="scene_heading"]');
    if (sceneHeadings[sceneIndex]) {
      const targetElem = sceneHeadings[sceneIndex] as HTMLElement;
      targetElem.scrollIntoView({ behavior: 'smooth', block: 'center' });
      targetElem.classList.add('bg-amber-100/50');
      setTimeout(() => {
        targetElem.classList.remove('bg-amber-100/50');
      }, 1500);
      setIsSceneNavOpen(false);
      showNotification(`Navegando a Escena ${sceneIndex + 1}`);
    }
  };

  const showNotification = useCallback((text: string, shortcut?: string) => {
    if (hideNoticeTimerRef.current) clearTimeout(hideNoticeTimerRef.current);
    setLastNotice({ text, shortcut });
    hideNoticeTimerRef.current = setTimeout(() => {
      setLastNotice(null);
    }, 2500);
  }, []);

  // Multi-Page Array State: Paginate blocks into discrete physical pages (US Letter 816px x 1056px, max 52 lines printable area)
  const paginateBlocks = useCallback((blocks: ScriptBlock[]): PageData[] => {
    if (!blocks || blocks.length === 0) {
      return [{
        pageNumber: 1,
        blocks: [{ id: generateId(), type: 'scene_heading', content: '' }]
      }];
    }

    const MAX_LINES_PER_PAGE = 52; // Standard Hollywood printable page capacity (~864px printable height / ~16px line)
    const pages: PageData[] = [];
    let currentPageBlocks: ScriptBlock[] = [];
    let currentLines = 0;

    for (let i = 0; i < blocks.length; i++) {
      const block = blocks[i];
      let blockLines = 1.0;
      switch (block.type) {
        case 'act':
        case 'scene_heading':
          blockLines = 3.0;
          break;
        case 'action':
        case 'text':
          blockLines = Math.max(1, Math.ceil((block.content || '').length / 60)) + 1.0;
          break;
        case 'character':
          blockLines = 2.0;
          break;
        case 'dialogue':
          blockLines = Math.max(1, Math.ceil((block.content || '').length / 35)) + 1.0;
          break;
        case 'parenthetical':
          blockLines = 1.2;
          break;
        case 'transition':
        case 'shot':
          blockLines = 2.0;
          break;
        default:
          blockLines = 1.0;
          break;
      }

      // Hollywood orphan prevention buffer:
      // scene_heading requires at least 2 lines of action; character requires at least 1 line of dialogue
      const buffer = (block.type === 'scene_heading') ? 3.0 : (block.type === 'character') ? 2.0 : 0;

      if (currentLines + blockLines + buffer > MAX_LINES_PER_PAGE && currentPageBlocks.length > 0) {
        pages.push({
          pageNumber: pages.length + 1,
          blocks: currentPageBlocks,
        });
        currentPageBlocks = [block];
        currentLines = blockLines;
      } else {
        currentPageBlocks.push(block);
        currentLines += blockLines;
      }
    }

    if (currentPageBlocks.length > 0 || pages.length === 0) {
      pages.push({
        pageNumber: pages.length + 1,
        blocks: currentPageBlocks.length > 0 ? currentPageBlocks : [{ id: generateId(), type: 'scene_heading', content: '' }],
      });
    }

    return pages;
  }, []);

  // Convert array of discrete PageData objects into strict fixed-dimension screenplay-page DOM elements
  const pagesToHtml = useCallback((pages: PageData[]): string => {
    if (!pages || pages.length === 0) {
      pages = [{ pageNumber: 1, blocks: [{ id: generateId(), type: 'scene_heading', content: '' }] }];
    }

    return pages.map((page) => {
      const headerHtml = page.pageNumber > 1
        ? `<div class="screenplay-page-header select-none pointer-events-none" contenteditable="false">
             <span class="font-mono text-[12pt] font-bold ${isDarkMode ? 'text-white' : 'text-[#111111]'}">${page.pageNumber}.</span>
           </div>`
        : `<div class="screenplay-page-header select-none pointer-events-none" contenteditable="false"></div>`;

      const blocksHtml = page.blocks.map((block) => {
        const text = (block.content || '').replace(/</g, '&lt;').replace(/>/g, '&gt;').trim();
        const isEmpty = isBlockContentEmpty(text);
        const safeText = isEmpty ? '<br>' : text;
        const placeholder = ELEMENT_PLACEHOLDERS[block.type] || ELEMENT_PLACEHOLDERS.action;
        const emptyAttr = isEmpty ? ' data-empty="true"' : '';
        const blockIdAttr = block.id ? ` data-block-id="${block.id}"` : '';

        switch (block.type) {
          case 'act':
            return `<p class="script-act font-bold uppercase ${isDarkMode ? 'text-white' : 'text-black'} text-center relative" data-type="act" data-placeholder="${placeholder}"${emptyAttr}${blockIdAttr}>${safeText}</p>`;
          case 'scene_heading':
            return `<p class="script-scene-heading font-bold uppercase ${isDarkMode ? 'text-white' : 'text-black'} relative" data-type="scene_heading" data-placeholder="${placeholder}"${emptyAttr}${blockIdAttr}>${safeText}</p>`;
          case 'action':
            return `<p class="script-action ${isDarkMode ? 'text-white' : 'text-[#1A1A1A]'} relative" data-type="action" data-placeholder="${placeholder}"${emptyAttr}${blockIdAttr}>${safeText}</p>`;
          case 'character':
            return `<p class="script-character font-bold uppercase ${isDarkMode ? 'text-white' : 'text-black'} relative" data-type="character" data-placeholder="${placeholder}"${emptyAttr}${blockIdAttr}>${safeText}</p>`;
          case 'dialogue':
            return `<p class="script-dialogue ${isDarkMode ? 'text-white' : 'text-[#111111]'} relative" data-type="dialogue" data-placeholder="${placeholder}"${emptyAttr}${blockIdAttr}>${safeText}</p>`;
          case 'parenthetical':
            return `<p class="script-parenthetical italic ${isDarkMode ? 'text-[#B0B0BA]' : 'text-[#333333]'} relative" data-type="parenthetical" data-placeholder="${placeholder}"${emptyAttr}${blockIdAttr}>${safeText}</p>`;
          case 'transition':
            return `<p class="script-transition font-bold uppercase ${isDarkMode ? 'text-white' : 'text-black'} text-right relative" data-type="transition" data-placeholder="${placeholder}"${emptyAttr}${blockIdAttr}>${safeText}</p>`;
          case 'shot':
            return `<p class="script-shot font-bold uppercase ${isDarkMode ? 'text-white' : 'text-black'} relative" data-type="shot" data-placeholder="${placeholder}"${emptyAttr}${blockIdAttr}>${safeText}</p>`;
          case 'text':
            return `<p class="script-text ${isDarkMode ? 'text-white' : 'text-[#1A1A1A]'} relative" data-type="text" data-placeholder="${placeholder}"${emptyAttr}${blockIdAttr}>${safeText}</p>`;
          default:
            return `<p class="script-action ${isDarkMode ? 'text-white' : 'text-[#1A1A1A]'} relative" data-type="action" data-placeholder="${placeholder}"${emptyAttr}${blockIdAttr}>${safeText}</p>`;
        }
      }).join('');

      const pageThemeClass = isDarkMode
        ? 'dark-sheet bg-[#222228] text-white border-[#33333c]'
        : 'light-sheet bg-white text-[#111111] border-[#D9D9D6]';

      return `
        <div class="screenplay-page relative select-text shadow-2xl transition-colors border ${pageThemeClass}" data-page-container="true" data-page-number="${page.pageNumber}">
          ${headerHtml}
          ${blocksHtml || `<p class="script-scene-heading font-bold uppercase ${isDarkMode ? 'text-white' : 'text-black'} relative" data-type="scene_heading" data-placeholder="${ELEMENT_PLACEHOLDERS.scene_heading}" data-empty="true"><br></p>`}
        </div>
      `;
    }).join('');
  }, [isDarkMode]);

  // Helper to convert ScriptBlocks to styled HTML with multi-page physical pagination
  const blocksToHtml = useCallback((blocks: ScriptBlock[]): string => {
    const pages = paginateBlocks(blocks);
    return pagesToHtml(pages);
  }, [paginateBlocks, pagesToHtml]);

  // Extract raw text from all paragraphs across all discrete pages
  const getEditorRawText = useCallback((): string => {
    if (!editorRef.current) return '';
    const paragraphs = Array.from(editorRef.current.querySelectorAll('p[data-type], p'));
    if (paragraphs.length === 0) {
      return editorRef.current.innerText || '';
    }
    return paragraphs
      .map((p: Element) => p.textContent || '')
      .join('\n\n')
      .replace(/\n{3,}/g, '\n\n');
  }, []);

  // Parse discrete DOM pages back into structured PageData[]
  const domToPages = useCallback((): PageData[] => {
    if (!editorRef.current) return [];
    const pageNodes = Array.from(editorRef.current.querySelectorAll('.screenplay-page, [data-page-container="true"]')) as HTMLElement[];
    
    if (pageNodes.length === 0) {
      const paragraphs = Array.from(editorRef.current.querySelectorAll('p[data-type], p')) as HTMLElement[];
      const blocks: ScriptBlock[] = paragraphs.map((p) => ({
        id: p.getAttribute('data-block-id') || generateId(),
        type: (p.getAttribute('data-type') as ElementType) || 'action',
        content: (p.textContent || '').trim() === '' || isPlaceholderText(p.textContent) ? '' : (p.textContent || '').trim(),
      }));
      return [{ pageNumber: 1, blocks: blocks.length > 0 ? blocks : [{ id: generateId(), type: 'action', content: '' }] }];
    }

    let sceneCount = 1;
    return pageNodes.map((pageElem, idx) => {
      const pageNum = parseInt(pageElem.getAttribute('data-page-number') || String(idx + 1), 10);
      const paragraphs = Array.from(pageElem.querySelectorAll('p[data-type], p')) as HTMLElement[];
      const blocks: ScriptBlock[] = paragraphs.map((p) => {
        const type = (p.getAttribute('data-type') as ElementType) || 'action';
        const raw = p.textContent || '';
        const content = raw.trim() === '' || isPlaceholderText(raw) ? '' : raw.trim();
        const block: ScriptBlock = {
          id: p.getAttribute('data-block-id') || generateId(),
          type,
          content,
        };
        if (type === 'scene_heading') {
          block.sceneNumber = sceneCount++;
        }
        return block;
      });
      return {
        pageNumber: pageNum,
        blocks: blocks.length > 0 ? blocks : [{ id: generateId(), type: 'action', content: '' }],
      };
    });
  }, []);

  // Real-time parsed blocks, pages, and stats
  const [currentBlocks, setCurrentBlocks] = useState<ScriptBlock[]>(project.blocks);
  const [paginatedPages, setPaginatedPages] = useState<PageData[]>(() => paginateBlocks(project.blocks));
  const stats = useMemo(() => calculateScriptStats(currentBlocks), [currentBlocks]);

  // Initialize editor content ONLY when project actually changes or mounts
  useEffect(() => {
    if (isInternalUpdateRef.current) return;
    if (editorRef.current && (currentProjectIdRef.current !== project.id || editorRef.current.children.length === 0)) {
      currentProjectIdRef.current = project.id;
      setCurrentBlocks(project.blocks);
      const initialPages = paginateBlocks(project.blocks);
      setPaginatedPages(initialPages);
      editorRef.current.innerHTML = pagesToHtml(initialPages);
    }
  }, [project.id, project.blocks, paginateBlocks, pagesToHtml]);

  // Synchronize dark-sheet / light-sheet theme classes on all live page containers when isDarkMode changes
  useEffect(() => {
    if (!editorRef.current) return;
    const pages = editorRef.current.querySelectorAll('.screenplay-page, [data-page-container="true"]');
    pages.forEach((page) => {
      if (isDarkMode) {
        page.classList.remove('light-sheet', 'bg-white', 'text-[#111111]', 'border-[#D9D9D6]', 'bg-black');
        page.classList.add('dark-sheet', 'bg-[#222228]', 'text-white', 'border-[#33333c]');
      } else {
        page.classList.remove('dark-sheet', 'bg-[#222228]', 'bg-black', 'text-white', 'border-[#242426]', 'border-[#33333c]');
        page.classList.add('light-sheet', 'bg-white', 'text-[#111111]', 'border-[#D9D9D6]');
      }
      const pageHeaderSpan = page.querySelector('.screenplay-page-header span');
      if (pageHeaderSpan) {
        if (isDarkMode) {
          pageHeaderSpan.classList.remove('text-[#111111]');
          pageHeaderSpan.classList.add('text-white');
        } else {
          pageHeaderSpan.classList.remove('text-white');
          pageHeaderSpan.classList.add('text-[#111111]');
        }
      }
    });
  }, [isDarkMode]);

  // Sync back to parent (debounced)
  const syncToParent = useCallback((blocks: ScriptBlock[]) => {
    setCurrentBlocks(blocks);
    isInternalUpdateRef.current = true;
    onUpdateBlocks(blocks);
    setTimeout(() => {
      isInternalUpdateRef.current = false;
    }, 150);
  }, [onUpdateBlocks]);

  // Push to history
  const pushHistory = (fountain: string) => {
    const cur = historyRef.current.slice(0, historyIndexRef.current + 1);
    if (cur[cur.length - 1] !== fountain) {
      cur.push(fountain);
      if (cur.length > 50) cur.shift();
      historyRef.current = cur;
      historyIndexRef.current = cur.length - 1;
    }
  };

  const handleUndo = () => {
    if (historyIndexRef.current > 0) {
      historyIndexRef.current -= 1;
      const prevFountain = historyRef.current[historyIndexRef.current];
      const parsed = parseFountainToBlocks(prevFountain);
      const pages = paginateBlocks(parsed);
      setPaginatedPages(pages);
      if (editorRef.current) {
        editorRef.current.innerHTML = pagesToHtml(pages);
      }
      syncToParent(parsed);
    }
  };

  const handleRedo = () => {
    if (historyIndexRef.current < historyRef.current.length - 1) {
      historyIndexRef.current += 1;
      const nextFountain = historyRef.current[historyIndexRef.current];
      const parsed = parseFountainToBlocks(nextFountain);
      const pages = paginateBlocks(parsed);
      setPaginatedPages(pages);
      if (editorRef.current) {
        editorRef.current.innerHTML = pagesToHtml(pages);
      }
      syncToParent(parsed);
    }
  };


  // Asynchronous API call to Gemini Flash to format messy or raw script text
  const handleFormatWithAiDirect = async () => {
    if (isFormattingAi) return;

    // 1. Capture raw input text from current selection or editor
    const selection = window.getSelection();
    let selectedText = '';
    let isSelectedRange = false;

    if (selection && !selection.isCollapsed && selection.rangeCount > 0) {
      selectedText = selection.toString().trim();
      isSelectedRange = selectedText.length > 0;
    }

    const rawTextToProcess = isSelectedRange ? selectedText : getEditorRawText();

    if (!rawTextToProcess || !rawTextToProcess.trim()) {
      // If editor has no content, open the dedicated Paste & Format modal
      setIsAiFormatModalOpen(true);
      return;
    }

    // 2. Show loading state on the button
    setIsFormattingAi(true);
    showNotification('Formateando texto con IA (Gemini Flash)... ✨');

    try {
      const res = await fetch('/api/ai/format', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rawText: rawTextToProcess,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Error al formatear con IA.');
      }

      // 3. Parse structured response from model
      let sceneCount = 1;
      const formattedBlocks: ScriptBlock[] = (data.blocks || []).map((b: { type: ElementType; content: string }) => ({
        id: generateId(),
        type: b.type,
        content: b.content,
        sceneNumber: b.type === 'scene_heading' ? sceneCount++ : undefined,
      }));

      if (formattedBlocks.length === 0) {
        throw new Error('No se generaron bloques estructurados.');
      }

      // 4. Replace unformatted text blocks in document state
      if (isSelectedRange && selection && selection.rangeCount > 0 && editorRef.current) {
        const range = selection.getRangeAt(0);
        range.deleteContents();

        const tempContainer = document.createElement('div');
        tempContainer.innerHTML = blocksToHtml(formattedBlocks);

        const fragment = document.createDocumentFragment();
        while (tempContainer.firstChild) {
          fragment.appendChild(tempContainer.firstChild);
        }
        range.insertNode(fragment);
        handleInput();
        showNotification('¡Texto seleccionado formateado con IA! ✨');
      } else {
        const newHtml = blocksToHtml(formattedBlocks);
        if (editorRef.current) {
          editorRef.current.innerHTML = newHtml;
        }
        syncToParent(formattedBlocks);
        pushHistory(blocksToFountain(formattedBlocks));
        showNotification('¡Guion estructurado en 9 elementos con IA! ✨');
      }
    } catch (err: any) {
      console.error('AI Format Error:', err);
      showNotification(err.message || 'Error al formatear con IA.');
    } finally {
      setIsFormattingAi(false);
    }
  };

  // Direct paste from clipboard and format with AI in one click
  const handlePasteAndFormatDirect = async () => {
    if (isFormattingAi) return;
    try {
      const clipboardText = await navigator.clipboard.readText();
      if (clipboardText && clipboardText.trim()) {
        setIsFormattingAi(true);
        showNotification('Formateando texto del portapapeles con IA (Gemini Flash)... ✨');
        const res = await fetch('/api/ai/format', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ rawText: clipboardText }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Error al formatear con IA.');
        let sceneCount = 1;
        const formattedBlocks: ScriptBlock[] = (data.blocks || []).map((b: { type: ElementType; content: string }) => ({
          id: generateId(),
          type: b.type,
          content: b.content,
          sceneNumber: b.type === 'scene_heading' ? sceneCount++ : undefined,
        }));
        if (formattedBlocks.length === 0) throw new Error('No se generaron bloques estructurados.');
        const newHtml = blocksToHtml(formattedBlocks);
        if (editorRef.current) {
          editorRef.current.innerHTML = newHtml;
        }
        syncToParent(formattedBlocks);
        pushHistory(blocksToFountain(formattedBlocks));
        showNotification('¡Texto del portapapeles estructurado con IA! ✨');
      } else {
        setIsAiFormatModalOpen(true);
      }
    } catch (err: any) {
      console.error(err);
      setIsAiFormatModalOpen(true);
    } finally {
      setIsFormattingAi(false);
    }
  };

  // Format action triggered directly from the expanded sidebar panel
  const handleFormatFromSidebar = async () => {
    if (isFormattingAi) return;
    const textToProcess = sidebarRawText.trim() || getEditorRawText();
    if (!textToProcess) {
      setSidebarFormatError('Ingresa o pega un texto sin formato para estructurarlo.');
      return;
    }

    setSidebarFormatError(null);
    setIsFormattingAi(true);
    showNotification('Formateando texto con Gemini 1.5 Flash... ✨');

    try {
      const res = await fetch('/api/ai/format', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rawText: textToProcess }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Error al formatear con IA.');
      }

      let sceneCount = 1;
      const formattedBlocks: ScriptBlock[] = (data.blocks || []).map((b: { type: ElementType; content: string }) => ({
        id: generateId(),
        type: b.type,
        content: b.content,
        sceneNumber: b.type === 'scene_heading' ? sceneCount++ : undefined,
      }));

      if (formattedBlocks.length === 0) {
        throw new Error('No se generaron bloques estructurados.');
      }

      if (sidebarApplyMode === 'replace') {
        const newHtml = blocksToHtml(formattedBlocks);
        if (editorRef.current) {
          editorRef.current.innerHTML = newHtml;
        }
        syncToParent(formattedBlocks);
        pushHistory(blocksToFountain(formattedBlocks));
        showNotification('¡Guion reemplazado con formato de IA! ✨');
      } else {
        const merged = [...project.blocks, ...formattedBlocks];
        const newHtml = blocksToHtml(merged);
        if (editorRef.current) {
          editorRef.current.innerHTML = newHtml;
        }
        syncToParent(merged);
        pushHistory(blocksToFountain(merged));
        showNotification('¡Bloques de IA insertados al final! ✨');
      }

      // Clear error on success
      setSidebarFormatError(null);
    } catch (err: any) {
      console.error('Sidebar AI format error:', err);
      setSidebarFormatError(err.message || 'Error al procesar con IA.');
      showNotification(err.message || 'Error al formatear con IA.');
    } finally {
      setIsFormattingAi(false);
    }
  };

  // Standard paste text from clipboard
  const handlePasteText = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (!text) return;
      if (!editorRef.current) return;
      editorRef.current.focus();
      document.execCommand('insertText', false, text);
      handleInput();
      showNotification('Texto pegado del portapapeles');
    } catch {
      showNotification('Usa Ctrl+V para pegar en el editor');
    }
  };

  const handleApplyFormattedBlocksFromModal = (newBlocks: ScriptBlock[], mode: 'replace' | 'append') => {
    if (mode === 'replace') {
      const newHtml = blocksToHtml(newBlocks);
      if (editorRef.current) {
        editorRef.current.innerHTML = newHtml;
      }
      syncToParent(newBlocks);
      pushHistory(blocksToFountain(newBlocks));
      showNotification('¡Guion reemplazado con formato de IA! ✨');
    } else {
      const merged = [...project.blocks, ...newBlocks];
      const newHtml = blocksToHtml(merged);
      if (editorRef.current) {
        editorRef.current.innerHTML = newHtml;
      }
      syncToParent(merged);
      pushHistory(blocksToFountain(merged));
      showNotification('¡Bloques de IA insertados al final! ✨');
    }
  };

  // Helper to place cursor inside an element accurately without causing layout jumps or corrupted offsets
  const setCaretInElement = useCallback((el: HTMLElement, atEnd: boolean = true, specificOffset?: number) => {
    if (!el || !editorRef.current) return;
    if (!el.isConnected) return;

    editorRef.current.focus();
    el.focus?.();

    const selection = window.getSelection();
    if (!selection) return;

    // If element is empty, ensure it has a clean <br> so the caret can rest inside it
    if (!el.hasChildNodes() || (el.childNodes.length === 1 && el.firstChild?.nodeType === Node.TEXT_NODE && el.firstChild.textContent === '')) {
      el.innerHTML = '<br>';
    }

    const range = document.createRange();

    // Check for text nodes
    const textNodes: Text[] = [];
    let brNode: HTMLBRElement | null = null;

    for (let i = 0; i < el.childNodes.length; i++) {
      const child = el.childNodes[i];
      if (child.nodeType === Node.TEXT_NODE && child.textContent && child.textContent.length > 0) {
        textNodes.push(child as Text);
      } else if (child.nodeName === 'BR') {
        brNode = child as HTMLBRElement;
      }
    }

    if (textNodes.length > 0) {
      if (specificOffset !== undefined) {
        const targetText = textNodes[0];
        const safeOffset = Math.min(Math.max(0, specificOffset), targetText.textContent?.length || 0);
        range.setStart(targetText, safeOffset);
        range.collapse(true);
      } else {
        const targetText = atEnd ? textNodes[textNodes.length - 1] : textNodes[0];
        const offset = atEnd ? (targetText.textContent?.length || 0) : 0;
        range.setStart(targetText, offset);
        range.collapse(true);
      }
    } else if (brNode) {
      range.setStartBefore(brNode);
      range.collapse(true);
    } else {
      range.selectNodeContents(el);
      range.collapse(!atEnd);
    }

    selection.removeAllRanges();
    selection.addRange(range);
  }, []);

  // Helper: Find current active paragraph from cursor selection, creating one if missing
  const getActiveParagraph = useCallback((): HTMLElement | null => {
    if (!editorRef.current) return null;

    // 1. Ensure at least one .screenplay-page container exists
    let firstPage = editorRef.current.querySelector('.screenplay-page, [data-page-container="true"]') as HTMLElement | null;
    if (!firstPage) {
      firstPage = document.createElement('div');
      const pageThemeClass = isDarkMode
        ? 'dark-sheet bg-[#222228] text-white border-[#33333c]'
        : 'light-sheet bg-white text-[#111111] border-[#D9D9D6]';
      firstPage.className = `screenplay-page relative select-text shadow-2xl transition-colors border ${pageThemeClass}`;
      firstPage.setAttribute('data-page-container', 'true');
      firstPage.setAttribute('data-page-number', '1');
      firstPage.innerHTML = '<div class="screenplay-page-header select-none pointer-events-none" contenteditable="false"></div>';
      editorRef.current.appendChild(firstPage);
    }

    const selection = window.getSelection();

    const createCleanP = (container: HTMLElement, insertBeforeNode: Node | null = null): HTMLElement => {
      const p = document.createElement('p');
      p.className = 'script-action text-[#1A1A1A] script-line min-h-[1.5em] my-0 leading-[1.5] transition-all relative outline-none';
      p.setAttribute('data-type', 'action');
      p.setAttribute('data-placeholder', ELEMENT_PLACEHOLDERS.action);
      p.setAttribute('data-empty', 'true');
      p.innerHTML = '<br>';
      if (insertBeforeNode) {
        container.insertBefore(p, insertBeforeNode);
      } else {
        container.appendChild(p);
      }
      return p;
    };

    if (!selection || !selection.anchorNode) {
      const existing = editorRef.current.querySelector('p[data-type], p') as HTMLElement | null;
      if (existing) return existing;
      const newP = createCleanP(firstPage);
      return newP;
    }

    let node: Node | null = selection.anchorNode;

    // If selection is directly on a Text node, check its parent
    if (node.nodeType === Node.TEXT_NODE) {
      const parent = node.parentElement;
      if (parent) {
        let pCandidate: HTMLElement | null = parent;
        while (pCandidate && pCandidate !== editorRef.current) {
          if (pCandidate.tagName === 'P') return pCandidate;
          pCandidate = pCandidate.parentElement;
        }

        // If parent is a page container or editorRef itself, wrap orphan text node into a real <p>!
        if (parent.classList.contains('screenplay-page') || parent.hasAttribute('data-page-container') || parent === editorRef.current) {
          const wrapperP = document.createElement('p');
          wrapperP.className = 'script-action text-[#1A1A1A] script-line min-h-[1.5em] my-0 leading-[1.5] transition-all relative outline-none';
          wrapperP.setAttribute('data-type', 'action');
          wrapperP.setAttribute('data-placeholder', ELEMENT_PLACEHOLDERS.action);
          parent.insertBefore(wrapperP, node);
          wrapperP.appendChild(node);
          return wrapperP;
        }
      }
    }

    // If selection is an element
    if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node as HTMLElement;
      if (el.tagName === 'P') return el;

      // If selection is inside a P (e.g. span, strong, etc.)
      const closestP = el.closest('p');
      if (closestP && editorRef.current.contains(closestP)) return closestP;

      // If selection is a DIV inserted by the browser inside a page container
      if (el.tagName === 'DIV' && !el.classList.contains('screenplay-page') && !el.classList.contains('screenplay-page-header') && el !== editorRef.current) {
        const wrapperP = document.createElement('p');
        wrapperP.className = 'script-action text-[#1A1A1A] script-line min-h-[1.5em] my-0 leading-[1.5] transition-all relative outline-none';
        wrapperP.setAttribute('data-type', 'action');
        wrapperP.setAttribute('data-placeholder', ELEMENT_PLACEHOLDERS.action);
        wrapperP.innerHTML = el.innerHTML || '<br>';
        el.parentElement?.insertBefore(wrapperP, el);
        el.remove();
        return wrapperP;
      }

      // If selection is on a page container (div.screenplay-page) or editorRef
      const page = (el.classList.contains('screenplay-page') || el.hasAttribute('data-page-container'))
        ? el
        : el.closest('.screenplay-page, [data-page-container="true"]') as HTMLElement | null || firstPage;

      if (page) {
        // Try to find the child at or near selection.anchorOffset
        const childNodes = Array.from(page.childNodes);
        const offset = Math.min(Math.max(0, selection.anchorOffset), childNodes.length);

        for (let i = offset; i < childNodes.length; i++) {
          if (childNodes[i].nodeType === Node.ELEMENT_NODE && (childNodes[i] as HTMLElement).tagName === 'P') {
            return childNodes[i] as HTMLElement;
          }
        }
        for (let i = offset - 1; i >= 0; i--) {
          if (childNodes[i].nodeType === Node.ELEMENT_NODE && (childNodes[i] as HTMLElement).tagName === 'P') {
            return childNodes[i] as HTMLElement;
          }
        }

        // If the page has no paragraphs at all (e.g. user cleared the page), spawn a clean paragraph!
        const newP = createCleanP(page);
        return newP;
      }
    }

    // Traverse upwards as general fallback
    let targetP = node as HTMLElement | null;
    while (targetP && targetP !== editorRef.current) {
      if (targetP.tagName === 'P') {
        return targetP;
      }
      targetP = targetP.parentElement;
    }

    // Fallback: check if any paragraph exists in editorRef
    const firstP = editorRef.current.querySelector('p[data-type], p') as HTMLElement | null;
    if (firstP) return firstP;

    // Ultimate fallback: create one in firstPage
    const fallbackP = createCleanP(firstPage);
    return fallbackP;
  }, [isDarkMode]);

  // Helper to get precise caret screen coordinates for Celtx-style popovers
  const getCaretCoordinates = useCallback((activeElement: HTMLElement): { top: number; left: number } => {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const rects = range.getClientRects();
      if (rects.length > 0) {
        const r = rects[rects.length - 1];
        if (r.bottom > 0 && r.left > 0) {
          return {
            top: r.bottom + 4,
            left: Math.max(16, r.left),
          };
        }
      }
      const bound = range.getBoundingClientRect();
      if (bound.bottom > 0 && bound.left > 0) {
        return {
          top: bound.bottom + 4,
          left: Math.max(16, bound.left),
        };
      }
    }
    const rect = activeElement.getBoundingClientRect();
    return {
      top: rect.bottom + 4,
      left: Math.max(16, rect.left),
    };
  }, []);

  // Update active element type state in the top bar and evaluate Celtx-style suggestions
  const updateActiveElementState = useCallback(() => {
    const selection = window.getSelection();
    if (selection && !selection.isCollapsed) {
      setSuggestionMenu(null);
      return;
    }

    const activeP = getActiveParagraph();
    if (activeP && activeP.tagName === 'P') {
      const t = (activeP.getAttribute('data-type') as ElementType) || 'action';
      setActiveElementType(t);

      if (!editorRef.current) {
        setSuggestionMenu(null);
        return;
      }

      const applySuggestionMenu = (
        type: 'scene_prefix' | 'scene_location' | 'scene_time' | 'character',
        headerTitle: string,
        items: EditorSuggestionItem[],
        coords: { top: number; left: number }
      ) => {
        setSuggestionMenu((prev) => {
          const isSameType = prev && prev.type === type;
          const isSameItems = prev && prev.items.length === items.length &&
            prev.items.every((it, idx) => it.id === items[idx].id);
          const selectedIndex = isSameType && isSameItems
            ? Math.min(prev.selectedIndex, Math.max(0, items.length - 1))
            : 0;
          return {
            type,
            headerTitle,
            items,
            selectedIndex,
            coords,
          };
        });
      };

      const fullText = activeP.textContent || '';
      const rawText = fullText.trim();
      const upper = fullText.toUpperCase();
      const rawUpper = rawText.toUpperCase();

      // Check whether scene heading already has a completed prefix with a following space (e.g. 'INT. ', 'EXT. ')
      const hasPrefixWithSpace = /^[-–—]?\s*(INT\.|EXT\.|INT\/EXT\.|I\/E\.)\s+/i.test(fullText);

      // 1. SCENE HEADING AUTOCOMPLETION (Prefixes, Locations, and Time of Day)
      if (t === 'scene_heading') {
        // CASE A: User has not typed a prefix or is typing prefix without a trailing space
        const isPrefixTyping = !hasPrefixWithSpace && !fullText.includes(' ') && (
          rawText === '' ||
          isPlaceholderText(rawText) ||
          /^[-–—]?\s*(I|IN|INT|INT\.|E|EX|EXT|EXT\.|I\/|I\/E|I\/E\.|INT\/|INT\/E|INT\/EXT|INT\/EXT\.)$/i.test(rawUpper)
        );

        if (isPrefixTyping) {
          const prefixes = ['INT.', 'EXT.', 'INT/EXT.', 'I/E.'];
          const cleanPrefixInput = rawUpper.replace(/^[-–—]\s*/, '').replace(/\.$/, '');
          const filteredPrefixes = prefixes.filter((p) => {
            if (!cleanPrefixInput || cleanPrefixInput === 'INT./EXT. LUGAR - TIEMPO') return true;
            return p.startsWith(cleanPrefixInput) || p.replace(/\.$/, '').startsWith(cleanPrefixInput);
          });

          if (filteredPrefixes.length > 0) {
            const coords = getCaretCoordinates(activeP);
            applySuggestionMenu(
              'scene_prefix',
              'INT./EXT.  LUGAR - TIEMPO',
              filteredPrefixes.map((p) => ({ id: p, label: p })),
              coords
            );
            return;
          }
        }

        // CASE B: User has typed prefix (e.g. 'INT. ', 'EXT. ') and is typing LOCATION
        const prefixMatch = fullText.match(/^[-–—]?\s*(INT\.|EXT\.|INT\/EXT\.|I\/E\.|\.INT|\.EXT|\.I\/E|[0-9]+\.\s*(INT|EXT)|INT\s|EXT\s)\s*/i);
        if (prefixMatch) {
          const prefixStr = prefixMatch[0];
          const afterPrefix = fullText.substring(prefixStr.length);

          // Check if user has NOT reached the time separator (' - ')
          if (!afterPrefix.includes(' - ') && !afterPrefix.includes(' – ') && !afterPrefix.endsWith(' -') && !afterPrefix.endsWith(' –')) {
            const locationQuery = afterPrefix.trim();

            // Collect known locations from project and DOM
            const projectLocs = (project.locations || []).map((l) => cleanLocationName(l.name)).filter(isValidLocationName);
            const domHeadingNodes = editorRef.current.querySelectorAll('p[data-type="scene_heading"]');
            const domLocs: string[] = [];
            domHeadingNodes.forEach((node) => {
              const txt = (node.textContent || '').trim().toUpperCase();
              if (txt && !isPlaceholderText(txt) && txt !== upper) {
                // Must be a complete scene heading with separator (' - ')
                const isComplete = txt.includes(' - ') || txt.includes(' – ') || txt.includes(' — ');
                if (isComplete) {
                  const locName = cleanLocationName(txt);
                  if (locName && isValidLocationName(locName)) domLocs.push(locName);
                }
              }
            });

            // Clean, prune and deduplicate all known locations against active project blocks
            const uniqueLocNames = Array.from(new Set([...projectLocs, ...domLocs])).filter(isValidLocationName);
            const mockLocItems = uniqueLocNames.map((name) => {
              const existing = (project.locations || []).find((l) => cleanLocationName(l.name) === name);
              return existing || {
                id: name,
                name,
                type: 'INT' as const,
                timeOfDay: 'DÍA' as const,
                description: '',
                realFilmingPlace: '',
                propsNeeded: [],
              };
            });
            const prunedLocs = pruneIncompleteLocationNames(mockLocItems, project.blocks || []).map((l) => l.name);

            let matchingLocs: string[] = [];
            const query = locationQuery.toLowerCase();

            if (!query) {
              // When user just entered the location space (e.g. 'INT. '), show existing registered locations
              matchingLocs = prunedLocs.slice(0, 6);
            } else {
              // 1. Prioritize direct prefix matches (e.g. 'GARDEN' when typing 'G')
              const prefixMatches = prunedLocs.filter(
                (loc) => loc.toLowerCase().startsWith(query) && loc.toLowerCase() !== query
              );

              // 2. Word-boundary matches (any word in the location starts with query, e.g. 'OFICINA DE INVESTIGACIÓN' matches 'I')
              const wordMatches = prunedLocs.filter((loc) => {
                if (loc.toLowerCase().startsWith(query) || loc.toLowerCase() === query) return false;
                const words = loc.toLowerCase().split(/[\s/.'"-]+/);
                return words.some((w) => w.startsWith(query));
              });

              matchingLocs = [...prefixMatches, ...wordMatches].slice(0, 6);
            }

            if (matchingLocs.length > 0) {
              const coords = getCaretCoordinates(activeP);
              applySuggestionMenu(
                'scene_location',
                'LUGAR',
                matchingLocs.map((loc) => ({ id: loc, label: loc })),
                coords
              );
              return;
            }
          } else {
            // CASE C: User is typing after ' - ' -> TIME OF DAY
            const parts = upper.split(/\s*[-–—]\s*/);
            const timeQuery = (parts[parts.length - 1] || '').trim();

            const standardTimes = ['DÍA', 'NOCHE', 'TARDE', 'AMANECER', 'ATARDECER', 'CONTINUO', 'MOMENTO DESPUÉS', 'DAY', 'NIGHT'];

            // If time of day is already completely specified, close menu
            if (standardTimes.includes(timeQuery)) {
              setSuggestionMenu(null);
              return;
            }

            const matchingTimes = standardTimes.filter(
              (tm) => (tm.startsWith(timeQuery) || tm.split(/\s+/).some((w) => w.startsWith(timeQuery))) && tm !== timeQuery
            );

            if (matchingTimes.length > 0) {
              const coords = getCaretCoordinates(activeP);
              applySuggestionMenu(
                'scene_time',
                'TIEMPO',
                matchingTimes.slice(0, 5).map((tm) => ({ id: tm, label: tm })),
                coords
              );
              return;
            }
          }
        }
      }

      // 2. CHARACTER AUTOCOMPLETION
      if (t === 'character') {
        const isSceneOrStructural = /^(INT|EXT|INT\/EXT|I\/E|PLANO|TOMA|ANGULO|P\.O\.V\.|CAMARA|CORTE|FUNDIDO|DISOLVENCIA|FADE|CUT|ACTO|ACT)\b/i.test(rawText);
        if (rawText && !isPlaceholderText(rawText) && !isSceneOrStructural && rawText.length >= 1) {
          // Collect characters that CURRENTLY exist in other lines/pages of this script
          const domCharNodes = editorRef.current.querySelectorAll('p[data-type="character"]');
          const currentScriptChars: string[] = [];

          domCharNodes.forEach((node) => {
            if (node === activeP) return;
            const txt = (node.textContent || '').replace(/\s*\(.*?\)\s*/g, '').trim().toUpperCase();
            if (txt && !isPlaceholderText(txt) && isValidCharacterName(txt) && txt !== rawText.toUpperCase() && !currentScriptChars.includes(txt)) {
              currentScriptChars.push(txt);
            }
          });

          // Also check blocks in project that currently exist in the script
          (project.blocks || []).forEach((b) => {
            if (b.type === 'character') {
              const txt = b.content.replace(/\s*\(.*?\)\s*/g, '').trim().toUpperCase();
              if (txt && !isPlaceholderText(txt) && isValidCharacterName(txt) && txt !== rawText.toUpperCase() && !currentScriptChars.includes(txt)) {
                currentScriptChars.push(txt);
              }
            }
          });

          // CRITICAL: ONLY suggest characters that CURRENTLY exist in the script.
          // Characters written earlier and then deleted must NEVER be suggested.
          const cleanCharacters = pruneIncompleteCharacterNames(
            currentScriptChars.map((name) => ({
              id: name,
              name,
              role: 'supporting' as const,
            }))
          ).map((c) => c.name);
          const charQuery = rawText.toLowerCase();

          // Prioritize prefix match, then word-start match; do not match arbitrary middle characters
          const prefixMatches = cleanCharacters.filter(
            (name) => name.toLowerCase().startsWith(charQuery) && name.toLowerCase() !== charQuery
          );
          const wordMatches = cleanCharacters.filter((name) => {
            if (name.toLowerCase().startsWith(charQuery) || name.toLowerCase() === charQuery) return false;
            const words = name.toLowerCase().split(/[\s.'"-]+/);
            return words.some((w) => w.startsWith(charQuery));
          });

          const matching = [...prefixMatches, ...wordMatches].slice(0, 6);

          if (matching.length > 0) {
            const coords = getCaretCoordinates(activeP);
            applySuggestionMenu(
              'character',
              'PERSONAJES',
              matching.map((name) => ({ id: name, label: name })),
              coords
            );
            return;
          }
        }
      }

      setSuggestionMenu(null);
    } else {
      setSuggestionMenu(null);
    }
  }, [project.characters, project.locations, getCaretCoordinates, getActiveParagraph]);

  // Dynamically update paragraph classes and placeholder empty state without resetting caret
  const refreshLineFormatting = () => {
    if (!editorRef.current) return;
    const paragraphs = editorRef.current.querySelectorAll('p');
    let prevType: ElementType | null = null;

    paragraphs.forEach((p) => {
      // Strictly ignore non-P elements, headers, or break elements
      if (p.tagName !== 'P') return;

      const text = (p.textContent || '').trim();
      const explicitType = p.getAttribute('data-type') as ElementType | null;
      const isEmpty = isBlockContentEmpty(text);
      
      if (isEmpty) {
        p.setAttribute('data-empty', 'true');
        const fallbackType = explicitType || 'action';
        p.setAttribute('data-placeholder', ELEMENT_PLACEHOLDERS[fallbackType]);
        return;
      } else {
        p.removeAttribute('data-empty');
      }

      if (!text) {
        p.className = 'script-action text-[#1A1A1A] my-1';
        p.setAttribute('data-type', 'action');
        p.setAttribute('data-placeholder', ELEMENT_PLACEHOLDERS.action);
        prevType = null;
        return;
      }

      // Check Act Heading (Centered Bold Uppercase)
      const actRegex = /^(ACTO\s+[0-9IVXLCDM]+|ACT\s+[0-9IVXLCDM]+|ACT\s+ONE|ACT\s+TWO|ACT\s+THREE|ACTO\s+PRIMERO|ACTO\s+SEGUNDO|ACTO\s+TERCERO)$/i;
      if (actRegex.test(text) || (text.startsWith('#') && !text.startsWith('##'))) {
        p.className = 'script-act font-bold uppercase text-black text-center';
        p.setAttribute('data-type', 'act');
        p.setAttribute('data-placeholder', ELEMENT_PLACEHOLDERS.act);
        prevType = 'act';
        return;
      }

      // Check Scene Heading (Bold Uppercase) - handles complete or typing prefixes (INT., EXT., INT, EXT, -INT., etc.)
      const isSceneHeading = /^[-–—]?\s*(INT\.|EXT\.|INT\/EXT\.|I\/E\.|\.INT|\.EXT|\.I\/E|[0-9]+\.\s*(INT|EXT)|INT\s|EXT\s|INT\/EXT\s|I\/E\s|INT$|EXT$|INT\/EXT$|I\/E$)/i.test(text);
      if (isSceneHeading) {
        if (/^[-–—]\s*/.test(text)) {
          const cleanedText = text.replace(/^[-–—]\s*/, '');
          p.textContent = cleanedText;
        }
        p.className = 'script-scene-heading font-bold uppercase text-black';
        p.setAttribute('data-type', 'scene_heading');
        p.setAttribute('data-placeholder', ELEMENT_PLACEHOLDERS.scene_heading);
        prevType = 'scene_heading';
        return;
      }

      // Check Transition (Bold Uppercase Right)
      if (/(CORTE A:|FUNDIDO A NEGRO:|FUNDIDO A BLANCO:|DISOLVENCIA A:|FADE IN:|FADE OUT:|CUT TO:)$/i.test(text) || text.startsWith('>')) {
        p.className = 'script-transition font-bold uppercase text-black text-right';
        p.setAttribute('data-type', 'transition');
        p.setAttribute('data-placeholder', ELEMENT_PLACEHOLDERS.transition);
        prevType = 'transition';
        return;
      }

      // Check Shot / Camera
      if (/^(PLANO|TOMA|ANGULO|P\.O\.V\.|CAMARA)/i.test(text)) {
        p.className = 'script-shot font-bold uppercase text-black';
        p.setAttribute('data-type', 'shot');
        p.setAttribute('data-placeholder', ELEMENT_PLACEHOLDERS.shot);
        prevType = 'shot';
        return;
      }

      // Check Parenthetical (Italic)
      if (text.startsWith('(') && text.endsWith(')')) {
        p.className = 'script-parenthetical italic text-[#333333]';
        p.setAttribute('data-type', 'parenthetical');
        p.setAttribute('data-placeholder', ELEMENT_PLACEHOLDERS.parenthetical);
        prevType = 'parenthetical';
        return;
      }

      // Check Character (Bold Uppercase Centered/Indented) - must be a valid character name and not a scene/structural keyword
      const isSceneOrStructural = /^(INT|EXT|INT\/EXT|I\/E|PLANO|TOMA|ANGULO|P\.O\.V\.|CAMARA|CORTE|FUNDIDO|DISOLVENCIA|FADE|CUT|ACTO|ACT)\b/i.test(text);
      const isUpper = text === text.toUpperCase() && /[A-ZÁÉÍÓÚÑ]/.test(text) && text.length < 35 && !text.endsWith('.');
      if (!isSceneOrStructural && isUpper && prevType !== 'character' && !text.includes(' - ') && isValidCharacterName(text)) {
        p.className = 'script-character font-bold uppercase text-black';
        p.setAttribute('data-type', 'character');
        p.setAttribute('data-placeholder', ELEMENT_PLACEHOLDERS.character);
        prevType = 'character';
        return;
      }

      // Check Dialogue
      if (prevType === 'character' || prevType === 'parenthetical') {
        p.className = 'script-dialogue text-[#111111]';
        p.setAttribute('data-type', 'dialogue');
        p.setAttribute('data-placeholder', ELEMENT_PLACEHOLDERS.dialogue);
        prevType = 'dialogue';
        return;
      }

      // Preserve explicit type if matched
      if (explicitType && explicitType !== 'action') {
        p.setAttribute('data-placeholder', ELEMENT_PLACEHOLDERS[explicitType]);
        switch (explicitType) {
          case 'act':
            p.className = 'script-act font-bold uppercase text-black text-center';
            prevType = 'act';
            return;
          case 'scene_heading':
            p.className = 'script-scene-heading font-bold uppercase text-black';
            prevType = 'scene_heading';
            return;
          case 'character':
            p.className = 'script-character font-bold uppercase text-black';
            prevType = 'character';
            return;
          case 'dialogue':
            p.className = 'script-dialogue text-[#111111]';
            prevType = 'dialogue';
            return;
          case 'parenthetical':
            p.className = 'script-parenthetical italic text-[#333333]';
            prevType = 'parenthetical';
            return;
          case 'transition':
            p.className = 'script-transition font-bold uppercase text-black text-right';
            prevType = 'transition';
            return;
          case 'shot':
            p.className = 'script-shot font-bold uppercase text-black';
            prevType = 'shot';
            return;
          case 'text':
            p.className = 'script-text text-[#1A1A1A]';
            prevType = 'text';
            return;
        }
      }

      // Default to Action
      p.className = 'script-action text-[#1A1A1A]';
      p.setAttribute('data-type', 'action');
      p.setAttribute('data-placeholder', ELEMENT_PLACEHOLDERS.action);
      prevType = 'action';
    });
  };

    // Helper to dynamically calculate line count for a paragraph
    const getParagraphEstimatedLines = (p: HTMLElement): number => {
      const text = (p.textContent || '').trim();
      const type = (p.getAttribute('data-type') as ElementType) || 'action';
      if (!text || text === '<br>' || isPlaceholderText(text)) {
        return 1.2;
      }
      switch (type) {
        case 'act':
        case 'scene_heading':
          return 2.5;
        case 'character':
          return 2.0;
        case 'dialogue':
          return Math.max(1, Math.ceil(text.length / 35)) + 0.8;
        case 'parenthetical':
          return 1.2;
        case 'transition':
        case 'shot':
          return 2.0;
        case 'action':
        default:
          return Math.max(1, Math.ceil(text.length / 60)) + 0.8;
      }
    };

    // Calculate vertical capacity, distribute overflowing elements, and prune trailing empty pages
    const checkAndDistributeOverflow = useCallback((): boolean => {
      if (!editorRef.current) return false;
      let pageNodes = Array.from(editorRef.current.querySelectorAll('.screenplay-page, [data-page-container="true"]')) as HTMLElement[];
      if (pageNodes.length === 0) return false;

      const MAX_LINES_PER_PAGE = 48; // Standard Hollywood printable capacity (1056px - 192px margins)
      let hasChanges = false;

      for (let pageIdx = 0; pageIdx < pageNodes.length; pageIdx++) {
        const pageElem = pageNodes[pageIdx];
        const paragraphs = Array.from(pageElem.querySelectorAll('p[data-type], p')) as HTMLElement[];
        if (paragraphs.length === 0) continue;

        let accumulatedLines = 0;
        const overflowingParagraphs: HTMLElement[] = [];

        for (let i = 0; i < paragraphs.length; i++) {
          const p = paragraphs[i];
          const pLines = getParagraphEstimatedLines(p);
          const pType = (p.getAttribute('data-type') as ElementType) || 'action';
          const buffer = (pType === 'scene_heading') ? 2.5 : (pType === 'character') ? 1.5 : 0;

          // Check both accumulated lines and physical offset in container
          const exceedsLines = (accumulatedLines + pLines + buffer > MAX_LINES_PER_PAGE);
          const exceedsPhysical = (p.offsetTop + p.offsetHeight > 910);

          // If adding this paragraph exceeds printable area and is not the very first line of page
          if ((exceedsLines || exceedsPhysical) && i > 0) {
            for (let j = i; j < paragraphs.length; j++) {
              overflowingParagraphs.push(paragraphs[j]);
            }
            break;
          }
          accumulatedLines += pLines;
        }

        if (overflowingParagraphs.length > 0) {
          hasChanges = true;
          let nextPageIndex = pageIdx + 1;
          let nextPageElem = pageNodes[nextPageIndex];

          // If next page does not exist, instantiate Page N+1
          if (!nextPageElem) {
            const nextNum = pageIdx + 2;
            nextPageElem = document.createElement('div');
            const pageThemeClass = isDarkMode
              ? 'dark-sheet bg-[#222228] text-white border-[#33333c]'
              : 'light-sheet bg-white text-[#111111] border-[#D9D9D6]';
            nextPageElem.className = `screenplay-page relative select-text shadow-2xl transition-colors border ${pageThemeClass}`;
            nextPageElem.setAttribute('data-page-container', 'true');
            nextPageElem.setAttribute('data-page-number', String(nextNum));
            nextPageElem.innerHTML = `
              <div class="screenplay-page-header select-none pointer-events-none" contenteditable="false">
                <span class="font-mono text-[12pt] font-bold ${isDarkMode ? 'text-white' : 'text-[#111111]'}">${nextNum}.</span>
              </div>
            `;
            editorRef.current.appendChild(nextPageElem);
            pageNodes.push(nextPageElem);
          }

          // Move overflowing elements to the beginning of next page
          const firstExistingP = nextPageElem.querySelector('p[data-type], p');
          overflowingParagraphs.forEach((p) => {
            if (firstExistingP) {
              nextPageElem.insertBefore(p, firstExistingP);
            } else {
              nextPageElem.appendChild(p);
            }
          });
        }
      }

      // Cleanup: Prune trailing orphan page containers with no paragraphs (never remove page 1)
      pageNodes = Array.from(editorRef.current.querySelectorAll('.screenplay-page, [data-page-container="true"]')) as HTMLElement[];
      for (let i = pageNodes.length - 1; i > 0; i--) {
        const pageElem = pageNodes[i];
        const paragraphs = Array.from(pageElem.querySelectorAll('p[data-type], p')) as HTMLElement[];
        if (paragraphs.length === 0) {
          pageElem.remove();
          hasChanges = true;
        } else {
          break; // Stop pruning once a page with paragraphs is encountered
        }
      }

      // Re-index all headers sequentially
      const finalPages = Array.from(editorRef.current.querySelectorAll('.screenplay-page, [data-page-container="true"]')) as HTMLElement[];
      finalPages.forEach((pageElem, idx) => {
        const pageNum = idx + 1;
        pageElem.setAttribute('data-page-number', String(pageNum));
        let header = pageElem.querySelector('.screenplay-page-header') as HTMLElement | null;
        if (!header) {
          header = document.createElement('div');
          header.className = 'screenplay-page-header select-none pointer-events-none';
          header.setAttribute('contenteditable', 'false');
          pageElem.insertBefore(header, pageElem.firstChild);
        }
        if (pageNum > 1) {
          header.innerHTML = `<span class="font-mono text-[12pt] font-bold ${isDarkMode ? 'text-white' : 'text-[#111111]'}">${pageNum}.</span>`;
        } else {
          header.innerHTML = '';
        }
      });

      return hasChanges;
    }, [isDarkMode]);

    // Input change handler
    const handleInput = () => {
      if (!editorRef.current) return;

      // Safeguard: Ensure at least one .screenplay-page container exists
      let firstPage = editorRef.current.querySelector('.screenplay-page, [data-page-container="true"]') as HTMLElement | null;
      if (!firstPage) {
        firstPage = document.createElement('div');
        const pageThemeClass = isDarkMode
          ? 'dark-sheet bg-[#222228] text-white border-[#33333c]'
          : 'light-sheet bg-white text-[#111111] border-[#D9D9D6]';
        firstPage.className = `screenplay-page relative select-text shadow-2xl transition-colors border ${pageThemeClass}`;
        firstPage.setAttribute('data-page-container', 'true');
        firstPage.setAttribute('data-page-number', '1');
        firstPage.innerHTML = '<div class="screenplay-page-header select-none pointer-events-none" contenteditable="false"></div>';
        editorRef.current.appendChild(firstPage);
      }

      // If any stray direct children of editorRef are <p> tags, adopt them into firstPage
      const strayParagraphs = (Array.from(editorRef.current.children) as HTMLElement[]).filter(
        (el) => el.tagName === 'P'
      );
      if (strayParagraphs.length > 0) {
        strayParagraphs.forEach((p) => {
          firstPage!.appendChild(p);
        });
      }

      // Normalize any stray child nodes in each page (wrap stray text nodes or non-P elements into proper <p>)
      const allPages = Array.from(editorRef.current.querySelectorAll('.screenplay-page, [data-page-container="true"]')) as HTMLElement[];
      allPages.forEach((page) => {
        Array.from(page.childNodes).forEach((child) => {
          if (child.nodeType === Node.TEXT_NODE) {
            const textContent = child.textContent || '';
            if (textContent.trim().length > 0) {
              const p = document.createElement('p');
              p.className = 'script-action text-[#1A1A1A] script-line min-h-[1.5em] my-0 leading-[1.5] transition-all relative outline-none';
              p.setAttribute('data-type', 'action');
              p.setAttribute('data-placeholder', ELEMENT_PLACEHOLDERS.action);
              p.textContent = textContent;
              page.insertBefore(p, child);
              child.remove();
            } else {
              child.remove();
            }
          } else if (child.nodeType === Node.ELEMENT_NODE) {
            const el = child as HTMLElement;
            if (el.tagName !== 'P' && !el.classList.contains('screenplay-page-header')) {
              const p = document.createElement('p');
              p.className = 'script-action text-[#1A1A1A] script-line min-h-[1.5em] my-0 leading-[1.5] transition-all relative outline-none';
              p.setAttribute('data-type', 'action');
              p.setAttribute('data-placeholder', ELEMENT_PLACEHOLDERS.action);
              p.innerHTML = el.innerHTML || '<br>';
              page.insertBefore(p, el);
              el.remove();
            }
          }
        });

        // Ensure page has at least one P block
        if (page.querySelectorAll('p[data-type], p').length === 0) {
          const cleanP = document.createElement('p');
          cleanP.className = 'script-action text-[#1A1A1A] script-line min-h-[1.5em] my-0 leading-[1.5] transition-all relative outline-none';
          cleanP.setAttribute('data-type', 'action');
          cleanP.setAttribute('data-placeholder', ELEMENT_PLACEHOLDERS.action);
          cleanP.setAttribute('data-empty', 'true');
          cleanP.innerHTML = '<br>';
          page.appendChild(cleanP);
        }
      });

      refreshLineFormatting();
      checkAndDistributeOverflow();
      updateActiveElementState();
      const rawText = getEditorRawText();
      const parsed = parseFountainToBlocks(rawText);
      syncToParent(parsed);
      pushHistory(rawText);
    };

  // Confirm and insert an autocomplete suggestion (Scene Heading Prefix, Location, Time of Day, or Character)
  const confirmSuggestion = useCallback((item: EditorSuggestionItem) => {
    if (!editorRef.current) return;
    const activeP = getActiveParagraph();
    if (!activeP) return;

    const currentMenuType = suggestionMenu?.type;

    if (currentMenuType === 'scene_prefix') {
      const cleanPrefix = item.label.replace(/\.?$/, '.');
      activeP.textContent = `${cleanPrefix} `;
      activeP.removeAttribute('data-empty');
      activeP.setAttribute('data-type', 'scene_heading');
      activeP.className = 'script-scene-heading font-bold uppercase text-black script-line min-h-[1.5em] my-0 leading-[1.5] transition-all relative outline-none';
      setCaretInElement(activeP, true);
      setSuggestionMenu(null);
      handleInput();
      setTimeout(() => {
        updateActiveElementState();
      }, 50);
      return;
    }

    if (currentMenuType === 'scene_location') {
      const full = activeP.textContent || '';
      const prefixMatch = full.match(/^[-–—]?\s*(INT\.|EXT\.|INT\/EXT\.|I\/E\.|\.INT|\.EXT|\.I\/E|[0-9]+\.\s*(INT|EXT)|INT\s|EXT\s)\s*/i);
      const prefix = prefixMatch ? (prefixMatch[0].endsWith(' ') ? prefixMatch[0] : `${prefixMatch[0]} `) : 'INT. ';
      activeP.textContent = `${prefix}${item.label.toUpperCase()} - `;
      activeP.removeAttribute('data-empty');
      setCaretInElement(activeP, true);
      setSuggestionMenu(null);
      handleInput();
      setTimeout(() => {
        updateActiveElementState();
      }, 50);
      return;
    }

    if (currentMenuType === 'scene_time') {
      const raw = (activeP.textContent || '').trim().toUpperCase();
      const parts = raw.split(/\s*[-–—]\s*/);
      const headingBase = parts.slice(0, Math.max(1, parts.length - 1)).join(' - ');
      activeP.textContent = `${headingBase} - ${item.label.toUpperCase()}`;
      activeP.removeAttribute('data-empty');
      setCaretInElement(activeP, true);
      setSuggestionMenu(null);
      handleInput();
      return;
    }

    if (currentMenuType === 'character' || activeP.getAttribute('data-type') === 'character') {
      activeP.textContent = item.label.toUpperCase();
      activeP.removeAttribute('data-empty');
      activeP.setAttribute('data-type', 'character');
      activeP.className = 'script-character font-bold uppercase text-black script-line min-h-[1.5em] my-0 leading-[1.5] transition-all relative outline-none';

      // Auto spawn dialogue line right below
      const parentPage = activeP.closest('.screenplay-page, [data-page-container="true"]') || activeP.parentElement || editorRef.current;
      const newP = document.createElement('p');
      newP.setAttribute('data-type', 'dialogue');
      newP.setAttribute('data-placeholder', ELEMENT_PLACEHOLDERS.dialogue);
      newP.setAttribute('data-empty', 'true');
      newP.className = 'script-dialogue text-[#111111] script-line min-h-[1.5em] my-0 leading-[1.5] transition-all relative outline-none';
      newP.innerHTML = '<br>';

      if (activeP.nextSibling && activeP.parentElement === parentPage) {
        parentPage.insertBefore(newP, activeP.nextSibling);
      } else if (activeP.parentElement) {
        activeP.parentElement.insertBefore(newP, activeP.nextSibling);
      } else {
        parentPage.appendChild(newP);
      }

      setCaretInElement(newP, true);
      setActiveElementType('dialogue');
      setSuggestionMenu(null);
      checkAndDistributeOverflow();
      handleInput();
      return;
    }
  }, [getActiveParagraph, suggestionMenu, setCaretInElement, handleInput, checkAndDistributeOverflow, updateActiveElementState]);

  // Helper to select contents (useful for characters & locations quick insertion)
  const selectElementContents = useCallback((el: HTMLElement) => {
    if (!el || !editorRef.current) return;
    editorRef.current.focus();
    const range = document.createRange();
    range.selectNodeContents(el);
    const selection = window.getSelection();
    if (selection) {
      selection.removeAllRanges();
      selection.addRange(range);
    }
  }, []);

  // Set element type of the current active paragraph with dynamic helper placeholder
  const applyElementTypeToCurrentParagraph = useCallback((targetType: ElementType, specificParagraph?: HTMLElement | null) => {
    if (!editorRef.current) return;
    editorRef.current.focus();

    let targetP = specificParagraph || getActiveParagraph();
    if (!targetP) return;

    const currentText = (targetP.textContent || '').trim();
    const isPlaceholderOrEmpty = isBlockContentEmpty(currentText);
    const baseLineClasses = 'script-line min-h-[1.5em] my-0 leading-[1.5] transition-all relative outline-none';
    let newClass = 'script-action text-[#1A1A1A]';

    // Strip parenthesis, scene heading prefixes, or trailing colons when converting between types
    let cleanText = currentText
      .replace(/^\(+/, '')
      .replace(/\)+$/, '')
      .replace(/^(INT\.|EXT\.|INT\/EXT\.|I\/E\.)\s*/i, '')
      .replace(/:\s*$/, '')
      .trim();

    if (isPlaceholderOrEmpty || cleanText === '' || cleanText === '()') {
      targetP.setAttribute('data-empty', 'true');
      targetP.innerHTML = '<br>';
      switch (targetType) {
        case 'act':
          newClass = 'script-act font-bold uppercase text-black text-center';
          break;
        case 'scene_heading':
          newClass = 'script-scene-heading font-bold uppercase text-black';
          break;
        case 'action':
          newClass = 'script-action text-[#1A1A1A]';
          break;
        case 'character':
          newClass = 'script-character font-bold uppercase text-black';
          break;
        case 'dialogue':
          newClass = 'script-dialogue text-[#111111]';
          break;
        case 'parenthetical':
          newClass = 'script-parenthetical italic text-[#333333]';
          break;
        case 'transition':
          newClass = 'script-transition font-bold uppercase text-black text-right';
          break;
        case 'shot':
          newClass = 'script-shot font-bold uppercase text-black';
          break;
        case 'text':
          newClass = 'script-text text-[#1A1A1A]';
          break;
        default:
          newClass = 'script-action text-[#1A1A1A]';
      }
    } else {
      targetP.removeAttribute('data-empty');
      switch (targetType) {
        case 'act': {
          newClass = 'script-act font-bold uppercase text-black text-center';
          targetP.textContent = cleanText.toUpperCase();
          break;
        }
        case 'scene_heading': {
          newClass = 'script-scene-heading font-bold uppercase text-black';
          if (!/^(INT\.|EXT\.|INT\/EXT\.|I\/E\.)/i.test(currentText)) {
            targetP.textContent = `INT. ${cleanText.toUpperCase()}`;
          } else {
            targetP.textContent = currentText.toUpperCase();
          }
          break;
        }
        case 'action': {
          newClass = 'script-action text-[#1A1A1A]';
          targetP.textContent = cleanText;
          break;
        }
        case 'character': {
          newClass = 'script-character font-bold uppercase text-black';
          targetP.textContent = cleanText.toUpperCase();
          break;
        }
        case 'dialogue': {
          newClass = 'script-dialogue text-[#111111]';
          targetP.textContent = cleanText;
          break;
        }
        case 'parenthetical': {
          newClass = 'script-parenthetical italic text-[#333333]';
          targetP.textContent = `(${cleanText})`;
          targetP.className = `${newClass} ${baseLineClasses}`;
          targetP.setAttribute('data-type', 'parenthetical');
          targetP.setAttribute('data-placeholder', ELEMENT_PLACEHOLDERS.parenthetical);
          setSuggestionMenu(null);
          setCaretInElement(targetP, false, 1 + cleanText.length);
          setActiveElementType('parenthetical');
          const def = SCREENPLAY_ELEMENTS.find((e) => e.type === 'parenthetical');
          if (def) {
            showNotification(`${def.number}. ${def.label}`, def.shortcut);
          }
          handleInput();
          return;
        }
        case 'transition': {
          newClass = 'script-transition font-bold uppercase text-black text-right';
          let text = cleanText.toUpperCase();
          if (!text.endsWith(':')) text = `${text}:`;
          targetP.textContent = text;
          break;
        }
        case 'shot': {
          newClass = 'script-shot font-bold uppercase text-black';
          if (!/^(PLANO|TOMA|P\.O\.V\.|ANGULO)/i.test(cleanText)) {
            targetP.textContent = `PLANO GENERAL - ${cleanText.toUpperCase()}`;
          } else {
            targetP.textContent = cleanText.toUpperCase();
          }
          break;
        }
        case 'text': {
          newClass = 'script-text text-[#1A1A1A]';
          targetP.textContent = cleanText;
          break;
        }
        default: {
          newClass = 'script-action text-[#1A1A1A]';
          targetP.textContent = cleanText;
        }
      }
    }

    targetP.className = `${newClass} ${baseLineClasses}`;
    targetP.setAttribute('data-type', targetType);
    targetP.setAttribute('data-placeholder', ELEMENT_PLACEHOLDERS[targetType]);

    // Clear suggestions when switching element type
    setSuggestionMenu(null);

    // Position cursor cleanly in the active block
    setCaretInElement(targetP, true);
    setActiveElementType(targetType);

    const def = SCREENPLAY_ELEMENTS.find((e) => e.type === targetType);
    if (def) {
      showNotification(`${def.number}. ${def.label}`, def.shortcut);
    }
    handleInput();
  }, [getActiveParagraph, handleInput, setCaretInElement, showNotification]);

  // Insert screenplay element at cursor (New paragraph) with dynamic placeholder
  const insertElement = (type: ElementType) => {
    if (!editorRef.current) return;
    editorRef.current.focus();

    // Check if current active paragraph is empty; if so, transform it directly without pushing down a line!
    const activeP = getActiveParagraph();
    if (activeP) {
      const text = (activeP.textContent || '').trim();
      const isEmpty = isBlockContentEmpty(text);
      if (isEmpty) {
        applyElementTypeToCurrentParagraph(type);
        return;
      }
    }

    const selection = window.getSelection();
    const def = SCREENPLAY_ELEMENTS.find((e) => e.type === type) || SCREENPLAY_ELEMENTS[1];
    let pClass = 'script-action text-[#1A1A1A]';

    switch (type) {
      case 'act':
        pClass = 'script-act font-bold uppercase text-black text-center';
        break;
      case 'scene_heading':
        pClass = 'script-scene-heading font-bold uppercase text-black';
        break;
      case 'character':
        pClass = 'script-character font-bold uppercase text-black';
        break;
      case 'parenthetical':
        pClass = 'script-parenthetical italic text-[#333333]';
        break;
      case 'dialogue':
        pClass = 'script-dialogue text-[#111111]';
        break;
      case 'transition':
        pClass = 'script-transition font-bold uppercase text-black text-right';
        break;
      case 'shot':
        pClass = 'script-shot font-bold uppercase text-black';
        break;
      case 'text':
        pClass = 'script-text text-[#1A1A1A]';
        break;
      case 'action':
      default:
        pClass = 'script-action text-[#1A1A1A]';
        break;
    }

    const p = document.createElement('p');
    p.className = pClass;
    p.setAttribute('data-type', type);
    p.setAttribute('data-placeholder', ELEMENT_PLACEHOLDERS[type]);
    if (type === 'parenthetical') {
      p.textContent = '()';
      p.removeAttribute('data-empty');
    } else {
      p.setAttribute('data-empty', 'true');
      p.innerHTML = '<br>';
    }

    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      range.collapse(false);
      range.insertNode(p);
    } else {
      const lastPage = editorRef.current.querySelector('.screenplay-page:last-child, [data-page-container="true"]:last-child') as HTMLElement | null;
      if (lastPage) {
        lastPage.appendChild(p);
      } else {
        editorRef.current.appendChild(p);
      }
    }

    if (type === 'parenthetical') {
      setCaretInElement(p, false, 1);
    } else {
      setCaretInElement(p);
    }
    setActiveElementType(type);
    showNotification(`${def.number}. ${def.label}`, def.shortcut);
    handleInput();
  };

  // Keyboard navigation & Screenplay Shortcuts (Ctrl+0..8 & clean Tab cycling)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    // 0. Celtx-Style Autocompletion Keyboard Trap & Navigation
    if (suggestionMenu && suggestionMenu.items.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSuggestionMenu((prev) => prev ? {
          ...prev,
          selectedIndex: (prev.selectedIndex + 1) % prev.items.length,
        } : null);
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSuggestionMenu((prev) => prev ? {
          ...prev,
          selectedIndex: (prev.selectedIndex - 1 + prev.items.length) % prev.items.length,
        } : null);
        return;
      }
      if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        confirmSuggestion(suggestionMenu.items[suggestionMenu.selectedIndex]);
        return;
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        setSuggestionMenu(null);
        return;
      }
    }

    // 1. SELECT ALL (Ctrl+A / Cmd+A): Select ONLY the text inside the screenplay paper
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'a') {
      e.preventDefault();
      if (editorRef.current) {
        const range = document.createRange();
        range.selectNodeContents(editorRef.current);
        const selection = window.getSelection();
        if (selection) {
          selection.removeAllRanges();
          selection.addRange(range);
        }
      }
      return;
    }

    // 2. Undo / Redo (Ctrl+Z / Ctrl+Y)
    if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
      e.preventDefault();
      handleUndo();
      return;
    }
    if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
      e.preventDefault();
      handleRedo();
      return;
    }

    // 2B. BACKSPACE / DELETE KEY: Revert empty element back to Action, remove empty line, or merge across pages cleanly
    if (e.key === 'Backspace' || e.key === 'Delete') {
      const selection = window.getSelection();
      if (selection && !selection.isCollapsed) {
        setSuggestionMenu(null);
        setTimeout(() => {
          if (editorRef.current) {
            let firstPage = editorRef.current.querySelector('.screenplay-page, [data-page-container="true"]') as HTMLElement | null;
            if (!firstPage) {
              firstPage = document.createElement('div');
              const pageThemeClass = isDarkMode
                ? 'dark-sheet bg-[#222228] text-white border-[#33333c]'
                : 'light-sheet bg-white text-[#111111] border-[#D9D9D6]';
              firstPage.className = `screenplay-page relative select-text shadow-2xl transition-colors border ${pageThemeClass}`;
              firstPage.setAttribute('data-page-container', 'true');
              firstPage.setAttribute('data-page-number', '1');
              firstPage.innerHTML = '<div class="screenplay-page-header select-none pointer-events-none" contenteditable="false"></div>';
              editorRef.current.appendChild(firstPage);
            }
            const allP = editorRef.current.querySelectorAll('p[data-type], p');
            if (allP.length === 0) {
              const cleanP = document.createElement('p');
              cleanP.className = 'script-action text-[#1A1A1A] script-line min-h-[1.5em] my-0 leading-[1.5] transition-all relative outline-none';
              cleanP.setAttribute('data-type', 'action');
              cleanP.setAttribute('data-placeholder', ELEMENT_PLACEHOLDERS.action);
              cleanP.setAttribute('data-empty', 'true');
              cleanP.innerHTML = '<br>';
              firstPage.appendChild(cleanP);
              setCaretInElement(cleanP);
            }
            handleInput();
          }
        }, 15);
        return;
      }

      const activeP = getActiveParagraph();
      if (activeP && editorRef.current) {
        const text = (activeP.textContent || '').trim();
        const currentType = (activeP.getAttribute('data-type') as ElementType) || 'action';
        const isEmpty = isBlockContentEmpty(text);

        // If parenthetical contains only '()' or just '(' or ')', revert cleanly to Action
        if (currentType === 'parenthetical' && (text === '()' || text === '(' || text === ')')) {
          e.preventDefault();
          activeP.innerHTML = '<br>';
          activeP.setAttribute('data-empty', 'true');
          applyElementTypeToCurrentParagraph('action', activeP);
          return;
        }

        // If at the beginning of Page K (where K > 1) on an empty line
        const activePage = activeP.closest('.screenplay-page, [data-page-container="true"]') as HTMLElement | null;
        const pageParagraphs = activePage ? Array.from(activePage.querySelectorAll('p[data-type], p')) : [];
        const isFirstInPage = pageParagraphs.length > 0 && pageParagraphs[0] === activeP;

        if (isEmpty && isFirstInPage && activePage && activePage.previousElementSibling) {
          const prevPage = activePage.previousElementSibling as HTMLElement;
          const prevPageParagraphs = Array.from(prevPage.querySelectorAll('p[data-type], p')) as HTMLElement[];
          const targetPrev = prevPageParagraphs[prevPageParagraphs.length - 1];

          if (targetPrev) {
            e.preventDefault();
            activeP.remove();
            // If page is now empty, remove page container
            if (activePage.querySelectorAll('p[data-type], p').length === 0) {
              activePage.remove();
            }
            setCaretInElement(targetPrev);
            updateActiveElementState();
            checkAndDistributeOverflow();
            handleInput();
            return;
          }
        }

        // If on an empty line and has a previous sibling element in the same page, delete the empty line
        if (isEmpty && activeP.previousElementSibling) {
          const prev = activeP.previousElementSibling as HTMLElement;
          if (prev && !prev.classList.contains('screenplay-page-header')) {
            e.preventDefault();
            activeP.remove();
            setCaretInElement(prev);
            updateActiveElementState();
            checkAndDistributeOverflow();
            handleInput();
            return;
          }
        }

        // If currently on an empty special element on the very first line (no previous sibling), revert to action
        if (isEmpty && currentType !== 'action') {
          e.preventDefault();
          applyElementTypeToCurrentParagraph('action', activeP);
          return;
        }

        // CRITICAL: If on the very first line of page 1, and it is ALREADY an empty action element:
        // Do NOT let the browser delete the paragraph and leave the page without paragraphs!
        const isFirstPageFirstP = (!activePage || !activePage.previousElementSibling) && 
          (!activeP.previousElementSibling || activeP.previousElementSibling.classList.contains('screenplay-page-header'));
        if (isEmpty && isFirstPageFirstP) {
          e.preventDefault();
          activeP.innerHTML = '<br>';
          activeP.setAttribute('data-empty', 'true');
          setCaretInElement(activeP);
          return;
        }

        // If caret is at offset 0 of an element with text, merge cleanly with previous paragraph on Backspace
        const sel = window.getSelection();
        if (e.key === 'Backspace' && sel && sel.isCollapsed && sel.anchorOffset === 0) {
          const isAtBeginning = sel.anchorNode === activeP || 
            (sel.anchorNode?.nodeType === Node.TEXT_NODE && sel.anchorNode === activeP.firstChild && sel.anchorOffset === 0);

          if (isAtBeginning) {
            let prevP: HTMLElement | null = null;
            if (activeP.previousElementSibling && !activeP.previousElementSibling.classList.contains('screenplay-page-header')) {
              prevP = activeP.previousElementSibling as HTMLElement;
            } else if (isFirstInPage && activePage && activePage.previousElementSibling) {
              const prevPageParagraphs = Array.from(activePage.previousElementSibling.querySelectorAll('p[data-type], p')) as HTMLElement[];
              prevP = prevPageParagraphs[prevPageParagraphs.length - 1] || null;
            }

            if (prevP) {
              e.preventDefault();
              const prevLen = (prevP.textContent || '').length;
              const contentToMerge = activeP.textContent || '';
              if (prevP.hasAttribute('data-empty')) {
                prevP.removeAttribute('data-empty');
                prevP.textContent = contentToMerge;
              } else {
                prevP.textContent = (prevP.textContent || '') + (contentToMerge ? ' ' + contentToMerge : '');
              }
              activeP.remove();
              if (activePage && activePage.querySelectorAll('p[data-type], p').length === 0 && activePage.previousElementSibling) {
                activePage.remove();
              }
              setCaretInElement(prevP, false, prevLen);
              updateActiveElementState();
              checkAndDistributeOverflow();
              handleInput();
              return;
            }
          }
        }
      }
    }

    // 2C. PARENTHETICAL AUTO-FORMAT & OVERTYPE BEHAVIOR
    // Auto-format Parenthetical on typing '('
    if (e.key === '(' && !e.ctrlKey && !e.metaKey && !e.altKey) {
      const activeP = getActiveParagraph();
      if (activeP) {
        const text = (activeP.textContent || '').trim();
        const currentType = (activeP.getAttribute('data-type') as ElementType) || 'action';
        // If already parenthetical with '()', ensure caret is inside at index 1
        if (currentType === 'parenthetical') {
          e.preventDefault();
          if (text !== '()') {
            activeP.textContent = '()';
            activeP.removeAttribute('data-empty');
            handleInput();
          }
          setCaretInElement(activeP, false, 1);
          return;
        }
        const sel = window.getSelection();
        const isAtStartOrEmpty = isBlockContentEmpty(text) || (sel && sel.anchorOffset === 0);
        if (isAtStartOrEmpty) {
          e.preventDefault();
          applyElementTypeToCurrentParagraph('parenthetical', activeP);
          activeP.textContent = '()';
          activeP.removeAttribute('data-empty');
          setCaretInElement(activeP, false, 1);
          handleInput();
          return;
        }
      }
    }

    // Jump past closing ')' when typing ')' right before it in a parenthetical
    if (e.key === ')' && !e.ctrlKey && !e.metaKey && !e.altKey) {
      const activeP = getActiveParagraph();
      if (activeP && activeP.getAttribute('data-type') === 'parenthetical') {
        const sel = window.getSelection();
        if (sel && sel.anchorNode) {
          const nodeText = sel.anchorNode.textContent || '';
          const offset = sel.anchorOffset;
          if (nodeText[offset] === ')') {
            e.preventDefault();
            const range = document.createRange();
            range.setStart(sel.anchorNode, offset + 1);
            range.collapse(true);
            sel.removeAllRanges();
            sel.addRange(range);
            return;
          }
        }
      }
    }

    // Clear data-empty state immediately when typing any printable character
    if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey && e.key !== '(' && e.key !== ')') {
      const activeP = getActiveParagraph();
      if (activeP) {
        if (activeP.hasAttribute('data-empty')) {
          activeP.removeAttribute('data-empty');
        }
        if (activeP.getAttribute('data-type') === 'parenthetical') {
          const text = (activeP.textContent || '').trim();
          if (!text || text === '<br>' || isBlockContentEmpty(text) || (!text.includes('(') && !text.includes(')'))) {
            e.preventDefault();
            activeP.textContent = `(${e.key})`;
            setCaretInElement(activeP, false, 2);
            handleInput();
            return;
          }
        }
      }
    }

    // 3. DIRECT ELEMENT SHORTCUTS: Ctrl + 1 through Ctrl + 6 (and Ctrl+0, 7, 8)
    if (e.ctrlKey || e.metaKey) {
      const key = e.key;
      const num = parseInt(key, 10);
      if (!isNaN(num)) {
        const shortcutMap: Record<number, ElementType> = {
          1: 'scene_heading', // INT./EXT. (Ctrl+1)
          2: 'action',        // ACCIÓN (Ctrl+2)
          3: 'character',     // PERSONAJE (Ctrl+3)
          4: 'dialogue',      // DIÁLOGO (Ctrl+4)
          5: 'parenthetical', // ACOTACIÓN (Ctrl+5)
          6: 'transition',    // TRANSICIÓN (Ctrl+6)
          0: 'act',           // ACTO (Ctrl+0)
          7: 'shot',          // PLANO (Ctrl+7)
          8: 'text',          // TEXTO (Ctrl+8)
        };
        if (shortcutMap[num]) {
          e.preventDefault();
          applyElementTypeToCurrentParagraph(shortcutMap[num]);
          return;
        }
      }
    }

    // 4. ENTER KEY: Screenplay Workflow Transitions & Page Spawning at Physical Boundaries
    if (e.key === 'Enter') {
      // 4A. MANUAL NEW PAGE BREAK (Shift + Enter / Ctrl + Enter / Cmd + Enter)
      if (e.shiftKey || e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const activeP = getActiveParagraph();
        if (activeP && editorRef.current) {
          const activePage = activeP.closest('.screenplay-page, [data-page-container="true"]') as HTMLElement | null;
          let targetNextPage = activePage?.nextElementSibling as HTMLElement | null;

          if (!targetNextPage) {
            const allPages = editorRef.current.querySelectorAll('.screenplay-page, [data-page-container="true"]');
            const nextPageIndex = allPages.length + 1;
            targetNextPage = document.createElement('div');
            const pageThemeClass = isDarkMode
              ? 'dark-sheet bg-[#222228] text-white border-[#33333c]'
              : 'light-sheet bg-white text-[#111111] border-[#D9D9D6]';
            targetNextPage.className = `screenplay-page relative select-text shadow-2xl transition-colors border ${pageThemeClass}`;
            targetNextPage.setAttribute('data-page-container', 'true');
            targetNextPage.setAttribute('data-page-number', String(nextPageIndex));
            targetNextPage.innerHTML = `
              <div class="screenplay-page-header select-none pointer-events-none" contenteditable="false">
                <span class="font-mono text-[12pt] font-bold ${isDarkMode ? 'text-white' : 'text-[#111111]'}">${nextPageIndex}.</span>
              </div>
            `;
            if (activePage && activePage.nextSibling) {
              editorRef.current.insertBefore(targetNextPage, activePage.nextSibling);
            } else {
              editorRef.current.appendChild(targetNextPage);
            }
          }

          // Move any paragraphs after activeP on activePage to targetNextPage
          if (activePage) {
            let nextSib = activeP.nextElementSibling;
            const toMove: HTMLElement[] = [];
            while (nextSib) {
              if (nextSib.tagName === 'P') toMove.push(nextSib as HTMLElement);
              nextSib = nextSib.nextElementSibling;
            }
            const firstPInNext = targetNextPage.querySelector('p[data-type], p');
            toMove.forEach((elem) => {
              if (firstPInNext) {
                targetNextPage!.insertBefore(elem, firstPInNext);
              } else {
                targetNextPage!.appendChild(elem);
              }
            });
          }

          // Create new scene heading at top of targetNextPage
          const newP = document.createElement('p');
          newP.setAttribute('data-type', 'scene_heading');
          newP.setAttribute('data-placeholder', ELEMENT_PLACEHOLDERS.scene_heading);
          newP.setAttribute('data-empty', 'true');
          newP.className = 'script-scene-heading font-bold uppercase text-black script-line min-h-[1.5em] my-0 leading-[1.5] transition-all relative outline-none';
          newP.innerHTML = '<br>';

          const firstExistingP = targetNextPage.querySelector('p[data-type], p');
          if (firstExistingP) {
            targetNextPage.insertBefore(newP, firstExistingP);
          } else {
            targetNextPage.appendChild(newP);
          }

          // Re-index all headers sequentially
          const allPages = Array.from(editorRef.current.querySelectorAll('.screenplay-page, [data-page-container="true"]')) as HTMLElement[];
          allPages.forEach((pageElem, idx) => {
            const pageNum = idx + 1;
            pageElem.setAttribute('data-page-number', String(pageNum));
            let header = pageElem.querySelector('.screenplay-page-header') as HTMLElement | null;
            if (!header) {
              header = document.createElement('div');
              header.className = 'screenplay-page-header select-none pointer-events-none';
              header.setAttribute('contenteditable', 'false');
              pageElem.insertBefore(header, pageElem.firstChild);
            }
            if (pageNum > 1) {
              header.innerHTML = `<span class="font-mono text-[12pt] font-bold ${isDarkMode ? 'text-white' : 'text-[#111111]'}">${pageNum}.</span>`;
            } else {
              header.innerHTML = '';
            }
          });

          setActiveElementType('scene_heading');
          const pageNum = targetNextPage.getAttribute('data-page-number') || '2';
          showNotification(`Nueva Hoja (${pageNum}) creada ✨`, e.shiftKey ? 'Shift+Enter' : 'Ctrl+Enter');
          
          setCaretInElement(newP);
          newP.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          setTimeout(() => setCaretInElement(newP), 15);
          handleInput();
          return;
        }
      }

      // 4B. Standard Enter Key in Screenplay Workflow
      if (!e.shiftKey && !e.ctrlKey && !e.metaKey) {
        const activeP = getActiveParagraph();
        if (activeP && editorRef.current) {
          const currentType = (activeP.getAttribute('data-type') as ElementType) || 'action';
          const rawText = (activeP.textContent || '').trim();
          const isEmpty = isBlockContentEmpty(rawText);

          e.preventDefault();

          // RULE 1: Empty Line Reset (Prevent ghost block auto-spawning)
          if (isEmpty) {
            if (currentType !== 'action') {
              applyElementTypeToCurrentParagraph('action', activeP);
              return;
            }
          }

          // RULE 2: Standard Screenplay Enter Transitions (when current line has text or empty action)
          let nextType: ElementType = 'action';
          if (isEmpty) {
            nextType = 'action';
          } else if (currentType === 'character') {
            nextType = 'dialogue';
          } else if (currentType === 'dialogue') {
            nextType = 'action';
          } else if (currentType === 'parenthetical') {
            nextType = 'dialogue';
          } else if (currentType === 'scene_heading') {
            nextType = 'action';
          } else if (currentType === 'transition') {
            nextType = 'scene_heading';
          } else if (currentType === 'act') {
            nextType = 'scene_heading';
          } else {
            nextType = 'action';
          }

          // Create the new paragraph with the target type
          const newP = document.createElement('p');
          const def = SCREENPLAY_ELEMENTS.find((elem) => elem.type === nextType) || SCREENPLAY_ELEMENTS[1];
          newP.setAttribute('data-type', nextType);
          newP.setAttribute('data-placeholder', ELEMENT_PLACEHOLDERS[nextType]);
          newP.setAttribute('data-empty', 'true');

          const elementClassMap: Partial<Record<ElementType, string>> = {
            dialogue: `script-dialogue ${isDarkMode ? 'text-white' : 'text-[#111111]'}`,
            scene_heading: `script-scene-heading font-bold uppercase ${isDarkMode ? 'text-white' : 'text-black'}`,
            character: `script-character font-bold uppercase ${isDarkMode ? 'text-white' : 'text-black'}`,
            parenthetical: `script-parenthetical italic ${isDarkMode ? 'text-[#B0B0BA]' : 'text-[#333333]'}`,
            transition: `script-transition font-bold uppercase ${isDarkMode ? 'text-white' : 'text-black'} text-right`,
            action: `script-action ${isDarkMode ? 'text-white' : 'text-[#1A1A1A]'}`,
            act: `script-act font-bold uppercase text-amber-500 text-center tracking-widest`,
            shot: `script-shot font-bold uppercase ${isDarkMode ? 'text-white' : 'text-black'}`,
            text: `script-text ${isDarkMode ? 'text-white' : 'text-[#2A2A2A]'}`,
          };

          const newClass = elementClassMap[nextType] || (isDarkMode ? 'script-action text-white' : 'script-action text-[#1A1A1A]');
          newP.className = `${newClass} script-line min-h-[1.5em] my-0 leading-[1.5] transition-all relative outline-none`;
          newP.innerHTML = '<br>';

          // Physical Page Boundary Check: Calculate height and position of current active page container
          const activePage = activeP.closest('.screenplay-page, [data-page-container="true"]') as HTMLElement | null;
          const pageParagraphs = activePage ? Array.from(activePage.querySelectorAll('p[data-type], p')) as HTMLElement[] : [];
          
          let pageLines = 0;
          pageParagraphs.forEach((p) => {
            pageLines += getParagraphEstimatedLines(p);
          });

          // A standard screenplay page is 1056px tall with 1-inch (96px) margins top & bottom (usable height = 864px, ~48 lines)
          const MAX_LINES_PER_PAGE = 48;
          const isPhysicallyNearBottom = (activeP.offsetTop + activeP.offsetHeight) >= 910;
          const isFullOrAtLimit = (pageLines >= MAX_LINES_PER_PAGE) || isPhysicallyNearBottom || (activePage ? activePage.scrollHeight > 1056 : false);
          const isLastParagraph = !activeP.nextElementSibling || activeP === pageParagraphs[pageParagraphs.length - 1];

          // If current page reaches the bottom limit and user is at or near the bottom, spawn/move to next page!
          if (isFullOrAtLimit && activePage && isLastParagraph) {
            let targetNextPage = activePage.nextElementSibling as HTMLElement | null;
            if (!targetNextPage || !targetNextPage.classList.contains('screenplay-page')) {
              const allPages = Array.from(editorRef.current.querySelectorAll('.screenplay-page, [data-page-container="true"]')) as HTMLElement[];
              const pageIdx = allPages.indexOf(activePage);
              const nextPageIndex = (pageIdx >= 0 ? pageIdx : allPages.length) + 2;
              targetNextPage = document.createElement('div');
              const pageThemeClass = isDarkMode
                ? 'dark-sheet bg-[#222228] text-white border-[#33333c]'
                : 'light-sheet bg-white text-[#111111] border-[#D9D9D6]';
              targetNextPage.className = `screenplay-page relative select-text shadow-2xl transition-colors border ${pageThemeClass}`;
              targetNextPage.setAttribute('data-page-container', 'true');
              targetNextPage.setAttribute('data-page-number', String(nextPageIndex));
              targetNextPage.innerHTML = `
                <div class="screenplay-page-header select-none pointer-events-none" contenteditable="false">
                  <span class="font-mono text-[12pt] font-bold ${isDarkMode ? 'text-white' : 'text-[#111111]'}">${nextPageIndex}.</span>
                </div>
              `;
              if (activePage.nextSibling) {
                editorRef.current.insertBefore(targetNextPage, activePage.nextSibling);
              } else {
                editorRef.current.appendChild(targetNextPage);
              }
            }

            const firstExistingP = targetNextPage.querySelector('p[data-type], p');
            if (firstExistingP) {
              targetNextPage.insertBefore(newP, firstExistingP);
            } else {
              targetNextPage.appendChild(newP);
            }

            // Re-index all page headers sequentially
            const allPages = Array.from(editorRef.current.querySelectorAll('.screenplay-page, [data-page-container="true"]')) as HTMLElement[];
            allPages.forEach((pageElem, idx) => {
              const pageNum = idx + 1;
              pageElem.setAttribute('data-page-number', String(pageNum));
              let header = pageElem.querySelector('.screenplay-page-header') as HTMLElement | null;
              if (!header) {
                header = document.createElement('div');
                header.className = 'screenplay-page-header select-none pointer-events-none';
                header.setAttribute('contenteditable', 'false');
                pageElem.insertBefore(header, pageElem.firstChild);
              }
              if (pageNum > 1) {
                header.innerHTML = `<span class="font-mono text-[12pt] font-bold ${isDarkMode ? 'text-white' : 'text-[#111111]'}">${pageNum}.</span>`;
              } else {
                header.innerHTML = '';
              }
            });
          } else {
            // Normal in-page insertion
            const container = activePage || editorRef.current;
            if (activeP.nextSibling && activeP.parentElement === container) {
              container.insertBefore(newP, activeP.nextSibling);
            } else if (activeP.parentElement) {
              activeP.parentElement.insertBefore(newP, activeP.nextSibling);
            } else {
              container.appendChild(newP);
            }
          }

          setCaretInElement(newP);
          setActiveElementType(nextType);
          showNotification(`${def.number}. ${def.label}`, def.shortcut);
          checkAndDistributeOverflow();
          handleInput();
          newP.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          setTimeout(() => setCaretInElement(newP), 15);
          return;
        }
      }
    }

    // 5. TAB KEY: Sequential 6-Element Cycling without getting trapped or inserting unwanted line breaks
    if (e.key === 'Tab') {
      e.preventDefault();
      setSuggestionMenu(null);
      const activeP = getActiveParagraph();
      if (!activeP) return;
      const currentType = (activeP.getAttribute('data-type') as ElementType) || 'action';

      if (e.shiftKey) {
        // Shift + Tab: reverse cycle through core 6 elements
        let currentIndex = CORE_SCREENPLAY_TYPES.indexOf(currentType);
        if (currentIndex === -1) currentIndex = 1; // default to action (index 1)
        const prevIndex = (currentIndex - 1 + CORE_SCREENPLAY_TYPES.length) % CORE_SCREENPLAY_TYPES.length;
        applyElementTypeToCurrentParagraph(CORE_SCREENPLAY_TYPES[prevIndex], activeP);
        return;
      }

      // Forward Tab: Cycle sequentially through core 6 elements:
      // scene_heading (INT./EXT.) -> action (ACCIÓN) -> character (PERSONAJE) -> dialogue (DIÁLOGO) -> parenthetical (ACOTACIÓN) -> transition (TRANSICIÓN) -> scene_heading
      let currentIndex = CORE_SCREENPLAY_TYPES.indexOf(currentType);
      if (currentIndex === -1) currentIndex = 1;
      const nextIndex = (currentIndex + 1) % CORE_SCREENPLAY_TYPES.length;
      applyElementTypeToCurrentParagraph(CORE_SCREENPLAY_TYPES[nextIndex], activeP);
      return;
    }

    // 6. Safe Autocorrect on Space: Only check the single word immediately before caret without resetting or destroying caret position
    if (autocorrectEnabled && e.key === ' ' && !e.ctrlKey && !e.metaKey && !e.altKey) {
      const selection = window.getSelection();
      if (selection && selection.isCollapsed && selection.anchorNode) {
        const textNode = selection.anchorNode;
        if (textNode.nodeType === Node.TEXT_NODE && textNode.textContent) {
          const caretOffset = selection.anchorOffset;
          const textBeforeCaret = textNode.textContent.slice(0, caretOffset);
          
          // Match the single word directly preceding the cursor (letters only)
          const wordMatch = textBeforeCaret.match(/([a-zA-ZáéíóúÁÉÍÓÚñÑ]+)$/);
          if (wordMatch) {
            const rawWord = wordMatch[1];
            const lowerWord = rawWord.toLowerCase();
            const corrected = SPANISH_ACCENT_CORRECTIONS[lowerWord];

            // Only apply if the word actually requires an accent and isn't already accented
            if (corrected && corrected !== lowerWord) {
              e.preventDefault();
              
              // Preserve capitalization pattern (ALL CAPS, Title Case, lowercase)
              let finalReplacement = corrected;
              if (rawWord === rawWord.toUpperCase()) {
                finalReplacement = corrected.toUpperCase();
              } else if (rawWord[0] === rawWord[0].toUpperCase()) {
                finalReplacement = corrected.charAt(0).toUpperCase() + corrected.slice(1);
              }

              const wordStart = caretOffset - rawWord.length;
              const textAfterCaret = textNode.textContent.slice(caretOffset);
              const newContent = textNode.textContent.slice(0, wordStart) + finalReplacement + ' ' + textAfterCaret;
              
              textNode.textContent = newContent;
              const newCaretOffset = wordStart + finalReplacement.length + 1; // +1 for the space

              // Restore caret precisely after the inserted space
              const range = document.createRange();
              range.setStart(textNode, Math.min(newCaretOffset, newContent.length));
              range.collapse(true);
              selection.removeAllRanges();
              selection.addRange(range);

              showNotification(`Autocorrección: ${finalReplacement} ✨`);
              handleInput();
              return;
            }
          }
        }
      }
    }
  };

  // Smart editor click and mousedown handler: if clicking empty canvas or page container, focus correct paragraph
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    if (target && (target.classList.contains('screenplay-page') || target.hasAttribute('data-page-container') || target === editorRef.current)) {
      const page = target.classList.contains('screenplay-page') ? target : (target.closest('.screenplay-page, [data-page-container="true"]') as HTMLElement || editorRef.current);
      const paragraphs = Array.from(page.querySelectorAll('p[data-type], p')) as HTMLElement[];
      if (paragraphs.length > 0) {
        const clickY = e.clientY;
        const firstRect = paragraphs[0].getBoundingClientRect();
        if (clickY < firstRect.top) {
          e.preventDefault();
          setCaretInElement(paragraphs[0], false);
        } else {
          e.preventDefault();
          setCaretInElement(paragraphs[paragraphs.length - 1], true);
        }
      }
    }
  };

  const handleEditorClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const selection = window.getSelection();
    if (selection && !selection.isCollapsed) {
      return;
    }
    updateActiveElementState();
    const target = e.target as HTMLElement;
    if (target && (target.classList.contains('screenplay-page') || target.hasAttribute('data-page-container') || target === editorRef.current)) {
      const page = target.classList.contains('screenplay-page') ? target : (target.closest('.screenplay-page, [data-page-container="true"]') as HTMLElement || editorRef.current);
      const paragraphs = Array.from(page.querySelectorAll('p[data-type], p')) as HTMLElement[];
      if (paragraphs.length > 0) {
        const clickY = e.clientY;
        const firstRect = paragraphs[0].getBoundingClientRect();
        if (clickY < firstRect.top) {
          setCaretInElement(paragraphs[0], false);
        } else {
          setCaretInElement(paragraphs[paragraphs.length - 1], true);
        }
      } else {
        const newP = document.createElement('p');
        newP.className = 'script-action text-[#1A1A1A] script-line min-h-[1.5em] my-0 leading-[1.5] transition-all relative outline-none';
        newP.setAttribute('data-type', 'action');
        newP.setAttribute('data-placeholder', ELEMENT_PLACEHOLDERS.action);
        newP.setAttribute('data-empty', 'true');
        newP.innerHTML = '<br>';
        page.appendChild(newP);
        setCaretInElement(newP);
      }
    }
  };

  // Copy pure fountain text to clipboard
  const handleCopyText = () => {
    const rawText = getEditorRawText();
    navigator.clipboard.writeText(rawText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Listen to global toolbar actions (undo, redo, zoom, format element, AI format)
  useEffect(() => {
    const handleEditorAction = (e: Event) => {
      const customEvent = e as CustomEvent<{ action: string; type?: ElementType }>;
      if (!customEvent.detail) return;
      const { action, type } = customEvent.detail;
      switch (action) {
        case 'undo':
          handleUndo();
          break;
        case 'redo':
          handleRedo();
          break;
        case 'copy':
          handleCopyText();
          break;
        case 'paste':
          handlePasteText();
          break;
        case 'format':
          if (type) applyElementTypeToCurrentParagraph(type);
          break;
        case 'ai-format':
          handleFormatWithAiDirect();
          break;
      }
    };

    const handleEditorZoom = (e: Event) => {
      const customEvent = e as CustomEvent<{ delta?: number; zoom?: number }>;
      if (!customEvent.detail) return;
      if (customEvent.detail.zoom !== undefined) {
        setZoom(customEvent.detail.zoom);
      } else if (customEvent.detail.delta !== undefined) {
        setZoom((z) => Math.max(60, Math.min(150, z + customEvent.detail.delta!)));
      }
    };

    window.addEventListener('editor-action', handleEditorAction);
    window.addEventListener('editor-zoom', handleEditorZoom);
    return () => {
      window.removeEventListener('editor-action', handleEditorAction);
      window.removeEventListener('editor-zoom', handleEditorZoom);
    };
  }, [handleUndo, handleRedo, handlePasteText, applyElementTypeToCurrentParagraph, handleFormatWithAiDirect]);

  return (
    <div className={`flex-1 flex flex-col h-[calc(100vh-88px)] transition-colors duration-200 overflow-hidden relative ${
      isDarkMode ? 'bg-[#121214] text-[#E0E0E0]' : 'bg-[#F4F4F1] text-[#1A1A1A]'
    }`}>
      {/* Floating Notification Toast */}
      {lastNotice && (
        <div className="absolute bottom-4 left-6 z-50 bg-[#1A1A1A] text-white px-3.5 py-2 rounded-lg shadow-xl text-xs font-mono flex items-center gap-2.5 animate-fade-in border border-[#333333]">
          <Wand2 className="w-4 h-4 text-amber-400 shrink-0" />
          <span className="font-semibold">{lastNotice.text}</span>
          {lastNotice.shortcut && (
            <span className="bg-[#333333] text-amber-300 px-1.5 py-0.5 rounded text-[10px] font-bold">
              {lastNotice.shortcut}
            </span>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* PURE FORMATTED SCREENPLAY PAPER SURFACE (STATIC FULLY CENTERED CANVAS)    */}
      {/* ========================================================================= */}
      <div className="flex-1 relative overflow-hidden flex">
        {/* Main Paper Scroll Area: Occupies full width, paper is strictly centered with mx-auto */}
        <div className={`w-full h-full overflow-y-auto p-4 sm:p-8 flex flex-col items-center transition-colors duration-200 ${
          isDarkMode ? 'bg-[#121214]' : 'bg-[#E5E5E0]'
        }`}>
          <div 
            style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top center' }}
            className="transition-transform duration-150 flex flex-col gap-6 items-center pb-32 pt-2 w-full max-w-[850px] mx-auto"
          >
            {/* ========================================================================= */}
            {/* 1. INITIAL TITLE PAGE (PORTADA DEL GUION CON TÍTULO GRANDE Y AUTOR)        */}
            {/* ========================================================================= */}
            {showTitlePage ? (
              <div 
                className={`screenplay-page screenplay-paper relative select-text shadow-2xl transition-colors border flex flex-col justify-between ${
                  isDarkMode 
                    ? 'dark-sheet bg-[#222228] text-white border-[#33333c]' 
                    : 'light-sheet bg-white text-[#111111] border-[#D9D9D6]'
                }`}
                style={{ minHeight: '1056px', width: '816px', maxWidth: '816px', padding: '1.2in 1.4in' }}
              >
                {/* Header Tag and Toggle */}
                <div className="flex items-center justify-between text-xs font-mono select-none opacity-50 uppercase tracking-widest pb-4">
                  <span className="flex items-center gap-1.5 font-bold">
                    <FileText className="w-4 h-4 text-amber-500" />
                    PORTADA DEL GUION
                  </span>
                  <button
                    onClick={handleToggleTitlePage}
                    className="hover:text-amber-500 transition-colors text-[10px] font-sans font-semibold normal-case tracking-normal px-2.5 py-0.5 rounded border border-current/20 hover:border-amber-500 cursor-pointer pointer-events-auto"
                    title="Ocultar carátula en el editor"
                  >
                    Ocultar Portada
                  </button>
                </div>

                {/* Center Content: Huge Title & Space for Author */}
                <div className="my-auto flex flex-col items-center justify-center text-center w-full space-y-8 px-4">
                  {/* Título del Guion - Very Large Text with clean placeholder and dashed border */}
                  <div className="w-full max-w-2xl flex flex-col items-center">
                    <input
                      type="text"
                      value={project.titlePage?.title !== undefined ? project.titlePage.title : (project.title || '')}
                      onChange={(e) => handleTitlePageFieldChange('title', e.target.value.toUpperCase())}
                      placeholder="Título de Guion"
                      className="w-full text-center text-4xl sm:text-5xl md:text-6xl font-black uppercase tracking-wider font-screenplay bg-transparent outline-none border-b-2 border-dashed border-current/25 hover:border-amber-500/40 focus:border-amber-500 focus:border-solid transition-colors py-2 px-3 placeholder:font-normal placeholder:normal-case placeholder:tracking-normal placeholder:text-neutral-400 placeholder:opacity-50"
                      spellCheck={false}
                    />
                  </div>

                  {/* Espacio para el autor seguido del título */}
                  <div className="w-full max-w-lg flex flex-col items-center space-y-2 pt-4">
                    <p className="text-xs sm:text-sm font-screenplay uppercase tracking-[0.25em] opacity-70 select-none">
                      Escrito por
                    </p>
                    <input
                      type="text"
                      value={project.titlePage?.writtenBy ?? ''}
                      onChange={(e) => handleTitlePageFieldChange('writtenBy', e.target.value)}
                      placeholder="Nombre del autor / Guionista"
                      className="w-full text-center text-xl sm:text-2xl font-bold font-screenplay bg-transparent outline-none border-b-2 border-dashed border-current/25 hover:border-amber-500/40 focus:border-amber-500 focus:border-solid transition-colors py-1.5 px-3 placeholder:opacity-40"
                      spellCheck={false}
                    />
                    {/* Basado en (opcional) */}
                    <input
                      type="text"
                      value={project.titlePage?.basedOn ?? ''}
                      onChange={(e) => handleTitlePageFieldChange('basedOn', e.target.value)}
                      placeholder="Basado en: (opcional)"
                      className="w-full text-center text-xs sm:text-sm italic font-screenplay bg-transparent outline-none border-b border-transparent hover:border-current/20 focus:border-amber-500 transition-colors py-1 opacity-70 placeholder:opacity-30"
                      spellCheck={false}
                    />
                  </div>
                </div>

                {/* Bottom Standard Screenplay Metadata */}
                <div className={`flex justify-between items-end text-xs font-screenplay border-t pt-4 ${
                  isDarkMode ? 'border-[#33333c] text-[#A0A0AB]' : 'border-neutral-300/60 text-neutral-600'
                }`}>
                  <div className="space-y-1">
                    <input
                      type="text"
                      value={project.titlePage?.draft ?? 'Primer Borrador'}
                      onChange={(e) => handleTitlePageFieldChange('draft', e.target.value)}
                      placeholder="Borrador / Versión"
                      className="font-semibold bg-transparent outline-none hover:border-b border-current/30 focus:border-amber-500 transition-colors text-xs block"
                    />
                    <p className="text-[11px] opacity-80">
                      {project.titlePage?.date || new Date().toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
                    </p>
                  </div>

                  <div className="text-right space-y-1">
                    <input
                      type="text"
                      value={project.titlePage?.contact ?? ''}
                      onChange={(e) => handleTitlePageFieldChange('contact', e.target.value)}
                      placeholder="contacto@ejemplo.com"
                      className="text-right bg-transparent outline-none hover:border-b border-current/30 focus:border-amber-500 transition-colors text-xs block ml-auto"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="w-full max-w-[816px] flex justify-end px-2 select-none">
                <button
                  onClick={handleToggleTitlePage}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono text-amber-500 hover:bg-amber-500/10 border border-amber-500/30 transition-all cursor-pointer shadow-xs"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Mostrar Portada Inicial</span>
                </button>
              </div>
            )}

            {/* Separator / Page Transition Indicator */}
            {showTitlePage && (
              <div className="w-full max-w-[816px] flex items-center justify-center py-2 select-none text-[11px] font-mono opacity-50">
                <div className="flex items-center gap-3">
                  <span className="w-16 h-px bg-current/30" />
                  <span className="tracking-widest font-semibold uppercase">PÁGINA 1 — CUERPO DEL GUION</span>
                  <span className="w-16 h-px bg-current/30" />
                </div>
              </div>
            )}

            {/* Screenplay Discrete Multi-Page Paper Canvas (US Letter 816px x 1056px per page) */}
            <div
              ref={editorRef}
              contentEditable={true}
              suppressContentEditableWarning={true}
              spellCheck={true}
              lang="es"
              autoCorrect="on"
              autoCapitalize="sentences"
              onInput={handleInput}
              onKeyDown={handleKeyDown}
              onKeyUp={(e) => {
                if (['ArrowDown', 'ArrowUp', 'ArrowLeft', 'ArrowRight', 'Enter', 'Escape', 'Tab', 'Shift', 'Control', 'Alt', 'Meta'].includes(e.key)) {
                  return;
                }
                updateActiveElementState();
              }}
              onMouseUp={() => {
                const sel = window.getSelection();
                if (sel && !sel.isCollapsed) {
                  setSuggestionMenu(null);
                  return;
                }
                updateActiveElementState();
              }}
              onMouseDown={handleMouseDown}
              onClick={handleEditorClick}
              className={`flex flex-col items-center gap-8 w-full outline-none font-screenplay text-[12pt] leading-[1.3] selection:bg-amber-400 selection:text-black ${
                isDarkMode ? 'text-white' : 'text-[#111111]'
              }`}
            />
          </div>
        </div>

        {/* Celtx-Style Autocompletion Suggestions Popover */}
        {suggestionMenu && suggestionMenu.items.length > 0 && (
          <div
            id="celtx-autocomplete-dropdown"
            className="fixed z-50 rounded-md shadow-xl border overflow-hidden min-w-[200px] max-w-[340px] animate-in fade-in zoom-in-95 duration-75 select-none"
            style={{
              top: `${suggestionMenu.coords.top}px`,
              left: `${suggestionMenu.coords.left}px`,
              backgroundColor: isDarkMode ? '#1E2028' : '#FFFFFF',
              borderColor: isDarkMode ? '#343846' : '#D1D5DB',
            }}
          >
            {suggestionMenu.headerTitle && (
              <div className={`px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider font-semibold border-b flex items-center justify-between ${
                isDarkMode ? 'text-neutral-400 border-neutral-700 bg-neutral-900/50' : 'text-neutral-500 border-neutral-200 bg-neutral-50'
              }`}>
                <span>{suggestionMenu.headerTitle}</span>
                <span className="text-[9px] opacity-60 font-sans">Tab / ↵</span>
              </div>
            )}
            <div className="py-0.5 max-h-48 overflow-y-auto">
              {suggestionMenu.items.map((item, index) => {
                const isSelected = index === suggestionMenu.selectedIndex;
                return (
                  <button
                    key={`${item.id}_${index}`}
                    type="button"
                    ref={(el) => {
                      if (isSelected && el) {
                        el.scrollIntoView({ block: 'nearest' });
                      }
                    }}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      confirmSuggestion(item);
                    }}
                    className={`w-full text-left px-3 py-1.5 text-xs font-mono font-bold uppercase transition-colors flex items-center justify-between cursor-pointer ${
                      isSelected
                        ? 'bg-[#1976D2] text-white shadow-xs'
                        : isDarkMode
                          ? 'text-neutral-200 hover:bg-[#2A2E3B]'
                          : 'text-neutral-800 hover:bg-neutral-100'
                    }`}
                  >
                    <span>{item.label}</span>
                    {isSelected && <span className="text-[10px] opacity-75 font-mono">↵</span>}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* SECRETARIOS: DRAGGABLE FLOATING SQUARE WIDGET & RESPONSIVE MODAL DRAWER  */}
        {/* ========================================================================= */}
        {!sidePanelVisible ? (
          /* Draggable Square Floating Widget */
          <div
            id="draggable-secretarios-fab"
            onPointerDown={handlePointerDownFab}
            onPointerMove={handlePointerMoveFab}
            onPointerUp={handlePointerUpFab}
            style={
              fabPos
                ? { left: `${fabPos.x}px`, top: `${fabPos.y}px`, touchAction: 'none' }
                : { bottom: '24px', right: '24px', touchAction: 'none' }
            }
            className={`fixed z-30 pointer-events-auto select-none cursor-grab active:cursor-grabbing p-1 rounded-2xl shadow-2xl transition-shadow duration-150 border ${
              isDarkMode
                ? 'bg-[#18181c] hover:bg-[#202026] border-[#34343e] text-white shadow-[0_12px_36px_rgba(0,0,0,0.85)]'
                : 'bg-white hover:bg-[#F9F9F8] border-[#D4D4CE] text-[#1A1A1A] shadow-[0_12px_36px_rgba(0,0,0,0.18)]'
            }`}
            title="Formatear Guion (IA) - Arrastra para mover o haz clic para abrir"
          >
            <div className="flex flex-col items-center justify-center w-14 h-14 sm:w-16 sm:h-16 gap-1">
              <div className="flex items-center gap-0.5 opacity-40">
                <GripVertical className="w-3 h-3 text-amber-400" />
              </div>
              <Sparkles className="w-5 h-5 text-amber-500 animate-pulse" />
              <span className="text-[9px] font-bold tracking-tight uppercase opacity-90 font-mono">
                Formatear
              </span>
            </div>
          </div>
        ) : (
          /* Floating Responsive Dialog / Drawer that does NOT squeeze or cover the sheet */
          <div className="fixed inset-0 z-40 flex items-center justify-center p-4 sm:p-6 bg-black/40 backdrop-blur-xs pointer-events-auto animate-in fade-in duration-200">
            <div
              className={`w-full max-w-md rounded-2xl border shadow-2xl p-4 space-y-3.5 backdrop-blur-2xl transition-all duration-200 ${
                isDarkMode
                  ? 'bg-[#141417]/98 border-[#2c2c34] text-white shadow-[0_25px_60px_rgba(0,0,0,0.9)]'
                  : 'bg-white/98 border-[#D4D4CE] text-[#1A1A1A] shadow-[0_25px_60px_rgba(0,0,0,0.16)]'
              }`}
              style={{ maxHeight: '90vh', overflowY: 'auto' }}
            >
              {/* Header: "Formateador de Guion" */}
              <div
                className={`flex items-center justify-between pb-2.5 border-b shrink-0 sticky top-0 z-10 ${
                  isDarkMode ? 'bg-[#141417]/90 border-[#222225]' : 'bg-white/90 border-[#D4D4CE]'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4.5 h-4.5 text-amber-500" />
                  <div>
                    <h3 className={`text-xs font-extrabold tracking-wide uppercase ${isDarkMode ? 'text-white' : 'text-[#1A1A1A]'}`}>
                      Formatear Guion (IA)
                    </h3>
                    <p className="text-[10px] opacity-60 font-mono">Asistente de Estructura y Formato</p>
                  </div>
                </div>

                {/* Close toggle button */}
                <button
                  type="button"
                  onClick={handleToggleSidePanel}
                  className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                    isDarkMode
                      ? 'hover:bg-[#222228] text-[#888888] hover:text-white'
                      : 'hover:bg-[#DFDFDC] text-[#70706B] hover:text-[#1A1A1A]'
                  }`}
                  title="Cerrar y volver al cuadrado flotante"
                >
                  <X className="w-4.5 h-4.5" />
                </button>
              </div>

              {/* MAIN CONTENT: Formatear Guion */}
              <div className="space-y-3 pt-1">
                {/* Textarea Input Area */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] font-mono opacity-80">
                    <span className="font-semibold">Texto sin formato:</span>
                    <span>{sidebarRawText.length} caracteres</span>
                  </div>

                  <textarea
                    value={sidebarRawText}
                    onChange={(e) => setSidebarRawText(e.target.value)}
                    placeholder="Pega o escribe aquí tu borrador, sinopsis, escaleta o texto libre sin formato..."
                    rows={6}
                    className={`w-full p-3 rounded-xl border text-xs font-mono resize-y outline-none transition-all ${
                      isDarkMode
                        ? 'bg-[#101012] border-[#2c2c32] text-white focus:border-amber-400 placeholder-[#555555]'
                        : 'bg-[#F9F9F8] border-[#D4D4CE] text-[#1A1A1A] focus:border-[#1A1A1A] placeholder-[#9C9C96]'
                    }`}
                  />

                  {/* Quick helper buttons */}
                  <div className="flex items-center justify-between gap-1 flex-wrap pt-0.5">
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={async () => {
                          try {
                            const clip = await navigator.clipboard.readText();
                            if (clip) setSidebarRawText(clip);
                          } catch {
                            // Ignore
                          }
                        }}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border flex items-center gap-1.5 transition-colors cursor-pointer ${
                          isDarkMode
                            ? 'bg-[#1c1c22] hover:bg-[#24242c] border-[#2c2c32] text-[#D4D4D4]'
                            : 'bg-[#F2F2EF] hover:bg-[#EAEAE7] border-[#D4D4CE] text-[#1A1A1A]'
                        }`}
                        title="Pegar contenido del portapapeles"
                      >
                        <ClipboardPaste className="w-3 h-3 text-amber-400" />
                        <span>Pegar</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          const sheetText = getEditorRawText();
                          if (sheetText) setSidebarRawText(sheetText);
                        }}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border flex items-center gap-1.5 transition-colors cursor-pointer ${
                          isDarkMode
                            ? 'bg-[#1c1c22] hover:bg-[#24242c] border-[#2c2c32] text-[#D4D4D4]'
                            : 'bg-[#F2F2EF] hover:bg-[#EAEAE7] border-[#D4D4CE] text-[#1A1A1A]'
                        }`}
                        title="Cargar el texto actual de la hoja"
                      >
                        <FileText className="w-3 h-3 text-sky-400" />
                        <span>De la Hoja</span>
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          setSidebarRawText(
                            `Acto I\n\nint cafeteria dia\nJuan toma café negro en la mesa del rincón mirando la puerta con nerviosismo.\n\nMaria\n(agitada)\nTienen el paquete. Tenemos que salir ya.\n\nJuan\nNadie nos vio. Siéntate.\n\ncorte a:\n\next. calle noche\nUn auto negro espera con las luces apagadas.`
                          )
                        }
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-colors cursor-pointer ${
                          isDarkMode
                            ? 'bg-[#1c1c22] hover:bg-[#24242c] border-[#2c2c32] text-[#D4D4D4]'
                            : 'bg-[#F2F2EF] hover:bg-[#EAEAE7] border-[#D4D4CE] text-[#1A1A1A]'
                        }`}
                        title="Cargar texto de ejemplo rápido"
                      >
                        <span>Ejemplo</span>
                      </button>
                    </div>

                    {sidebarRawText && (
                      <button
                        type="button"
                        onClick={() => setSidebarRawText('')}
                        className={`p-1.5 rounded-lg opacity-60 hover:opacity-100 transition-opacity cursor-pointer ${
                          isDarkMode ? 'hover:text-rose-400' : 'hover:text-rose-600'
                        }`}
                        title="Limpiar texto"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Target Insertion Mode Selector */}
                <div className="space-y-1.5">
                  <div className="text-[11px] font-mono opacity-80 font-semibold">
                    Destino en el Guion:
                  </div>
                  <div
                    className={`grid grid-cols-2 gap-1 p-1 rounded-xl border ${
                      isDarkMode ? 'bg-[#101012] border-[#27272a]' : 'bg-[#F2F2EF] border-[#D4D4CE]'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => setSidebarApplyMode('replace')}
                      className={`py-2 px-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                        sidebarApplyMode === 'replace'
                          ? isDarkMode
                            ? 'bg-amber-500 text-black font-bold shadow-xs'
                            : 'bg-[#1A1A1A] text-white shadow-xs'
                          : isDarkMode
                            ? 'text-[#888888] hover:text-white'
                            : 'text-[#70706B] hover:text-[#1A1A1A]'
                      }`}
                    >
                      Reemplazar Todo
                    </button>
                    <button
                      type="button"
                      onClick={() => setSidebarApplyMode('append')}
                      className={`py-2 px-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                        sidebarApplyMode === 'append'
                          ? isDarkMode
                            ? 'bg-amber-500 text-black font-bold shadow-xs'
                            : 'bg-[#1A1A1A] text-white shadow-xs'
                          : isDarkMode
                            ? 'text-[#888888] hover:text-white'
                            : 'text-[#70706B] hover:text-[#1A1A1A]'
                      }`}
                    >
                      Insertar al Final
                    </button>
                  </div>
                </div>

                {/* Error Message */}
                {sidebarFormatError && (
                  <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs leading-tight">
                    {sidebarFormatError}
                  </div>
                )}

                {/* Primary Execute Button */}
                <button
                  id="btn-execute-sidebar-ai-format"
                  type="button"
                  onClick={handleFormatFromSidebar}
                  disabled={isFormattingAi}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-sm shadow-md bg-amber-500 hover:bg-amber-400 text-black transition-all active:scale-98 cursor-pointer disabled:opacity-50"
                >
                  {isFormattingAi ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-black" />
                      <span>Estructurando con Gemini...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-black fill-current" />
                      <span>Formatear Guion con IA</span>
                    </>
                  )}
                </button>

                {/* Option to Open in Full Modal Dialog */}
                <button
                  type="button"
                  onClick={() => {
                    handleToggleSidePanel();
                    setIsAiFormatModalOpen(true);
                  }}
                  className={`w-full py-2 text-center text-xs font-medium rounded-xl border transition-colors cursor-pointer ${
                    isDarkMode
                      ? 'bg-[#18181c] hover:bg-[#202026] border-[#2c2c34] text-[#A0A0A0] hover:text-white'
                      : 'bg-[#F9F9F8] hover:bg-[#EAEAE7] border-[#D4D4CE] text-[#70706B] hover:text-[#1A1A1A]'
                  }`}
                >
                  Abrir Comparador Completo
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Dedicated AI Script Formatter Modal */}
      <AiFormatModal
        isOpen={isAiFormatModalOpen}
        onClose={() => setIsAiFormatModalOpen(false)}
        initialRawText={getEditorRawText()}
        onApplyBlocks={handleApplyFormattedBlocksFromModal}
        isDarkMode={isDarkMode}
      />
    </div>
  );
};



