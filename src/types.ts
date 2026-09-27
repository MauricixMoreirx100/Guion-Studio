export type ElementType = 
  | 'act'             // Acto (ACTO I, ACT ONE) -> Centrado & Bold
  | 'scene_heading'   // Encabezado / Título de Escena (INT./EXT. LUGAR - TIEMPO) -> BOLD
  | 'action'          // Descripción y acción de la escena
  | 'character'       // Nombre del personaje -> BOLD & MAYÚSCULAS
  | 'dialogue'        // Diálogo hablado
  | 'parenthetical'   // Acotación / Paréntesis (ej: (susurrando))
  | 'transition'      // Transición (ej: CORTE A:, FUNDIDO A NEGRO:) -> BOLD
  | 'shot'            // Plano / Enfoque de cámara -> BOLD
  | 'text'            // Texto general / Nota narrativa
  | 'note';           // Nota de producción interna

export interface ScriptBlock {
  id: string;
  type: ElementType;
  content: string;
  sceneNumber?: number;
  dualDialogue?: boolean; // Para diálogo simultáneo
  notes?: string;
}

export interface PageData {
  pageNumber: number;
  blocks: ScriptBlock[];
}

export interface CharacterProfile {
  id: string;
  name: string; // Nombre en mayúsculas
  description?: string;
  role: 'protagonist' | 'antagonist' | 'supporting' | 'extra';
  actorName?: string;
  age?: string;
  notes?: string;
  colorTag?: string;
}

export interface LocationItem {
  id: string;
  name: string; // Ej: CAFETERÍA EL FARO, BOSQUE DE NIEBLA
  type: 'INT' | 'EXT' | 'INT/EXT';
  timeOfDay: 'DÍA' | 'NOCHE' | 'ATARDECER' | 'AMANECER' | 'CONTINUO';
  description?: string;
  realFilmingPlace?: string; // Lugar real para rodaje
  propsNeeded?: string[];
  permitsRequired?: boolean;
  notes?: string;
}

export interface TitlePageData {
  title: string;
  writtenBy: string;
  basedOn?: string;
  draft: string;
  date: string;
  contact: string;
  copyright?: string;
  logline?: string;
  genre?: string;
}

export interface Project {
  id: string;
  title: string;
  type: 'feature' | 'short' | 'tv_pilot' | 'commercial' | 'theater';
  createdAt: number;
  updatedAt: number;
  titlePage: TitlePageData;
  blocks: ScriptBlock[];
  characters: CharacterProfile[];
  locations: LocationItem[];
  settings: {
    highlightCharacters: boolean;
    highlightLocations: boolean;
    showSceneNumbers: boolean;
    autoCapitalizeCharacters: boolean;
    paperFormat: 'US_LETTER' | 'A4';
    showTitlePage?: boolean;
  };
}

export type ViewTab = 
  | 'editor' 
  | 'preview' 
  | 'production'
  | 'locations' 
  | 'characters' 
  | 'beats' 
  | 'title_page' 
  | 'ai_doctor';
