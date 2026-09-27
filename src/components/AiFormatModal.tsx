import React, { useState } from 'react';
import { 
  X, 
  Sparkles, 
  Loader2, 
  Check, 
  ClipboardPaste, 
  FileText, 
  ArrowRight,
  RefreshCw,
  Copy,
  Info,
  CheckCircle2,
  Wand2
} from 'lucide-react';
import { ScriptBlock, ElementType } from '../types';
import { generateId } from '../utils/fountain';

interface AiFormatModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialRawText?: string;
  onApplyBlocks: (blocks: ScriptBlock[], mode: 'replace' | 'append') => void;
  isDarkMode?: boolean;
}

const ELEMENT_TYPE_BADGES: Record<ElementType, { label: string; color: string }> = {
  act: { label: 'Acto', color: 'bg-amber-500/20 text-amber-300 border-amber-500/40' },
  scene_heading: { label: 'Título de Escena', color: 'bg-blue-500/20 text-blue-300 border-blue-500/40' },
  action: { label: 'Acción', color: 'bg-stone-500/20 text-stone-300 border-stone-500/40' },
  character: { label: 'Personaje', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' },
  dialogue: { label: 'Diálogo', color: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40' },
  parenthetical: { label: 'Acotación', color: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40' },
  transition: { label: 'Transición', color: 'bg-purple-500/20 text-purple-300 border-purple-500/40' },
  shot: { label: 'Plano / Toma', color: 'bg-rose-500/20 text-rose-300 border-rose-500/40' },
  text: { label: 'Texto General', color: 'bg-teal-500/20 text-teal-300 border-teal-500/40' },
  note: { label: 'Nota', color: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40' },
};

const SAMPLE_RAW_TEXT = `Acto I

int cafeteria dia
La lluvia golpea los cristales empañados. Juan bebe cafe negro en la mesa del rincon mirando la puerta con ansiedad.

Maria
Entra empapada con una gabardina roja. Mira a todos lados y lo descubre.

Maria
(nerviosa y en voz baja)
Pensé que no vendrías. Tienen el paquete.

Juan
Nadie nos vio entrar. Sientate.

corte a:

ext. calle noche
plano general de un auto negro esperando con las luces apagadas.`;

export const AiFormatModal: React.FC<AiFormatModalProps> = ({
  isOpen,
  onClose,
  initialRawText = '',
  onApplyBlocks,
  isDarkMode = true,
}) => {
  const [rawText, setRawText] = useState<string>(initialRawText || '');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [formattedBlocks, setFormattedBlocks] = useState<ScriptBlock[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  if (!isOpen) return null;

  const handlePasteClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setRawText(text);
      }
    } catch {
      // Fallback
    }
  };

  const handleFormatWithAi = async () => {
    if (!rawText.trim()) {
      setErrorMsg('Por favor escribe o pega un texto sin formato para estructurarlo.');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/ai/format', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rawText,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Error al comunicarse con el servicio de IA.');
      }

      let sceneCount = 1;
      const parsed: ScriptBlock[] = (data.blocks || []).map((b: { type: ElementType; content: string }) => ({
        id: generateId(),
        type: b.type,
        content: b.content,
        sceneNumber: b.type === 'scene_heading' ? sceneCount++ : undefined,
      }));

      if (parsed.length === 0) {
        throw new Error('No se generaron bloques estructurados.');
      }

      setFormattedBlocks(parsed);
    } catch (err: any) {
      console.error('AI Format error:', err);
      setErrorMsg(err.message || 'Ocurrió un error al formatear con IA.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApply = (mode: 'replace' | 'append') => {
    if (formattedBlocks.length === 0) return;
    onApplyBlocks(formattedBlocks, mode);
    onClose();
  };

  const handleCopyFormatted = () => {
    const text = formattedBlocks.map(b => `${b.type.toUpperCase()}: ${b.content}`).join('\n\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-fade-in">
      <div 
        className={`border rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden transition-colors ${
          isDarkMode ? 'bg-[#181818] border-[#2E2E2E] text-[#ECECEC]' : 'bg-white border-[#D9D9D6] text-[#1A1A1A]'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header: Concise & Elegant */}
        <div className={`px-5 py-4 border-b flex items-center justify-between transition-colors ${
          isDarkMode ? 'bg-[#202020] border-[#2E2E2E]' : 'bg-[#F4F4F1] border-[#D9D9D6]'
        }`}>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-amber-500 to-amber-600 text-black rounded-xl shadow-md">
              <Sparkles className="w-5 h-5 fill-current" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base font-serif italic text-white flex items-center gap-2">
                  <span className={isDarkMode ? 'text-white' : 'text-[#1A1A1A]'}>Formateador de Guion con IA</span>
                </h3>
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-full font-bold">
                  Gemini 1.5 Flash
                </span>
              </div>
              <p className={`text-xs mt-0.5 ${isDarkMode ? 'text-[#9E9E9E]' : 'text-[#70706B]'}`}>
                Estructura texto sin alterar tu historia en los 9 elementos cinematográficos estándar.
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className={`p-2 rounded-lg transition-colors cursor-pointer ${
              isDarkMode ? 'text-[#9E9E9E] hover:text-white hover:bg-[#2A2A2A]' : 'text-[#70706B] hover:text-[#1A1A1A] hover:bg-[#EBEBE8]'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Info Strip (Concise Guide) */}
        <div className={`px-5 py-2.5 border-b flex items-center justify-between text-xs flex-wrap gap-2 ${
          isDarkMode ? 'bg-[#1C1C1C] border-[#2A2A2A] text-[#A0A0A0]' : 'bg-[#FAFAF8] border-[#EBEBE8] text-[#70706B]'
        }`}>
          <div className="flex items-center gap-1.5 font-mono text-[11px]">
            <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>Mantiene el 100% del contenido original • Clasifica Acto, Escena, Acción, Personaje, Diálogo y más</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePasteClipboard}
              className={`text-[11px] font-medium px-2.5 py-1 rounded-md border flex items-center gap-1.5 transition-all cursor-pointer ${
                isDarkMode 
                  ? 'bg-[#262626] hover:bg-[#303030] border-[#383838] text-white' 
                  : 'bg-white hover:bg-[#F4F4F1] border-[#D9D9D6] text-[#1A1A1A]'
              }`}
            >
              <ClipboardPaste className="w-3 h-3 text-amber-400" />
              <span>Pegar Portapapeles</span>
            </button>
            <button
              type="button"
              onClick={() => setRawText(SAMPLE_RAW_TEXT)}
              className={`text-[11px] font-medium px-2.5 py-1 rounded-md border transition-all cursor-pointer ${
                isDarkMode 
                  ? 'bg-[#262626] hover:bg-[#303030] border-[#383838] text-[#9E9E9E] hover:text-white' 
                  : 'bg-white hover:bg-[#F4F4F1] border-[#D9D9D6] text-[#70706B] hover:text-[#1A1A1A]'
              }`}
            >
              Cargar Ejemplo
            </button>
          </div>
        </div>

        {/* Modal Dual-Pane Body */}
        <div className="flex-1 overflow-hidden grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-[#2E2E2E]">
          {/* Left: Raw Text Input */}
          <div className={`p-4 flex flex-col h-full overflow-hidden ${isDarkMode ? 'bg-[#141414]' : 'bg-[#FAFAF8]'}`}>
            <div className="flex items-center justify-between mb-2">
              <label className={`text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${
                isDarkMode ? 'text-[#CCCCCC]' : 'text-[#1A1A1A]'
              }`}>
                <FileText className="w-3.5 h-3.5 text-amber-400" />
                <span>Texto sin Formato / Pegado</span>
              </label>
              <span className="text-[11px] text-[#70706B] font-mono">
                {rawText.trim().split(/\s+/).filter(Boolean).length} palabras
              </span>
            </div>

            <textarea
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              placeholder="Pega aquí el texto desordenado (diálogos, notas de Word, WhatsApp, correo o PDF sin sangrías ni formato estándar)..."
              className={`flex-1 w-full rounded-xl p-3.5 text-xs font-screenplay resize-none focus:outline-none shadow-inner leading-relaxed transition-colors border ${
                isDarkMode 
                  ? 'bg-[#1C1C1C] border-[#2E2E2E] text-[#ECECEC] focus:border-amber-400/60' 
                  : 'bg-white border-[#D9D9D6] text-[#1A1A1A] focus:border-[#1A1A1A]'
              }`}
              rows={12}
            />

            {errorMsg && (
              <div className="mt-2.5 p-2.5 bg-rose-500/20 border border-rose-500/30 text-rose-300 rounded-lg text-xs font-medium">
                {errorMsg}
              </div>
            )}

            <div className="mt-3 flex items-center justify-end">
              <button
                onClick={handleFormatWithAi}
                disabled={isLoading || !rawText.trim()}
                className="flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 disabled:opacity-50 text-black rounded-xl text-xs font-bold shadow-lg transition-all active:scale-95 cursor-pointer font-sans"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-black" />
                    <span>Estructurando con Gemini 1.5 Flash...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-black fill-current" />
                    <span>Formatear con Gemini 1.5 Flash</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Right: Recognized Screenplay Blocks */}
          <div className={`p-4 flex flex-col h-full overflow-hidden ${isDarkMode ? 'bg-[#181818]' : 'bg-white'}`}>
            <div className="flex items-center justify-between mb-2">
              <label className={`text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${
                isDarkMode ? 'text-[#CCCCCC]' : 'text-[#1A1A1A]'
              }`}>
                <Wand2 className="w-3.5 h-3.5 text-amber-400" />
                <span>Estructura Reconocida ({formattedBlocks.length} bloques)</span>
              </label>
              {formattedBlocks.length > 0 && (
                <button
                  type="button"
                  onClick={handleCopyFormatted}
                  className={`text-[11px] font-medium px-2 py-0.5 rounded border flex items-center gap-1 cursor-pointer transition-colors ${
                    isDarkMode 
                      ? 'bg-[#242424] hover:bg-[#2E2E2E] border-[#383838] text-white' 
                      : 'bg-white hover:bg-[#F4F4F1] border-[#D9D9D6] text-[#1A1A1A]'
                  }`}
                >
                  {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copied ? 'Copiado' : 'Copiar'}</span>
                </button>
              )}
            </div>

            <div className={`flex-1 rounded-xl p-3 overflow-y-auto space-y-2 border ${
              isDarkMode ? 'bg-[#141414] border-[#282828]' : 'bg-[#FAFAF8] border-[#D9D9D6]'
            }`}>
              {isLoading ? (
                <div className="h-full flex flex-col items-center justify-center p-6 text-center text-[#70706B] gap-3">
                  <Loader2 className="w-8 h-8 animate-spin text-amber-400" />
                  <p className={`text-xs font-semibold ${isDarkMode ? 'text-white' : 'text-[#1A1A1A]'}`}>
                    Clasificando líneas en elementos cinematográficos...
                  </p>
                  <p className={`text-[11px] max-w-xs ${isDarkMode ? 'text-[#9E9E9E]' : 'text-[#70706B]'}`}>
                    Gemini 1.5 Flash está analizando diálogos, acotaciones, encabezados y acciones.
                  </p>
                </div>
              ) : formattedBlocks.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center p-6 text-center text-[#70706B] gap-2">
                  <div className={`p-3 rounded-full ${isDarkMode ? 'bg-[#222222] text-amber-400' : 'bg-[#EBEBE8] text-[#70706B]'}`}>
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <p className={`text-xs font-semibold ${isDarkMode ? 'text-white' : 'text-[#1A1A1A]'}`}>
                    Sin estructura generada aún
                  </p>
                  <p className={`text-[11px] max-w-xs ${isDarkMode ? 'text-[#9E9E9E]' : 'text-[#70706B]'}`}>
                    Pega tu texto a la izquierda y presiona el botón para formatearlo automáticamente.
                  </p>
                </div>
              ) : (
                formattedBlocks.map((block, idx) => {
                  const badge = ELEMENT_TYPE_BADGES[block.type] || { label: block.type, color: 'bg-gray-500/20 text-gray-300' };
                  return (
                    <div 
                      key={block.id || idx}
                      className={`p-2.5 rounded-lg border shadow-xs flex flex-col gap-1 ${
                        isDarkMode ? 'bg-[#1E1E1E] border-[#2A2A2A]' : 'bg-white border-[#EBEBE8]'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded border font-mono ${badge.color}`}>
                          {badge.label}
                        </span>
                        <span className="text-[9px] text-[#70706B] font-mono">#{idx + 1}</span>
                      </div>
                      <p className={`text-xs font-screenplay leading-relaxed ${
                        block.type === 'scene_heading' || block.type === 'character' || block.type === 'act' || block.type === 'transition' || block.type === 'shot'
                          ? isDarkMode ? 'font-bold text-white' : 'font-bold text-[#1A1A1A]'
                          : isDarkMode ? 'text-[#D0D0D0]' : 'text-[#333333]'
                      }`}>
                        {block.content}
                      </p>
                    </div>
                  );
                })
              )}
            </div>

            {formattedBlocks.length > 0 && (
              <div className={`mt-3 flex items-center justify-end gap-2 pt-2 border-t ${
                isDarkMode ? 'border-[#282828]' : 'border-[#EBEBE8]'
              }`}>
                <button
                  type="button"
                  onClick={() => handleApply('append')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
                    isDarkMode 
                      ? 'bg-[#242424] hover:bg-[#2E2E2E] border-[#383838] text-white' 
                      : 'bg-white hover:bg-[#F4F4F1] border-[#D9D9D6] text-[#1A1A1A]'
                  }`}
                >
                  Insertar al Final
                </button>
                <button
                  type="button"
                  onClick={() => handleApply('replace')}
                  className="px-4 py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black rounded-lg text-xs font-bold shadow-md transition-all cursor-pointer"
                >
                  Reemplazar Guion
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className={`px-5 py-3 border-t flex items-center justify-between text-[11px] font-mono ${
          isDarkMode ? 'bg-[#1C1C1C] border-[#2A2A2A] text-[#888888]' : 'bg-[#F4F4F1] border-[#D9D9D6] text-[#70706B]'
        }`}>
          <span>Taxonomía Oficial: Acto • Escena • Acción • Personaje • Diálogo • Acotación • Transición • Plano • Texto</span>
          <button
            onClick={onClose}
            className={`font-semibold hover:underline cursor-pointer ${isDarkMode ? 'text-white' : 'text-[#1A1A1A]'}`}
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
