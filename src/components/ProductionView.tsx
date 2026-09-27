import React, { useState } from 'react';
import { 
  Clapperboard, 
  MapPin, 
  Users, 
  LayoutGrid, 
  FileText, 
  Sparkles, 
  ArrowLeft, 
  Film,
  Calendar,
  Layers
} from 'lucide-react';
import { Project, ScriptBlock, CharacterProfile, LocationItem, TitlePageData } from '../types';
import { LocationsBreakdown } from './LocationsBreakdown';
import { CharactersDirectory } from './CharactersDirectory';
import { BeatSheetCards } from './BeatSheetCards';
import { TitlePageEditor } from './TitlePageEditor';

interface ProductionViewProps {
  project: Project;
  onUpdateLocations: (locations: LocationItem[]) => void;
  onAddSceneForLocation: (location: LocationItem) => void;
  onUpdateCharacters: (characters: CharacterProfile[]) => void;
  onInsertCharacterDialogue: (character: CharacterProfile) => void;
  onUpdateBlocks: (blocks: ScriptBlock[]) => void;
  onUpdateTitlePage: (titlePage: TitlePageData) => void;
  onSwitchToEditor: () => void;
  isDarkMode?: boolean;
}

type ProductionSubTab = 'locations' | 'characters' | 'beats' | 'title_page';

export const ProductionView: React.FC<ProductionViewProps> = ({
  project,
  onUpdateLocations,
  onAddSceneForLocation,
  onUpdateCharacters,
  onInsertCharacterDialogue,
  onUpdateBlocks,
  onUpdateTitlePage,
  onSwitchToEditor,
  isDarkMode = true,
}) => {
  const [subTab, setSubTab] = useState<ProductionSubTab>('locations');

  const subTabs: { id: ProductionSubTab; label: string; icon: React.ReactNode; count?: number; description: string }[] = [
    { 
      id: 'locations', 
      label: 'Lugares de Rodaje', 
      icon: <MapPin className="w-4 h-4 text-emerald-400" />,
      count: project.locations?.length || 0,
      description: 'Desglose de locaciones INT / EXT, atrezo y permisos de filmación'
    },
    { 
      id: 'characters', 
      label: 'Personajes & Casting', 
      icon: <Users className="w-4 h-4 text-amber-400" />,
      count: project.characters?.length || 0,
      description: 'Directorio de personajes, roles protagónicos, colores y actores'
    },
    { 
      id: 'beats', 
      label: 'Escaleta / Tarjetas', 
      icon: <LayoutGrid className="w-4 h-4 text-sky-400" />,
      count: project.blocks.filter(b => b.type === 'scene_heading').length,
      description: 'Estructura visual de escenas y tarjetas de ritmo dramático'
    },
    { 
      id: 'title_page', 
      label: 'Portada & Créditos', 
      icon: <FileText className="w-4 h-4 text-purple-400" />,
      description: 'Página de presentación formal del guion para productoras'
    },
  ];

  return (
    <div className={`flex-1 flex flex-col min-h-[calc(100vh-60px)] transition-colors duration-200 ${
      isDarkMode ? 'bg-[#121212] text-[#E0E0E0]' : 'bg-[#F4F4F1] text-[#1A1A1A]'
    }`}>
      {/* Header of Dedicated Production Center */}
      <div className={`border-b px-4 sm:px-8 py-4 transition-colors ${
        isDarkMode ? 'bg-[#181818] border-[#2A2A2A]' : 'bg-[#EBEBE8] border-[#D9D9D6]'
      }`}>
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-400 shadow-sm">
              <Clapperboard className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold font-serif italic text-white flex items-center gap-2">
                  <span className={isDarkMode ? 'text-white' : 'text-[#1A1A1A]'}>Centro de Producción</span>
                </h1>
                <span className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded-full font-bold border ${
                  isDarkMode 
                    ? 'bg-[#242424] text-amber-300 border-amber-500/30' 
                    : 'bg-white text-amber-800 border-amber-300'
                }`}>
                  {project.title}
                </span>
              </div>
              <p className={`text-xs mt-0.5 ${isDarkMode ? 'text-[#9E9E9E]' : 'text-[#70706B]'}`}>
                Gestión de rodaje, desglose de locaciones, biblia de personajes y escaleta fuera de la sala de escritura.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={onSwitchToEditor}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer shadow-xs active:scale-95 ${
                isDarkMode 
                  ? 'bg-[#242424] hover:bg-[#303030] border-[#383838] text-white' 
                  : 'bg-white hover:bg-[#F4F4F1] border-[#D9D9D6] text-[#1A1A1A]'
              }`}
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Volver al Guion</span>
            </button>
          </div>
        </div>

        {/* Sub-navigation Tabs */}
        <div className="max-w-7xl mx-auto mt-4 flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {subTabs.map((tab) => {
            const isActive = subTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setSubTab(tab.id)}
                className={`flex items-center gap-2.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 border ${
                  isActive
                    ? isDarkMode
                      ? 'bg-[#2A2A2A] text-white border-amber-500/50 shadow-md'
                      : 'bg-white text-[#1A1A1A] border-[#1A1A1A] shadow-xs'
                    : isDarkMode
                      ? 'bg-[#181818] hover:bg-[#222222] text-[#9E9E9E] hover:text-white border-transparent'
                      : 'bg-transparent hover:bg-white/60 text-[#70706B] hover:text-[#1A1A1A] border-transparent'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full font-bold ${
                    isActive
                      ? isDarkMode ? 'bg-amber-400/20 text-amber-300' : 'bg-[#1A1A1A] text-white'
                      : isDarkMode ? 'bg-[#2A2A2A] text-[#9E9E9E]' : 'bg-[#D9D9D6] text-[#70706B]'
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Content Area for the Active Production Module */}
      <div className="flex-1 overflow-y-auto">
        {subTab === 'locations' && (
          <LocationsBreakdown
            project={project}
            onUpdateLocations={onUpdateLocations}
            onAddSceneForLocation={onAddSceneForLocation}
          />
        )}

        {subTab === 'characters' && (
          <CharactersDirectory
            project={project}
            onUpdateCharacters={onUpdateCharacters}
            onInsertCharacterDialogue={onInsertCharacterDialogue}
          />
        )}

        {subTab === 'beats' && (
          <BeatSheetCards
            project={project}
            onUpdateBlocks={onUpdateBlocks}
            onSwitchToEditor={onSwitchToEditor}
          />
        )}

        {subTab === 'title_page' && (
          <TitlePageEditor
            project={project}
            onUpdateTitlePage={onUpdateTitlePage}
          />
        )}
      </div>
    </div>
  );
};
