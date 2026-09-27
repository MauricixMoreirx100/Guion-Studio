import React, { useState } from 'react';
import { 
  Users, 
  Plus, 
  Trash2, 
  Edit3, 
  MessageSquare, 
  UserCheck, 
  Sparkles, 
  Award, 
  ShieldAlert, 
  Layers,
  Heart
} from 'lucide-react';
import { Project, CharacterProfile } from '../types';
import { generateId, calculateScriptStats } from '../utils/fountain';

interface CharactersDirectoryProps {
  project: Project;
  onUpdateCharacters: (characters: CharacterProfile[]) => void;
  onInsertCharacterDialogue: (character: CharacterProfile) => void;
}

export const CharactersDirectory: React.FC<CharactersDirectoryProps> = ({
  project,
  onUpdateCharacters,
  onInsertCharacterDialogue,
}) => {
  const [editingCharId, setEditingCharId] = useState<string | null>(null);
  const [filterRole, setFilterRole] = useState<'ALL' | 'protagonist' | 'antagonist' | 'supporting' | 'extra'>('ALL');

  const stats = calculateScriptStats(project.blocks);

  const handleAddCharacter = () => {
    const newChar: CharacterProfile = {
      id: generateId(),
      name: 'NUEVO PERSONAJE',
      role: 'supporting',
      age: '30 años',
      description: 'Rasgos de personalidad, motivaciones y estilo al hablar.',
      actorName: '',
      colorTag: '#f59e0b',
    };
    onUpdateCharacters([...(project.characters || []), newChar]);
    setEditingCharId(newChar.id);
  };

  const handleUpdateCharacter = (id: string, updates: Partial<CharacterProfile>) => {
    const updated = (project.characters || []).map((c) =>
      c.id === id ? { ...c, ...updates } : c
    );
    onUpdateCharacters(updated);
  };

  const handleDeleteCharacter = (id: string) => {
    const updated = (project.characters || []).filter((c) => c.id !== id);
    onUpdateCharacters(updated);
  };

  const filteredCharacters = (project.characters || []).filter((char) => {
    if (filterRole === 'ALL') return true;
    return char.role === filterRole;
  });

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-85px)] bg-[#F4F4F1] text-[#1A1A1A] overflow-y-auto p-4 sm:p-8">
      <div className="max-w-6xl mx-auto w-full space-y-6 pb-20">
        {/* Header Banner */}
        <div className="bg-[#EBEBE8] border border-[#D9D9D6] rounded-2xl p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-white border border-[#D9D9D6] flex items-center justify-center text-[#1A1A1A]">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-[#1A1A1A] font-serif">Directorio de Personajes</h1>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-white text-[#1A1A1A] border border-[#D9D9D6]">
                  Formato Negrita
                </span>
              </div>
              <p className="text-xs text-[#70706B] mt-0.5">
                Nombres en mayúsculas y negrita, conteo de intervenciones dramáticas y notas de casting.
              </p>
            </div>
          </div>

          <button
            onClick={handleAddCharacter}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#1A1A1A] hover:bg-[#333333] text-white font-semibold text-xs shadow-xs transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>+ Añadir Personaje</span>
          </button>
        </div>

        {/* Filters and Stats summary */}
        <div className="flex items-center justify-between gap-3 flex-wrap bg-white p-3 rounded-xl border border-[#D9D9D6] shadow-xs">
          <div className="flex items-center gap-1.5 text-xs text-[#70706B] flex-wrap">
            <span>Filtrar:</span>
            <button
              onClick={() => setFilterRole('ALL')}
              className={`px-3 py-1 rounded-md font-medium transition-all ${
                filterRole === 'ALL' ? 'bg-[#1A1A1A] text-white' : 'bg-[#F4F4F1] text-[#1A1A1A] hover:bg-[#EBEBE8]'
              }`}
            >
              Todos ({project.characters?.length || 0})
            </button>
            <button
              onClick={() => setFilterRole('protagonist')}
              className={`px-3 py-1 rounded-md font-medium transition-all ${
                filterRole === 'protagonist' ? 'bg-[#1A1A1A] text-white' : 'bg-[#F4F4F1] text-[#1A1A1A] hover:bg-[#EBEBE8]'
              }`}
            >
              Protagonistas
            </button>
            <button
              onClick={() => setFilterRole('antagonist')}
              className={`px-3 py-1 rounded-md font-medium transition-all ${
                filterRole === 'antagonist' ? 'bg-[#1A1A1A] text-white' : 'bg-[#F4F4F1] text-[#1A1A1A] hover:bg-[#EBEBE8]'
              }`}
            >
              Antagonistas
            </button>
            <button
              onClick={() => setFilterRole('supporting')}
              className={`px-3 py-1 rounded-md font-medium transition-all ${
                filterRole === 'supporting' ? 'bg-[#1A1A1A] text-white' : 'bg-[#F4F4F1] text-[#1A1A1A] hover:bg-[#EBEBE8]'
              }`}
            >
              Secundarios
            </button>
          </div>

          <div className="text-xs text-[#70706B] font-mono">
            Total Diálogos: <strong className="text-[#1A1A1A]">{stats.dialogueLines}</strong>
          </div>
        </div>

        {/* Characters Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCharacters.length === 0 ? (
            <div className="col-span-3 text-center py-16 bg-white border border-dashed border-[#D9D9D6] rounded-2xl">
              <Users className="w-12 h-12 mx-auto text-[#9C9C96] mb-2" />
              <p className="text-sm font-semibold text-[#1A1A1A]">No hay personajes registrados</p>
              <p className="text-xs text-[#70706B] mt-1">
                Escribe nombres de personajes en el editor o pulsa "+ Añadir Personaje".
              </p>
            </div>
          ) : (
            filteredCharacters.map((char) => {
              const isEditing = editingCharId === char.id;
              const cleanName = char.name.trim().toUpperCase();
              const lineCount = stats.characterLineCounts[cleanName] || 0;
              const dialogueShare = stats.dialogueLines > 0 ? Math.round((lineCount / stats.dialogueLines) * 100) : 0;

              return (
                <div
                  key={char.id}
                  className="bg-white border border-[#D9D9D6] hover:border-[#1A1A1A] rounded-2xl p-5 shadow-xs flex flex-col justify-between transition-all group"
                >
                  <div>
                    {/* Header: Role Badge & Character Name in BOLD */}
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                          <span className={`px-2 py-0.5 text-[10px] font-bold rounded uppercase tracking-wider ${
                            char.role === 'protagonist'
                              ? 'bg-[#1A1A1A] text-white'
                              : char.role === 'antagonist'
                              ? 'bg-[#555550] text-white'
                              : 'bg-[#EBEBE8] text-[#1A1A1A]'
                          }`}>
                            {char.role === 'protagonist' && <Award className="w-3 h-3 inline mr-1" />}
                            {char.role === 'antagonist' && <ShieldAlert className="w-3 h-3 inline mr-1" />}
                            {char.role}
                          </span>

                          {char.age && (
                            <span className="text-[11px] text-[#70706B] font-mono">
                              {char.age}
                            </span>
                          )}
                        </div>

                        {/* Character Name in BOLD UPPERCASE */}
                        {isEditing ? (
                          <div className="space-y-2 mt-2">
                            <input
                              type="text"
                              value={char.name}
                              onChange={(e) => handleUpdateCharacter(char.id, { name: e.target.value.toUpperCase() })}
                              className="w-full bg-[#F4F4F1] font-screenplay font-bold text-sm text-[#1A1A1A] px-2.5 py-1 rounded border border-[#D9D9D6] focus:border-[#1A1A1A] outline-none uppercase"
                              placeholder="NOMBRE DEL PERSONAJE"
                            />
                            <div className="grid grid-cols-2 gap-2">
                              <select
                                value={char.role}
                                onChange={(e) => handleUpdateCharacter(char.id, { role: e.target.value as any })}
                                className="bg-[#F4F4F1] text-xs text-[#1A1A1A] px-2 py-1 rounded border border-[#D9D9D6] outline-none"
                              >
                                <option value="protagonist">Protagonista</option>
                                <option value="antagonist">Antagonista</option>
                                <option value="supporting">Secundario</option>
                                <option value="extra">Extra / Menor</option>
                              </select>
                              <input
                                type="text"
                                value={char.age || ''}
                                onChange={(e) => handleUpdateCharacter(char.id, { age: e.target.value })}
                                placeholder="Edad (ej: 34 años)"
                                className="bg-[#F4F4F1] text-xs text-[#1A1A1A] px-2 py-1 rounded border border-[#D9D9D6] outline-none"
                              />
                            </div>
                          </div>
                        ) : (
                          <h3 className="font-screenplay font-bold text-base text-[#1A1A1A] tracking-wider">
                            <strong>{char.name.toUpperCase()}</strong>
                          </h3>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setEditingCharId(isEditing ? null : char.id)}
                          className="p-1.5 rounded-md text-[#70706B] hover:text-[#1A1A1A] hover:bg-[#F4F4F1]"
                          title={isEditing ? 'Guardar' : 'Editar'}
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteCharacter(char.id)}
                          className="p-1.5 rounded-md text-[#70706B] hover:text-rose-700 hover:bg-rose-50"
                          title="Eliminar"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Actor Casting info */}
                    <div className="mb-3">
                      <label className="text-[10px] uppercase font-bold text-[#70706B] block mb-0.5">
                        Actor / Casting sugerido:
                      </label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={char.actorName || ''}
                          onChange={(e) => handleUpdateCharacter(char.id, { actorName: e.target.value })}
                          placeholder="Nombre del actor o tipo de casting..."
                          className="w-full bg-[#F4F4F1] text-xs text-[#1A1A1A] px-2.5 py-1 rounded border border-[#D9D9D6] outline-none"
                        />
                      ) : (
                        <p className="text-xs text-[#1A1A1A] font-medium">
                          {char.actorName ? `🎭 ${char.actorName}` : <span className="text-[#9C9C96] italic">Por definir</span>}
                        </p>
                      )}
                    </div>

                    {/* Bio & Voice Description */}
                    <div className="mb-3">
                      <label className="text-[10px] uppercase font-bold text-[#70706B] block mb-0.5">
                        Perfil psicológico & voz:
                      </label>
                      {isEditing ? (
                        <textarea
                          value={char.description || ''}
                          onChange={(e) => handleUpdateCharacter(char.id, { description: e.target.value })}
                          placeholder="Rasgos distintivos, cadencia de voz, conflicto interno..."
                          rows={2}
                          className="w-full bg-[#F4F4F1] text-xs text-[#1A1A1A] px-2.5 py-1 rounded border border-[#D9D9D6] outline-none resize-none"
                        />
                      ) : (
                        <p className="text-xs text-[#555550] line-clamp-3 leading-relaxed">
                          {char.description || <span className="text-[#9C9C96] italic">Sin descripción</span>}
                        </p>
                      )}
                    </div>

                    {/* Spoken dialogues bar */}
                    <div className="pt-2 border-t border-[#D9D9D6]">
                      <div className="flex items-center justify-between text-[11px] mb-1">
                        <span className="text-[#70706B] flex items-center gap-1">
                          <MessageSquare className="w-3 h-3 text-[#1A1A1A]" />
                          <span>Intervenciones en guion:</span>
                        </span>
                        <span className="font-bold text-[#1A1A1A] font-mono">{lineCount} líneas ({dialogueShare}%)</span>
                      </div>
                      <div className="w-full h-1.5 bg-[#EBEBE8] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#1A1A1A] transition-all duration-300"
                          style={{ width: `${Math.min(100, dialogueShare * 2)}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Bottom Action: Insert dialogue block into script */}
                  <div className="mt-4 pt-3 border-t border-[#D9D9D6] flex items-center justify-end">
                    <button
                      onClick={() => onInsertCharacterDialogue(char)}
                      className="w-full py-1.5 rounded-md bg-[#F4F4F1] hover:bg-[#EBEBE8] text-[#1A1A1A] border border-[#D9D9D6] text-xs font-medium flex items-center justify-center gap-1.5 transition-all shadow-xs"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Insertar Diálogo al Guion</span>
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
