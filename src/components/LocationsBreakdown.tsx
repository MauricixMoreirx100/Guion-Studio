import React, { useState } from 'react';
import { 
  MapPin, 
  Plus, 
  Trash2, 
  Edit3, 
  Sun, 
  Moon, 
  Sunset, 
  Sunrise, 
  Building, 
  Trees, 
  CheckSquare, 
  Users, 
  Film, 
  ExternalLink,
  Sparkles,
  Info
} from 'lucide-react';
import { Project, LocationItem } from '../types';
import { generateId } from '../utils/fountain';

interface LocationsBreakdownProps {
  project: Project;
  onUpdateLocations: (locations: LocationItem[]) => void;
  onAddSceneForLocation: (location: LocationItem) => void;
}

export const LocationsBreakdown: React.FC<LocationsBreakdownProps> = ({
  project,
  onUpdateLocations,
  onAddSceneForLocation,
}) => {
  const [editingLocId, setEditingLocId] = useState<string | null>(null);
  const [newPropInput, setNewPropInput] = useState<string>('');
  const [filterType, setFilterType] = useState<'ALL' | 'INT' | 'EXT'>('ALL');

  // Find scenes and characters per location
  const locationSceneMap: Record<string, { scenes: number[]; characters: Set<string> }> = {};

  let currentLocKey = '';
  for (const block of project.blocks) {
    if (block.type === 'scene_heading') {
      currentLocKey = block.content.trim().toUpperCase();
      if (!locationSceneMap[currentLocKey]) {
        locationSceneMap[currentLocKey] = { scenes: [], characters: new Set() };
      }
      if (block.sceneNumber) {
        locationSceneMap[currentLocKey].scenes.push(block.sceneNumber);
      }
    } else if (block.type === 'character' && currentLocKey) {
      const cleanName = block.content.replace(/\s*\(.*?\)\s*/g, '').trim().toUpperCase();
      if (locationSceneMap[currentLocKey]) {
        locationSceneMap[currentLocKey].characters.add(cleanName);
      }
    }
  }

  const handleAddLocation = () => {
    const newLoc: LocationItem = {
      id: generateId(),
      name: 'NUEVA LOCACIÓN',
      type: 'INT',
      timeOfDay: 'DÍA',
      description: 'Descripción del set de rodaje y ambiente visual.',
      realFilmingPlace: '',
      propsNeeded: [],
      permitsRequired: false,
    };
    onUpdateLocations([...(project.locations || []), newLoc]);
    setEditingLocId(newLoc.id);
  };

  const handleUpdateLocation = (id: string, updates: Partial<LocationItem>) => {
    const updated = (project.locations || []).map((loc) =>
      loc.id === id ? { ...loc, ...updates } : loc
    );
    onUpdateLocations(updated);
  };

  const handleDeleteLocation = (id: string) => {
    const updated = (project.locations || []).filter((loc) => loc.id !== id);
    onUpdateLocations(updated);
  };

  const handleAddProp = (locId: string) => {
    if (!newPropInput.trim()) return;
    const loc = project.locations.find((l) => l.id === locId);
    if (!loc) return;
    const currentProps = loc.propsNeeded || [];
    handleUpdateLocation(locId, { propsNeeded: [...currentProps, newPropInput.trim()] });
    setNewPropInput('');
  };

  const handleRemoveProp = (locId: string, index: number) => {
    const loc = project.locations.find((l) => l.id === locId);
    if (!loc) return;
    const currentProps = [...(loc.propsNeeded || [])];
    currentProps.splice(index, 1);
    handleUpdateLocation(locId, { propsNeeded: currentProps });
  };

  const filteredLocations = (project.locations || []).filter((loc) => {
    if (filterType === 'ALL') return true;
    return loc.type === filterType || (filterType === 'INT' && loc.type === 'INT/EXT');
  });

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-85px)] bg-[#F4F4F1] text-[#1A1A1A] overflow-y-auto p-4 sm:p-8">
      <div className="max-w-6xl mx-auto w-full space-y-6 pb-20">
        {/* Header Banner */}
        <div className="bg-[#EBEBE8] border border-[#D9D9D6] rounded-2xl p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-white border border-[#D9D9D6] flex items-center justify-center text-[#1A1A1A]">
              <MapPin className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-[#1A1A1A] font-serif">Lugares de Grabación y Rodaje</h1>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-white text-[#1A1A1A] border border-[#D9D9D6]">
                  Formato Negrita
                </span>
              </div>
              <p className="text-xs text-[#70706B] mt-0.5">
                Desglose de locaciones para producción cinematográfica (interiores, exteriores, atrezzo y set real).
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleAddLocation}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#1A1A1A] hover:bg-[#333333] text-white font-semibold text-xs shadow-xs transition-all active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>+ Añadir Lugar</span>
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center justify-between gap-3 flex-wrap bg-white p-3 rounded-xl border border-[#D9D9D6] shadow-xs">
          <div className="flex items-center gap-1.5 text-xs text-[#70706B]">
            <span>Filtrar por:</span>
            <button
              onClick={() => setFilterType('ALL')}
              className={`px-3 py-1 rounded-md font-medium transition-all ${
                filterType === 'ALL' ? 'bg-[#1A1A1A] text-white' : 'bg-[#F4F4F1] text-[#1A1A1A] hover:bg-[#EBEBE8]'
              }`}
            >
              Todas ({project.locations?.length || 0})
            </button>
            <button
              onClick={() => setFilterType('INT')}
              className={`px-3 py-1 rounded-md font-medium transition-all ${
                filterType === 'INT' ? 'bg-[#1A1A1A] text-white' : 'bg-[#F4F4F1] text-[#1A1A1A] hover:bg-[#EBEBE8]'
              }`}
            >
              Interiores (INT)
            </button>
            <button
              onClick={() => setFilterType('EXT')}
              className={`px-3 py-1 rounded-md font-medium transition-all ${
                filterType === 'EXT' ? 'bg-[#1A1A1A] text-white' : 'bg-[#F4F4F1] text-[#1A1A1A] hover:bg-[#EBEBE8]'
              }`}
            >
              Exteriores (EXT)
            </button>
          </div>

          <div className="text-xs text-[#70706B] font-mono">
            Total Sets: <strong className="text-[#1A1A1A]">{project.locations?.length || 0}</strong>
          </div>
        </div>

        {/* Locations Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredLocations.length === 0 ? (
            <div className="col-span-2 text-center py-16 bg-white border border-dashed border-[#D9D9D6] rounded-2xl">
              <MapPin className="w-12 h-12 mx-auto text-[#9C9C96] mb-2" />
              <p className="text-sm font-semibold text-[#1A1A1A]">No hay lugares de grabación registrados</p>
              <p className="text-xs text-[#70706B] mt-1">
                Escribe encabezados de escena como "INT. CASA - DÍA" en el editor o pulsa "+ Añadir Lugar".
              </p>
            </div>
          ) : (
            filteredLocations.map((loc) => {
              const isEditing = editingLocId === loc.id;
              const fullHeadingName = `${loc.type}. ${loc.name} - ${loc.timeOfDay}`;
              const matchData = locationSceneMap[fullHeadingName] || locationSceneMap[`${loc.type}. ${loc.name}`] || { scenes: [], characters: new Set() };
              const charactersArray = Array.from(matchData.characters);

              return (
                <div
                  key={loc.id}
                  className="bg-white border border-[#D9D9D6] hover:border-[#1A1A1A] rounded-2xl p-5 shadow-xs flex flex-col justify-between transition-all group"
                >
                  <div>
                    {/* Header: Type Tag & Location in BOLD */}
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                          <span className={`px-2 py-0.5 text-[10px] font-bold rounded uppercase tracking-wider ${
                            loc.type === 'INT' ? 'bg-[#1A1A1A] text-white' : 'bg-[#EBEBE8] text-[#1A1A1A] border border-[#D9D9D6]'
                          }`}>
                            {loc.type === 'INT' ? <Building className="w-3 h-3 inline mr-1" /> : <Trees className="w-3 h-3 inline mr-1" />}
                            {loc.type}
                          </span>

                          <span className="px-2 py-0.5 text-[10px] font-medium rounded bg-[#F4F4F1] text-[#1A1A1A] border border-[#D9D9D6] flex items-center gap-1">
                            {loc.timeOfDay === 'NOCHE' ? <Moon className="w-3 h-3 text-[#555550]" /> : <Sun className="w-3 h-3 text-[#1A1A1A]" />}
                            {loc.timeOfDay}
                          </span>
                        </div>

                        {/* Location Name in BOLD */}
                        {isEditing ? (
                          <div className="space-y-2 mt-2">
                            <input
                              type="text"
                              value={loc.name}
                              onChange={(e) => handleUpdateLocation(loc.id, { name: e.target.value.toUpperCase() })}
                              className="w-full bg-[#F4F4F1] font-screenplay font-bold text-sm text-[#1A1A1A] px-2.5 py-1.5 rounded border border-[#D9D9D6] focus:border-[#1A1A1A] outline-none uppercase"
                              placeholder="NOMBRE DEL LUGAR"
                            />
                            <div className="grid grid-cols-2 gap-2">
                              <select
                                value={loc.type}
                                onChange={(e) => handleUpdateLocation(loc.id, { type: e.target.value as any })}
                                className="bg-[#F4F4F1] text-xs text-[#1A1A1A] px-2 py-1 rounded border border-[#D9D9D6] outline-none"
                              >
                                <option value="INT">INT. (Interior)</option>
                                <option value="EXT">EXT. (Exterior)</option>
                                <option value="INT/EXT">INT/EXT. (Mixto)</option>
                              </select>
                              <select
                                value={loc.timeOfDay}
                                onChange={(e) => handleUpdateLocation(loc.id, { timeOfDay: e.target.value as any })}
                                className="bg-[#F4F4F1] text-xs text-[#1A1A1A] px-2 py-1 rounded border border-[#D9D9D6] outline-none"
                              >
                                <option value="DÍA">DÍA</option>
                                <option value="NOCHE">NOCHE</option>
                                <option value="ATARDECER">ATARDECER</option>
                                <option value="AMANECER">AMANECER</option>
                                <option value="CONTINUO">CONTINUO</option>
                              </select>
                            </div>
                          </div>
                        ) : (
                          <h3 className="font-screenplay font-bold text-base text-[#1A1A1A] tracking-wide">
                            <strong>{loc.type}. {loc.name} - {loc.timeOfDay}</strong>
                          </h3>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setEditingLocId(isEditing ? null : loc.id)}
                          className="p-1.5 rounded-md text-[#70706B] hover:text-[#1A1A1A] hover:bg-[#F4F4F1]"
                          title={isEditing ? 'Guardar' : 'Editar'}
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteLocation(loc.id)}
                          className="p-1.5 rounded-md text-[#70706B] hover:text-rose-700 hover:bg-rose-50"
                          title="Eliminar"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Real-world filming place */}
                    <div className="mb-3">
                      <label className="text-[10px] uppercase font-bold text-[#70706B] block mb-0.5">
                        Lugar Real de Rodaje / Dirección:
                      </label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={loc.realFilmingPlace || ''}
                          onChange={(e) => handleUpdateLocation(loc.id, { realFilmingPlace: e.target.value })}
                          placeholder="Ej: Estudio 3B, Calle Mayor 14, Parque Central..."
                          className="w-full bg-[#F4F4F1] text-xs text-[#1A1A1A] px-2.5 py-1 rounded border border-[#D9D9D6] outline-none"
                        />
                      ) : (
                        <p className="text-xs text-[#1A1A1A] font-medium">
                          {loc.realFilmingPlace ? `📍 ${loc.realFilmingPlace}` : <span className="text-[#9C9C96] italic">No especificado (clic en editar para agregar set real)</span>}
                        </p>
                      )}
                    </div>

                    {/* Description / Atmosphere */}
                    <div className="mb-3">
                      <label className="text-[10px] uppercase font-bold text-[#70706B] block mb-0.5">
                        Descripción visual & atmósfera:
                      </label>
                      {isEditing ? (
                        <textarea
                          value={loc.description || ''}
                          onChange={(e) => handleUpdateLocation(loc.id, { description: e.target.value })}
                          placeholder="Iluminación, texturas, sonido ambiente..."
                          rows={2}
                          className="w-full bg-[#F4F4F1] text-xs text-[#1A1A1A] px-2.5 py-1 rounded border border-[#D9D9D6] outline-none resize-none"
                        />
                      ) : (
                        <p className="text-xs text-[#555550] line-clamp-2 leading-relaxed">
                          {loc.description || <span className="text-[#9C9C96] italic">Sin descripción</span>}
                        </p>
                      )}
                    </div>

                    {/* Props & Production Checklist */}
                    <div className="mb-3 pt-2 border-t border-[#D9D9D6]">
                      <label className="text-[10px] uppercase font-bold text-[#70706B] flex items-center justify-between mb-1">
                        <span>Atrezzo / Props requeridos:</span>
                      </label>
                      <div className="flex flex-wrap gap-1.5 mb-1.5">
                        {(loc.propsNeeded || []).map((prop, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-[#F4F4F1] text-[#1A1A1A] border border-[#D9D9D6]"
                          >
                            <span>{prop}</span>
                            {isEditing && (
                              <button
                                onClick={() => handleRemoveProp(loc.id, idx)}
                                className="text-[#70706B] hover:text-rose-700"
                              >
                                ×
                              </button>
                            )}
                          </span>
                        ))}
                        {(!loc.propsNeeded || loc.propsNeeded.length === 0) && !isEditing && (
                          <span className="text-[11px] text-[#9C9C96] italic">No hay props listados</span>
                        )}
                      </div>

                      {isEditing && (
                        <div className="flex gap-1 mt-1">
                          <input
                            type="text"
                            value={newPropInput}
                            onChange={(e) => setNewPropInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddProp(loc.id))}
                            placeholder="+ Añadir elemento de utilería..."
                            className="flex-1 bg-[#F4F4F1] text-xs px-2 py-1 rounded border border-[#D9D9D6] text-[#1A1A1A] outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => handleAddProp(loc.id)}
                            className="px-2 py-1 bg-[#1A1A1A] hover:bg-[#333333] text-xs text-white rounded"
                          >
                            Agregar
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Characters appearing at this location */}
                    {charactersArray.length > 0 && (
                      <div className="pt-2 border-t border-[#D9D9D6] flex items-center gap-1.5 text-xs text-[#70706B] flex-wrap">
                        <Users className="w-3.5 h-3.5 text-[#1A1A1A]" />
                        <span className="text-[11px]">Personajes:</span>
                        {charactersArray.map((c, i) => (
                          <span key={i} className="font-bold text-[#1A1A1A] text-[11px]">
                            <strong>{c}</strong>{i < charactersArray.length - 1 ? ',' : ''}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Bottom Action: Insert scene into script */}
                  <div className="mt-4 pt-3 border-t border-[#D9D9D6] flex items-center justify-between">
                    <span className="text-[11px] text-[#70706B] font-mono">
                      {matchData.scenes.length > 0
                        ? `Escenas: ${matchData.scenes.join(', ')}`
                        : 'No utilizada aún en el guion'}
                    </span>
                    <button
                      onClick={() => onAddSceneForLocation(loc)}
                      className="px-3 py-1 rounded-md bg-[#F4F4F1] hover:bg-[#EBEBE8] text-[#1A1A1A] border border-[#D9D9D6] text-xs font-medium flex items-center gap-1 transition-all shadow-xs"
                    >
                      <span>+ Crear Escena</span>
                    </button>
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
