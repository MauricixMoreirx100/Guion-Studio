import React, { useState } from 'react';
import { 
  X, 
  Sparkles, 
  Send, 
  Loader2, 
  Check, 
  MessageSquare, 
  Film, 
  MapPin, 
  Users, 
  FileCheck, 
  Copy, 
  Plus
} from 'lucide-react';
import { Project, ScriptBlock } from '../types';
import { blocksToFountain, parseFountainToBlocks } from '../utils/fountain';

interface AiScriptDoctorModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project;
  initialAction?: string;
  initialContext?: string;
  onAppendGeneratedBlocks: (blocks: ScriptBlock[]) => void;
}

export const AiScriptDoctorModal: React.FC<AiScriptDoctorModalProps> = ({
  isOpen,
  onClose,
  project,
  initialAction = 'continue_scene',
  initialContext = '',
  onAppendGeneratedBlocks,
}) => {
  const [action, setAction] = useState<string>(initialAction);
  const [selectedCharacter, setSelectedCharacter] = useState<string>(project.characters?.[0]?.name || '');
  const [selectedLocation, setSelectedLocation] = useState<string>(project.locations?.[0]?.name || 'INT. HABITACIÓN - DÍA');
  const [customPrompt, setCustomPrompt] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [aiResponse, setAiResponse] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleGenerate = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    setAiResponse('');

    const currentScriptText = blocksToFountain(project.blocks.slice(-20));

    try {
      const res = await fetch('/api/ai/assist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          currentScript: currentScriptText,
          prompt: customPrompt,
          character: selectedCharacter,
          location: selectedLocation,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Error al conectar con el servidor.');
      }

      setAiResponse(data.result || 'No se pudo generar respuesta.');
    } catch (err: any) {
      console.error('AI Error:', err);
      setErrorMsg(err.message || 'Error inesperado al consultar con IA.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplyToScript = () => {
    if (!aiResponse) return;
    const newBlocks = parseFountainToBlocks(aiResponse);
    if (newBlocks.length > 0) {
      onAppendGeneratedBlocks(newBlocks);
      onClose();
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(aiResponse);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      <div 
        className="bg-white border border-[#D9D9D6] rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-xl overflow-hidden text-[#1A1A1A]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#D9D9D6] flex items-center justify-between bg-[#EBEBE8]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white border border-[#D9D9D6] flex items-center justify-center text-[#1A1A1A]">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#1A1A1A] font-serif">Script Doctor & Asistente Creativo IA</h2>
              <p className="text-xs text-[#70706B] mt-0.5">
                Formatea personajes y lugares en negrita, genera diálogos y audita el ritmo dramático.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[#70706B] hover:text-[#1A1A1A] rounded-lg hover:bg-[#F4F4F1] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Selection Tabs */}
        <div className="p-4 bg-[#F4F4F1] border-b border-[#D9D9D6] flex gap-2 overflow-x-auto">
          {[
            { id: 'continue_scene', label: 'Continuar Escena', icon: <Film className="w-3.5 h-3.5" /> },
            { id: 'suggest_dialogue', label: 'Sugerir Diálogos', icon: <MessageSquare className="w-3.5 h-3.5" /> },
            { id: 'generate_scene', label: 'Crear Escena en Locación', icon: <MapPin className="w-3.5 h-3.5" /> },
            { id: 'doctor_review', label: 'Auditoría Script Doctor', icon: <FileCheck className="w-3.5 h-3.5" /> },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => { setAction(tab.id); setAiResponse(''); }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                action === tab.id
                  ? 'bg-[#1A1A1A] text-white shadow-xs'
                  : 'bg-white text-[#70706B] hover:text-[#1A1A1A] border border-[#D9D9D6]'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Form Body */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4 bg-white">
          {action === 'suggest_dialogue' && (
            <div>
              <label className="block text-xs font-bold uppercase text-[#1A1A1A] mb-1">
                Selecciona el Personaje:
              </label>
              <select
                value={selectedCharacter}
                onChange={(e) => setSelectedCharacter(e.target.value)}
                className="w-full px-3 py-2 bg-[#F4F4F1] border border-[#D9D9D6] rounded-xl text-[#1A1A1A] font-bold font-screenplay text-sm outline-none"
              >
                {project.characters?.map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.name} ({c.role})
                  </option>
                ))}
              </select>
            </div>
          )}

          {action === 'generate_scene' && (
            <div>
              <label className="block text-xs font-bold uppercase text-[#1A1A1A] mb-1">
                Lugar de Rodaje / Locación:
              </label>
              <input
                type="text"
                value={selectedLocation}
                onChange={(e) => setSelectedLocation(e.target.value)}
                placeholder="INT. CAFETERÍA - DÍA"
                className="w-full px-3 py-2 bg-[#F4F4F1] border border-[#D9D9D6] rounded-xl text-[#1A1A1A] font-bold font-screenplay text-sm outline-none uppercase"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-bold uppercase text-[#70706B] mb-1">
              {action === 'continue_scene' && 'Instrucciones para continuar la acción:'}
              {action === 'suggest_dialogue' && 'Intención dramática y emoción del diálogo:'}
              {action === 'generate_scene' && 'Premisa o conflicto que ocurre en la escena:'}
              {action === 'doctor_review' && 'Enfoque de la revisión (opcional):'}
            </label>
            <textarea
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              placeholder={
                action === 'continue_scene'
                  ? 'Ej: Revela un secreto inesperado en la conversación...'
                  : action === 'suggest_dialogue'
                  ? 'Ej: Un tono irónico pero con miedo latente...'
                  : 'Ej: Mateo confronta a Valeria sobre el guion alterado...'
              }
              rows={2}
              className="w-full px-3 py-2 bg-[#F4F4F1] border border-[#D9D9D6] rounded-xl text-[#1A1A1A] text-xs outline-none focus:border-[#1A1A1A] resize-none leading-relaxed"
            />
          </div>

          <button
            onClick={handleGenerate}
            disabled={isLoading}
            className="w-full py-2.5 rounded-xl bg-[#1A1A1A] hover:bg-[#333333] text-white font-semibold text-xs shadow-xs flex items-center justify-center gap-2 transition-all disabled:opacity-50 active:scale-98"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Consultando con Script Doctor IA...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Generar con IA (Gemini 3.7 Flash)</span>
              </>
            )}
          </button>

          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800">
              {errorMsg}
            </div>
          )}

          {/* AI Result Box */}
          {aiResponse && (
            <div className="mt-4 bg-[#F4F4F1] border border-[#D9D9D6] rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-[#D9D9D6] pb-2">
                <span className="text-xs font-bold text-[#1A1A1A] flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  Respuesta Generada
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={handleCopy}
                    className="px-2.5 py-1 rounded-md bg-white hover:bg-[#EBEBE8] border border-[#D9D9D6] text-[#1A1A1A] text-xs flex items-center gap-1 shadow-xs"
                  >
                    {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>Copiar</span>
                  </button>
                  {action !== 'doctor_review' && (
                    <button
                      onClick={handleApplyToScript}
                      className="px-3 py-1 rounded-md bg-[#1A1A1A] hover:bg-[#333333] text-white font-semibold text-xs flex items-center gap-1 shadow-xs active:scale-95"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Insertar en Guion</span>
                    </button>
                  )}
                </div>
              </div>

              <div className="font-screenplay text-xs text-[#1A1A1A] whitespace-pre-wrap leading-relaxed max-h-72 overflow-y-auto pr-2">
                {aiResponse}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
