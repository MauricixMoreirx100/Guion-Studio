import React, { useState } from 'react';
import { 
  LayoutGrid, 
  MapPin, 
  Users, 
  Plus, 
  Trash2, 
  ArrowLeft, 
  ArrowRight, 
  Eye, 
  Clock, 
  Sparkles 
} from 'lucide-react';
import { Project, ScriptBlock } from '../types';
import { generateId } from '../utils/fountain';

interface BeatSheetCardsProps {
  project: Project;
  onUpdateBlocks: (blocks: ScriptBlock[]) => void;
  onSwitchToEditor: (sceneNumber?: number) => void;
}

interface SceneCardData {
  sceneHeadingBlock: ScriptBlock;
  sceneNumber: number;
  locationName: string;
  blocks: ScriptBlock[];
  summary: string;
  characters: string[];
}

export const BeatSheetCards: React.FC<BeatSheetCardsProps> = ({
  project,
  onUpdateBlocks,
  onSwitchToEditor,
}) => {
  // Extract scene groups
  const scenes: SceneCardData[] = [];
  let currentScene: SceneCardData | null = null;

  let sceneCounter = 1;
  for (const block of project.blocks) {
    if (block.type === 'scene_heading') {
      if (currentScene) {
        scenes.push(currentScene);
      }
      currentScene = {
        sceneHeadingBlock: block,
        sceneNumber: sceneCounter++,
        locationName: block.content,
        blocks: [block],
        summary: '',
        characters: [],
      };
    } else if (currentScene) {
      currentScene.blocks.push(block);
      if (block.type === 'action' && !currentScene.summary) {
        currentScene.summary = block.content;
      }
      if (block.type === 'character') {
        const cleanName = block.content.replace(/\s*\(.*?\)\s*/g, '').trim().toUpperCase();
        if (cleanName && !currentScene.characters.includes(cleanName)) {
          currentScene.characters.push(cleanName);
        }
      }
    }
  }
  if (currentScene) {
    scenes.push(currentScene);
  }

  const handleMoveScene = (sceneIndex: number, direction: 'left' | 'right') => {
    if (direction === 'left' && sceneIndex === 0) return;
    if (direction === 'right' && sceneIndex === scenes.length - 1) return;

    const targetIndex = direction === 'left' ? sceneIndex - 1 : sceneIndex + 1;
    const reorderedScenes = [...scenes];
    const temp = reorderedScenes[sceneIndex];
    reorderedScenes[sceneIndex] = reorderedScenes[targetIndex];
    reorderedScenes[targetIndex] = temp;

    // Flatten back to blocks
    const newBlocks: ScriptBlock[] = [];
    let sc = 1;
    reorderedScenes.forEach((s) => {
      s.blocks.forEach((b) => {
        if (b.type === 'scene_heading') {
          newBlocks.push({ ...b, sceneNumber: sc++ });
        } else {
          newBlocks.push(b);
        }
      });
    });

    onUpdateBlocks(newBlocks);
  };

  const handleAddNewScene = () => {
    const newSceneHeading: ScriptBlock = {
      id: generateId(),
      type: 'scene_heading',
      content: 'INT. NUEVA LOCACIÓN - DÍA',
      sceneNumber: scenes.length + 1,
    };
    const newAction: ScriptBlock = {
      id: generateId(),
      type: 'action',
      content: 'Descripción inicial de la escena...',
    };

    onUpdateBlocks([...project.blocks, newSceneHeading, newAction]);
  };

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-85px)] bg-[#F4F4F1] text-[#1A1A1A] overflow-y-auto p-4 sm:p-8">
      <div className="max-w-6xl mx-auto w-full space-y-6 pb-20">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#EBEBE8] p-5 rounded-2xl border border-[#D9D9D6] shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white border border-[#D9D9D6] flex items-center justify-center text-[#1A1A1A]">
              <LayoutGrid className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#1A1A1A] font-serif">Escaleta / Tarjetas de Escena</h2>
              <p className="text-xs text-[#70706B] mt-0.5">
                Visualiza el ritmo dramático y reorganiza el orden de filmación de tus escenas.
              </p>
            </div>
          </div>

          <button
            onClick={handleAddNewScene}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#1A1A1A] hover:bg-[#333333] text-white font-semibold text-xs shadow-xs transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>+ Añadir Escena</span>
          </button>
        </div>

        {/* Scene Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {scenes.map((scene, idx) => (
            <div
              key={scene.sceneHeadingBlock.id}
              className="bg-white border border-[#D9D9D6] hover:border-[#1A1A1A] rounded-2xl p-4 shadow-xs flex flex-col justify-between transition-all group"
            >
              <div>
                {/* Card Top: Scene Number & Location in BOLD */}
                <div className="flex items-center justify-between gap-2 pb-2 mb-2 border-b border-[#D9D9D6]">
                  <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-[#EBEBE8] text-[#1A1A1A] border border-[#D9D9D6]">
                    Escena {scene.sceneNumber}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleMoveScene(idx, 'left')}
                      disabled={idx === 0}
                      className="p-1 rounded text-[#70706B] hover:text-[#1A1A1A] hover:bg-[#F4F4F1] disabled:opacity-20"
                      title="Mover antes"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleMoveScene(idx, 'right')}
                      disabled={idx === scenes.length - 1}
                      className="p-1 rounded text-[#70706B] hover:text-[#1A1A1A] hover:bg-[#F4F4F1] disabled:opacity-20"
                      title="Mover después"
                    >
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Location Heading in BOLD */}
                <h3 className="font-screenplay font-bold text-sm text-[#1A1A1A] tracking-wide mb-2 line-clamp-2">
                  <strong>{scene.locationName.toUpperCase()}</strong>
                </h3>

                {/* Action summary */}
                <p className="text-xs text-[#555550] line-clamp-3 mb-3 leading-relaxed">
                  {scene.summary || <span className="text-[#9C9C96] italic">Sin descripción de acción</span>}
                </p>

                {/* Characters involved */}
                {scene.characters.length > 0 && (
                  <div className="pt-2 border-t border-[#D9D9D6] flex items-center gap-1.5 flex-wrap">
                    <Users className="w-3 h-3 text-[#1A1A1A]" />
                    <span className="text-[10px] text-[#70706B]">Personajes:</span>
                    {scene.characters.map((charName, ci) => (
                      <span key={ci} className="text-[11px] font-bold font-screenplay text-[#1A1A1A]">
                        <strong>{charName}</strong>{ci < scene.characters.length - 1 ? ',' : ''}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Bottom Action: Edit in screenplay editor */}
              <div className="mt-4 pt-2 border-t border-[#D9D9D6] flex items-center justify-between text-xs text-[#70706B]">
                <span>{scene.blocks.length} bloques</span>
                <button
                  onClick={() => onSwitchToEditor(scene.sceneNumber)}
                  className="px-2.5 py-1 rounded-md bg-[#F4F4F1] hover:bg-[#EBEBE8] text-[#1A1A1A] border border-[#D9D9D6] text-xs font-medium flex items-center gap-1 transition-all shadow-xs"
                >
                  <Eye className="w-3 h-3" />
                  <span>Editar Escena</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
